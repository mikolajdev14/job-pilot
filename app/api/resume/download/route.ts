import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

const RESUME_BUCKET = "resumes";

export async function GET(): Promise<Response> {
  try {
    const insforge = await createInsforgeServer();
    const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
    const user = currentUserData?.user;

    if (currentUserError || !user) {
      return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/download] Could not read profile", profileError);
      return Response.json({ error: "We could not load your resume. Please try again." }, { status: 500 });
    }

    if (!profile?.resume_pdf_url) {
      return Response.json({ error: "No generated resume was found." }, { status: 404 });
    }

    const { data: resume, error: downloadError } = await insforge.storage
      .from(RESUME_BUCKET)
      .download(`${user.id}/resume.pdf`);

    if (downloadError || !resume) {
      console.error("[api/resume/download] Resume download failed", downloadError);
      return Response.json({ error: "We could not open your generated resume." }, { status: 404 });
    }

    return new Response(resume, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline; filename=\"resume.pdf\"",
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("[api/resume/download] Resume download failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "We could not open your generated resume." }, { status: 500 });
  }
}
