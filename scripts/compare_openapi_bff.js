const fs = require('fs');
const path = require('path');

function readOpenApi(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/);
  const paths = [];
  const re = /^\s*(\/[^\s:]+.*):\s*$/; // matches lines starting with /path:
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      // remove trailing ':' and surrounding spaces
      let p = m[1].trim();
      // remove possible trailing colon (already excluded) and normalize multiple segments
      paths.push(p);
    }
  }
  return Array.from(new Set(paths)).sort();
}

function readBffRoutes(indexFile, routesDir) {
  const idx = fs.readFileSync(indexFile, 'utf8');
  const appuseRe = /app\.use\(\s*['"`]([^'"`]*)['"`]\s*,\s*require\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g;
  const matches = Array.from(idx.matchAll(appuseRe));
  const mounts = matches.map(m => ({ prefix: m[1], module: m[2] }));

  // For each mount, try to resolve route file path
  const routeFiles = [];
  for (const mount of mounts) {
    let mod = mount.module;
    // handle relative require like './routes/inventoryBff'
    const resolved = path.resolve(path.dirname(indexFile), mod) + '.js';
    if (fs.existsSync(resolved)) routeFiles.push({ prefix: mount.prefix, file: resolved });
    else {
      // maybe require returns a folder index
      const alt = path.resolve(path.dirname(indexFile), mod, 'index.js');
      if (fs.existsSync(alt)) routeFiles.push({ prefix: mount.prefix, file: alt });
      else {
        // try direct join from routesDir
        const name = path.basename(mod);
        const try1 = path.join(routesDir, name + '.js');
        if (fs.existsSync(try1)) routeFiles.push({ prefix: mount.prefix, file: try1 });
      }
    }
  }

  // fallback: include all files in routesDir
  if (routeFiles.length === 0) {
    const all = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    for (const f of all) routeFiles.push({ prefix: '/', file: path.join(routesDir, f) });
  }

  const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const routes = [];
  for (const rf of routeFiles) {
    const txt = fs.readFileSync(rf.file, 'utf8');
    const ms = Array.from(txt.matchAll(routePattern));
    for (const m of ms) {
      let routePath = m[2];
      // if routePath is '/', treat accordingly
      let full = path.posix.join(rf.prefix === '/' ? '' : rf.prefix, routePath);
      if (!full.startsWith('/')) full = '/' + full;
      full = normalizePath(full);
      routes.push(full);
    }
  }
  return Array.from(new Set(routes)).sort();
}

function normalizePath(p) {
  // convert :param to {param}
  let out = p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  // remove duplicate slashes
  out = out.replace(/\/+/g, '/');
  // remove trailing slash unless root
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const openapi = path.join(repoRoot, 'api', 'openapi.yaml');
  const bffIndex = path.join(repoRoot, 'bff-service', 'src', 'index.js');
  const bffRoutesDir = path.join(repoRoot, 'bff-service', 'src', 'routes');

  if (!fs.existsSync(openapi)) { console.error('openapi.yaml not found at', openapi); process.exit(2); }
  if (!fs.existsSync(bffIndex)) { console.error('bff index not found at', bffIndex); process.exit(2); }

  const openPaths = readOpenApi(openapi).map(normalizePath);
  const bffPaths = readBffRoutes(bffIndex, bffRoutesDir).map(normalizePath);

  const openSet = new Set(openPaths);
  const bffSet = new Set(bffPaths);

  const onlyInOpenapi = openPaths.filter(p => !bffSet.has(p));
  const onlyInBff = bffPaths.filter(p => !openSet.has(p));

  console.log('OpenAPI paths found:', openPaths.length);
  console.log('BFF routes found:', bffPaths.length);
  console.log('---');
  console.log('Paths present in OpenAPI but NOT in BFF:');
  if (onlyInOpenapi.length === 0) console.log('  (none)'); else onlyInOpenapi.forEach(p => console.log('  ' + p));
  console.log('---');
  console.log('Routes present in BFF but NOT in OpenAPI:');
  if (onlyInBff.length === 0) console.log('  (none)'); else onlyInBff.forEach(p => console.log('  ' + p));

  // detailed output in JSON file
  const report = { openPaths, bffPaths, onlyInOpenapi, onlyInBff };
  fs.writeFileSync(path.join(repoRoot, 'reports', 'bff_openapi_comparison.json'), JSON.stringify(report, null, 2));
  console.log('\nReport written to reports/bff_openapi_comparison.json');
}

main();
