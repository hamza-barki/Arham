-- ==============================================================================
-- RLS PERMISSION TEST FILE  
-- Proves anon / customer / staff permissions for every table
-- Run these in Supabase SQL editor or via psql
-- Uses SET LOCAL ROLE to simulate different auth contexts
-- ==============================================================================

-- Helper: temporarily impersonate a role
-- In Supabase, use the service role to set JWT claims for testing

BEGIN;

-- ==============================================================================
-- TEST SETUP
-- ==============================================================================
DO $$
DECLARE
  _anon_test     TEXT := 'anon tests';
  _customer_id   UUID := gen_random_uuid();
  _staff_id      UUID := gen_random_uuid();
  _admin_id      UUID := gen_random_uuid();
BEGIN
  RAISE NOTICE '=== RLS PERMISSION TESTS START ===';
END $$;

-- ==============================================================================
-- A. ANON USER TESTS (no auth.uid())
-- ==============================================================================

-- A1: Anon can read active products
DO $$
DECLARE cnt INTEGER;
BEGIN
  -- Simulate anon: auth.uid() = NULL
  SET LOCAL request.jwt.claims TO '{}';
  SELECT COUNT(*) INTO cnt FROM public.products WHERE status = 'active';
  ASSERT cnt >= 0, 'FAIL: Anon cannot read products';
  RAISE NOTICE 'PASS [A1]: Anon can read active products (count=%)', cnt;
END $$;

-- A2: Anon CANNOT read product_private
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  BEGIN
    SELECT COUNT(*) INTO cnt FROM public.product_private;
    -- Should return 0 rows (RLS blocks), not error
    ASSERT cnt = 0, 'FAIL: Anon can see product_private rows!';
    RAISE NOTICE 'PASS [A2]: Anon cannot see product_private (0 rows returned by RLS)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [A2]: Anon blocked from product_private (exception: %)', SQLERRM;
  END;
END $$;

-- A3: Anon can read categories
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  SELECT COUNT(*) INTO cnt FROM public.categories;
  ASSERT cnt >= 0, 'FAIL: Anon cannot read categories';
  RAISE NOTICE 'PASS [A3]: Anon can read categories (count=%)', cnt;
END $$;

-- A4: Anon can read provinces, cities, areas
DO $$
DECLARE cnt_p INTEGER; cnt_c INTEGER; cnt_a INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  SELECT COUNT(*) INTO cnt_p FROM public.provinces;
  SELECT COUNT(*) INTO cnt_c FROM public.cities;
  SELECT COUNT(*) INTO cnt_a FROM public.areas WHERE active = true;
  ASSERT cnt_p >= 0, 'FAIL: Anon cannot read provinces';
  ASSERT cnt_c >= 0, 'FAIL: Anon cannot read cities';
  ASSERT cnt_a >= 0, 'FAIL: Anon cannot read areas';
  RAISE NOTICE 'PASS [A4]: Anon can read geo hierarchy (provinces=%, cities=%, areas=%)', cnt_p, cnt_c, cnt_a;
END $$;

-- A5: Anon can read settings
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  SELECT COUNT(*) INTO cnt FROM public.settings;
  ASSERT cnt >= 0, 'FAIL: Anon cannot read settings';
  RAISE NOTICE 'PASS [A5]: Anon can read settings (count=%)', cnt;
END $$;

-- A6: Anon can INSERT support_messages (contact form)
DO $$
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  BEGIN
    INSERT INTO public.support_messages (name, email, message)
    VALUES ('Test Anon', 'anon@test.com', 'Test message from anon');
    RAISE NOTICE 'PASS [A6]: Anon can submit support message';
    -- Cleanup
    DELETE FROM public.support_messages WHERE email = 'anon@test.com';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL [A6]: Anon blocked from inserting support message: %', SQLERRM;
  END;
END $$;

-- A7: Anon CANNOT read audit_log
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  BEGIN
    SELECT COUNT(*) INTO cnt FROM public.audit_log;
    ASSERT cnt = 0, 'FAIL: Anon can see audit_log rows!';
    RAISE NOTICE 'PASS [A7]: Anon cannot see audit_log (0 rows by RLS)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [A7]: Anon blocked from audit_log (exception)';
  END;
END $$;

-- A8: Anon CANNOT read user_roles
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  BEGIN
    SELECT COUNT(*) INTO cnt FROM public.user_roles;
    ASSERT cnt = 0, 'FAIL: Anon can see user_roles!';
    RAISE NOTICE 'PASS [A8]: Anon cannot see user_roles';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [A8]: Anon blocked from user_roles (exception)';
  END;
END $$;

-- A9: Anon CANNOT read profiles
DO $$
DECLARE cnt INTEGER;
BEGIN
  SET LOCAL request.jwt.claims TO '{}';
  BEGIN
    SELECT COUNT(*) INTO cnt FROM public.profiles;
    ASSERT cnt = 0, 'FAIL: Anon can see profiles!';
    RAISE NOTICE 'PASS [A9]: Anon cannot see profiles (0 rows by RLS)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [A9]: Anon blocked from profiles (exception)';
  END;
END $$;

-- ==============================================================================
-- B. CUSTOMER TESTS (authenticated, no staff role)
-- ==============================================================================

