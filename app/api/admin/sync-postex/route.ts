import { NextResponse } from 'next/server';
import { syncOperationalCities } from '@/scripts/sync-postex-cities.mjs';
import { requireRole } from '@/lib/admin-auth';

export async function POST() {
  try {
    await requireRole('admin');
    const result = await syncOperationalCities();
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.message?.includes('401') ? 401 : err.message?.includes('403') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to sync PostEx operational cities' },
      { status }
    );
  }
}

