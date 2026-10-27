// Regla del proyecto: ningún archivo fuente pasa de 300 líneas (se cuentan todas).
// ESLint ya lo revisa en los .ts; este script cubre también plantillas, estilos y scripts.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const MAX_LINES = 300;
const ROOTS = ['src', 'scripts', 'docs'];
const EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.html', '.scss', '.css', '.md']);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(entry.name))) yield path;
  }
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, 'utf8')
      .replace(/\r?\n$/, '')
      .split(/\r?\n/).length;
    if (lines > MAX_LINES) offenders.push(`${file}: ${lines} líneas`);
  }
}

if (offenders.length > 0) {
  console.error(`Archivos con más de ${MAX_LINES} líneas:\n  ${offenders.join('\n  ')}`);
  process.exit(1);
}
console.log(`Todos los archivos tienen ${MAX_LINES} líneas o menos.`);
