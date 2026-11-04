import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Strictly protect every /admin/* and /api/admin/* route server-side
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isApi = pathname.startsWith('/api/');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const isConfigured = Boolean(
      supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id') &&
      !supabaseAnonKey.includes('your-anon-key')
    );

    const isDemoMode = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

    // Fail-closed: In production or when DEMO_MODE != true, missing configuration MUST stop with error
    if (!isConfigured) {
      if (isDemoMode) {
        return response;
      }
      return isApi
        ? NextResponse.json({ error: 'Service Unavailable: System configuration missing in production.' }, { status: 503 })
        : new NextResponse('Service Unavailable: System configuration missing in production.', { status: 503 });
    }

    // Authenticate user via Supabase SSR Cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Unauthenticated -> 401 for API, 307 redirect to /login for page
    if (!user || authError) {
      if (isApi) {
        return NextResponse.json({ error: '401 Unauthorized: Admin session required.' }, { status: 401 });
      }
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl, 307);
    }

    // Enforce role-based access control (RBAC): only staff, manager, admin, super_admin
    if (serviceRoleKey) {
      const adminClient = createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: { getAll: () => [], setAll: () => {} },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: roleRow, error: roleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: false })
        .limit(1)
        .single();

      const userRole = roleRow?.role;
      const allowedRoles = ['staff', 'manager', 'admin', 'super_admin'];

      if (roleError || !userRole || !allowedRoles.includes(userRole)) {
        return isApi
          ? NextResponse.json({ error: '403 Forbidden: Insufficient permissions.' }, { status: 403 })
          : new NextResponse(
              '403 Forbidden: Insufficient permissions to access the Admin Console. Contact a Super Admin.',
              { status: 403 }
            );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
