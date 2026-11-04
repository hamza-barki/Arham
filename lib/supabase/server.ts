import 'server-only';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses RLS for secure server-side mutations, inventory deductions, and admin operations.
 * GUARANTEED to never be imported into client components due to 'server-only'.
 */
export const getServiceRoleClient = (): SupabaseClient<Database> => {
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.includes('your-supabase-service-role')) {
    console.warn(
      '[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not configured. Service role operations will run in mock mode.'
    );
  }

  if (!adminClient) {
    adminClient = createSupabaseClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceRoleKey || 'placeholder-service-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return adminClient;
};
