const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const workspaceRoot = path.resolve(__dirname, '..');
const services = [
  'inventory-service',
  'orders-service',
  'payment-service',
  'shipping-service',
  'bff-service',
];

function extractSummary(html) {
  // Extract the 4 strong percentage values near the top (Statements, Branches, Functions, Lines)
  const result = { statements: 'N/A', branches: 'N/A', functions: 'N/A', lines: 'N/A' };
  const re = /<span class="strong">\s*([^<]+)\s*<\/span>\s*\n\s*<span class="quiet">Statements<\/span>/i;
  const m = html.match(re);
  if (m) result.statements = m[1].trim();
  // branches, functions, lines appear subsequently — find all strong/quiet pairs
  const pairs = Array.from(html.matchAll(/<span class="strong">\s*([^<]+)\s*<\/span>\s*\n\s*<span class="quiet">([^<]+)<\/span>/g));
  for (const p of pairs) {
    const val = p[1].trim();
    const label = p[2].trim().toLowerCase();
    if (label.includes('statements')) result.statements = val;
    else if (label.includes('branches')) result.branches = val;
    else if (label.includes('functions')) result.functions = val;
    else if (label.includes('lines')) result.lines = val;
  }
  return result;
}

function readSnippet(filePath, maxLines = 30) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').slice(0, maxLines).join('\n');
  } catch (e) { return ''; }
}

async function buildReport() {
  const rows = [];
  for (const svc of services) {
    const reportIndex = path.join(workspaceRoot, svc, 'coverage', 'lcov-report', 'index.html');
    let summary = { statements: 'N/A', branches: 'N/A', functions: 'N/A', lines: 'N/A' };
    if (fs.existsSync(reportIndex)) {
      const html = fs.readFileSync(reportIndex, 'utf8');
      summary = extractSummary(html);
    }
    const testFileCandidates = [
      path.join(workspaceRoot, svc, 'src', '__tests__'),
      path.join(workspaceRoot, svc, 'src', '__tests__', `${svc.split('-')[0]}.test.js`),
    ];
    let snippet = '';
    // try to read first test file under src/__tests__
    const testsDir = path.join(workspaceRoot, svc, 'src', '__tests__');
    if (fs.existsSync(testsDir)) {
      const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.js'));
      if (files.length) snippet = readSnippet(path.join(testsDir, files[0]));
    }

    rows.push({ svc, summary, snippet });
  }

  const htmlParts = [];
  htmlParts.push(`<!doctype html><html><head><meta charset="utf-8"><title>Informe de Pruebas - SmartLogix</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h1,h2{color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}pre{background:#f5f5f5;padding:10px;overflow:auto}</style></head><body>`);
  htmlParts.push('<h1>Informe de Pruebas y Cobertura — SmartLogix</h1>');
  htmlParts.push(`<p>Generado: ${new Date().toISOString()}</p>`);

  htmlParts.push('<h2>Resumen por servicio</h2>');
  htmlParts.push('<table><thead><tr><th>Servicio</th><th>Statements</th><th>Branches</th><th>Functions</th><th>Lines</th><th>Coverage PDF</th></tr></thead><tbody>');
  for (const r of rows) {
    const pdfPath = path.join('reports', 'coverage', `${r.svc}-coverage.pdf`);
    const absPdf = path.resolve(workspaceRoot, pdfPath);
    htmlParts.push(`<tr><td>${r.svc}</td><td>${r.summary.statements}</td><td>${r.summary.branches}</td><td>${r.summary.functions}</td><td>${r.summary.lines}</td><td><a href="file://${absPdf}">Abrir PDF</a></td></tr>`);
  }
  htmlParts.push('</tbody></table>');

  htmlParts.push('<h2>Ejemplos de pruebas (fragmentos)</h2>');
  for (const r of rows) {
    htmlParts.push(`<h3>${r.svc}</h3>`);
    if (r.snippet) htmlParts.push(`<pre>${escapeHtml(r.snippet)}</pre>`);
    else htmlParts.push('<p><em>No se encontró archivo de pruebas para mostrar.</em></p>');
  }

  htmlParts.push('<h2>Comandos para reproducir pruebas</h2>');
  htmlParts.push('<pre>cd &lt;service-folder&gt;\nnpm install\nnpm test -- --coverage</pre>');

  htmlParts.push('<h2>Archivos generados</h2>');
  htmlParts.push('<ul>');
  htmlParts.push('<li>reports/test-report.html</li>');
  htmlParts.push('<li>reports/test-report.pdf</li>');
  htmlParts.push('<li>reports/coverage/*.pdf (por servicio)</li>');
  htmlParts.push('</ul>');

  htmlParts.push('</body></html>');

  const outDir = path.join(workspaceRoot, 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const htmlOut = path.join(outDir, 'test-report.html');
  fs.writeFileSync(htmlOut, htmlParts.join('\n'), 'utf8');
  console.log('Wrote', htmlOut);

  // render to PDF
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlOut, { waitUntil: 'networkidle0' });
    const pdfOut = path.join(outDir, 'test-report.pdf');
    await page.pdf({ path: pdfOut, format: 'A4', printBackground: true });
    console.log('Wrote', pdfOut);
    await page.close();
  } finally {
    await browser.close();
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

buildReport().catch(e => { console.error(e); process.exit(1); });
