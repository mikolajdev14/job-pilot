"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { MATCH_THRESHOLD } from "@/lib/utils";

type Job = {
  id: string | number;
  company: string;
  role: string;
  score: number;
  salary: string;
  source: "Search" | "URL";
  dateFound: string;
};

type MatchFilter = "all" | "high" | "low";
type SortOrder = "score" | "newest" | "oldest";

const mockJobs: Job[] = [
  { id: 1, company: "Vercel", role: "Senior Frontend Engineer", score: 94, salary: "$160k - $200k", source: "Search", dateFound: "2 hours ago" },
  { id: 2, company: "Stripe", role: "Staff UI Engineer", score: 88, salary: "$180k - $240k", source: "Search", dateFound: "Yesterday" },
  { id: 3, company: "Linear", role: "Product Engineer", score: 96, salary: "$150k - $190k", source: "Search", dateFound: "Yesterday" },
  { id: 4, company: "Notion", role: "Frontend Developer", score: 72, salary: "$130k - $170k", source: "Search", dateFound: "2 days ago" },
  { id: 5, company: "OpenAI", role: "Design Engineer", score: 91, salary: "$200k - $280k", source: "Search", dateFound: "3 days ago" },
  { id: 6, company: "Figma", role: "Software Engineer, Editor", score: 85, salary: "$170k - $220k", source: "Search", dateFound: "4 days ago" },
  { id: 7, company: "Shopify", role: "Frontend Developer", score: 83, salary: "$145k - $185k", source: "Search", dateFound: "5 days ago" },
  { id: 8, company: "GitLab", role: "Senior Product Designer", score: 68, salary: "$140k - $180k", source: "URL", dateFound: "6 days ago" },
  { id: 9, company: "Supabase", role: "Developer Experience Engineer", score: 90, salary: "$155k - $205k", source: "Search", dateFound: "1 week ago" },
  { id: 10, company: "Slack", role: "Frontend Platform Engineer", score: 79, salary: "$165k - $215k", source: "Search", dateFound: "1 week ago" },
  { id: 11, company: "Ramp", role: "Senior React Engineer", score: 87, salary: "$175k - $225k", source: "Search", dateFound: "1 week ago" },
  { id: 12, company: "Dropbox", role: "Web Applications Engineer", score: 64, salary: "$135k - $175k", source: "URL", dateFound: "2 weeks ago" },
  { id: 13, company: "Cloudflare", role: "UI Systems Engineer", score: 82, salary: "$150k - $200k", source: "Search", dateFound: "2 weeks ago" },
  { id: 14, company: "Atlassian", role: "Senior Software Engineer", score: 76, salary: "$160k - $210k", source: "Search", dateFound: "2 weeks ago" },
  { id: 15, company: "Twilio", role: "Frontend Infrastructure Engineer", score: 71, salary: "$145k - $190k", source: "Search", dateFound: "3 weeks ago" },
  { id: 16, company: "Airtable", role: "Product Designer", score: 62, salary: "$130k - $175k", source: "URL", dateFound: "3 weeks ago" },
  { id: 17, company: "HubSpot", role: "Senior Web Engineer", score: 84, salary: "$140k - $185k", source: "Search", dateFound: "3 weeks ago" },
  { id: 18, company: "Asana", role: "Frontend Engineer", score: 80, salary: "$155k - $205k", source: "Search", dateFound: "1 month ago" },
  { id: 19, company: "Webflow", role: "UI Engineer", score: 78, salary: "$135k - $180k", source: "Search", dateFound: "1 month ago" },
  { id: 20, company: "Discord", role: "Senior Client Engineer", score: 74, salary: "$150k - $200k", source: "Search", dateFound: "1 month ago" },
  { id: 21, company: "Brex", role: "Design Systems Engineer", score: 89, salary: "$175k - $230k", source: "Search", dateFound: "1 month ago" },
  { id: 22, company: "GitHub", role: "Staff Frontend Engineer", score: 93, salary: "$180k - $245k", source: "Search", dateFound: "1 month ago" },
  { id: 23, company: "Coinbase", role: "Senior React Developer", score: 69, salary: "$155k - $210k", source: "URL", dateFound: "1 month ago" },
  { id: 24, company: "Pinterest", role: "Product Engineer", score: 86, salary: "$160k - $215k", source: "Search", dateFound: "1 month ago" },
];

const PAGE_SIZE = 6;
const TOTAL_RESULTS = 24;

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseJobPreview(value: unknown): Job | null {
  const job = recordValue(value);
  const company = stringValue(job.company);
  const role = stringValue(job.role);
  const score = numberValue(job.score);
  if (!company || !role || score === null) return null;

  return {
    id: stringValue(job.id) || `${company}-${role}`,
    company,
    role,
    score,
    salary: stringValue(job.salary) || "Not listed",
    source: job.source === "URL" ? "URL" : "Search",
    dateFound: stringValue(job.dateFound) || "Just now",
  };
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m19 14 .6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path d="M5 20V6.5L12 4v16M12 20V9l7-2.5V20M3.5 20h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9h1M8 12h1M8 15h1M15 11h1M15 14h1M15 17h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info-medium";
  return "bg-warning";
}

