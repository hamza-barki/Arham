import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// -----------------------------------------------------------------------------
// Environment Variables
// -----------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Quick check helper
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// -----------------------------------------------------------------------------
// 1. Client-Side Supabase Client (Public / Anonymous / Customer)
// Safe to use in React Client Components, hooks, and browser contexts.
// Uses @supabase/ssr createBrowserClient to automatically synchronize session
// cookies for Next.js Edge Middleware and Server Actions.
// -----------------------------------------------------------------------------
let browserClient: SupabaseClient<Database> | null = null;

export const createClient = (): SupabaseClient<Database> => {
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  const client = createBrowserClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  );

  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
};

// Export singleton instance for direct import
export const supabase = createClient();

export default supabase;
