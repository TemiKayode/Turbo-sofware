-- Fix infinite recursion in RLS policies
-- Use security definer functions to break circular dependencies

-- Function to get user's company_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result UUID;
BEGIN
    SELECT company_id INTO result
    FROM public.users
    WHERE id = user_id;
    RETURN result;
END;
$$;

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT (role = 'admin') INTO result
    FROM public.users
    WHERE id = user_id;
    RETURN COALESCE(result, false);
END;
$$;

-- Drop and recreate users policies using the functions
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view users in their company" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Policy 1: Users can always view their own record
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can view other users in their company
CREATE POLICY "Users can view users in their company"
    ON public.users FOR SELECT
    USING (
        company_id IS NOT NULL AND
        company_id = get_user_company_id(auth.uid())
    );

-- Policy 3: Admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (is_user_admin(auth.uid()));

-- Fix companies policies
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;

CREATE POLICY "Users can view companies they belong to"
    ON public.companies FOR SELECT
    USING (
        id = get_user_company_id(auth.uid())
    );

-- Fix documents policies
DROP POLICY IF EXISTS "Users can view documents in their company" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents in their company" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents in their company" ON public.documents;

CREATE POLICY "Users can view documents in their company"
    ON public.documents FOR SELECT
    USING (
        company_id = get_user_company_id(auth.uid())
    );

CREATE POLICY "Users can create documents in their company"
    ON public.documents FOR INSERT
    WITH CHECK (
        company_id = get_user_company_id(auth.uid())
    );

CREATE POLICY "Users can update documents in their company"
    ON public.documents FOR UPDATE
    USING (
        company_id = get_user_company_id(auth.uid())
    );

-- Fix invoices policy
DROP POLICY IF EXISTS "Users can view invoices in their company" ON public.invoices;

CREATE POLICY "Users can view invoices in their company"
    ON public.invoices FOR SELECT
    USING (
        company_id = get_user_company_id(auth.uid())
    );

-- Fix data_breaches policy
DROP POLICY IF EXISTS "Users can view data breaches in their company" ON public.data_breaches;

CREATE POLICY "Users can view data breaches in their company"
    ON public.data_breaches FOR SELECT
    USING (
        company_id = get_user_company_id(auth.uid())
    );

-- Fix backups policy
DROP POLICY IF EXISTS "Users can view backups in their company" ON public.backups;

CREATE POLICY "Users can view backups in their company"
    ON public.backups FOR SELECT
    USING (
        company_id = get_user_company_id(auth.uid())
    );

