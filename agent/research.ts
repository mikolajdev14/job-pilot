import dns from "node:dns/promises";
import net from "node:net";
import OpenAI from "openai";
import Browserbase from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import {
  BROWSERBASE_SESSION_TIMEOUT_SECONDS,
  companyResearchSchema,
  RESEARCH_DEADLINE_MS,
  type CompanyResearchDossier,
} from "@/lib/company-research";

type InsforgeServer = Awaited<ReturnType<typeof import("@/lib/insforge-server").createInsforgeServer>>;

export type ResearchJob = {
  id: string;
  runId: string;
  title: string;
  company: string;
  sourceUrl: string;
  externalApplyUrl: string;
  aboutRole: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export type ResearchProfile = {
  currentTitle: string;
  yearsExperience: string;
  experienceLevel: string;
  skills: string[];
  industries: string[];
  workExperience: unknown[];
};

export type ResearchResult = {
  dossier: CompanyResearchDossier;
  browserEvidenceUsed: boolean;
};

export class CompanyResearchError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly detail = message) {
    super(message);
    this.name = "CompanyResearchError";
  }
}

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
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function safeLogValue(value: unknown): string {
  return value instanceof Error ? value.message.slice(0, 200) : String(value).slice(0, 200);
}

async function writeResearchLog(insforge: InsforgeServer, userId: string, jobId: string, runId: string, message: string, level: "info" | "success" | "warning" | "error"): Promise<void> {
  if (!runId) return;
  const { error } = await insforge.database.from("agent_logs").insert([{ run_id: runId, user_id: userId, job_id: jobId, message, level }]);
  if (error) console.error("[agent/research] Could not write agent log", error);
}

function hostRoot(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const twoPartSuffixes = new Set(["co.uk", "com.au", "co.nz", "co.jp", "com.br", "co.in"]);
  const suffix = labels.slice(-2).join(".");
  return twoPartSuffixes.has(suffix) ? labels.slice(-3).join(".") : labels.slice(-2).join(".");
}

function isPrivateIpv4(value: string): boolean {
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168) || octets[0] === 0;
}

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) return isPrivateIpv4(address);
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
  }
  return true;
}

async function isPublicUrl(value: string): Promise<boolean> {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".local") || net.isIP(url.hostname) && isPrivateAddress(url.hostname)) return false;
    const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

async function resolvePublicUrl(candidate: string): Promise<string | null> {
  if (!await isPublicUrl(candidate)) return null;
  try {
    const response = await fetch(candidate, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
      headers: { "user-agent": "JobPilot company research bot" },
    });
    const finalUrl = response.url || candidate;
    if (!await isPublicUrl(finalUrl)) return null;
    const url = new URL(finalUrl);
    if (url.hostname.includes("adzuna")) return null;
    return `${url.protocol}//${url.hostname}/`;
  } catch {
    return null;
  }
}

async function findCompanyHomepage(job: ResearchJob): Promise<string | null> {
  const candidates = [job.externalApplyUrl, job.sourceUrl].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = await resolvePublicUrl(candidate);
    if (resolved) return resolved;
  }

  const slug = job.company.toLowerCase().replace(/\b(incorporated|inc|llc|ltd|limited|corp|corporation|company|co)\b/g, "").replace(/[^a-z0-9]/g, "").slice(0, 60);
  if (!slug) return null;
  const fallback = `https://www.${slug}.com/`;
  return await isPublicUrl(fallback) ? fallback : null;
}

const pageEvidenceSchema = z.object({
  oneLiner: z.string().trim().max(400).default(""),
  productSummary: z.string().trim().max(1_600).default(""),
  signals: z.array(z.string().trim().max(500)).max(12).default([]),
  pageLinks: z.array(z.object({ url: z.string().url(), kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]).default("other") })).max(10).default([]),
});

type PageEvidence = z.infer<typeof pageEvidenceSchema>;

function cleanEvidence(evidence: PageEvidence): PageEvidence {
  return {
    oneLiner: evidence.oneLiner.trim(),
    productSummary: evidence.productSummary.trim(),
    signals: evidence.signals.map((item) => item.trim()).filter(Boolean),
    pageLinks: evidence.pageLinks.filter((item) => item.url.startsWith("https://")),
  };
}

