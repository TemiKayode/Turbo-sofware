-- Fix RLS policy for user signup
-- Allow users to insert their own record during registration

-- Drop existing policy if it exists (in case of re-run)
DROP POLICY IF EXISTS "Users can create their own record" ON public.users;

-- Create policy to allow users to insert their own record
-- This is needed during signup when auth.uid() matches the id being inserted
CREATE POLICY "Users can create their own record"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Also allow inserting security logs during signup
DROP POLICY IF EXISTS "Users can create their own security logs" ON public.security_logs;

CREATE POLICY "Users can create their own security logs"
    ON public.security_logs FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

