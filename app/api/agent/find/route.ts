import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { PostHog } from "posthog-node";
import { AdzunaApiError, detectAdzunaCountry, searchJobs, type AdzunaJob } from "@/lib/adzuna";
import { createInsforgeServer } from "@/lib/insforge-server";
import { MATCH_THRESHOLD } from "@/lib/utils";
import { scoreJob, type JobMatch, type JobMatchingProfile } from "@/lib/job-matching";

export const runtime = "nodejs";

type JobPreview = {
  id: string;
  company: string;
  role: string;
  score: number;
  salary: string;
  source: "Search";
  dateFound: string;
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function profileForMatching(value: unknown): JobMatchingProfile {
  const profile = recordValue(value);
  return {
    fullName: stringValue(profile.full_name),
    currentJobTitle: stringValue(profile.current_title),
    yearsExperience: profile.years_experience === null || profile.years_experience === undefined ? "" : String(profile.years_experience),
    skills: stringList(profile.skills),
    industries: stringList(profile.industries),
    workExperience: profile.work_experience ?? [],
    education: profile.education ?? null,
    jobTitlesSeeking: stringList(profile.job_titles_seeking),
    remotePreference: stringValue(profile.remote_preference),
    preferredLocations: stringList(profile.preferred_locations),
  };
}

function formatSalary(job: AdzunaJob): string {
  if (job.salaryMin === null && job.salaryMax === null) return "Not listed";
  const min = job.salaryMin === null ? null : `$${Math.round(job.salaryMin / 1000)}k`;
  const max = job.salaryMax === null ? null : `$${Math.round(job.salaryMax / 1000)}k`;
  if (min && max) return `${min} - ${max}`;
  return min ?? max ?? "Not listed";
}

function formatDateFound(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Just now";

  const differenceInHours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (differenceInHours < 1) return "Just now";
  if (differenceInHours < 24) return `${differenceInHours} hour${differenceInHours === 1 ? "" : "s"} ago`;
  const differenceInDays = Math.floor(differenceInHours / 24);
  if (differenceInDays === 1) return "Yesterday";
  if (differenceInDays < 7) return `${differenceInDays} days ago`;
  return `${Math.floor(differenceInDays / 7)} week${Math.floor(differenceInDays / 7) === 1 ? "" : "s"} ago`;
}

function createPostHog(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

async function writeAgentLog(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  runId: string,
  userId: string,
  message: string,
  level: "info" | "success" | "warning" | "error",
): Promise<void> {
  const { error } = await insforge.database.from("agent_logs").insert([{ run_id: runId, user_id: userId, message, level }]);
  if (error) console.error("[agent/find] Could not write agent log", error);
}

async function markRunFailed(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  runId: string | null,
  userId: string,
  message: string,
): Promise<void> {
  if (!runId) return;
  const { error } = await insforge.database.from("agent_runs").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userId);
  if (error) console.error("[agent/find] Could not mark run failed", error);
  await writeAgentLog(insforge, runId, userId, message, "error");
}

function apiError(error: unknown): NextResponse {
  if (error instanceof OpenAI.APIError) {
    console.error("[agent/find] OpenAI scoring failed", { code: error.code, requestId: error.requestID, status: error.status });
    if (error.code === "insufficient_quota") return NextResponse.json({ success: false, error: "OpenAI usage limit reached. Add billing or credits to score jobs." }, { status: 503 });
    if (error.status === 429) return NextResponse.json({ success: false, error: "OpenAI is temporarily rate limited. Please try again in a moment." }, { status: 503 });
    if (error.status === 401) return NextResponse.json({ success: false, error: "The OpenAI API key is not authorized. Check the server configuration." }, { status: 503 });
  }

  if (error instanceof AdzunaApiError) {
    console.error("[agent/find] Adzuna request failed", { status: error.status });
    return NextResponse.json({ success: false, error: "The job search provider is temporarily unavailable. Please try again." }, { status: 502 });
  }

  console.error("[agent/find] Job search failed", { message: error instanceof Error ? error.message : "Unknown error" });
  return NextResponse.json({ success: false, error: "We could not find jobs right now. Please try again." }, { status: 500 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let insforge: Awaited<ReturnType<typeof createInsforgeServer>> | null = null;
  let runId: string | null = null;
  let userId = "";
  const posthog = createPostHog();

  try {
    const body = recordValue(await request.json().catch(() => null));
    const jobTitle = stringValue(body.jobTitle);
    const location = stringValue(body.location);

    if (!jobTitle) return NextResponse.json({ success: false, error: "Enter a job title before searching." }, { status: 400 });
    if (jobTitle.length > 120 || location.length > 120) return NextResponse.json({ success: false, error: "Search fields must be 120 characters or fewer." }, { status: 400 });

    insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;
    if (currentUserError || !user) return NextResponse.json({ success: false, error: "Your session has expired. Please sign in again." }, { status: 401 });
    userId = user.id;

    posthog?.capture({ distinctId: userId, event: "job_search_started", properties: { userId, jobTitle, location } });

    const { data: profileRow, error: profileError } = await insforge.database.from("profiles").select("full_name,current_title,years_experience,skills,industries,work_experience,education,job_titles_seeking,remote_preference,preferred_locations").eq("id", userId).maybeSingle();
    if (profileError) {
      console.error("[agent/find] Could not load profile", profileError);
      return NextResponse.json({ success: false, error: "We could not load your profile for job matching." }, { status: 500 });
    }
    if (!profileRow) return NextResponse.json({ success: false, error: "Complete and save your profile before searching for jobs." }, { status: 400 });

    const { data: runData, error: runError } = await insforge.database.from("agent_runs").insert([{ user_id: userId, status: "running", job_title_searched: jobTitle, location_searched: location || null, jobs_found: 0 }]).select("id").single();
    if (runError) {
      console.error("[agent/find] Could not create agent run", runError);
      return NextResponse.json({ success: false, error: "We could not start the job search. Please try again." }, { status: 500 });
    }
    runId = stringValue(recordValue(runData).id);
    if (!runId) throw new Error("Agent run did not return an id");

    await writeAgentLog(insforge, runId, userId, `Started job search for ${jobTitle}${location ? ` in ${location}` : ""}.`, "info");

    const country = detectAdzunaCountry(location);
    const adzunaJobs = await searchJobs(jobTitle, location, country);
    const profile = profileForMatching(profileRow);
    const scoredJobs: Array<{ job: AdzunaJob; match: JobMatch }> = [];
    for (const job of adzunaJobs) scoredJobs.push({ job, match: await scoreJob(profile, job) });

    const previews: JobPreview[] = [];
    for (const scoredJob of scoredJobs) {
      const { job, match } = scoredJob;
      const { data: savedJob, error: saveError } = await insforge.database.from("jobs").insert([{
        user_id: userId,
        run_id: runId,
        source: "search",
        source_url: job.redirectUrl,
        external_apply_url: job.redirectUrl,
        title: job.title,
        company: job.company,
        location: job.location || null,
        salary: formatSalary(job),
        job_type: ["fulltime", "parttime", "contract"].includes(job.contractType) ? job.contractType : "fulltime",
        about_role: job.description || null,
        match_score: match.matchScore,
        match_reason: match.matchReason,
        matched_skills: match.matchedSkills,
        missing_skills: match.missingSkills,
        found_at: new Date().toISOString(),
      }]).select("id,company,title,match_score,salary,found_at").single();

      if (saveError) throw new Error("Could not save a discovered job");
      const saved = recordValue(savedJob);
      const jobId = stringValue(saved.id);
      if (!jobId) throw new Error("Saved job did not return an id");

      const score = typeof saved.match_score === "number" ? saved.match_score : match.matchScore;
      previews.push({ id: jobId, company: stringValue(saved.company) || job.company, role: stringValue(saved.title) || job.title, score, salary: stringValue(saved.salary) || formatSalary(job), source: "Search", dateFound: formatDateFound(stringValue(saved.found_at)) });
      posthog?.capture({ distinctId: userId, event: "job_found", properties: { userId, source: "search", matchScore: score } });
    }

    const { error: completeError } = await insforge.database.from("agent_runs").update({ status: "completed", jobs_found: previews.length, completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userId);
    if (completeError) throw new Error("Could not complete agent run");
    await writeAgentLog(insforge, runId, userId, `Completed job search with ${previews.length} jobs.`, "success");

    const strongMatches = previews.filter((job) => job.score >= MATCH_THRESHOLD).length;
    return NextResponse.json({ success: true, jobs: previews, jobsFound: previews.length, strongMatches, message: `Found ${previews.length} jobs and saved ${strongMatches} strong matches.` });
  } catch (error) {
    if (insforge && userId) await markRunFailed(insforge, runId, userId, "Job search failed before completion.");
    return apiError(error);
  } finally {
    if (posthog) {
      try {
        await posthog.shutdown();
      } catch (error) {
        console.error("[agent/find] Could not flush PostHog events", error);
      }
    }
  }
}
