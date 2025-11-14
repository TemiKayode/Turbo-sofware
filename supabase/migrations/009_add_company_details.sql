-- Add company details columns to companies table
-- These columns are needed for the Account Settings page

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN public.companies.email IS 'Company contact email';
COMMENT ON COLUMN public.companies.phone IS 'Company contact phone number';
COMMENT ON COLUMN public.companies.website IS 'Company website URL';
COMMENT ON COLUMN public.companies.address IS 'Company physical address';
COMMENT ON COLUMN public.companies.city IS 'Company city';
COMMENT ON COLUMN public.companies.state IS 'Company state/province';
COMMENT ON COLUMN public.companies.country IS 'Company country';
COMMENT ON COLUMN public.companies.postal_code IS 'Company postal/zip code';
COMMENT ON COLUMN public.companies.tax_id IS 'Company tax identification number';
COMMENT ON COLUMN public.companies.registration_number IS 'Company registration number';

