const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const services = [
  'inventory-service',
  'orders-service',
  'payment-service',
  'shipping-service',
  'bff-service',
];

async function render() {
  const outDir = path.resolve(__dirname, '..', 'reports', 'coverage');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    for (const svc of services) {
      const indexPath = path.resolve(__dirname, '..', svc, 'coverage', 'lcov-report', 'index.html');
      if (!fs.existsSync(indexPath)) {
        console.warn(`Skipping ${svc}: coverage HTML not found at ${indexPath}`);
        continue;
      }
      const page = await browser.newPage();
      const url = 'file://' + indexPath;
      await page.goto(url, { waitUntil: 'networkidle0' });
      const outFile = path.join(outDir, `${svc}-coverage.pdf`);
      await page.pdf({ path: outFile, format: 'A4', printBackground: true });
      console.log(`Saved ${outFile}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

render().catch(err => { console.error(err); process.exit(1); });