function scoreWidth(score: number): string {
  if (score >= 95) return "w-24";
  if (score >= 90) return "w-24";
  if (score >= 80) return "w-20";
  if (score >= 70) return "w-16";
  return "w-14";
}

function scoreText(score: number): string {
  if (score >= 80) return "text-success-dark";
  if (score >= 60) return "text-info-dark";
  return "text-text-primary";
}

export function FindJobsPage() {
  const [jobTitle, setJobTitle] = useState("Frontend Engineer");
  const [location, setLocation] = useState("");
  const [jobResults, setJobResults] = useState<Job[]>(mockJobs);
  const [jobsFound, setJobsFound] = useState(TOTAL_RESULTS);
  const [strongMatches, setStrongMatches] = useState(4);
  const [filterQuery, setFilterQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("score");
  const [page, setPage] = useState(1);
  const [searchState, setSearchState] = useState<"success" | "searching" | "error">("success");
  const [searchError, setSearchError] = useState("");

  const filteredJobs = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    const matchingJobs = jobResults.filter((job) => {
      const matchesText = !query || `${job.company} ${job.role}`.toLowerCase().includes(query);
      const matchesScore = matchFilter === "all" || (matchFilter === "high" ? job.score >= MATCH_THRESHOLD : job.score < MATCH_THRESHOLD);
      return matchesText && matchesScore;
    });

    return matchingJobs.sort((first, second) => {
      if (sortOrder === "score") return second.score - first.score;
      if (sortOrder === "oldest") return String(second.id).localeCompare(String(first.id));
      return String(first.id).localeCompare(String(second.id));
    });
  }, [filterQuery, jobResults, matchFilter, sortOrder]);

  const isFiltered = Boolean(filterQuery.trim()) || matchFilter !== "all";
  const resultCount = isFiltered ? filteredJobs.length : jobsFound;
  const pageCount = !isFiltered && jobsFound === TOTAL_RESULTS ? 8 : Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
  const visibleJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchState("searching");
    setSearchError("");

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const payload = await response.json().catch(() => null) as unknown;
      const result = recordValue(payload);
      const parsedJobs = Array.isArray(result.jobs)
        ? result.jobs.map(parseJobPreview).filter((job): job is Job => job !== null)
        : [];

      if (!response.ok || result.success !== true) {
        setSearchState("error");
        setSearchError(stringValue(result.error) || "We could not find jobs right now. Please try again.");
        return;
      }

      setJobResults(parsedJobs);
      setJobsFound(numberValue(result.jobsFound) ?? parsedJobs.length);
      setStrongMatches(numberValue(result.strongMatches) ?? parsedJobs.filter((job) => job.score >= MATCH_THRESHOLD).length);
      setPage(1);
      setSearchState("success");
    } catch {
      setSearchState("error");
      setSearchError("We could not find jobs right now. Please try again.");
    }
  };

  const updateFilter = (value: string) => {
    setFilterQuery(value);
    setPage(1);
  };

  const updateMatchFilter = (value: MatchFilter) => {
    setMatchFilter(value);
    setPage(1);
  };

  const updateSortOrder = (value: SortOrder) => {
    setSortOrder(value);
    setPage(1);
  };

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Workspace / Discovery</p>
          <h1 id="job-search-title" className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Find your next role</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-text-secondary">Search the market and let JobPilot rank each opportunity against your profile.</p>
        </header>
        <section aria-labelledby="job-search-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <form onSubmit={handleSearch} className="grid gap-5 lg:grid-cols-12 lg:items-end">
            <label htmlFor="job-title" className="space-y-2 lg:col-span-5">
              <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Job Title</span>
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"><SearchIcon /></span>
                <input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Frontend Engineer" className="min-h-14 w-full rounded-lg border border-border-muted bg-surface-secondary px-4 py-3 pl-12 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted hover:bg-surface-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </span>
            </label>

            <label htmlFor="job-location" className="space-y-2 lg:col-span-5">
              <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Location</span>
              <input id="job-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Remote, New York..." className="min-h-14 w-full rounded-lg border border-border-muted bg-surface-secondary px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted hover:bg-surface-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" />
            </label>

            <button type="submit" disabled={searchState === "searching"} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-medium text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 lg:col-span-2">
              <SearchIcon />
              {searchState === "searching" ? "Searching..." : "Find Jobs"}
            </button>
          </form>

          {searchState === "success" && <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 rounded-lg border border-success/20 bg-success-lightest px-4 py-4 text-base font-medium text-success-dark"><SparkleIcon /><span>Found {jobsFound} jobs and saved {strongMatches} strong matches.</span></div>}
          {searchState === "error" && <p role="alert" className="mt-5 rounded-lg border border-error/30 bg-error/10 px-4 py-4 text-base text-error">{searchError}</p>}
        </section>

        <section aria-labelledby="job-results-title" className="flex flex-col gap-6">
          <h2 id="job-results-title" className="sr-only">Job results</h2>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label htmlFor="job-filter" className="relative min-w-0 flex-1">
                <span className="sr-only">Filter by company or role</span>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"><SearchIcon /></span>
                <input id="job-filter" value={filterQuery} onChange={(event) => updateFilter(event.target.value)} placeholder="Filter by company or role..." className="min-h-11 w-full rounded-lg border border-border-muted bg-surface-secondary px-4 py-2.5 pl-11 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted hover:bg-surface-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative">
                  <span className="sr-only">Match filter</span>
                  <select value={matchFilter} onChange={(event) => updateMatchFilter(event.target.value as MatchFilter)} className="min-h-11 w-full appearance-none rounded-lg border border-border-muted bg-surface-secondary py-2.5 pl-3 pr-9 text-base text-text-primary outline-none transition-colors hover:bg-surface-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-40">
                    <option value="all">All Matches</option>
                    <option value="high">High Match</option>
                    <option value="low">Low Match</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-secondary"><ChevronDownIcon /></span>
                </label>

                <label className="relative">
                  <span className="sr-only">Sort jobs</span>
                  <select value={sortOrder} onChange={(event) => updateSortOrder(event.target.value as SortOrder)} className="min-h-11 w-full appearance-none rounded-lg border border-border-muted bg-surface-secondary py-2.5 pl-3 pr-9 text-base text-text-primary outline-none transition-colors hover:bg-surface-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-40">
                    <option value="score">Match Score</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-secondary"><ChevronDownIcon /></span>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[62rem] border-collapse text-left">
                <caption className="sr-only">Saved job matches</caption>
                <thead className="bg-surface-secondary">
                  <tr className="border-b border-border">
                    <th scope="col" className="w-1/5 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Company</th>
                    <th scope="col" className="w-1/4 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Role</th>
                    <th scope="col" className="w-1/5 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Match Score</th>
                    <th scope="col" className="w-1/6 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Salary Est.</th>
                    <th scope="col" className="w-1/6 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Source</th>
                    <th scope="col" className="w-1/6 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Date Found</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs.map((job) => (
                    <tr key={job.id} className="border-b border-border last:border-b-0 hover:bg-surface-secondary">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-text-secondary"><BuildingIcon /></span>
                          <Link href={`/find-jobs/${job.id}`} className="rounded-md font-semibold text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{job.company}</Link>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-base font-medium text-text-dark"><Link href={`/find-jobs/${job.id}`} className="rounded-md transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{job.role}</Link></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="h-1.5 w-24 rounded-full bg-border"><span className={`block h-full rounded-full ${scoreColor(job.score)} ${scoreWidth(job.score)}`} /></span>
                          <span className={`text-base font-semibold ${scoreText(job.score)}`}>{job.score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-base text-text-secondary">{job.salary}</td>
                      <td className="px-6 py-5"><span className="inline-flex rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">{job.source}</span></td>
                      <td className="px-6 py-5 text-base text-text-secondary">{job.dateFound}</td>
                    </tr>
                  ))}
                  {visibleJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <p className="text-base font-medium text-text-primary">No jobs match these filters.</p>
                        <p className="mt-1 text-sm text-text-muted">Try a different company, role, or match filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-text-secondary">Showing <strong className="font-semibold text-text-primary">{resultCount === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, resultCount)}</strong> to <strong className="font-semibold text-text-primary">{Math.min(page * PAGE_SIZE, resultCount)}</strong> of <strong className="font-semibold text-text-primary">{resultCount}</strong> results</p>
              <nav aria-label="Job results pagination" className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <div className="hidden items-center gap-2 sm:flex">
                  {[1, 2, 3].filter((number) => number <= pageCount).map((number) => (
                    <button key={number} type="button" onClick={() => setPage(number)} aria-current={page === number ? "page" : undefined} className={`inline-flex size-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${page === number ? "border-accent/20 bg-accent-light text-accent" : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"}`}>{number}</button>
                  ))}
                  {pageCount > 3 && <><span className="px-1 text-text-muted" aria-hidden="true">...</span><button type="button" onClick={() => setPage(pageCount)} aria-current={page === pageCount ? "page" : undefined} className={`inline-flex size-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${page === pageCount ? "border-accent/20 bg-accent-light text-accent" : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"}`}>{pageCount}</button></>}
                </div>
                <span className="text-sm font-medium text-text-secondary sm:hidden">Page {page} of {pageCount}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </nav>
            </div>
          </div>
          <p className="text-center text-xs text-text-muted">Jobs by Adzuna</p>
        </section>
      </div>
    </main>
  );
}
