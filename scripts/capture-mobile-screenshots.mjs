import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\PC VISION\\.gemini\\antigravity\\brain\\34239fc5-f21f-4dc0-997a-4397c13f1ae7';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640, deviceScaleFactor: 2 },
  { name: '390x844', width: 390, height: 844, deviceScaleFactor: 3 },
];

async function capture() {
  console.log('🚀 Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Sign in as Super Admin to establish session cookies for admin routes
  console.log('🔑 Authenticating as Super Admin at /login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"], input[name="email"]', 'admin@arhamcollection.pk');
  await page.type('input[type="password"], input[name="password"]', 'SuperAdmin2026!PK#Secure');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
  ]);
  console.log('✓ Authentication step completed.');

  // 2. Add an item to cart so cart and checkout show real data
  console.log('🛒 Adding sample product to cart for realistic preview...');
  await page.goto(`${BASE_URL}/product/noor-e-kashmir-3-piece-luxury-ensemble`, { waitUntil: 'networkidle2' });
  try {
    const addToCartBtn = await page.$('button[type="submit"], button:has-text("Add to Bag"), button:has-text("Add to Cart")');
    if (addToCartBtn) {
      await addToCartBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Notice adding to cart:', e.message);
  }

  // 3. Capture across both mobile viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n📸 Capturing screens for viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    });

    // 1. Home
    console.log(`  - Capturing Home (${vp.name})...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const homeFile = `mobile-home-${vp.name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, homeFile), fullPage: false });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, homeFile), path.join(ARTIFACTS_DIR, homeFile));

    // 2. Product
    console.log(`  - Capturing Product (${vp.name})...`);
    await page.goto(`${BASE_URL}/product/noor-e-kashmir-3-piece-luxury-ensemble`, { waitUntil: 'networkidle2' });
    const productFile = `mobile-product-${vp.name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, productFile), fullPage: false });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, productFile), path.join(ARTIFACTS_DIR, productFile));

    // 3. Cart
    console.log(`  - Capturing Cart (${vp.name})...`);
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle2' });
    const cartFile = `mobile-cart-${vp.name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, cartFile), fullPage: false });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, cartFile), path.join(ARTIFACTS_DIR, cartFile));

    // 4. Checkout Address Picker
    console.log(`  - Capturing Checkout Address Picker (${vp.name})...`);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2' });
    const checkoutFile = `mobile-checkout-address-${vp.name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, checkoutFile), fullPage: false });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, checkoutFile), path.join(ARTIFACTS_DIR, checkoutFile));

    // 5. Admin Orders (Cards view on mobile)
    console.log(`  - Capturing Admin Orders with Mobile Cards (${vp.name})...`);
    await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle2' });
    const adminOrdersFile = `mobile-admin-orders-${vp.name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, adminOrdersFile), fullPage: false });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, adminOrdersFile), path.join(ARTIFACTS_DIR, adminOrdersFile));
  }

  await browser.close();
  console.log('\n🎉 All mobile screenshots successfully captured and copied to artifacts!');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

