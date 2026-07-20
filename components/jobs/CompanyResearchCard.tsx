"use client";

import { useEffect, useRef, useState } from "react";
import type { CompanyResearchDossier } from "@/lib/company-research";

interface CompanyResearchCardProps {
  jobId: string;
  company: string;
  initialResearch: CompanyResearchDossier | null;
}

type ResearchError = {
  code: string;
  message: string;
};

function BuildingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none"><path d="M5 20V6.5L12 4v16M12 20V9l7-2.5V20M3.5 20h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9h1M8 12h1M8 15h1M15 11h1M15 14h1M15 17h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.8" /><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function SparkleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m19 14 .6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

function ExternalLinkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><path d="M14 5h5v5M19 5l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function safeSource(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function emptyMessage(items: string[]): React.ReactNode {
  return items.length > 0 ? <ul className="space-y-3">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-text-primary"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />{item}</li>)}</ul> : <p className="text-sm text-text-muted">No information available yet.</p>;
}

function ResearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t border-border px-5 py-5 sm:px-6"><h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">{title}</h3><div className="mt-3">{children}</div></section>;
}

function Dossier({ research }: { research: CompanyResearchDossier }) {
  return <div>
    <ResearchSection title="Company Overview"><p className="text-base leading-7 text-text-primary">{research.companyOverview}</p></ResearchSection>
    <ResearchSection title="Tech Stack">{research.techStack.length > 0 ? <ul className="flex flex-wrap gap-2">{research.techStack.map((item) => <li key={item} className="rounded-full bg-accent-muted px-3 py-1 text-sm font-semibold text-accent">{item}</li>)}</ul> : <p className="text-sm text-text-muted">No information available yet.</p>}</ResearchSection>
    <ResearchSection title="Culture Signals">{emptyMessage(research.culture)}</ResearchSection>
    <ResearchSection title="Why This Role"><p className="text-base leading-7 text-text-primary">{research.whyThisRole}</p></ResearchSection>
    <ResearchSection title="Your Edge">{research.yourEdge.length > 0 ? <ul className="space-y-3">{research.yourEdge.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg bg-success-lightest px-4 py-3 text-sm leading-6 text-success-dark">{item}</li>)}</ul> : <p className="text-sm text-text-muted">No information available yet.</p>}</ResearchSection>
    <ResearchSection title="Gaps to Prepare">{emptyMessage(research.gapsToAddress)}</ResearchSection>
    <ResearchSection title="Smart Questions to Ask">{emptyMessage(research.smartQuestions)}</ResearchSection>
    <ResearchSection title="Interview Preparation">{emptyMessage(research.interviewPrep)}</ResearchSection>
    <ResearchSection title="Sources">{research.sources.length > 0 ? <ul className="space-y-2">{research.sources.map((source) => safeSource(source) ? <li key={source}><a href={source} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ExternalLinkIcon />{new URL(source).hostname}</a></li> : null)}</ul> : <p className="text-sm text-text-muted">No public sources were available.</p>}</ResearchSection>
  </div>;
}

export function CompanyResearchCard({ jobId, company, initialResearch }: CompanyResearchCardProps) {
  const [research, setResearch] = useState<CompanyResearchDossier | null>(initialResearch);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<ResearchError | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  async function researchCompany(): Promise<void> {
    setIsResearching(true);
    setError(null);
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const response = await fetch("/api/agent/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }), signal: controller.signal });
      const payload: unknown = await response.json().catch(() => null);
      const body = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
      const rawError = typeof body.error === "object" && body.error !== null ? body.error as Record<string, unknown> : {};
      if (!response.ok || body.success !== true) {
        setError({ code: typeof rawError.code === "string" ? rawError.code : "RESEARCH_FAILED", message: typeof rawError.message === "string" ? rawError.message : "We could not research this company right now. Please try again." });
        return;
      }
      const nextResearch = body.dossier;
      if (!nextResearch || typeof nextResearch !== "object") throw new Error("Missing dossier");
      setResearch(nextResearch as CompanyResearchDossier);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError({ code: "RESEARCH_FAILED", message: "We could not research this company right now. Please try again." });
    } finally {
      if (!controller.signal.aborted) setIsResearching(false);
    }
  }

  return <section aria-labelledby="research-title" className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent"><BuildingIcon /></span><div><h2 id="research-title" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Company Research</h2><p className="mt-1 text-sm text-text-muted">Build a tailored interview dossier for {company}.</p></div></div>
      <button type="button" onClick={researchCompany} disabled={isResearching} aria-busy={isResearching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        {isResearching ? <><SparkleIcon />Researching Company...</> : <><SearchIcon />{research ? "Refresh Research" : "Research Company"}</>}
      </button>
    </div>
    {isResearching && <div role="status" className="border-t border-border px-5 py-10 text-center sm:px-6"><div className="mx-auto flex size-14 animate-pulse items-center justify-center rounded-xl bg-accent-muted text-accent"><SparkleIcon /></div><p className="mt-5 text-base font-semibold text-text-primary">Researching {company}...</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">We are reviewing public company pages and matching the findings to your profile.</p></div>}
    {!isResearching && error && <div role="alert" className="border-t border-border bg-warning/10 px-5 py-6 sm:px-6"><p className="text-sm font-semibold text-text-primary">{error.message}</p><p className="mt-1 text-sm text-text-secondary">You can retry when the provider is available.</p></div>}
    {!isResearching && !error && research && <Dossier research={research} />}
    {!isResearching && !error && !research && <div className="border-t border-border px-5 py-16 text-center sm:px-6 sm:py-20"><div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-surface-secondary text-text-muted"><BuildingIcon /></div><h3 className="mt-5 text-base font-semibold text-text-primary">No research yet</h3><p className="mx-auto mt-2 max-w-md text-base leading-6 text-text-muted">Click “Research Company” to let the AI browse {company}&apos;s public pages and build a dossier.</p></div>}
  </section>;
}
