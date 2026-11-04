-- ==============================================================================
-- PROMOTE AN AUTHENTICATED USER TO ADMIN
-- Run this in the Supabase SQL Editor after signing up via the Supabase Dashboard
-- or using your preferred email.
-- ==============================================================================

-- Option 1: Promote by Email
-- Replace 'admin@brandname.pk' with your email
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'admin@brandname.pk';

  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.admins (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'super_admin';
    RAISE NOTICE 'Admin created for user %', target_user_id;
  ELSE
    RAISE WARNING 'User with email admin@brandname.pk not found in auth.users. Please sign up or create user first.';
  END IF;
END $$;

-- Option 2: Verify existing admins
SELECT a.id, a.user_id, u.email, a.role, a.created_at
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;
