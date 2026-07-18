export type WorkRole = {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

export type ProfileFormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  currentJobTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: WorkRole[];
  highestDegree: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
  jobTitles: string;
  remotePreference: string;
  salaryExpectation: string;
  preferredLocations: string;
  coverLetterTone: string;
  resumePdfUrl: string | null;
};

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: unknown;
  education: unknown;
  job_titles_seeking: string[];
  remote_preference: string | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type SaveProfileResult =
  | { success: true; resumePdfUrl: string | null }
  | { success: false; error: string };

export type ExtractProfileResult =
  | { success: true; profile: ProfileFormValues }
  | { success: false; error: string };
