import OpenAI from "openai";
import type { AdzunaJob } from "@/lib/adzuna";

export type JobMatchingProfile = {
  fullName: string;
  currentJobTitle: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: unknown;
  education: unknown;
  jobTitlesSeeking: string[];
  remotePreference: string;
  preferredLocations: string[];
};

export type JobMatch = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown, limit = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function integerScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseMatch(value: unknown): JobMatch | null {
  const result = recordValue(value);
  const matchReason = stringValue(result.matchReason);
  if (!matchReason) return null;

  return {
    matchScore: integerScore(result.matchScore),
    matchReason: matchReason.slice(0, 1200),
    matchedSkills: stringList(result.matchedSkills),
    missingSkills: stringList(result.missingSkills),
  };
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (!apiKey) throw new Error("Missing OpenAI API key");
  return new OpenAI({ apiKey, maxRetries: 1 });
}

export async function scoreJob(profile: JobMatchingProfile, job: AdzunaJob): Promise<JobMatch> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: "You score a job against a candidate profile. Return only valid JSON with exactly these keys: matchScore (integer 0 to 100), matchReason (one concise paragraph), matchedSkills (array of skills the candidate has that the job needs), and missingSkills (array of job skills not present in the profile). Use only evidence from the profile and job text. Never invent candidate skills, requirements, or experience. Score the overall fit, not just keyword overlap.",
      },
      {
        role: "user",
        content: JSON.stringify({
          candidate: profile,
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            contractType: job.contractType,
          },
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("Empty job match response");

  const parsed = parseMatch(JSON.parse(content) as unknown);
  if (!parsed) throw new Error("Invalid job match response");
  return parsed;
}