async function collectBrowserEvidence(homepageUrl: string, insforge: InsforgeServer, userId: string, jobId: string, runId: string): Promise<{ evidence: PageEvidence[]; sources: string[] }> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID ?? process.env.BROWSERBASE_APP_ID;
  const openAiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (!apiKey || !projectId || !openAiKey) throw new CompanyResearchError("RESEARCH_UNAVAILABLE", 503, "Company research is temporarily unavailable. Please try again.", "missing_browserbase_or_stagehand_key");

  const browserbase = new Browserbase({ apiKey, timeout: 15_000, maxRetries: 1 });
  let stagehand: Stagehand | null = null;
  const evidence: PageEvidence[] = [];
  const sources: string[] = [];
  const deadline = Date.now() + RESEARCH_DEADLINE_MS;

  try {
    await writeResearchLog(insforge, userId, jobId, runId, "research_provider_session_started", "info");
    const allowedDomain = hostRoot(new URL(homepageUrl).hostname);
    const session = await browserbase.sessions.create({ projectId, timeout: BROWSERBASE_SESSION_TIMEOUT_SECONDS, browserSettings: { blockAds: true, allowedDomains: [allowedDomain] } });
    stagehand = new Stagehand({ env: "BROWSERBASE", apiKey, projectId, browserbaseSessionID: session.id, model: { modelName: "openai/gpt-4o", apiKey: openAiKey }, disablePino: true, verbose: 0 });
    await stagehand.init();
    const page = stagehand.context.activePage();
    if (!page) throw new Error("Browser session did not expose a page.");

    await writeResearchLog(insforge, userId, jobId, runId, "research_provider_homepage_opened", "info");
    await page.goto(homepageUrl, { timeoutMs: Math.max(5_000, deadline - Date.now()) });
    const homepage = cleanEvidence(await stagehand.extract("Extract a one line company description, product summary, evidence based signals, and useful same company links. Only use facts visible on the page.", pageEvidenceSchema, { timeout: Math.max(5_000, deadline - Date.now()) }));
    evidence.push(homepage);
    sources.push(homepageUrl);

    const allowedRoot = hostRoot(new URL(homepageUrl).hostname);
    const preference = new Map([["about", 0], ["careers", 1], ["engineering", 2], ["product", 3], ["team", 4], ["blog", 5], ["other", 6]]);
    const preferredLinks = homepage.pageLinks.filter((link) => {
      try {
        const url = new URL(link.url);
        return url.protocol === "https:" && hostRoot(url.hostname) === allowedRoot;
      } catch {
        return false;
      }
    }).sort((left, right) => (preference.get(left.kind) ?? 6) - (preference.get(right.kind) ?? 6)).slice(0, 3);

    for (const link of preferredLinks) {
      if (Date.now() >= deadline - 3_000) break;
      try {
        await writeResearchLog(insforge, userId, jobId, runId, `research_provider_subpage_opened:${link.kind}`, "info");
        await page.goto(link.url, { timeoutMs: Math.max(5_000, deadline - Date.now()) });
        const subpage = cleanEvidence(await stagehand.extract("Extract public facts from this page, with emphasis on culture, engineering practices, team, careers, products, or notable facts. Do not infer facts that are not visible.", pageEvidenceSchema, { timeout: Math.max(5_000, deadline - Date.now()) }));
        evidence.push(subpage);
        sources.push(link.url);
      } catch (error) {
        await writeResearchLog(insforge, userId, jobId, runId, `research_provider_subpage_failed:${safeLogValue(error)}`, "warning");
      }
    }

    await writeResearchLog(insforge, userId, jobId, runId, "research_provider_evidence_collected", "success");
    return { evidence, sources: [...new Set(sources)] };
  } finally {
    try {
      if (stagehand) await stagehand.close({ force: true });
      await writeResearchLog(insforge, userId, jobId, runId, "research_provider_session_closed", "info");
    } catch (error) {
      console.error("[agent/research] Could not close Browserbase session", error);
      await writeResearchLog(insforge, userId, jobId, runId, "research_provider_session_close_failed", "warning");
    }
  }
}

function profilePrompt(profile: ResearchProfile): string {
  return JSON.stringify({
    currentTitle: profile.currentTitle,
    yearsExperience: profile.yearsExperience,
    experienceLevel: profile.experienceLevel,
    skills: profile.skills,
    industries: profile.industries,
    workExperience: profile.workExperience.slice(0, 5),
  });
}

