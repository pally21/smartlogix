const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function render(svgPath, outPng, outPdf) {
  const absSvg = path.resolve(svgPath);
  if (!fs.existsSync(absSvg)) {
    console.error('SVG not found:', absSvg);
    process.exit(2);
  }

  const url = 'file://' + absSvg;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read SVG to get width/height if provided
  const svgContent = fs.readFileSync(absSvg, 'utf8');
  let width = 1200, height = 700;
  const w = svgContent.match(/width="(\d+)"/);
  const h = svgContent.match(/height="(\d+)"/);
  if (w) width = parseInt(w[1], 10);
  if (h) height = parseInt(h[1], 10);

  await page.setViewport({ width, height });

  // Wrap SVG in a minimal HTML document and render that (avoids file:// XML issues)
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0">${svgContent}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.screenshot({ path: outPng, fullPage: true });

  await page.pdf({ path: outPdf, printBackground: true, width: `${width}px`, height: `${height}px` });

  await browser.close();
}

async function main() {
  const svg = process.argv[2] || 'api/architecture.svg';
  const png = process.argv[3] || 'api/architecture.png';
  const pdf = process.argv[4] || 'api/architecture.pdf';

  try {
    await render(svg, png, pdf);
    console.log('Wrote', png, pdf);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) main();
