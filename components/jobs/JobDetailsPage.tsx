import Link from "next/link";
import { CompanyResearchCard } from "@/components/jobs/CompanyResearchCard";
import type { JobDetailsData } from "@/lib/job-details-server";

interface JobDetailsPageProps {
  job: JobDetailsData;
}

function ChevronLeftIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BuildingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none"><path d="M5 20V6.5L12 4v16M12 20V9l7-2.5V20M3.5 20h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9h1M8 12h1M8 15h1M15 11h1M15 14h1M15 17h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function ExternalLinkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><path d="M14 5h5v5M19 5l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function DollarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="M12 3v18M16 7.5C15.2 6.5 14 6 12.5 6 10.6 6 9 7.1 9 8.7c0 4.1 7 2.2 7 6.1 0 1.8-1.6 3.2-3.8 3.2-1.7 0-3-.6-4-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function LocationIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="M19 10.2c0 4.2-7 10.3-7 10.3s-7-6.1-7-10.3a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

function BriefcaseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 11h16M10 11v2h4v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}

function SparkleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m19 14 .6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

function DocumentIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M14 3.5V8h4M10 12h4M10 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function scoreClasses(score: number | null): string {
  if (score === null) return "bg-surface-secondary text-text-secondary";
  if (score >= 80) return "bg-success-lightest text-success-dark";
  if (score >= 60) return "bg-info-lightest text-info-dark";
  return "bg-warning/10 text-text-primary";
}

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "—";

  const elapsedSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Just now";

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, seconds] of units) {
    if (elapsedSeconds >= seconds) {
      return formatter.format(-Math.round(elapsedSeconds / seconds), unit);
    }
  }

  return "Just now";
}

function displayJobType(jobType: string): string {
  if (jobType === "fulltime") return "Full-time";
  if (jobType === "parttime") return "Part-time";
  if (jobType === "contract") return "Contract";
  return "—";
}

function ActionLink({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
}

export function JobDetailsPage({ job }: JobDetailsPageProps) {
  const scoreLabel = job.matchScore === null ? "—" : `${job.matchScore}%`;
  const applyUrl = job.externalApplyUrl || job.sourceUrl;

  return (
    <main id="main-content" className="app-main bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Workspace / Job details</p>
        <Link href="/find-jobs" className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md px-1 text-base font-medium text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
          <ChevronLeftIcon />
          Back to Jobs
        </Link>
        </div>

        <header className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-muted"><BuildingIcon /></span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{job.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-text-secondary">
                  <span>{job.company}</span>
                  <span aria-hidden="true">•</span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreClasses(job.matchScore)}`}>{scoreLabel} Match Score</span>
                </div>
              </div>
            </div>
            {job.externalApplyUrl || job.sourceUrl ? (
              <ActionLink href={job.externalApplyUrl || job.sourceUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                <ExternalLinkIcon />
                View Job Post
              </ActionLink>
            ) : (
              <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-muted">View Job Post</span>
            )}
          </div>
        </header>

        <section aria-label="Job information" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={<DollarIcon />} iconClass="bg-success-lightest text-success" value={job.salary || "—"} label="Salary Est." />
          <InfoCard icon={<LocationIcon />} iconClass="bg-info-lightest text-info-dark" value={job.location || "—"} label="Location" />
          <InfoCard icon={<BriefcaseIcon />} iconClass="bg-accent-muted text-accent" value={displayJobType(job.jobType)} label="Job Type" />
          <InfoCard icon={<CalendarIcon />} iconClass="bg-surface-secondary text-text-secondary" value={formatRelativeTime(job.foundAt)} label="Date Found" />
        </section>

        <section aria-labelledby="match-reasoning-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <SectionLabel id="match-reasoning-title" icon={<SparkleIcon />} label="AI Match Reasoning" iconClass="bg-success-lightest text-success" />
          <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-text-primary">{job.matchReason || "No match reasoning is available for this job yet."}</p>
        </section>

        <section aria-labelledby="skills-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <h2 id="skills-title" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Required Skills vs Your Profile</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-base text-text-secondary">You have</p>
              {job.matchedSkills.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Matched skills">
                  {job.matchedSkills.map((skill) => <li key={skill} className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-3 py-1 text-sm font-semibold text-success-dark"><span aria-hidden="true">✓</span>{skill}</li>)}
                </ul>
              ) : <p className="mt-3 text-base text-text-muted">No matched skills were recorded.</p>}
            </div>
            <div>
              <p className="text-base text-text-secondary">Gap skills</p>
              {job.missingSkills.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Missing skills">
                  {job.missingSkills.map((skill) => <li key={skill} className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-sm font-semibold text-accent"><span aria-hidden="true">×</span>{skill}</li>)}
                </ul>
              ) : <p className="mt-3 text-base text-text-muted">No skill gaps were recorded.</p>}
            </div>
          </div>
        </section>

        <section aria-labelledby="description-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <SectionLabel id="description-title" icon={<DocumentIcon />} label="Job Description" iconClass="bg-surface-secondary text-text-secondary" />
          <p className="mt-5 whitespace-pre-line text-base font-medium leading-7 text-text-primary">{job.aboutRole || "No job description was provided for this role."}</p>
        </section>

        <CompanyResearchCard jobId={job.id} company={job.company} initialResearch={job.companyResearch} />

        {applyUrl ? (
          <ActionLink href={applyUrl} className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            Apply Now at {job.company}
          </ActionLink>
        ) : (
          <span className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-accent/50 px-5 py-3 text-base font-semibold text-accent-foreground">Apply Now at {job.company}</span>
        )}
      </div>
    </main>
  );
}

function InfoCard({ icon, iconClass, value, label }: { icon: React.ReactNode; iconClass: string; value: string; label: string }) {
  return <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span><div className="min-w-0"><p className="truncate text-base font-semibold text-text-primary">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p></div></article>;
}

function SectionLabel({ id, icon, iconClass, label }: { id: string; icon: React.ReactNode; iconClass: string; label: string }) {
  return <div className="flex items-center gap-3"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</span><h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-text-secondary">{label}</h2></div>;
}
