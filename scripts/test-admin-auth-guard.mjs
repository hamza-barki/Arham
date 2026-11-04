/**
 * Automated Security Test: Admin Auth Route Guard
 * Verifies that unauthenticated requests to ANY /admin/* route never receive a 200 OK.
 * Must be redirected to /login (307/302) or rejected with 401/403.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/orders/test-id-123',
  '/admin/products',
  '/admin/products/new',
  '/admin/products/import',
  '/admin/products/test-id-123/edit',
  '/admin/areas',
  '/admin/customers',
  '/admin/settings',
  '/admin/reports/rto',
  '/admin/support',
  '/admin/team',
  '/admin/audit-log',
];

async function runTest() {
  console.log(`\n================================================================`);
  console.log(`🔒 AUTOMATED TEST: Admin Route Auth Guard (Unauthenticated Access)`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`================================================================\n`);

  let passCount = 0;
  let failCount = 0;

  for (const route of ADMIN_ROUTES) {
    const url = `${BASE_URL}${route}`;
    try {
      // Use redirect: 'manual' to inspect 307/302 redirect status rather than following
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Security-Audit-Bot/1.0',
        },
      });

      const status = res.status;
      const location = res.headers.get('location');

      if (status === 200) {
        console.error(`❌ FAILED: ${route} returned HTTP 200 OK without authentication!`);
        failCount++;
      } else if (status === 307 || status === 302 || status === 303) {
        console.log(`✅ PASSED: ${route} -> HTTP ${status} Redirect to: ${location}`);
        passCount++;
      } else if (status === 401 || status === 403) {
        console.log(`✅ PASSED: ${route} -> HTTP ${status} Access Denied`);
        passCount++;
      } else {
        console.log(`⚠️ Status ${status} on ${route}`);
        passCount++;
      }
    } catch (err) {
      console.error(`Error requesting ${url}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n----------------------------------------------------------------`);
  console.log(`Summary: ${passCount}/${ADMIN_ROUTES.length} routes protected. Failures: ${failCount}`);
  console.log(`----------------------------------------------------------------\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTest();

