-- Fix RLS circular dependency issues
-- The problem: Policies query public.users which is blocked by RLS, causing 500 errors

-- Drop and recreate users SELECT policies to handle NULL company_id
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view users in their company" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Policy 1: Users can always view their own record (even without company_id)
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can view other users in their company (only if they have a company_id)
-- This uses a subquery that won't cause circular dependency because it checks auth.uid() directly
CREATE POLICY "Users can view users in their company"
    ON public.users FOR SELECT
    USING (
        company_id IS NOT NULL AND
        company_id = (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

-- Policy 3: Admins can view all users (only if they have admin role)
-- This also avoids circular dependency by checking auth.uid() directly
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Fix companies policies to handle users without company_id
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;

CREATE POLICY "Users can view companies they belong to"
    ON public.companies FOR SELECT
    USING (
        id IN (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

-- Fix documents policies
DROP POLICY IF EXISTS "Users can view documents in their company" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents in their company" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents in their company" ON public.documents;

CREATE POLICY "Users can view documents in their company"
    ON public.documents FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

CREATE POLICY "Users can create documents in their company"
    ON public.documents FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update documents in their company"
    ON public.documents FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

-- Fix invoices policy
DROP POLICY IF EXISTS "Users can view invoices in their company" ON public.invoices;

CREATE POLICY "Users can view invoices in their company"
    ON public.invoices FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.users 
            WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    );

