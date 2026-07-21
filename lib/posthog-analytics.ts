import "server-only";

import type {
  DashboardAnalytics,
  DailyAnalyticsPoint,
  MatchScoreBucket,
} from "@/lib/dashboard-types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SCORE_BUCKETS: string[] = ["50–59", "60–69", "70–79", "80–89", "90–100"];

type AnalyticsResult = {
  analytics: DashboardAnalytics;
  error?: string;
};

function emptyDistribution(): MatchScoreBucket[] {
  return SCORE_BUCKETS.map((label) => ({ label, count: 0 }));
}

export function emptyDashboardAnalytics(): DashboardAnalytics {
  return {
    jobsOverTime: [],
    companyResearchActivity: [],
    matchScoreDistribution: emptyDistribution(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function numberValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date, days: number): string {
  return new Intl.DateTimeFormat("en", days <= 7
    ? { weekday: "short", timeZone: "UTC" }
    : { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function makeDateSeries(days: number, rows: Map<string, number>, valueKey: "jobsFound" | "companyResearch"): DailyAnalyticsPoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - index - 1) * DAY_MS);
    const key = dateKey(date);
    return {
      date: key,
      label: dateLabel(date, days),
      jobsFound: valueKey === "jobsFound" ? rows.get(key) ?? 0 : 0,
      companyResearch: valueKey === "companyResearch" ? rows.get(key) ?? 0 : 0,
    };
  });
}

function postHogApiHost(): string {
  const explicitHost = process.env.POSTHOG_API_HOST?.trim();
  if (explicitHost) return explicitHost.replace(/\/$/, "");

  const configuredHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim().replace(/\/$/, "") ?? "";
  return configuredHost.replace("://eu.i.", "://eu.").replace("://us.i.", "://us.");
}

function queryConfiguration(): { apiHost: string; personalApiKey: string; projectId: string } | null {
  const apiHost = postHogApiHost();
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim() ?? "";
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim() ?? "";

  if (!apiHost || !personalApiKey || !/^\d+$/.test(projectId)) return null;
  return { apiHost, personalApiKey, projectId };
}

function analyticsFromResponse(value: unknown): DashboardAnalytics | null {
  const response = recordValue(value);
  if (!Array.isArray(response.results)) return null;

  const jobsByDay = new Map<string, number>();
  const researchByDay = new Map<string, number>();
  const distribution = emptyDistribution();

  for (const result of response.results) {
    if (!Array.isArray(result) || typeof result[0] !== "string") continue;
    const day = result[0].slice(0, 10);
    jobsByDay.set(day, numberValue(result[1]));
    researchByDay.set(day, numberValue(result[2]));
    distribution[0].count += numberValue(result[3]);
    distribution[1].count += numberValue(result[4]);
    distribution[2].count += numberValue(result[5]);
    distribution[3].count += numberValue(result[6]);
    distribution[4].count += numberValue(result[7]);
  }

  return {
    jobsOverTime: makeDateSeries(30, jobsByDay, "jobsFound"),
    companyResearchActivity: makeDateSeries(7, researchByDay, "companyResearch"),
    matchScoreDistribution: distribution,
  };
}

export async function getPostHogDashboardAnalytics(userId: string): Promise<AnalyticsResult> {
  const config = queryConfiguration();
  if (!config) {
    return {
      analytics: emptyDashboardAnalytics(),
      error: "Analytics are not configured yet. Add PostHog query access to show your charts.",
    };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return { analytics: emptyDashboardAnalytics(), error: "Analytics could not be loaded." };
  }

  const query = `
    SELECT
      toString(toDate(timestamp)) AS day,
      sumIf(1, event = 'job_found') AS jobs_found,
      sumIf(1, event = 'company_researched') AS companies_researched,
      sumIf(1, event = 'job_found' AND toFloat(properties.matchScore) >= 50 AND toFloat(properties.matchScore) < 60) AS score_50_59,
      sumIf(1, event = 'job_found' AND toFloat(properties.matchScore) >= 60 AND toFloat(properties.matchScore) < 70) AS score_60_69,
      sumIf(1, event = 'job_found' AND toFloat(properties.matchScore) >= 70 AND toFloat(properties.matchScore) < 80) AS score_70_79,
      sumIf(1, event = 'job_found' AND toFloat(properties.matchScore) >= 80 AND toFloat(properties.matchScore) < 90) AS score_80_89,
      sumIf(1, event = 'job_found' AND toFloat(properties.matchScore) >= 90 AND toFloat(properties.matchScore) <= 100) AS score_90_100
    FROM events
    WHERE distinct_id = '${userId}'
      AND timestamp >= now() - INTERVAL 30 DAY
      AND event IN ('job_found', 'company_researched')
    GROUP BY day
    ORDER BY day ASC
    LIMIT 31
  `;

  try {
    const response = await fetch(`${config.apiHost}/api/projects/${config.projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.personalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
        name: "job_pilot_dashboard_analytics",
        refresh: "blocking",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      console.error("[dashboard/analytics] PostHog query failed", response.status);
      return { analytics: emptyDashboardAnalytics(), error: "Analytics could not be loaded right now." };
    }

    const analytics = analyticsFromResponse(await response.json());
    if (!analytics) {
      console.error("[dashboard/analytics] PostHog returned an invalid response");
      return { analytics: emptyDashboardAnalytics(), error: "Analytics could not be loaded right now." };
    }

    return { analytics };
  } catch (error) {
    console.error("[dashboard/analytics] PostHog query failed", error instanceof Error ? error.message : "Unknown error");
    return { analytics: emptyDashboardAnalytics(), error: "Analytics could not be loaded right now." };
  }
}
