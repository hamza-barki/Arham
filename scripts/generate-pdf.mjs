import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\PC VISION\\.gemini\\antigravity\\brain\\34239fc5-f21f-4dc0-997a-4397c13f1ae7';

async function generatePdf() {
  console.log('📄 Launching Chrome to render AUDIT_REPORT.pdf...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const htmlPath = path.resolve('AUDIT_REPORT.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const rootPdfPath = path.resolve('AUDIT_REPORT.pdf');
  await page.pdf({
    path: rootPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm',
    },
  });

  const artifactPdfPath = path.join(ARTIFACTS_DIR, 'AUDIT_REPORT.pdf');
  fs.copyFileSync(rootPdfPath, artifactPdfPath);

  await browser.close();
  console.log(`✅ PDF generated successfully:`);
  console.log(`   - Root: ${rootPdfPath}`);
  console.log(`   - Artifact: ${artifactPdfPath}`);
}

generatePdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

