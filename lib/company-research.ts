import { z } from "zod";

export const COMPANY_RESEARCH_TTL_MS = 10 * 60 * 1000;
export const RESEARCH_DEADLINE_MS = 105_000;
export const BROWSERBASE_SESSION_TIMEOUT_SECONDS = 120;

const researchItemSchema = z.string().trim().min(1).max(500);

export const companyResearchSchema = z.object({
  companyOverview: z.string().trim().max(1_600),
  techStack: z.array(z.string().trim().min(1).max(120)).max(20),
  culture: z.array(researchItemSchema).max(12),
  whyThisRole: z.string().trim().max(1_200),
  yourEdge: z.array(researchItemSchema).max(12),
  gapsToAddress: z.array(researchItemSchema).max(12),
  smartQuestions: z.array(researchItemSchema).max(12),
  interviewPrep: z.array(researchItemSchema).max(12),
  sources: z.array(z.string().url().max(2_048).refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Sources must use HTTPS.")).max(10),
});

export type CompanyResearchDossier = z.infer<typeof companyResearchSchema>;

export const researchMarkerSchema = z.object({
  status: z.literal("running"),
  startedAt: z.string().datetime(),
});

export type ResearchMarker = z.infer<typeof researchMarkerSchema>;

export function parseCompanyResearch(value: unknown): CompanyResearchDossier | null {
  const result = companyResearchSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseResearchMarker(value: unknown): ResearchMarker | null {
  const result = researchMarkerSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function isFreshResearchMarker(marker: ResearchMarker, now = Date.now()): boolean {
  const startedAt = Date.parse(marker.startedAt);
  return Number.isFinite(startedAt) && now - startedAt < COMPANY_RESEARCH_TTL_MS;
}

export function isSafeResearchSource(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
