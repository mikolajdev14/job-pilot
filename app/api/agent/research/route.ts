import { NextRequest, NextResponse } from "next/server";
import { PostHog } from "posthog-node";
import {
  COMPANY_RESEARCH_TTL_MS,
  isFreshResearchMarker,
  parseCompanyResearch,
  parseResearchMarker,
} from "@/lib/company-research";
import { createInsforgeServer } from "@/lib/insforge-server";
import { CompanyResearchError, jobFromRow, profileFromRow, researchCompany } from "@/agent/research";

export const runtime = "nodejs";

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createPostHog(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  return new PostHog(token, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST, flushAt: 1, flushInterval: 0 });
}

async function writeLog(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  userId: string,
  jobId: string,
  runId: string,
  message: string,
  level: "info" | "success" | "warning" | "error",
): Promise<void> {
  if (!runId) return;
  const { error } = await insforge.database.from("agent_logs").insert([{ run_id: runId, user_id: userId, job_id: jobId, message, level }]);
  if (error) console.error("[agent/research] Could not write agent log", error);
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof CompanyResearchError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, {
      status: error.status,
      headers: error.status === 429 ? { "Retry-After": "600" } : undefined,
    });
  }

  console.error("[agent/research] Research failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ success: false, error: { code: "RESEARCH_FAILED", message: "We could not research this company right now. Please try again." } }, { status: 500 });
}

