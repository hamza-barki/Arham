import fs from 'fs';

const report = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf8'));

console.log('--- Top Opportunities / Diagnostic Audits ---');
const audits = report.audits;
for (const [key, audit] of Object.entries(audits)) {
  if (audit.score !== null && audit.score < 0.9 && audit.details?.type === 'opportunity') {
    console.log(`- ${audit.title}: ${audit.displayValue || ''} (Score: ${audit.score})`);
  }
}

console.log('\n--- Core Web Vitals (Dev Server) ---');
console.log('FCP:', audits['first-contentful-paint']?.displayValue);
console.log('LCP:', audits['largest-contentful-paint']?.displayValue);
console.log('TBT:', audits['total-blocking-time']?.displayValue);
console.log('CLS:', audits['cumulative-layout-shift']?.displayValue);
console.log('Speed Index:', audits['speed-index']?.displayValue);

