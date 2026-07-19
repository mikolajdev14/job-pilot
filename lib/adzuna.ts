export type AdzunaCountry = "us" | "gb" | "au" | "ca" | "pl";

export type AdzunaJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  redirectUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryIsPredicted: boolean;
  contractType: string;
  created: string;
};

export class AdzunaApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Adzuna API request failed with status ${status}`);
    this.name = "AdzunaApiError";
    this.status = status;
  }
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function nestedString(value: unknown, key: string): string {
  return stringValue(recordValue(value)[key]);
}

function parseJob(value: unknown): AdzunaJob | null {
  const job = recordValue(value);
  const id = stringValue(job.id);
  const title = stringValue(job.title);
  const redirectUrl = stringValue(job.redirect_url);

  if (!id || !title || !redirectUrl) return null;

  return {
    id,
    title,
    company: nestedString(job.company, "display_name") || "Unknown company",
    location: nestedString(job.location, "display_name"),
    description: stringValue(job.description),
    redirectUrl,
    salaryMin: nullableNumber(job.salary_min),
    salaryMax: nullableNumber(job.salary_max),
    salaryIsPredicted: job.salary_is_predicted === "1",
    contractType: stringValue(job.contract_type),
    created: stringValue(job.created),
  };
}

export function detectAdzunaCountry(location: string): AdzunaCountry {
  const normalized = location.toLowerCase();
  const polishLocations = ["poland", "polska", "krakow", "kraków", "warsaw", "warszawa", "wroclaw", "wrocław", "gdansk", "gdańsk", "poznan", "poznań", "lodz", "łódź", "katowice"];
  if (polishLocations.some((term) => normalized.includes(term))) return "pl";
  if (/(^|\W)(uk|united kingdom|england|scotland|wales)(\W|$)/.test(normalized)) return "gb";
  if (/(^|\W)(australia|sydney|melbourne)(\W|$)/.test(normalized)) return "au";
  if (/(^|\W)(canada|toronto|vancouver|montreal)(\W|$)/.test(normalized)) return "ca";
  return "us";
}

export async function searchJobs(jobTitle: string, location: string, country: AdzunaCountry = "us"): Promise<AdzunaJob[]> {
  const applicationId = process.env.ADZUNA_APPLICATION_ID ?? process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY ?? process.env.ADZUNA_APP_KEY;

  if (!applicationId || !apiKey) {
    throw new Error("Missing Adzuna API configuration");
  }

  const params = new URLSearchParams({
    app_id: applicationId,
    app_key: apiKey,
    what: jobTitle,
    category: "it-jobs",
    results_per_page: "10",
    "content-type": "application/json",
  });

  if (location) params.set("where", location);

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) throw new AdzunaApiError(response.status);

  const payload = await response.json() as unknown;
  const results = recordValue(payload).results;
  if (!Array.isArray(results)) return [];

  return results
    .map(parseJob)
    .filter((job): job is AdzunaJob => job !== null);
}
