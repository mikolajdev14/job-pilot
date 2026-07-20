import { notFound, redirect } from "next/navigation";
import { parseCompanyResearch, type CompanyResearchDossier } from "@/lib/company-research";
import { createInsforgeServer } from "@/lib/insforge-server";

export type JobDetailsData = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  sourceUrl: string;
  externalApplyUrl: string;
  aboutRole: string;
  matchScore: number | null;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
  foundAt: string;
  companyResearch: CompanyResearchDossier | null;
};

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function scoreValue(value: unknown): number | null {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function httpUrl(value: unknown): string {
  const url = stringValue(value);
  return /^https?:\/\//i.test(url) ? url : "";
}

function normalizeJob(value: unknown): JobDetailsData | null {
  const job = recordValue(value);
  const id = stringValue(job.id);
  const title = stringValue(job.title);
  const company = stringValue(job.company);

  if (!id || !title || !company) return null;

  return {
    id,
    title,
    company,
    location: stringValue(job.location),
    salary: stringValue(job.salary),
    jobType: stringValue(job.job_type),
    sourceUrl: httpUrl(job.source_url),
    externalApplyUrl: httpUrl(job.external_apply_url),
    aboutRole: stringValue(job.about_role),
    matchScore: scoreValue(job.match_score),
    matchReason: stringValue(job.match_reason),
    matchedSkills: stringList(job.matched_skills),
    missingSkills: stringList(job.missing_skills),
    foundAt: stringValue(job.found_at),
    companyResearch: parseCompanyResearch(job.company_research),
  };
}

export async function getJobDetailsPageData(jobId: string): Promise<JobDetailsData> {
  const insforge = await createInsforgeServer();
  const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
  const user = currentUserData?.user;

  if (currentUserError || !user) redirect("/login");

  const { data, error } = await insforge.database
    .from("jobs")
    .select("id,title,company,location,salary,job_type,source_url,external_apply_url,about_role,match_score,match_reason,matched_skills,missing_skills,found_at,company_research")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[find-jobs/[id]] Could not load job", error);
    throw new Error("Could not load this job.");
  }

  const job = normalizeJob(data);
  if (!job) notFound();

  return job;
}
