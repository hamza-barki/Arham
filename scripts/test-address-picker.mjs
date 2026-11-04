/**
 * Automated Verification Test for Mobile-First Address Picker & Admin Features
 */

import { z } from 'zod';
import { syncOperationalCities } from './sync-postex-cities.mjs';

console.log('================================================================');
console.log('🧪 RUNNING VERIFICATION SUITE: ADDRESS PICKER & LOGISTICS');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// Pakistani phone normalizer logic
function normalizePakistaniPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits;
  if (digits.length === 10 && digits.startsWith('3')) return '0' + digits;
  return null;
}

// Mirror of checkoutSchema for isolated node test
const testCheckoutSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().refine((val) => normalizePakistaniPhone(val) !== null),
  email: z.string().trim().email().optional().or(z.literal('')),
  province: z.string().trim().min(2),
  city: z.string().trim().min(2),
  courierCityCode: z.string().trim().optional().or(z.literal('')),
  areaId: z.string().trim().optional().or(z.literal('')),
  areaName: z.string().trim().min(2),
  isCustomArea: z.boolean().default(false),
  customAreaName: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().min(3).max(250),
  landmark: z.string().trim().max(120).optional().or(z.literal('')),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  paymentMethod: z.enum(['COD', 'BankTransfer', 'Card', 'EasyPaisa', 'JazzCash']),
}).superRefine((data, ctx) => {
  if (data.isCustomArea && (!data.customAreaName || data.customAreaName.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please write the name of your area so our delivery team can find you',
      path: ['customAreaName'],
    });
  }
});

// CSV parser logic
function parseAreaCsv(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], errors: ['CSV content is empty.'] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
  const provinceIdx = headers.findIndex((h) => h === 'province' || h === 'prov');
  const cityIdx = headers.findIndex((h) => h === 'city');
  const areaIdx = headers.findIndex((h) => h === 'area');
  const codeIdx = headers.findIndex((h) => h === 'courier_city_code' || h === 'code');

  if (provinceIdx === -1 || cityIdx === -1 || areaIdx === -1) {
    return { rows: [], errors: ['Invalid CSV headers'] };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
      c.trim().replace(/^["']|["']$/g, '').trim()
    );
    rows.push({
      province: cells[provinceIdx],
      city: cells[cityIdx],
      area: cells[areaIdx],
      courier_city_code: codeIdx !== -1 ? cells[codeIdx] : undefined,
    });
  }
  return { rows, errors: [] };
}

// -----------------------------------------------------------------------------
// 1. Zod Validation Tests: Client & Server
// -----------------------------------------------------------------------------
console.log('\n--- 1. Zod Schema Validation (Order & Address) ---');

// Test 1.1: Valid standard checkout payload
const validStandard = testCheckoutSchema.safeParse({
  customerName: 'Ayesha Khan',
  phone: '03001234567',
  province: 'Punjab',
  city: 'Lahore',
  areaName: 'Gulberg III',
  isCustomArea: false,
  address: 'House 14-B, Street 3',
  landmark: 'Near Jamia Masjid',
  paymentMethod: 'COD',
});
assert(validStandard.success, 'Standard verified area passes Zod validation');

// Test 1.2: Valid "My area is not listed" payload
const validCustom = testCheckoutSchema.safeParse({
  customerName: 'Muhammad Bilal',
  phone: '03214567890',
  province: 'Sindh',
  city: 'Karachi',
  areaName: 'Saadi Garden Block 2',
  isCustomArea: true,
  customAreaName: 'Saadi Garden Block 2',
  address: 'Flat 302, Green Heights',
  paymentMethod: 'COD',
});
assert(validCustom.success, 'Custom unlisted area with customAreaName passes Zod validation');

// Test 1.3: Custom area missing customAreaName should fail
const invalidCustom = testCheckoutSchema.safeParse({
  customerName: 'Muhammad Bilal',
  phone: '03214567890',
  province: 'Sindh',
  city: 'Karachi',
  areaName: 'Custom',
  isCustomArea: true,
  customAreaName: '', // empty!
  address: 'Flat 302',
  paymentMethod: 'COD',
});
assert(!invalidCustom.success, 'Custom area with empty customAreaName fails validation');

// Test 1.4: Invalid phone number
const invalidPhone = testCheckoutSchema.safeParse({
  customerName: 'Test Customer',
  phone: '12345', // invalid
  province: 'Punjab',
  city: 'Lahore',
  areaName: 'Gulberg',
  address: 'House 1',
  paymentMethod: 'COD',
});
assert(!invalidPhone.success, 'Invalid Pakistani phone number rejected');

// Test 1.5: Optional Leaflet Map Pin (lat / lng)
const validWithMapPin = testCheckoutSchema.safeParse({
  customerName: 'Ali Raza',
  phone: '03331122334',
  province: 'Punjab',
  city: 'Lahore',
  areaName: 'Model Town',
  address: 'House 42, Block C',
  lat: 31.4826,
  lng: 74.3219,
  paymentMethod: 'COD',
});
assert(validWithMapPin.success, 'Optional map pin lat/lng coordinates validated and accepted');

// -----------------------------------------------------------------------------
// 2. CSV Importer Parser Tests
// -----------------------------------------------------------------------------
console.log('\n--- 2. CSV Importer Parser ---');

const sampleCsv = `province,city,area,courier_city_code
Punjab,Lahore,DHA Phase 6,LHE
Sindh,Karachi,"Buffer Zone, Sector 15",KHI
Islamabad Capital Territory,Islamabad,Sector B-17 Multi Gardens,ISB`;

const parsed = parseAreaCsv(sampleCsv);
assert(parsed.rows.length === 3, 'CSV parser correctly extracted 3 data rows');
assert(parsed.rows[0].area === 'DHA Phase 6', 'Row 1 area parsed correctly');
assert(parsed.rows[0].courier_city_code === 'LHE', 'Row 1 courier city code parsed correctly');
assert(parsed.rows[1].area === 'Buffer Zone, Sector 15', 'Row 2 quoted comma handled correctly');
assert(parsed.rows[2].province === 'Islamabad Capital Territory', 'Row 3 province parsed correctly');

// -----------------------------------------------------------------------------
// 3. PostEx Reference API Sync Test
// -----------------------------------------------------------------------------
console.log('\n--- 3. PostEx Reference API Sync ---');

try {
  const syncResult = await syncOperationalCities();
  assert(syncResult.success, 'PostEx sync operational cities completed successfully');
} catch (e) {
  assert(false, `PostEx sync failed: ${e.message}`);
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 Test Summary: ${passedTests} / ${totalTests} passed`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
