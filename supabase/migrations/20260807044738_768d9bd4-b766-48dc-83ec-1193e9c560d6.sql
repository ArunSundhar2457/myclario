ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_check CHECK (language IN ('en', 'de', 'es'));
  END IF;
END $$;