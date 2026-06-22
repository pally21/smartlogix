const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const workspaceRoot = path.resolve(__dirname, '..');
const services = [
  { name: 'inventory-service', modelsDir: 'inventory-service/src/models' },
  { name: 'orders-service', modelsDir: 'orders-service/src/models' },
  { name: 'shipping-service', modelsDir: 'shipping-service/src/models' },
];

function readSnippet(filePath, maxLines = 120) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').slice(0, maxLines).join('\n');
  } catch (e) { return ''; }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function build() {
  const parts = [];
  parts.push('<!doctype html><html><head><meta charset="utf-8"><title>Persistencia — SmartLogix</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h1,h2{color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}pre{background:#f5f5f5;padding:10px;overflow:auto}</style></head><body>');
  parts.push('<h1>Documento de Persistencia — SmartLogix</h1>');
  parts.push(`<p>Generado: ${new Date().toISOString()}</p>`);

  parts.push('<h2>Resumen general</h2>');
  parts.push('<ul>');
  parts.push('<li>Motor de base de datos: PostgreSQL</li>');
  parts.push('<li>ORM/mapper: Sequelize (Node.js) — equivalente a JPA en Java</li>');
  parts.push('<li>Patrón: cada microservicio gestiona su propia BD (DB per service)</li>');
  parts.push('<li>Conexión: variables de entorno `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`</li>');
  parts.push('</ul>');

  for (const svc of services) {
    parts.push(`<h2>${svc.name}</h2>`);
    const dir = path.join(workspaceRoot, svc.modelsDir);
    if (!fs.existsSync(dir)) {
      parts.push('<p><em>No se encontraron modelos en este servicio.</em></p>');
      continue;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    parts.push('<h3>Modelos / Entidades</h3>');
    parts.push('<table><thead><tr><th>Modelo</th><th>Tabla</th><th>Campos principales</th></tr></thead><tbody>');
    for (const f of files) {
      const p = path.join(dir, f);
      const snippet = readSnippet(p, 200);
      // Attempt to extract tableName if present
      let table = '—';
      const m = snippet.match(/tableName:\s*['"]([a-zA-Z0-9_]+)['"]/);
      if (m) table = m[1];
      // Extract first fields (heuristic)
      const fields = [];
      const fieldMatches = Array.from(snippet.matchAll(/(\w+):\s*{[\s\S]*?type:\s*DataTypes\.([A-Z0-9_()',]+)/g));
      for (const fm of fieldMatches.slice(0,6)) fields.push(fm[1]);
      parts.push(`<tr><td>${f.replace('.js','')}</td><td>${table}</td><td>${fields.join(', ')}</td></tr>`);
    }
    parts.push('</tbody></table>');

    parts.push('<h3>Fragmentos de código (primeras líneas)</h3>');
    for (const f of files) {
      const p = path.join(dir, f);
      const snippet = readSnippet(p, 200);
      parts.push(`<h4>${f}</h4>`);
      parts.push('<pre>' + escapeHtml(snippet) + '</pre>');
    }

    parts.push('<h3>Relaciones y notas</h3>');
    // Add service-specific notes
    if (svc.name === 'inventory-service') {
      parts.push('<p>Relaciones: <code>Product.hasMany(Stock)</code>, <code>Warehouse.hasMany(Stock)</code>, <code>Stock.belongsTo(Product)</code>.</p>');
      parts.push('<p>Tablas: <code>products</code>, <code>stocks</code>, <code>warehouses</code>.</p>');
    } else if (svc.name === 'orders-service') {
      parts.push('<p>Relaciones: <code>Order.hasMany(OrderItem)</code>, <code>OrderItem.belongsTo(Order)</code>.</p>');
      parts.push('<p>Tablas: <code>orders</code>, <code>order_items</code>.</p>');
    } else if (svc.name === 'shipping-service') {
      parts.push('<p>Modelo principal: <code>Shipment</code> con estados y generación automática de <code>trackingNumber</code>.</p>');
      parts.push('<p>Tabla: <code>shipments</code>.</p>');
    }
  }

  parts.push('<h2>Recomendaciones</h2>');
  parts.push('<ul>');
  parts.push('<li>Agregar migraciones con <code>sequelize-cli</code> y scripts para inicializar esquemas en CI/CD.</li>');
  parts.push('<li>Encriptar/ocultar credenciales en variables de entorno o usar secretos del orquestador.</li>');
  parts.push('<li>Agregar índices en campos de búsqueda (ej. <code>sku</code>, <code>order_number</code>, <code>tracking_number</code>).</li>');
  parts.push('<li>Agregar pruebas de integración que validen el mapeo ORM &gt; tablas.</li>');
  parts.push('</ul>');

  parts.push('<h2>Ubicaciones en el repositorio</h2>');
  parts.push('<ul>');
  parts.push('<li>inventory-service: src/models/</li>');
  parts.push('<li>orders-service: src/models/</li>');
  parts.push('<li>shipping-service: src/models/</li>');
  parts.push('</ul>');

  parts.push('</body></html>');

  const outDir = path.join(workspaceRoot, 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const htmlOut = path.join(outDir, 'persistencia.html');
  fs.writeFileSync(htmlOut, parts.join('\n'), 'utf8');
  console.log('Wrote', htmlOut);

  // render to PDF
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlOut, { waitUntil: 'networkidle0' });
    const pdfOut = path.join(outDir, 'persistencia.pdf');
    await page.pdf({ path: pdfOut, format: 'A4', printBackground: true });
    console.log('Wrote', pdfOut);
    await page.close();
  } finally {
    await browser.close();
  }
}

build().catch(e => { console.error(e); process.exit(1); });
