import "server-only";

import { redirect } from "next/navigation";
import { parseCompanyResearch } from "@/lib/company-research";
import type {
  DashboardActivity,
  DashboardPageData,
  DashboardStats,
} from "@/lib/dashboard-types";
import { createInsforgeServer } from "@/lib/insforge-server";
import { emptyDashboardAnalytics, getPostHogDashboardAnalytics } from "@/lib/posthog-analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function rowsValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function relativeTime(value: string, now: number): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const elapsed = Math.max(0, now - timestamp);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (elapsed < 60 * 60 * 1000) return formatter.format(-Math.max(1, Math.round(elapsed / (60 * 1000))), "minute");
  if (elapsed < DAY_MS) return formatter.format(-Math.max(1, Math.round(elapsed / (60 * 60 * 1000))), "hour");
  if (elapsed < 7 * DAY_MS) return formatter.format(-Math.max(1, Math.round(elapsed / DAY_MS)), "day");
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function statsFromJobs(rows: unknown[], now: number): DashboardStats {
  const scores = rows
    .map((value) => numberValue(recordValue(value).match_score))
    .filter((value): value is number => value !== null);
  const researched = rows.filter((value) => parseCompanyResearch(recordValue(value).company_research) !== null);
  const weekStart = now - 7 * DAY_MS;

  return {
    totalJobs: rows.length,
    averageMatchRate: scores.length > 0
      ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
      : 0,
    companiesResearched: researched.length,
    jobsThisWeek: rows.filter((value) => {
      const timestamp = new Date(stringValue(recordValue(value).found_at)).getTime();
      return Number.isFinite(timestamp) && timestamp >= weekStart;
    }).length,
  };
}

function activitiesFromRows(runRows: unknown[], jobRows: unknown[], logRows: unknown[], now: number): DashboardActivity[] {
  const jobsById = new Map<string, string>();
  for (const value of jobRows) {
    const row = recordValue(value);
    const id = stringValue(row.id);
    const company = stringValue(row.company);
    if (id && company) jobsById.set(id, company);
  }

  const searches = runRows.map((value): DashboardActivity => {
    const row = recordValue(value);
    const id = stringValue(row.id);
    const title = stringValue(row.job_title_searched) || "your search";
    const jobsFound = Math.max(0, Math.round(numberValue(row.jobs_found) ?? 0));
    const occurredAt = stringValue(row.completed_at) || stringValue(row.started_at);
    return {
      id: `search-${id}`,
      type: "search",
      title: `Found ${jobsFound} ${jobsFound === 1 ? "job" : "jobs"} for ${title}`,
      detail: "Job search completed",
      occurredAt,
      timeAgo: relativeTime(occurredAt, now),
    };
  }).filter((activity) => activity.occurredAt);

  const research = logRows.flatMap((value): DashboardActivity[] => {
    const row = recordValue(value);
    const id = stringValue(row.id);
    const jobId = stringValue(row.job_id);
    const company = jobsById.get(jobId);
    const occurredAt = stringValue(row.created_at);
    if (!id || !company || !occurredAt) return [];
    return [{
      id: `research-${id}`,
      type: "research",
      title: `Researched ${company}`,
      detail: "Company dossier ready",
      occurredAt,
      timeAgo: relativeTime(occurredAt, now),
    }];
  });

  return [...searches, ...research]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 8);
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const insforge = await createInsforgeServer();
  const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
  const user = currentUserData?.user;

  if (currentUserError || !user) redirect("/login");

  const analyticsPromise = getPostHogDashboardAnalytics(user.id);
  const [jobsResult, runsResult, logsResult, profileResult, analyticsResult] = await Promise.all([
    insforge.database.from("jobs").select("id,company,match_score,company_research,found_at").eq("user_id", user.id).order("found_at", { ascending: false }),
    insforge.database.from("agent_runs").select("id,status,job_title_searched,jobs_found,started_at,completed_at").eq("user_id", user.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(10),
    insforge.database.from("agent_logs").select("id,job_id,message,created_at").eq("user_id", user.id).eq("message", "research_succeeded").order("created_at", { ascending: false }).limit(10),
    insforge.database.from("profiles").select("is_complete").eq("id", user.id).maybeSingle(),
    analyticsPromise,
  ]);

  const databaseFailed = Boolean(jobsResult.error || runsResult.error || logsResult.error || profileResult.error);
  if (jobsResult.error) console.error("[dashboard/page] Could not load jobs", jobsResult.error);
  if (runsResult.error) console.error("[dashboard/page] Could not load agent runs", runsResult.error);
  if (logsResult.error) console.error("[dashboard/page] Could not load research activity", logsResult.error);
  if (profileResult.error) console.error("[dashboard/page] Could not load profile status", profileResult.error);

  const jobs = rowsValue(jobsResult.data);
  const now = Date.now();

  return {
    stats: statsFromJobs(jobs, now),
    activities: activitiesFromRows(rowsValue(runsResult.data), jobs, rowsValue(logsResult.data), now),
    analytics: analyticsResult.analytics ?? emptyDashboardAnalytics(),
    profileComplete: recordValue(profileResult.data).is_complete === true,
    databaseError: databaseFailed ? "Some dashboard data could not be loaded right now." : undefined,
    analyticsError: analyticsResult.error,
  };
}
