"use client";

import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { saveProfile } from "@/actions/profile";
import { extractProfileFromResume } from "@/actions/profile-extraction";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import type { ProfileFormValues, WorkRole } from "@/lib/profile-types";

const inputClassName =
  "min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary shadow-sm outline-none transition-colors placeholder:text-text-muted hover:border-border-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-secondary";

const labelClassName =
  "text-xs font-semibold uppercase tracking-wide text-text-secondary";

const buttonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
      <path d="M12 8v4m0 4h.01M10.3 4.7 3.9 16a2 2 0 001.75 3h12.7a2 2 0 001.75-3L13.7 4.7a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ProfileFormProps {
  initialProfile: ProfileFormValues;
  loadError?: string;
}

export function ProfileForm({ initialProfile, loadError }: ProfileFormProps) {
  const [profile, setProfile] = useState<ProfileFormValues>(initialProfile);
  const [skillDraft, setSkillDraft] = useState("");
  const [industryDraft, setIndustryDraft] = useState("");
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");
  const [extractState, setExtractState] = useState<"idle" | "extracting" | "extracted">("idle");
  const [extractError, setExtractError] = useState("");
  const [generateState, setGenerateState] = useState<"idle" | "generating" | "generated">("idle");
  const [generateError, setGenerateError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
    setSaveError("");
  };

  const updateRole = <K extends keyof WorkRole>(
    roleIndex: number,
    field: K,
    value: WorkRole[K],
  ) => {
    setProfile((current) => ({
      ...current,
      workExperience: current.workExperience.map((role, index) =>
        index === roleIndex ? { ...role, [field]: value } : role,
      ),
    }));
    setSaveState("idle");
    setSaveError("");
  };

  const addTag = (type: "skills" | "industries") => {
    const draft = type === "skills" ? skillDraft.trim() : industryDraft.trim();
    if (!draft || profile[type].includes(draft)) return;

    updateField(type, [...profile[type], draft]);
    if (type === "skills") setSkillDraft("");
    else setIndustryDraft("");
  };

  const removeTag = (type: "skills" | "industries", tag: string) => {
    updateField(
      type,
      profile[type].filter((currentTag) => currentTag !== tag),
    );
  };

  const selectResume = (file: File | undefined) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeError("Please select a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError("The resume must be smaller than 5MB.");
      return;
    }

    setSelectedResume(file);
    setResumeError("");
    setExtractState("idle");
    setExtractError("");
  };

  const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectResume(event.target.files?.[0]);
  };

  const handleResumeDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectResume(event.dataTransfer.files[0]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState("saving");
    setSaveError("");

    const formData = new FormData();
    formData.set("profile", JSON.stringify(profile));
    if (selectedResume) formData.set("resume", selectedResume);

    const result = await saveProfile(formData);
    if (!result.success) {
      setSaveState("idle");
      setSaveError(result.error);
      return;
    }

    updateField("resumePdfUrl", result.resumePdfUrl);
    setSaveState("saved");
  };

  const handleExtract = async () => {
    setExtractState("extracting");
    setExtractError("");

    const formData = new FormData();
    if (selectedResume) formData.set("resume", selectedResume);

    const result = await extractProfileFromResume(formData);
    if (!result.success) {
      setExtractState("idle");
      setExtractError(result.error);
      return;
    }

    setProfile((current) => ({ ...result.profile, email: current.email, resumePdfUrl: current.resumePdfUrl }));
    setSaveState("idle");
    setSaveError("");
    setExtractState("extracted");
  };

  const handleGenerateResume = async () => {
    setGenerateState("generating");
    setGenerateError("");

    try {
      const response = await fetch("/api/resume/generate", { method: "POST" });
      const result = await response.json().catch(() => null) as { success?: boolean; resumePdfUrl?: string | null; error?: string } | null;

      if (!response.ok || !result?.success || !result.resumePdfUrl) {
        setGenerateState("idle");
        setGenerateError(result?.error ?? "We could not generate your resume right now. Please try again.");
        return;
      }

      updateField("resumePdfUrl", result.resumePdfUrl);
      setGenerateState("generated");
    } catch {
      setGenerateState("idle");
      setGenerateError("We could not generate your resume right now. Please try again.");
    }
  };

  const addRole = () => {
    if (profile.workExperience.length >= 3) return;
    updateField("workExperience", [
      ...profile.workExperience,
      {
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: "",
      },
    ]);
  };

  const completion = calculateProfileCompletion(profile);
  const hasResume = Boolean(selectedResume || profile.resumePdfUrl);
  const statusClasses = completion.isComplete
    ? "border-success/40 bg-surface"
    : "border-error/40 bg-surface";
  const statusIconClasses = completion.isComplete
    ? "bg-success-light text-success-dark"
    : "bg-error/10 text-error";

  return (
    <main id="main-content" className="flex-1 bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loadError && <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-base text-error">{loadError}</p>}
        <section
          aria-labelledby="profile-attention-title"
          className={`flex flex-col gap-6 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 ${statusClasses}`}
        >
          <div className="flex items-start gap-4">
            <span className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full ${statusIconClasses}`}>
              <AlertIcon />
            </span>
            <div className="space-y-3">
              <div>
                <h1 id="profile-attention-title" className="text-lg font-semibold text-text-primary">
                  {completion.isComplete ? "Profile is complete" : "Profile needs attention"}
                </h1>
                <p className="mt-1 max-w-2xl text-base leading-6 text-text-secondary">
                  {completion.isComplete
                    ? "Your profile is ready for tailored job matches and quality resume generation."
                    : "Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes."}
                </p>
              </div>
              <ul aria-label="Missing profile fields" className="flex flex-wrap gap-2">
                {completion.missingFields.map((field) => (
                  <li key={field} className="rounded-full bg-error/10 px-3 py-1 text-xs font-semibold tracking-wide text-error">
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative flex size-28 shrink-0 items-center justify-center self-center sm:self-auto">
            <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-error/15" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${completion.percentage} ${100 - completion.percentage}`} pathLength="100" className={completion.isComplete ? "text-success" : "text-error"} />
            </svg>
            <div className="text-center">
              <strong className="block text-2xl font-semibold text-text-primary">{completion.percentage}%</strong>
              <span className="text-xs text-text-secondary">complete</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="resume-title" className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div>
            <h2 id="resume-title" className="text-lg font-semibold text-text-primary">Resume</h2>
            <p className="mt-1 text-base text-text-secondary">Upload your resume or generate one from your profile.</p>
          </div>

          <div
            className="mt-6 rounded-lg border-2 border-dashed border-border-muted bg-surface-secondary px-5 py-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleResumeDrop}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleResumeChange} className="sr-only" id="resume-upload" />
            <label htmlFor="resume-upload" className="flex cursor-pointer flex-col items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent-light text-accent"><UploadIcon /></span>
              <span className="text-base font-medium text-text-primary">
                {selectedResume?.name ?? (hasResume ? "Resume uploaded" : "Click to upload or drag and drop")}
              </span>
              <span className="text-sm text-text-secondary">PDF format only. Maximum file size 5MB.</span>
              <span className={`${buttonClassName} mt-1 bg-surface text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-secondary`}>Select Resume</span>
            </label>
            {resumeError && <p role="alert" className="mt-3 text-sm text-error">{resumeError}</p>}
          </div>

          {hasResume && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Auto-fill from your resume</h3>
                <p className="mt-1 text-sm text-text-secondary">Let GPT-4o find profile details for you to review.</p>
              </div>
              <button type="button" onClick={handleExtract} disabled={extractState === "extracting"} className={`${buttonClassName} shrink-0 bg-accent text-accent-foreground hover:bg-accent-dark`}>
                {extractState === "extracting" ? "Extracting..." : extractState === "extracted" ? "Profile Extracted" : "Extract from Resume"}
              </button>
            </div>
          )}
          {extractError && <p role="alert" className="mt-3 text-sm text-error">{extractError}</p>}
          {extractState === "extracted" && <p role="status" className="mt-3 text-sm text-success-dark">Profile fields were filled from your resume. Review them before saving.</p>}

          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-text-secondary">Need a fresh document based on the fields below?</p>
            <button type="button" onClick={handleGenerateResume} disabled={generateState === "generating"} className={`${buttonClassName} bg-accent text-accent-foreground hover:bg-accent-dark`}>
              {generateState === "generating" ? "Generating Resume..." : generateState === "generated" ? "Resume Generated" : "Generate Resume from Profile"}
            </button>
          </div>
          {generateError && <p role="alert" className="mt-3 text-sm text-error">{generateError}</p>}
          {generateState === "generated" && <p role="status" className="mt-3 text-sm text-success-dark">Your generated resume is saved securely and ready to use.</p>}
          {profile.resumePdfUrl && (
            <a
              href="/api/resume/download"
              target="_blank"
              rel="noreferrer"
              className={`${buttonClassName} mt-3 bg-surface text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-secondary`}
            >
              Open generated resume
            </a>
          )}
        </section>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
            <p className="mt-1 text-base text-text-secondary">Keep your details current to receive better job matches.</p>
          </div>

          <fieldset className="mt-6 border-t border-border pt-6">
            <legend className="text-base font-semibold text-text-primary">Personal Info</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label htmlFor="full-name" className="space-y-2"><span className={labelClassName}>Full Name</span><input id="full-name" className={inputClassName} value={profile.fullName} onChange={(event) => updateField("fullName", event.target.value)} /></label>
              <label htmlFor="email" className="space-y-2"><span className={labelClassName}>Email</span><input id="email" className={inputClassName} type="email" value={profile.email} disabled /></label>
              <label htmlFor="phone-number" className="space-y-2"><span className={labelClassName}>Phone Number</span><input id="phone-number" className={inputClassName} value={profile.phoneNumber} placeholder="Enter your phone number" onChange={(event) => updateField("phoneNumber", event.target.value)} /></label>
              <label htmlFor="location" className="space-y-2"><span className={labelClassName}>Location</span><input id="location" className={inputClassName} value={profile.location} placeholder="City, Country" onChange={(event) => updateField("location", event.target.value)} /></label>
              <label htmlFor="linkedin-url" className="space-y-2"><span className={labelClassName}>LinkedIn URL</span><input id="linkedin-url" className={inputClassName} type="url" value={profile.linkedinUrl} placeholder="https://linkedin.com/in/yourname" onChange={(event) => updateField("linkedinUrl", event.target.value)} /></label>
              <label htmlFor="portfolio-url" className="space-y-2"><span className={labelClassName}>Portfolio / GitHub</span><input id="portfolio-url" className={inputClassName} type="url" value={profile.portfolioUrl} placeholder="https://github.com/yourname" onChange={(event) => updateField("portfolioUrl", event.target.value)} /></label>
              <label htmlFor="work-authorization" className="space-y-2"><span className={labelClassName}>Work Authorization</span><select id="work-authorization" className={inputClassName} value={profile.workAuthorization} onChange={(event) => updateField("workAuthorization", event.target.value)}><option>Citizen</option><option>Permanent resident</option><option>Requires sponsorship</option></select></label>
            </div>
          </fieldset>

          <fieldset className="mt-8 border-t border-border pt-6">
            <legend className="text-base font-semibold text-text-primary">Professional Info</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label htmlFor="current-job-title" className="space-y-2 md:col-span-2"><span className={labelClassName}>Current / Recent Job Title</span><input id="current-job-title" className={inputClassName} value={profile.currentJobTitle} onChange={(event) => updateField("currentJobTitle", event.target.value)} /></label>
              <label htmlFor="experience-level" className="space-y-2"><span className={labelClassName}>Experience Level</span><select id="experience-level" className={inputClassName} value={profile.experienceLevel} onChange={(event) => updateField("experienceLevel", event.target.value)}><option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option></select></label>
              <label htmlFor="years-experience" className="space-y-2"><span className={labelClassName}>Years of Experience</span><input id="years-experience" className={inputClassName} type="number" min="0" value={profile.yearsExperience} onChange={(event) => updateField("yearsExperience", event.target.value)} /></label>
              <div className="space-y-2 md:col-span-2">
                <span className={labelClassName}>Skills</span>
                <div className="flex gap-2"><input id="skills-input" className={inputClassName} value={skillDraft} placeholder="Add a skill" onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag("skills"); } }} /><button type="button" onClick={() => addTag("skills")} className={`${buttonClassName} shrink-0 bg-accent-light text-accent hover:bg-accent/20`}><PlusIcon />Add</button></div>
                <ul aria-label="Skills" className="flex flex-wrap gap-2 pt-1">{profile.skills.map((skill) => <li key={skill} className="inline-flex items-center gap-2 rounded-full bg-accent-light px-3 py-1.5 text-sm font-medium text-accent">{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => removeTag("skills", skill)} className="rounded-full p-0.5 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">×</button></li>)}</ul>
              </div>
              <div className="space-y-2 md:col-span-2">
                <span className={labelClassName}>Industries <span className="normal-case font-normal tracking-normal text-text-muted">(optional)</span></span>
                <div className="flex gap-2"><input id="industries-input" className={inputClassName} value={industryDraft} placeholder="Add an industry" onChange={(event) => setIndustryDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag("industries"); } }} /><button type="button" onClick={() => addTag("industries")} className={`${buttonClassName} shrink-0 bg-accent-light text-accent hover:bg-accent/20`}><PlusIcon />Add</button></div>
                {profile.industries.length > 0 && <ul aria-label="Industries" className="flex flex-wrap gap-2 pt-1">{profile.industries.map((industry) => <li key={industry} className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 text-sm font-medium text-text-secondary">{industry}<button type="button" aria-label={`Remove ${industry}`} onClick={() => removeTag("industries", industry)} className="rounded-full p-0.5 hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">×</button></li>)}</ul>}
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-8 border-t border-border pt-6">
            <div className="flex items-center justify-between gap-4"><legend className="text-base font-semibold text-text-primary">Work Experience</legend><button type="button" onClick={addRole} disabled={profile.workExperience.length >= 3} className={`${buttonClassName} min-h-10 gap-1.5 px-2 text-accent hover:bg-accent-muted`}><PlusIcon />Add role</button></div>
            <div className="mt-5 space-y-5">
              {profile.workExperience.map((role, roleIndex) => (
                <div key={roleIndex} className="rounded-lg border border-border bg-surface-secondary p-4 sm:p-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label htmlFor={`company-name-${roleIndex}`} className="space-y-2"><span className={labelClassName}>Company Name</span><input id={`company-name-${roleIndex}`} className={inputClassName} value={role.companyName} placeholder="Company name" onChange={(event) => updateRole(roleIndex, "companyName", event.target.value)} /></label>
                    <label htmlFor={`job-title-${roleIndex}`} className="space-y-2"><span className={labelClassName}>Job Title</span><input id={`job-title-${roleIndex}`} className={inputClassName} value={role.jobTitle} placeholder="Job title" onChange={(event) => updateRole(roleIndex, "jobTitle", event.target.value)} /></label>
                    <label htmlFor={`start-date-${roleIndex}`} className="space-y-2"><span className={labelClassName}>Start Date</span><input id={`start-date-${roleIndex}`} className={inputClassName} type="month" value={role.startDate} onChange={(event) => updateRole(roleIndex, "startDate", event.target.value)} /></label>
                    <label htmlFor={`end-date-${roleIndex}`} className="space-y-2"><span className={labelClassName}>End Date</span><input id={`end-date-${roleIndex}`} className={inputClassName} type="month" value={role.endDate} disabled={role.current} onChange={(event) => updateRole(roleIndex, "endDate", event.target.value)} /></label>
                    <label htmlFor={`current-role-${roleIndex}`} className="flex min-h-11 items-center gap-3 text-base text-text-secondary md:col-span-2"><input id={`current-role-${roleIndex}`} type="checkbox" checked={role.current} onChange={(event) => updateRole(roleIndex, "current", event.target.checked)} className="size-4 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" />Currently working here</label>
                    <label htmlFor={`responsibilities-${roleIndex}`} className="space-y-2 md:col-span-2"><span className={labelClassName}>Key Responsibilities</span><textarea id={`responsibilities-${roleIndex}`} className={`${inputClassName} min-h-28 resize-y`} value={role.responsibilities} placeholder="Describe your key responsibilities" onChange={(event) => updateRole(roleIndex, "responsibilities", event.target.value)} /></label>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8 border-t border-border pt-6">
            <legend className="text-base font-semibold text-text-primary">Education</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label htmlFor="highest-degree" className="space-y-2"><span className={labelClassName}>Highest Degree</span><select id="highest-degree" className={inputClassName} value={profile.highestDegree} onChange={(event) => updateField("highestDegree", event.target.value)}><option>High School</option><option>Associate Degree</option><option>Bachelor&apos;s Degree</option><option>Master&apos;s Degree</option><option>Doctorate</option></select></label>
              <label htmlFor="field-of-study" className="space-y-2"><span className={labelClassName}>Field of Study</span><input id="field-of-study" className={inputClassName} value={profile.fieldOfStudy} placeholder="Field of study" onChange={(event) => updateField("fieldOfStudy", event.target.value)} /></label>
              <label htmlFor="institution-name" className="space-y-2"><span className={labelClassName}>Institution Name</span><input id="institution-name" className={inputClassName} value={profile.institutionName} placeholder="Institution name" onChange={(event) => updateField("institutionName", event.target.value)} /></label>
              <label htmlFor="graduation-year" className="space-y-2"><span className={labelClassName}>Graduation Year</span><input id="graduation-year" className={inputClassName} type="number" min="1900" max="2100" value={profile.graduationYear} placeholder="YYYY" onChange={(event) => updateField("graduationYear", event.target.value)} /></label>
            </div>
          </fieldset>

          <fieldset className="mt-8 border-t border-border pt-6">
            <legend className="text-base font-semibold text-text-primary">Job Preferences</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label htmlFor="job-titles" className="space-y-2 md:col-span-2"><span className={labelClassName}>Job Titles Seeking</span><input id="job-titles" className={inputClassName} value={profile.jobTitles} placeholder="Frontend Engineer, React Developer" onChange={(event) => updateField("jobTitles", event.target.value)} /></label>
              <label htmlFor="remote-preference" className="space-y-2"><span className={labelClassName}>Remote Preference</span><select id="remote-preference" className={inputClassName} value={profile.remotePreference} onChange={(event) => updateField("remotePreference", event.target.value)}><option>Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
              <label htmlFor="salary-expectation" className="space-y-2"><span className={labelClassName}>Salary Expectation <span className="normal-case font-normal tracking-normal text-text-muted">(optional)</span></span><input id="salary-expectation" className={inputClassName} value={profile.salaryExpectation} placeholder="e.g. $100,000" onChange={(event) => updateField("salaryExpectation", event.target.value)} /></label>
              <label htmlFor="preferred-locations" className="space-y-2 md:col-span-2"><span className={labelClassName}>Preferred Locations <span className="normal-case font-normal tracking-normal text-text-muted">(optional)</span></span><input id="preferred-locations" className={inputClassName} value={profile.preferredLocations} placeholder="e.g. New York, London, Remote" onChange={(event) => updateField("preferredLocations", event.target.value)} /></label>
              <label htmlFor="cover-letter-tone" className="space-y-2 md:col-span-2"><span className={labelClassName}>Cover Letter Tone</span><select id="cover-letter-tone" className={inputClassName} value={profile.coverLetterTone} onChange={(event) => updateField("coverLetterTone", event.target.value)}><option>Professional</option><option>Conversational</option><option>Confident</option><option>Concise</option></select></label>
            </div>
          </fieldset>

          <div className="mt-8 border-t border-border pt-6">
            <button type="submit" disabled={saveState === "saving"} className={`${buttonClassName} w-full bg-accent text-accent-foreground hover:bg-accent-dark sm:w-auto sm:min-w-40`}>
              {saveState === "saving" ? "Saving Profile..." : saveState === "saved" ? "Profile Saved" : "Save Profile"}
            </button>
            {saveError && <p role="alert" className="mt-3 text-sm text-error">{saveError}</p>}
            {saveState === "saved" && <p role="status" className="mt-3 text-sm text-success-dark">Your profile and resume were saved securely.</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