async function synthesizeDossier(job: ResearchJob, profile: ResearchProfile, evidence: PageEvidence[], sources: string[]): Promise<CompanyResearchDossier> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (!apiKey) throw new CompanyResearchError("RESEARCH_UNAVAILABLE", 503, "Company research is temporarily unavailable. Please try again.", "missing_openai_key");
  const openai = new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You create an interview dossier from public evidence, a saved job, and a candidate profile. Return only JSON with exactly these keys: companyOverview, techStack, culture, whyThisRole, yourEdge, gapsToAddress, smartQuestions, interviewPrep, sources. Never invent company facts, candidate experience, or job requirements. Empty strings and arrays are valid when evidence is thin. Keep companyOverview and whyThisRole under 30 words. Use at most 2 items in every array, and keep each item under 18 words. Every source must be HTTPS and come from the supplied source list. Output compact valid JSON." },
      { role: "user", content: JSON.stringify({ job, profile: profilePrompt(profile), publicEvidence: evidence, sourceAllowList: sources }) },
    ],
  });
  const content = response.choices[0]?.message.content;
  const finishReason = response.choices[0]?.finish_reason ?? "unknown";
  if (!content) throw new CompanyResearchError("RESEARCH_UNAVAILABLE", 503, "Company research is temporarily unavailable. Please try again.", `empty_openai_completion:${finishReason}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new CompanyResearchError("RESEARCH_UNAVAILABLE", 503, "Company research is temporarily unavailable. Please try again.", `invalid_openai_json:${finishReason}`);
  }
  const result = companyResearchSchema.safeParse(parsed);
  if (!result.success) {
    const invalidFields = result.error.issues.map((issue) => issue.path.join(".")).filter(Boolean).slice(0, 5).join(",") || "unknown";
    throw new CompanyResearchError("RESEARCH_UNAVAILABLE", 503, "Company research is temporarily unavailable. Please try again.", `invalid_dossier_shape:${invalidFields}:${finishReason}`);
  }
  const allowedSources = new Set(sources);
  return { ...result.data, sources: result.data.sources.filter((source) => allowedSources.has(source)) };
}

export async function researchCompany(insforge: InsforgeServer, userId: string, job: ResearchJob, profile: ResearchProfile): Promise<ResearchResult> {
  const homepage = await findCompanyHomepage(job);
  let browserEvidenceUsed = false;
  let evidence: PageEvidence[] = [];
  let sources: string[] = [];

  if (homepage) {
    try {
      const browserResult = await collectBrowserEvidence(homepage, insforge, userId, job.id, job.runId);
      evidence = browserResult.evidence;
      sources = browserResult.sources;
      browserEvidenceUsed = evidence.length > 0;
    } catch (error) {
      await writeResearchLog(insforge, userId, job.id, job.runId, `research_browser_failed:${safeLogValue(error)}`, "warning");
    }
  } else {
    await writeResearchLog(insforge, userId, job.id, job.runId, "research_browser_failed:no_safe_company_url", "warning");
  }

  const dossier = await synthesizeDossier(job, profile, evidence, sources);
  return { dossier, browserEvidenceUsed };
}

export function jobFromRow(value: unknown): ResearchJob | null {
  const row = recordValue(value);
  const id = stringValue(row.id);
  const title = stringValue(row.title);
  const company = stringValue(row.company);
  if (!id || !title || !company) return null;
  return { id, runId: stringValue(row.run_id), title, company, sourceUrl: stringValue(row.source_url), externalApplyUrl: stringValue(row.external_apply_url), aboutRole: stringValue(row.about_role), matchedSkills: stringList(row.matched_skills), missingSkills: stringList(row.missing_skills) };
}

export function profileFromRow(value: unknown): ResearchProfile {
  const row = recordValue(value);
  return { currentTitle: stringValue(row.current_title), yearsExperience: row.years_experience === null || row.years_experience === undefined ? "" : String(row.years_experience), experienceLevel: stringValue(row.experience_level), skills: stringList(row.skills), industries: stringList(row.industries), workExperience: Array.isArray(row.work_experience) ? row.work_experience : [] };
}