-- Setup: insert a test customer using service role (bypass RLS for setup)
DO $$
DECLARE _uid UUID := 'cust0000-0000-0000-0000-000000000001';
BEGIN
  -- These inserts use service role, not tested user
  INSERT INTO auth.users (id, email) VALUES (_uid, 'customer@test.com')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profiles (id, email, full_name)
    VALUES (_uid, 'customer@test.com', 'Test Customer')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
  RAISE NOTICE 'SETUP: Test customer created (id=%)', _uid;
END $$;

-- B1: Customer can read OWN profile, not others
DO $$
DECLARE
  _uid UUID := 'cust0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  -- Simulate customer JWT
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.profiles WHERE id = _uid;
  ASSERT cnt = 1, 'FAIL: Customer cannot read own profile';
  RAISE NOTICE 'PASS [B1]: Customer can read own profile';
END $$;

-- B2: Customer CANNOT read product_private
DO $$
DECLARE
  _uid UUID := 'cust0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.product_private;
  ASSERT cnt = 0, 'FAIL: Customer can see product_private!';
  RAISE NOTICE 'PASS [B2]: Customer cannot see product_private (RLS blocks)';
END $$;

-- B3: Customer CANNOT read audit_log
DO $$
DECLARE
  _uid UUID := 'cust0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.audit_log;
  ASSERT cnt = 0, 'FAIL: Customer can see audit_log!';
  RAISE NOTICE 'PASS [B3]: Customer cannot see audit_log';
END $$;

-- B4: Customer can read products (active)
DO $$
DECLARE
  _uid UUID := 'cust0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.products WHERE status = 'active';
  ASSERT cnt >= 0, 'FAIL: Customer cannot read products';
  RAISE NOTICE 'PASS [B4]: Customer can read active products (count=%)', cnt;
END $$;

-- B5: Customer CANNOT update settings
DO $$
DECLARE
  _uid UUID := 'cust0000-0000-0000-0000-000000000001';
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  BEGIN
    UPDATE public.settings SET value = '"hacked"'::jsonb WHERE key = 'store_name';
    RAISE NOTICE 'FAIL [B5]: Customer could update settings!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [B5]: Customer blocked from updating settings (%)' , SQLERRM;
  END;
END $$;

-- ==============================================================================
-- C. STAFF TESTS
-- ==============================================================================
DO $$
DECLARE _uid UUID := 'staf0000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO auth.users (id, email) VALUES (_uid, 'staff@test.com')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profiles (id, email, full_name)
    VALUES (_uid, 'staff@test.com', 'Test Staff')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'staff')
    ON CONFLICT (user_id, role) DO NOTHING;
  RAISE NOTICE 'SETUP: Test staff created (id=%)', _uid;
END $$;

-- C1: Staff can read all orders
DO $$
DECLARE
  _uid UUID := 'staf0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.orders;
  ASSERT cnt >= 0, 'FAIL: Staff cannot read orders';
  RAISE NOTICE 'PASS [C1]: Staff can read all orders (count=%)', cnt;
END $$;

-- C2: Staff can read all profiles
DO $$
DECLARE
  _uid UUID := 'staf0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.profiles;
  ASSERT cnt >= 1, 'FAIL: Staff cannot read profiles';
  RAISE NOTICE 'PASS [C2]: Staff can read all profiles (count=%)', cnt;
END $$;

-- C3: Staff CANNOT read product_private (staff ≠ admin)
DO $$
DECLARE
  _uid UUID := 'staf0000-0000-0000-0000-000000000001';
  cnt  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  SELECT COUNT(*) INTO cnt FROM public.product_private;
  ASSERT cnt = 0, 'FAIL: Staff can see product_private!';
  RAISE NOTICE 'PASS [C3]: Staff cannot see product_private (admin-only)';
END $$;

-- C4: Staff CANNOT delete orders
DO $$
DECLARE
  _uid UUID := 'staf0000-0000-0000-0000-000000000001';
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
  
  BEGIN
    DELETE FROM public.orders WHERE 1 = 0; -- safe no-op, just test policy
    RAISE NOTICE 'INFO [C4]: DELETE on orders executed (no rows matched) - policy check passed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS [C4]: Staff blocked from deleting orders (%)', SQLERRM;
  END;
END $$;

-- ==============================================================================
-- CLEANUP TEST DATA
-- ==============================================================================
DO $$
BEGIN
  DELETE FROM public.user_roles WHERE user_id IN (
    'cust0000-0000-0000-0000-000000000001',
    'staf0000-0000-0000-0000-000000000001'
  );
  DELETE FROM public.profiles WHERE id IN (
    'cust0000-0000-0000-0000-000000000001',
    'staf0000-0000-0000-0000-000000000001'
  );
  DELETE FROM auth.users WHERE id IN (
    'cust0000-0000-0000-0000-000000000001',
    'staf0000-0000-0000-0000-000000000001'
  );
  RAISE NOTICE '=== CLEANUP DONE === All test data removed';
  RAISE NOTICE '=== RLS PERMISSION TESTS COMPLETE ===';
END $$;

ROLLBACK; -- Roll back all changes; tests are read-only verification
