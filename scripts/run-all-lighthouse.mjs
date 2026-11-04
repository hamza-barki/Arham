import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

process.env.CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const outDir = path.join(rootDir, 'lighthouse-reports');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const routes = [
  { name: 'home', path: '/' },
  { name: 'product', path: '/product/noor-e-kashmir-3-piece-luxury-ensemble' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
];

console.log('='.repeat(70));
console.log(' LIGHTHOUSE MOBILE PRODUCTION AUDITS (360x640)');
console.log(' Target: http://localhost:3000');
console.log('='.repeat(70));

const results = [];

for (const route of routes) {
  const url = `http://localhost:3000${route.path}`;
  const jsonPath = path.join(outDir, `${route.name}.json`);
  const htmlPath = path.join(outDir, `${route.name}.html`);

  console.log(`\nAuditing [${route.name.toUpperCase()}]: ${url}...`);

  try {
    const cmd = `npx --yes lighthouse "${url}" ` +
      `--chrome-flags="--headless=new --no-sandbox" ` +
      `--output=json,html --output-path="${path.join(outDir, route.name)}" ` +
      `--only-categories=performance,accessibility,best-practices,seo ` +
      `--form-factor=mobile ` +
      `--screenEmulation.width=360 --screenEmulation.height=640 ` +
      `--throttling-method=provided`;

    execSync(cmd, { stdio: 'pipe', env: process.env });

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const rep = JSON.parse(raw);
    const cat = rep.categories;

    const scores = {
      route: route.name,
      path: route.path,
      performance: Math.round((cat.performance?.score || 0) * 100),
      accessibility: Math.round((cat.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cat['best-practices']?.score || 0) * 100),
      seo: Math.round((cat.seo?.score || 0) * 100),
      fcp: rep.audits['first-contentful-paint']?.displayValue || 'N/A',
      lcp: rep.audits['largest-contentful-paint']?.displayValue || 'N/A',
      cls: rep.audits['cumulative-layout-shift']?.displayValue || 'N/A',
      tbt: rep.audits['total-blocking-time']?.displayValue || 'N/A',
      htmlFile: `${route.name}.report.html`,
    };

    results.push(scores);
    console.log(`  ✓ Performance:    ${scores.performance}`);
    console.log(`  ✓ Accessibility:  ${scores.accessibility}`);
    console.log(`  ✓ Best Practices: ${scores.bestPractices}`);
    console.log(`  ✓ SEO:            ${scores.seo}`);
    console.log(`  ✓ Core Web Vitals: FCP=${scores.fcp}, LCP=${scores.lcp}, CLS=${scores.cls}, TBT=${scores.tbt}`);
  } catch (err) {
    console.error(`  ✗ Error auditing ${route.name}:`, err.message);
  }
}

console.log('\n' + '='.repeat(70));
console.log(' AUDIT SUMMARY TABLE');
console.log('='.repeat(70));
console.log('| Page | Performance | Accessibility | Best Practices | SEO | LCP | FCP | CLS |');
console.log('|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|');
results.forEach((r) => {
  console.log(`| **${r.route}** (\`${r.path}\`) | ${r.performance} | ${r.accessibility} | ${r.bestPractices} | ${r.seo} | ${r.lcp} | ${r.fcp} | ${r.cls} |`);
});

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(`\nSaved HTML and JSON reports to: ${outDir}`);

