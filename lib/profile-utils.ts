import type { ProfileFormValues, ProfileRecord, WorkRole } from "@/lib/profile-types";

type Completion = {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
};

const experienceLabels: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
};

const authorizationLabels: Record<string, string> = {
  citizen: "Citizen",
  permanent_resident: "Permanent resident",
  visa_required: "Requires sponsorship",
};

const remoteLabels: Record<string, string> = {
  any: "Any",
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const toneLabels: Record<string, string> = {
  formal: "Professional",
  casual: "Conversational",
  enthusiastic: "Confident",
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function workRoleFromRecord(value: unknown): WorkRole | null {
  const record = objectValue(value);
  if (!record) return null;

  const endDate = stringValue(record.endDate);
  return {
    companyName: stringValue(record.company ?? record.companyName),
    jobTitle: stringValue(record.role ?? record.jobTitle),
    startDate: stringValue(record.startDate),
    endDate,
    current: !endDate,
    responsibilities: stringValue(record.description ?? record.responsibilities),
  };
}

export function emptyProfile(email = ""): ProfileFormValues {
  return {
    fullName: "",
    email,
    phoneNumber: "",
    location: "",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "Citizen",
    currentJobTitle: "",
    experienceLevel: "Junior",
    yearsExperience: "",
    skills: [],
    industries: [],
    workExperience: [],
    highestDegree: "High School",
    fieldOfStudy: "",
    institutionName: "",
    graduationYear: "",
    jobTitles: "",
    remotePreference: "Any",
    salaryExpectation: "",
    preferredLocations: "",
    coverLetterTone: "Professional",
    resumePdfUrl: null,
  };
}

export function profileRecordToForm(
  record: ProfileRecord,
  emailFallback = "",
): ProfileFormValues {
  const education = objectValue(record.education);
  const workExperience = Array.isArray(record.work_experience)
    ? record.work_experience
        .map(workRoleFromRecord)
        .filter((role): role is WorkRole => role !== null)
        .slice(0, 3)
    : [];

  return {
    fullName: stringValue(record.full_name),
    email: stringValue(record.email) || emailFallback,
    phoneNumber: stringValue(record.phone),
    location: stringValue(record.location),
    linkedinUrl: stringValue(record.linkedin_url),
    portfolioUrl: stringValue(record.portfolio_url),
    workAuthorization: authorizationLabels[stringValue(record.work_authorization)] ?? "Citizen",
    currentJobTitle: stringValue(record.current_title),
    experienceLevel: experienceLabels[stringValue(record.experience_level)] ?? "Junior",
    yearsExperience: record.years_experience === null ? "" : String(record.years_experience),
    skills: stringList(record.skills),
    industries: stringList(record.industries),
    workExperience,
    highestDegree: stringValue(education?.degree) || "High School",
    fieldOfStudy: stringValue(education?.field),
    institutionName: stringValue(education?.institution),
    graduationYear: stringValue(education?.graduationYear),
    jobTitles: stringList(record.job_titles_seeking).join(", "),
    remotePreference: remoteLabels[stringValue(record.remote_preference)] ?? "Any",
    salaryExpectation: stringValue(record.salary_expectation),
    preferredLocations: stringList(record.preferred_locations).join(", "),
    coverLetterTone: toneLabels[stringValue(record.cover_letter_tone)] ?? "Professional",
    resumePdfUrl: record.resume_pdf_url,
  };
}

export function calculateProfileCompletion(profile: ProfileFormValues): Completion {
  const educationComplete = Boolean(
    profile.highestDegree.trim() &&
      profile.fieldOfStudy.trim() &&
      profile.institutionName.trim() &&
      profile.graduationYear.trim(),
  );
  const requirements = [
    ["NAME", Boolean(profile.fullName.trim())],
    ["PHONE", Boolean(profile.phoneNumber.trim())],
    ["LOCATION", Boolean(profile.location.trim())],
    ["JOB TITLE", Boolean(profile.currentJobTitle.trim())],
    ["EXPERIENCE", Boolean(profile.yearsExperience.trim())],
    ["SKILLS", profile.skills.length > 0],
    ["EDUCATION", educationComplete],
    ["JOB TITLES", Boolean(profile.jobTitles.trim())],
    ["WORK AUTHORIZATION", Boolean(profile.workAuthorization.trim())],
    ["REMOTE PREFERENCE", Boolean(profile.remotePreference.trim())],
  ] as const;
  const missingFields = requirements
    .filter(([, complete]) => !complete)
    .map(([label]) => label);
  const percentage = Math.round(((requirements.length - missingFields.length) / requirements.length) * 100);

  return {
    percentage,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}
