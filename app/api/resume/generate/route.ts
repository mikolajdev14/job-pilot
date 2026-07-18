import OpenAI from "openai";
import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { createInsforgeServer } from "@/lib/insforge-server";
import { ResumePdfDocument, type ResumePdfContent, type ResumePdfProfile } from "@/lib/resume-pdf";

export const runtime = "nodejs";

const RESUME_BUCKET = "resumes";
const MAX_BULLETS_PER_ROLE = 4;

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown, limit = 30): string[] {
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

function sourceRoles(value: unknown): ResumePdfProfile["workExperience"] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 3).map((item) => {
    const role = recordValue(item);
    const endDate = stringValue(role.endDate);
    return {
      companyName: stringValue(role.company ?? role.companyName),
      jobTitle: stringValue(role.role ?? role.jobTitle),
      startDate: stringValue(role.startDate),
      endDate,
      current: !endDate,
      responsibilities: stringValue(role.description ?? role.responsibilities),
    };
  }).filter((role) => role.companyName || role.jobTitle);
}

function profileForResume(row: Record<string, unknown>, fallbackEmail: string): ResumePdfProfile {
  const education = recordValue(row.education);
  return {
    fullName: stringValue(row.full_name),
    email: stringValue(row.email) || fallbackEmail,
    phoneNumber: stringValue(row.phone),
    location: stringValue(row.location),
    linkedinUrl: stringValue(row.linkedin_url),
    portfolioUrl: stringValue(row.portfolio_url),
    currentJobTitle: stringValue(row.current_title),
    yearsExperience: row.years_experience === null || row.years_experience === undefined ? "" : String(row.years_experience),
    skills: stringList(row.skills),
    workExperience: sourceRoles(row.work_experience),
    highestDegree: stringValue(education.degree),
    fieldOfStudy: stringValue(education.field),
    institutionName: stringValue(education.institution),
    graduationYear: stringValue(education.graduationYear),
  };
}

function textValue(value: unknown, limit: number): string {
  return stringValue(value).slice(0, limit);
}

function parseGeneratedContent(value: unknown): ResumePdfContent | null {
  const result = recordValue(value);
  const summary = textValue(result.summary, 900);
  const experience = Array.isArray(result.experience)
    ? result.experience.slice(0, 3).map((item) => {
        const role = recordValue(item);
        return {
          companyName: textValue(role.companyName, 120),
          jobTitle: textValue(role.jobTitle, 120),
          startDate: textValue(role.startDate, 20),
          endDate: textValue(role.endDate, 20),
          bullets: stringList(role.bullets, MAX_BULLETS_PER_ROLE).map((bullet) => bullet.slice(0, 300)),
        };
      }).filter((role) => role.companyName || role.jobTitle || role.bullets.length > 0)
    : [];

  if (!summary && experience.length === 0) return null;
  return { summary, experience };
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (!apiKey) throw new Error("Missing OpenAI API key");
  return new OpenAI({ apiKey, maxRetries: 1 });
}

function profilePrompt(profile: ResumePdfProfile): string {
  const roles = profile.workExperience.map((role) => ({
    companyName: role.companyName,
    jobTitle: role.jobTitle,
    startDate: role.startDate,
    endDate: role.endDate || "Present",
    responsibilities: role.responsibilities,
  }));

  return JSON.stringify({
    fullName: profile.fullName,
    currentJobTitle: profile.currentJobTitle,
    yearsExperience: profile.yearsExperience,
    skills: profile.skills,
    workExperience: roles,
    education: {
      degree: profile.highestDegree,
      field: profile.fieldOfStudy,
      institution: profile.institutionName,
      graduationYear: profile.graduationYear,
    },
  });
}

async function generateContent(profile: ResumePdfProfile): Promise<ResumePdfContent> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: "You write concise, polished resume content from a candidate profile. Return only a valid JSON object with exactly two keys: summary (a professional summary paragraph) and experience (an array of objects with companyName, jobTitle, startDate, endDate, and bullets). Rewrite responsibilities into strong, specific resume bullets. Never invent employers, dates, technologies, metrics, or achievements. Keep the summary under 90 words and provide up to four bullets per role. Use empty strings or empty arrays when source data is missing.",
      },
      {
        role: "user",
        content: `Candidate profile:\n${profilePrompt(profile)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("Empty resume content response");

  const parsed = JSON.parse(content) as unknown;
  const validated = parseGeneratedContent(parsed);
  if (!validated) throw new Error("Invalid resume content response");
  return validated;
}

function errorResponse(error: unknown): Response {
  if (error instanceof OpenAI.APIError) {
    console.error("[api/resume/generate] OpenAI request failed", {
      code: error.code,
      requestId: error.requestID,
      status: error.status,
    });

    if (error.code === "insufficient_quota") {
      return Response.json({ error: "OpenAI usage limit reached. Add billing or credits to generate a resume." }, { status: 503 });
    }
    if (error.status === 429) {
      return Response.json({ error: "OpenAI is temporarily rate limited. Please try again in a moment." }, { status: 503 });
    }
    if (error.status === 401) {
      return Response.json({ error: "The OpenAI API key is not authorized. Check the server configuration." }, { status: 503 });
    }
  }

  console.error("[api/resume/generate] Resume generation failed", {
    message: error instanceof Error ? error.message : "Unknown error",
  });
  return Response.json({ error: "We could not generate your resume right now. Please try again." }, { status: 500 });
}

export async function POST(): Promise<Response> {
  try {
    const insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;

    if (currentUserError || !user) {
      return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }

    const { data: profileRow, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/generate] Could not read profile", profileError);
      return Response.json({ error: "We could not load your profile. Please try again." }, { status: 500 });
    }

    if (!profileRow) {
      return Response.json({ error: "Complete and save your profile before generating a resume." }, { status: 400 });
    }

    const profile = profileForResume(profileRow as Record<string, unknown>, user.email ?? "");
    if (!profile.fullName && !profile.currentJobTitle && profile.workExperience.length === 0) {
      return Response.json({ error: "Add your name, job title, or work experience before generating a resume." }, { status: 400 });
    }

    const content = await generateContent(profile);
    const pdfBuffer = await renderToBuffer(
      createElement(ResumePdfDocument, { profile, content }) as unknown as Parameters<typeof renderToBuffer>[0],
    );
    const resumePath = `${user.id}/resume.pdf`;
    const resumeBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    const { data: uploadedResume, error: uploadError } = await insforge.storage
      .from(RESUME_BUCKET)
      .upload(resumePath, resumeBlob);

    if (uploadError || !uploadedResume) {
      console.error("[api/resume/generate] Resume upload failed", uploadError);
      return Response.json({ error: "We could not save your generated resume. Please try again." }, { status: 500 });
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploadedResume.url })
      .eq("id", user.id);

    if (updateError) {
      console.error("[api/resume/generate] Could not save resume URL", updateError);
      return Response.json({ error: "Your resume was generated but could not be linked to your profile." }, { status: 500 });
    }

    revalidatePath("/profile");
    return Response.json({ success: true, resumePdfUrl: uploadedResume.url });
  } catch (error) {
    return errorResponse(error);
  }
}
