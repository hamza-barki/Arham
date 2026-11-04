import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

process.env.CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Running mobile Lighthouse audit at 360x640...');

try {
  const cmd = `npx --yes lighthouse http://localhost:3000 ` +
    `--chrome-flags="--headless=new --no-sandbox" ` +
    `--output=json --output-path=./lighthouse-report.json ` +
    `--only-categories=performance,accessibility,best-practices,seo ` +
    `--form-factor=mobile ` +
    `--screenEmulation.width=360 --screenEmulation.height=640 ` +
    `--throttling-method=provided`;

  execSync(cmd, { stdio: 'inherit', env: process.env });

  if (fs.existsSync('./lighthouse-report.json')) {
    const raw = fs.readFileSync('./lighthouse-report.json', 'utf8');
    const report = JSON.parse(raw);
    const categories = report.categories;

    console.log('\n=======================================');
    console.log('🏆 LIGHTHOUSE MOBILE AUDIT RESULTS (360x640)');
    console.log('=======================================');
    console.log(`Performance:    ${Math.round((categories.performance?.score || 0) * 100)} / 100`);
    console.log(`Accessibility:  ${Math.round((categories.accessibility?.score || 0) * 100)} / 100`);
    console.log(`Best Practices: ${Math.round((categories['best-practices']?.score || 0) * 100)} / 100`);
    console.log(`SEO:            ${Math.round((categories.seo?.score || 0) * 100)} / 100`);
    console.log('=======================================\n');
  }
} catch (e) {
  console.error('Lighthouse audit error:', e.message);
}

