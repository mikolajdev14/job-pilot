"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import type { ProfileFormValues, ProfileRecord, SaveProfileResult, WorkRole } from "@/lib/profile-types";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const RESUME_BUCKET = "resumes";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function commaSeparated(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWorkRoles(value: unknown): WorkRole[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 3).map((item) => {
    const role = isRecord(item) ? item : {};
    return {
      companyName: stringValue(role.companyName),
      jobTitle: stringValue(role.jobTitle),
      startDate: stringValue(role.startDate),
      endDate: stringValue(role.endDate),
      current: role.current === true,
      responsibilities: stringValue(role.responsibilities),
    };
  });
}

function parseProfile(value: FormDataEntryValue | null): ProfileFormValues | null {
  if (typeof value !== "string") return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;

    return {
      fullName: stringValue(parsed.fullName),
      email: stringValue(parsed.email),
      phoneNumber: stringValue(parsed.phoneNumber),
      location: stringValue(parsed.location),
      linkedinUrl: stringValue(parsed.linkedinUrl),
      portfolioUrl: stringValue(parsed.portfolioUrl),
      workAuthorization: stringValue(parsed.workAuthorization),
      currentJobTitle: stringValue(parsed.currentJobTitle),
      experienceLevel: stringValue(parsed.experienceLevel),
      yearsExperience: stringValue(parsed.yearsExperience),
      skills: stringList(parsed.skills).slice(0, 50),
      industries: stringList(parsed.industries).slice(0, 50),
      workExperience: normalizeWorkRoles(parsed.workExperience),
      highestDegree: stringValue(parsed.highestDegree),
      fieldOfStudy: stringValue(parsed.fieldOfStudy),
      institutionName: stringValue(parsed.institutionName),
      graduationYear: stringValue(parsed.graduationYear),
      jobTitles: stringValue(parsed.jobTitles),
      remotePreference: stringValue(parsed.remotePreference),
      salaryExpectation: stringValue(parsed.salaryExpectation),
      preferredLocations: stringValue(parsed.preferredLocations),
      coverLetterTone: stringValue(parsed.coverLetterTone),
      resumePdfUrl: null,
    };
  } catch {
    return null;
  }
}

function enumValue(value: string, values: Record<string, string>, fallback: string): string {
  return values[value] ?? fallback;
}

function profileRow(profile: ProfileFormValues, userId: string, email: string, resumePdfUrl: string | null, isComplete: boolean) {
  const experienceLevel = enumValue(profile.experienceLevel, {
    Junior: "junior",
    "Mid-level": "mid",
    Senior: "senior",
    Lead: "lead",
  }, "junior");
  const remotePreference = enumValue(profile.remotePreference, {
    Any: "any",
    Remote: "remote",
    Hybrid: "hybrid",
    "On-site": "onsite",
  }, "any");
  const coverLetterTone = enumValue(profile.coverLetterTone, {
    Professional: "formal",
    Conversational: "casual",
    Confident: "enthusiastic",
    Concise: "formal",
  }, "formal");
  const workAuthorization = enumValue(profile.workAuthorization, {
    Citizen: "citizen",
    "Permanent resident": "permanent_resident",
    "Requires sponsorship": "visa_required",
  }, "citizen");
  const education = profile.highestDegree || profile.fieldOfStudy || profile.institutionName || profile.graduationYear
    ? {
        degree: profile.highestDegree,
        field: profile.fieldOfStudy,
        institution: profile.institutionName,
        graduationYear: profile.graduationYear,
      }
    : null;

  return {
    id: userId,
    full_name: profile.fullName || null,
    email: email || profile.email || null,
    phone: profile.phoneNumber || null,
    location: profile.location || null,
    current_title: profile.currentJobTitle || null,
    experience_level: experienceLevel,
    years_experience: profile.yearsExperience ? Number(profile.yearsExperience) : null,
    skills: profile.skills,
    industries: profile.industries,
    work_experience: profile.workExperience.map((role) => ({
      role: role.jobTitle,
      company: role.companyName,
      startDate: role.startDate,
      endDate: role.current ? null : role.endDate || null,
      description: role.responsibilities,
      technologies: [],
    })),
    education,
    job_titles_seeking: commaSeparated(profile.jobTitles),
    remote_preference: remotePreference,
    preferred_locations: commaSeparated(profile.preferredLocations),
    salary_expectation: profile.salaryExpectation || null,
    cover_letter_tone: coverLetterTone,
    linkedin_url: profile.linkedinUrl || null,
    portfolio_url: profile.portfolioUrl || null,
    work_authorization: workAuthorization,
    resume_pdf_url: resumePdfUrl,
    is_complete: isComplete,
  } satisfies Omit<ProfileRecord, "created_at" | "updated_at" | "resume_pdf_url" | "skills" | "industries" | "work_experience" | "education" | "job_titles_seeking" | "preferred_locations"> & {
    skills: string[];
    industries: string[];
    work_experience: unknown;
    education: unknown;
    job_titles_seeking: string[];
    preferred_locations: string[];
    resume_pdf_url: string | null;
  };
}

export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;

    if (currentUserError || !user) {
      return { success: false, error: "Your session has expired. Please sign in again." };
    }

    const profile = parseProfile(formData.get("profile"));
    if (!profile) {
      return { success: false, error: "The profile form could not be read. Please try again." };
    }

    const completion = calculateProfileCompletion(profile);
    const yearsExperience = profile.yearsExperience ? Number(profile.yearsExperience) : null;
    if (yearsExperience !== null && (!Number.isInteger(yearsExperience) || yearsExperience < 0)) {
      return { success: false, error: "Years of experience must be a whole number of zero or more." };
    }

    const { data: existingProfile, error: readError } = await insforge.database
      .from("profiles")
      .select("id, resume_pdf_url")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      console.error("[actions/profile] Could not read existing profile", readError);
      return { success: false, error: "We could not load your existing profile. Please try again." };
    }

    const resumeEntry = formData.get("resume");
    const hasResume = resumeEntry instanceof File && resumeEntry.size > 0;
    let resumePdfUrl = typeof existingProfile?.resume_pdf_url === "string"
      ? existingProfile.resume_pdf_url
      : null;

    if (hasResume && resumeEntry instanceof File) {
      if (resumeEntry.type !== "application/pdf" || resumeEntry.size > MAX_RESUME_SIZE) {
        return { success: false, error: "Resume must be a PDF file smaller than 5MB." };
      }

      const resumePath = `${user.id}/resume.pdf`;
      const { data: uploadedResume, error: uploadError } = await insforge.storage
        .from(RESUME_BUCKET)
        .upload(resumePath, resumeEntry);

      if (uploadError || !uploadedResume) {
        console.error("[actions/profile] Resume upload failed", uploadError);
        return { success: false, error: "We could not upload your resume. Please try again." };
      }

      resumePdfUrl = uploadedResume.url;
    }

    const row = profileRow(profile, user.id, user.email ?? "", resumePdfUrl, completion.isComplete);
    const profileQuery = insforge.database.from("profiles");
    const writeResult = existingProfile
      ? await profileQuery.update(row).eq("id", user.id)
      : await profileQuery.insert([row]);

    if (writeResult.error) {
      console.error("[actions/profile] Profile write failed", writeResult.error);
      return { success: false, error: "We could not save your profile. Please try again." };
    }

    revalidatePath("/profile");
    return { success: true, resumePdfUrl };
  } catch (error) {
    console.error("[actions/profile] Profile save failed", error);
    return { success: false, error: "We could not save your profile. Please try again." };
  }
}