function runningResponse(): NextResponse {
  return NextResponse.json({ success: false, error: { code: "RESEARCH_IN_PROGRESS", message: "Company research is already running. Please try again in a few minutes." } }, { status: 429, headers: { "Retry-After": "600" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const posthog = createPostHog();
  let insforge: Awaited<ReturnType<typeof createInsforgeServer>> | null = null;
  let userId = "";
  let jobId = "";
  let runId = "";
  let claimed = false;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_CONTENT_TYPE", message: "The research request must use JSON." } }, { status: 400 });
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: { code: "INVALID_JSON", message: "The research request was not valid JSON." } }, { status: 400 });
    }
    const body = recordValue(parsedBody);
    jobId = stringValue(body.jobId);
    if (!jobId || jobId.length > 100) return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "A valid job is required." } }, { status: 400 });

    insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;
    if (currentUserError || !user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." } }, { status: 401 });
    userId = user.id;

    const { data: jobRow, error: jobError } = await insforge.database.from("jobs").select("id,run_id,title,company,source_url,external_apply_url,about_role,matched_skills,missing_skills,company_research").eq("id", jobId).eq("user_id", userId).maybeSingle();
    if (jobError) {
      console.error("[agent/research] Could not load job", jobError);
      return NextResponse.json({ success: false, error: { code: "JOB_LOAD_FAILED", message: "We could not load this job right now." } }, { status: 500 });
    }
    const job = jobFromRow(jobRow);
    if (!job) return NextResponse.json({ success: false, error: { code: "JOB_NOT_FOUND", message: "This saved job could not be found." } }, { status: 404 });
    runId = job.runId;

    const { data: profileRow, error: profileError } = await insforge.database.from("profiles").select("current_title,years_experience,experience_level,skills,industries,work_experience").eq("id", userId).maybeSingle();
    if (profileError) throw new CompanyResearchError("PROFILE_LOAD_FAILED", 500, "We could not load your profile for company research.");
    if (!profileRow) throw new CompanyResearchError("PROFILE_REQUIRED", 400, "Complete and save your profile before researching a company.");

    const currentResearch = recordValue(jobRow).company_research;
    const cached = parseCompanyResearch(currentResearch);
    if (cached) {
      await writeLog(insforge, userId, jobId, job.runId, "research_cached", "info");
      return NextResponse.json({ success: true, cached: true, dossier: cached });
    }
    const marker = parseResearchMarker(currentResearch);
    if (currentResearch !== null && currentResearch !== undefined && !marker) await writeLog(insforge, userId, jobId, job.runId, "research_invalid_cached_dossier", "warning");
    if (marker && isFreshResearchMarker(marker)) {
      await writeLog(insforge, userId, jobId, job.runId, "research_rate_limited", "warning");
      return runningResponse();
    }

    const runningMarker = { status: "running" as const, startedAt: new Date().toISOString() };
    let claimQuery = insforge.database.from("jobs").update({ company_research: runningMarker }).eq("id", jobId).eq("user_id", userId);
    if (!marker && (currentResearch === null || currentResearch === undefined)) claimQuery = claimQuery.is("company_research", null);
    if (marker) claimQuery = claimQuery.eq("company_research->>status", "running").lt("company_research->>startedAt", new Date(Date.now() - COMPANY_RESEARCH_TTL_MS).toISOString());
    const { data: claimedRow, error: claimError } = await claimQuery.select("id").maybeSingle();
    if (claimError) {
      console.error("[agent/research] Could not claim job", claimError);
      return NextResponse.json({ success: false, error: { code: "CLAIM_FAILED", message: "We could not start company research right now." } }, { status: 500 });
    }
    if (!claimedRow) {
      const { data: latestRow } = await insforge.database.from("jobs").select("company_research").eq("id", jobId).eq("user_id", userId).maybeSingle();
      const latest = recordValue(latestRow).company_research;
      const latestDossier = parseCompanyResearch(latest);
      if (latestDossier) return NextResponse.json({ success: true, cached: true, dossier: latestDossier });
      const latestMarker = parseResearchMarker(latest);
      if (latestMarker && isFreshResearchMarker(latestMarker)) {
        await writeLog(insforge, userId, jobId, job.runId, "research_rate_limited", "warning");
        return runningResponse();
      }
      return NextResponse.json({ success: false, error: { code: "CLAIM_FAILED", message: "We could not start company research right now." } }, { status: 409 });
    }
    claimed = true;
    await writeLog(insforge, userId, jobId, job.runId, "research_started", "info");

    const result = await researchCompany(insforge, userId, job, profileFromRow(profileRow));
    const persisted = await insforge.database.from("jobs").update({ company_research: result.dossier }).eq("id", jobId).eq("user_id", userId).eq("company_research->>status", "running").select("company_research").maybeSingle();
    if (persisted.error || !persisted.data) throw new CompanyResearchError("PERSISTENCE_FAILED", 500, "We researched the company but could not save the dossier.");
    const dossier = parseCompanyResearch(recordValue(persisted.data).company_research);
    if (!dossier) throw new CompanyResearchError("PERSISTENCE_FAILED", 500, "We researched the company but could not validate the saved dossier.");

    await writeLog(insforge, userId, jobId, job.runId, "research_succeeded", "success");
    posthog?.capture({ distinctId: userId, event: "company_research_completed", properties: { userId, jobId, browserEvidenceUsed: result.browserEvidenceUsed, sourceCount: dossier.sources.length } });
    return NextResponse.json({ success: true, cached: false, dossier });
  } catch (error) {
    if (insforge && userId && jobId && claimed) {
      const { error: clearError } = await insforge.database.from("jobs").update({ company_research: null }).eq("id", jobId).eq("user_id", userId).eq("company_research->>status", "running");
      if (clearError) console.error("[agent/research] Could not clear running marker", clearError);
      const failureCode = error instanceof CompanyResearchError ? error.code : "RESEARCH_FAILED";
      const failureEvent = failureCode === "PERSISTENCE_FAILED" ? "research_persistence_failed" : failureCode === "RESEARCH_UNAVAILABLE" ? "research_synthesis_failed" : "research_failed";
      const detail = error instanceof CompanyResearchError ? error.detail : error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 220) : "unknown failure";
      await writeLog(insforge, userId, jobId, runId, `${failureEvent}:${detail}`, "error");
    }
    return errorResponse(error);
  } finally {
    if (posthog) {
      try {
        await posthog.shutdown();
      } catch (error) {
        console.error("[agent/research] Could not flush PostHog events", error);
      }
    }
  }
}
