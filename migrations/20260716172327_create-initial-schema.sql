CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  current_title TEXT,
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
  years_experience INTEGER CHECK (years_experience >= 0),
  skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  industries TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  work_experience JSONB NOT NULL DEFAULT '[]'::JSONB,
  education JSONB,
  job_titles_seeking TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  remote_preference TEXT CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  salary_expectation TEXT,
  cover_letter_tone TEXT CHECK (cover_letter_tone IN ('formal', 'casual', 'enthusiastic')),
  linkedin_url TEXT,
  portfolio_url TEXT,
  work_authorization TEXT CHECK (
    work_authorization IN ('citizen', 'permanent_resident', 'visa_required')
  ),
  resume_pdf_url TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_work_experience_shape CHECK (
    jsonb_typeof(work_experience) = 'array'
    AND CASE
      WHEN jsonb_typeof(work_experience) = 'array'
        THEN jsonb_array_length(work_experience) <= 3
      ELSE FALSE
    END
  ),
  CONSTRAINT profiles_education_shape CHECK (
    education IS NULL OR jsonb_typeof(education) = 'object'
  )
);

CREATE TABLE public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'completed', 'failed')
  ),
  job_title_searched TEXT NOT NULL,
  location_searched TEXT,
  jobs_found INTEGER NOT NULL DEFAULT 0 CHECK (jobs_found >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('search', 'url')),
  source_url TEXT,
  external_apply_url TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  job_type TEXT CHECK (job_type IN ('fulltime', 'parttime', 'contract')),
  about_role TEXT,
  responsibilities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  nice_to_have TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  benefits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  about_company TEXT,
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_reason TEXT,
  matched_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  missing_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  company_research JSONB,
  found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT jobs_url_source_requires_url CHECK (
    source <> 'url' OR source_url IS NOT NULL
  )
);

CREATE TABLE public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_id_idx ON public.profiles (id);
CREATE INDEX agent_runs_user_started_idx
  ON public.agent_runs (user_id, started_at DESC);
CREATE INDEX agent_runs_status_idx ON public.agent_runs (status);
CREATE INDEX jobs_user_found_idx ON public.jobs (user_id, found_at DESC);
CREATE INDEX jobs_user_match_idx ON public.jobs (user_id, match_score DESC);
CREATE INDEX jobs_run_id_idx ON public.jobs (run_id);
CREATE INDEX jobs_user_id_idx ON public.jobs (user_id);
CREATE INDEX jobs_research_idx ON public.jobs (user_id, found_at DESC)
  WHERE company_research IS NOT NULL;
CREATE INDEX agent_logs_user_created_idx
  ON public.agent_logs (user_id, created_at DESC);
CREATE INDEX agent_logs_run_id_idx ON public.agent_logs (run_id);
CREATE INDEX agent_logs_job_id_idx ON public.agent_logs (job_id);

CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER agent_runs_prevent_user_change
BEFORE UPDATE ON public.agent_runs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER jobs_prevent_user_change
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER agent_logs_prevent_user_change
BEFORE UPDATE ON public.agent_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change();

CREATE OR REPLACE FUNCTION public.validate_job_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  run_owner UUID;
BEGIN
  IF NEW.run_id IS NOT NULL THEN
    SELECT user_id INTO run_owner
    FROM public.agent_runs
    WHERE id = NEW.run_id;

    IF run_owner IS NULL OR run_owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'job and run must belong to the same user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_validate_ownership
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.validate_job_ownership();

CREATE OR REPLACE FUNCTION public.validate_log_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  run_owner UUID;
  job_owner UUID;
  job_run_id UUID;
BEGIN
  SELECT user_id INTO run_owner
  FROM public.agent_runs
  WHERE id = NEW.run_id;

  IF run_owner IS NULL OR run_owner IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'log and run must belong to the same user';
  END IF;

  IF NEW.job_id IS NOT NULL THEN
    SELECT user_id, run_id INTO job_owner, job_run_id
    FROM public.jobs
    WHERE id = NEW.job_id;

    IF job_owner IS NULL OR job_owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'log and job must belong to the same user';
    END IF;

    IF job_run_id IS NOT NULL AND job_run_id IS DISTINCT FROM NEW.run_id THEN
      RAISE EXCEPTION 'log job must belong to the same run';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER agent_logs_validate_ownership
BEFORE INSERT OR UPDATE ON public.agent_logs
FOR EACH ROW
EXECUTE FUNCTION public.validate_log_ownership();

CREATE OR REPLACE FUNCTION public.enforce_agent_run_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF OLD.status <> 'running' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'terminal agent run cannot change status';
  END IF;

  IF NEW.status = 'running' AND NEW.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'running agent run cannot have completed_at';
  END IF;

  IF OLD.status = 'running' AND NEW.status IN ('completed', 'failed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
  END IF;

  IF OLD.status <> 'running' AND NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    RAISE EXCEPTION 'terminal agent run cannot change completed_at';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER agent_runs_enforce_transition
BEFORE UPDATE ON public.agent_runs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_agent_run_transition();

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.agent_runs FROM anon;
REVOKE ALL ON public.jobs FROM anon;
REVOKE ALL ON public.agent_logs FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agent_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT, INSERT ON public.agent_logs TO authenticated;

CREATE POLICY profiles_owner_select ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_owner_insert ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_owner_update ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_select ON public.agent_runs
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_insert ON public.agent_runs
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_update ON public.agent_runs
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_select ON public.jobs
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_insert ON public.jobs
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_update ON public.jobs
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY agent_logs_owner_select ON public.agent_logs
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY agent_logs_owner_insert ON public.agent_logs
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobpilot_resumes_select ON storage.objects;
DROP POLICY IF EXISTS jobpilot_resumes_insert ON storage.objects;
DROP POLICY IF EXISTS jobpilot_resumes_update ON storage.objects;
DROP POLICY IF EXISTS jobpilot_resumes_delete ON storage.objects;

CREATE POLICY jobpilot_resumes_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket = 'resumes'
  AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  AND storage.filename(key) = 'resume.pdf'
);

CREATE POLICY jobpilot_resumes_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket = 'resumes'
  AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  AND storage.filename(key) = 'resume.pdf'
);

CREATE POLICY jobpilot_resumes_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket = 'resumes'
  AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  AND storage.filename(key) = 'resume.pdf'
)
WITH CHECK (
  bucket = 'resumes'
  AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  AND storage.filename(key) = 'resume.pdf'
);

CREATE POLICY jobpilot_resumes_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket = 'resumes'
  AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  AND storage.filename(key) = 'resume.pdf'
);

GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
