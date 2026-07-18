"use server";

import OpenAI from "openai";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { createInsforgeServer } from "@/lib/insforge-server";
import { emptyProfile } from "@/lib/profile-utils";
import type { ExtractProfileResult, ProfileFormValues, WorkRole } from "@/lib/profile-types";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MIN_TEXT_LENGTH = 40;
const MAX_TEXT_LENGTH = 50_000;
const RESUME_BUCKET = "resumes";

const experienceLevels = ["Junior", "Mid-level", "Senior", "Lead"] as const;
const workAuthorizations = ["Citizen", "Permanent resident", "Requires sponsorship"] as const;
const remotePreferences = ["Any", "Remote", "Hybrid", "On-site"] as const;
const coverLetterTones = ["Professional", "Conversational", "Confident", "Concise"] as const;
const degrees = ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate"] as const;

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown, limit = 50): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function enumValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  const candidate = stringValue(value);
  return values.includes(candidate as T) ? (candidate as T) : fallback;
}

function monthValue(value: unknown): string {
  const candidate = stringValue(value);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(candidate) ? candidate : "";
}

function yearValue(value: unknown): string {
  const candidate = stringValue(value);
  return /^\d{4}$/.test(candidate) ? candidate : "";
}

function yearsValue(value: unknown): string {
  const candidate = typeof value === "number" ? value : Number(stringValue(value));
  return Number.isInteger(candidate) && candidate >= 0 && candidate <= 80 ? String(candidate) : "";
}

function workRole(value: unknown): WorkRole | null {
  if (!isRecord(value)) return null;

  const role = {
    companyName: stringValue(value.companyName),
    jobTitle: stringValue(value.jobTitle),
    startDate: monthValue(value.startDate),
    endDate: monthValue(value.endDate),
    current: value.current === true,
    responsibilities: stringValue(value.responsibilities),
  } satisfies WorkRole;

  return role.companyName || role.jobTitle || role.responsibilities ? role : null;
}

function normalizeProfile(value: unknown, email: string): ProfileFormValues | null {
  if (!isRecord(value)) return null;

  const profile = emptyProfile(email);
  const workExperience = Array.isArray(value.workExperience)
    ? value.workExperience.map(workRole).filter((role): role is WorkRole => role !== null).slice(0, 3)
    : [];

  return {
    ...profile,
    fullName: stringValue(value.fullName),
    phoneNumber: stringValue(value.phoneNumber),
    location: stringValue(value.location),
    linkedinUrl: stringValue(value.linkedinUrl),
    portfolioUrl: stringValue(value.portfolioUrl),
    workAuthorization: enumValue(value.workAuthorization, workAuthorizations, profile.workAuthorization as (typeof workAuthorizations)[number]),
    currentJobTitle: stringValue(value.currentJobTitle),
    experienceLevel: enumValue(value.experienceLevel, experienceLevels, profile.experienceLevel as (typeof experienceLevels)[number]),
    yearsExperience: yearsValue(value.yearsExperience),
    skills: stringList(value.skills),
    industries: stringList(value.industries),
    workExperience,
    highestDegree: enumValue(value.highestDegree, degrees, profile.highestDegree as (typeof degrees)[number]),
    fieldOfStudy: stringValue(value.fieldOfStudy),
    institutionName: stringValue(value.institutionName),
    graduationYear: yearValue(value.graduationYear),
    jobTitles: stringValue(value.jobTitles),
    remotePreference: enumValue(value.remotePreference, remotePreferences, profile.remotePreference as (typeof remotePreferences)[number]),
    salaryExpectation: stringValue(value.salaryExpectation),
    preferredLocations: stringValue(value.preferredLocations),
    coverLetterTone: enumValue(value.coverLetterTone, coverLetterTones, profile.coverLetterTone as (typeof coverLetterTones)[number]),
  };
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (!apiKey) throw new Error("Missing OpenAI API key");

  return new OpenAI({ apiKey, maxRetries: 1 });
}

async function getResumeBuffer(formData: FormData, userId: string): Promise<Buffer | null> {
  const resumeEntry = formData.get("resume");
  if (resumeEntry instanceof File && resumeEntry.size > 0) {
    if (resumeEntry.type !== "application/pdf" || resumeEntry.size > MAX_RESUME_SIZE) {
      throw new Error("Resume must be a PDF file smaller than 5MB.");
    }

    return Buffer.from(await resumeEntry.arrayBuffer());
  }

  const { data, error } = await (await createInsforgeServer()).storage
    .from(RESUME_BUCKET)
    .download(`${userId}/resume.pdf`);

  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function extractProfileFromResume(formData: FormData): Promise<ExtractProfileResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;

    if (currentUserError || !user) {
      return { success: false, error: "Your session has expired. Please sign in again." };
    }

    const resumeBuffer = await getResumeBuffer(formData, user.id);
    if (!resumeBuffer) {
      return { success: false, error: "Please upload a resume before extracting your profile." };
    }

    const pdfData = await pdf(resumeBuffer);
    const resumeText = pdfData.text.trim();
    if (resumeText.length < MIN_TEXT_LENGTH) {
      return { success: false, error: "Could not extract text from this PDF. Please try a different file." };
    }

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You extract job seeker profile data from resume text. Return only a valid JSON object with these exact keys: fullName, phoneNumber, location, linkedinUrl, portfolioUrl, workAuthorization, currentJobTitle, experienceLevel, yearsExperience, skills, industries, workExperience, highestDegree, fieldOfStudy, institutionName, graduationYear, jobTitles, remotePreference, salaryExpectation, preferredLocations, coverLetterTone. Use empty strings or empty arrays when the resume does not provide a value. Never invent information. Use these UI values exactly: workAuthorization is Citizen, Permanent resident, or Requires sponsorship. experienceLevel is Junior, Mid-level, Senior, or Lead. remotePreference is Any, Remote, Hybrid, or On-site. coverLetterTone is Professional, Conversational, Confident, or Concise. highestDegree is High School, Associate Degree, Bachelor's Degree, Master's Degree, or Doctorate. workExperience is an array of at most three objects with companyName, jobTitle, startDate, endDate, current, and responsibilities. Dates must use YYYY-MM format when a month is known, otherwise empty strings. yearsExperience must be a nonnegative whole number or an empty string.`,
        },
        {
          role: "user",
          content: `Resume text:\n\n${resumeText.slice(0, MAX_TEXT_LENGTH)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return { success: false, error: "We could not extract profile details from this resume. Please try again." };

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, error: "We could not read the extracted profile details. Please try again." };
    }

    const profile = normalizeProfile(parsed, user.email ?? "");
    if (!profile) return { success: false, error: "We could not validate the extracted profile details. Please try again." };

    return { success: true, profile };
  } catch (error) {
    if (error instanceof Error && error.message === "Resume must be a PDF file smaller than 5MB.") {
      return { success: false, error: error.message };
    }

    if (error instanceof OpenAI.APIError) {
      console.error("[actions/profile-extraction] OpenAI request failed", {
        code: error.code,
        requestId: error.requestID,
        status: error.status,
      });

      if (error.code === "insufficient_quota") {
        return { success: false, error: "OpenAI usage limit reached. Add billing or credits to continue extracting profiles." };
      }

      if (error.status === 429) {
        return { success: false, error: "OpenAI is temporarily rate limited. Please try again in a moment." };
      }

      if (error.status === 401) {
        return { success: false, error: "The OpenAI API key is not authorized. Check the server configuration." };
      }
    }

    console.error("[actions/profile-extraction] Resume extraction failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: "We could not extract your profile right now. Please try again." };
  }
}
