#!/usr/bin/env node
// scripts/audit-api-frontend-parity.mjs
//
// Compara as rotas Express expostas em backend/src/interfaces/http/routes/*.routes.ts
// com as chamadas feitas em frontend/web-app/src/api/*.ts (e qualquer fetch() cru no
// resto do frontend), para achar endpoints que o backend já expõe mas nenhuma tela
// consome ainda. Heurística estática baseada em regex — não é um parser de AST.
//
// Uso:
//   node scripts/audit-api-frontend-parity.mjs
//   node scripts/audit-api-frontend-parity.mjs > /tmp/paridade-$(date +%Y-%m-%d).md
//
// Sem dependências externas (Node puro).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const BACKEND_INDEX = path.join(ROOT, 'backend/src/index.ts');
const ROUTES_DIR = path.join(ROOT, 'backend/src/interfaces/http/routes');
const FRONTEND_SRC = path.join(ROOT, 'frontend/web-app/src');
const API_DIR = path.join(FRONTEND_SRC, 'api');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

function relative(p) {
  return path.relative(ROOT, p);
}

function normalizePath(rawPath) {
  let p = rawPath.split('?')[0];
  p = p.replace(/\$\{[^}]*\}/g, ':param'); // segmentos de template literal (${id})
  p = p.replace(/:[a-zA-Z0-9_]+/g, ':param'); // segmentos dinâmicos do Express (:id)
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

function joinPath(prefix, sub) {
  const right = sub.startsWith('/') ? sub : '/' + sub;
  const joined = prefix === '/' || prefix === '' ? right : prefix.replace(/\/$/, '') + right;
  if (joined.length > 1) return joined.replace(/\/+$/, '');
  return joined;
}

// ---------------------------------------------------------------------------
// 1. Backend: mapear prefixos montados em index.ts (app.use('/prefixo', xRouter))
// ---------------------------------------------------------------------------

function extractMounts(indexSrc) {
  const mounts = new Map(); // nome do router importado -> prefixo montado
  const re = /app\.use\(\s*(['"`])([^'"`]*)\1\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
  let m;
  while ((m = re.exec(indexSrc))) {
    mounts.set(m[3], m[2]);
  }
  return mounts;
}

function extractInlineAppRoutes(indexSrc) {
  // rotas declaradas direto em index.ts, ex: app.get('/health', ...)
  const routes = [];
  const lines = indexSrc.split('\n');
  const re = /\bapp\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]*)\2/;
  for (const line of lines) {
    const m = re.exec(line);
    if (m) {
      routes.push({
        method: m[1].toUpperCase(),
        path: normalizePath(m[3]),
        rawPath: m[3],
        file: relative(BACKEND_INDEX),
        guard: line.includes('optionalAuthMiddleware') ? 'optionalAuthMiddleware' : line.includes('authMiddleware') ? 'authMiddleware' : '—',
      });
    }
  }
  return routes;
}

function getRouterVarName(src) {
  const m = src.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*Router\(\)/);
  return m ? m[1] : 'router';
}

function getExportedName(src, varName) {
  const asExport = src.match(new RegExp(`export\\s*\\{\\s*${varName}\\s+as\\s+([a-zA-Z0-9_]+)\\s*\\}`));
  if (asExport) return asExport[1];
  if (new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*Router\\(\\)`).test(src)) return varName;
  return varName;
}

function extractRoutesFromFile(filePath, mounts) {
  const src = fs.readFileSync(filePath, 'utf8');
  const varName = getRouterVarName(src);
  const exportedName = getExportedName(src, varName);
  const prefix = mounts.get(exportedName);

  if (prefix === undefined) {
    console.error(`[aviso] ${relative(filePath)}: router "${exportedName}" não encontrado em app.use() de index.ts — pulando.`);
    return [];
  }

  const routes = [];
  const lineRe = new RegExp(`\\b${varName}\\.(get|post|put|patch|delete)\\(\\s*(['"\`])([^'"\`]*)\\2`);
  for (const line of src.split('\n')) {
    const m = lineRe.exec(line);
    if (!m) continue;
    const rawPath = m[3];
    const fullPath = joinPath(prefix, rawPath);
    routes.push({
      method: m[1].toUpperCase(),
      path: normalizePath(fullPath),
      rawPath: fullPath,
      file: relative(filePath),
      guard: line.includes('optionalAuthMiddleware') ? 'optionalAuthMiddleware' : line.includes('authMiddleware') ? 'authMiddleware' : '—',
    });
  }
  return routes;
}

function collectBackendRoutes() {
  const indexSrc = fs.readFileSync(BACKEND_INDEX, 'utf8');
  const mounts = extractMounts(indexSrc);
  const routes = [...extractInlineAppRoutes(indexSrc)];

  for (const file of fs.readdirSync(ROUTES_DIR)) {
    if (!file.endsWith('.routes.ts')) continue;
    routes.push(...extractRoutesFromFile(path.join(ROUTES_DIR, file), mounts));
  }
  return routes;
}

// ---------------------------------------------------------------------------
// 2. Frontend: chamadas via apiClient.<metodo>(...) em src/api/*.ts, e qualquer
//    fetch() cru fora de src/api/ (não deveria existir — ver AGENTS/FRONTEND_STRATEGY)
// ---------------------------------------------------------------------------

function extractApiClientCalls() {
  const calls = [];
  const files = walk(API_DIR, ['.ts']).filter((f) => path.basename(f) !== 'client.ts');
  const re = /apiClient\.(get|post|put|patch|delete)(?:<[^>(]*>)?\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(src))) {
      calls.push({
        method: m[1].toUpperCase(),
        path: normalizePath(m[3]),
        rawPath: m[3],
        file: relative(file),
      });
    }
  }
  return calls;
}

function extractRawFetchCalls() {
  // fetch() fora de src/api/ é proibido pela FRONTEND_STRATEGY.md — se aparecer,
  // provavelmente é uma chamada nova que ainda não passou pela camada apiClient.
  const calls = [];
  const files = walk(FRONTEND_SRC, ['.ts', '.tsx']).filter((f) => !f.startsWith(API_DIR + path.sep));
  const re = /\bfetch\(\s*`\$\{[^}]*\}([^`]*)`/g;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(src))) {
      calls.push({
        method: 'GET', // não dá para inferir o método de forma confiável neste padrão; assume GET
        path: normalizePath(m[1]),
        rawPath: m[1],
        file: relative(file),
      });
    }
  }
  return calls;
}

// ---------------------------------------------------------------------------
// 3. Diff + relatório
// ---------------------------------------------------------------------------

function key(route) {
  return `${route.method} ${route.path}`;
}

function groupBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const k = fn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

function main() {
  const backendRoutes = collectBackendRoutes();
  const frontendCalls = [...extractApiClientCalls(), ...extractRawFetchCalls()];

  const frontendKeys = new Set(frontendCalls.map(key));
  const backendKeys = new Set(backendRoutes.map(key));

  const missingInFrontend = backendRoutes.filter((r) => !frontendKeys.has(key(r)));
  const missingInBackend = frontendCalls.filter((c) => !backendKeys.has(key(c)));

  const lines = [];
  lines.push('# Auditoria de Paridade Backend x Frontend');
  lines.push('');
  lines.push(`Gerado em ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Backend: ${backendRoutes.length} rotas encontradas · Frontend: ${frontendCalls.length} chamadas encontradas.`);
  lines.push('');

  lines.push('## Seção 1 — Rotas do backend sem chamada correspondente no frontend');
  lines.push('');
  if (missingInFrontend.length === 0) {
    lines.push('Nenhuma. Todo endpoint do backend tem pelo menos uma chamada correspondente no frontend.');
  } else {
    const byFile = groupBy(missingInFrontend, (r) => r.file);
    for (const [file, routes] of byFile) {
      lines.push(`### ${file}`);
      lines.push('');
      lines.push('| Método | Rota | Auth |');
      lines.push('|:-------|:-----|:-----|');
      for (const r of routes) {
        lines.push(`| ${r.method} | \`${r.rawPath}\` | ${r.guard ?? '—'} |`);
      }
      lines.push('');
    }
  }

  lines.push('## Seção 2 — Chamadas do frontend sem rota correspondente no backend (bônus)');
  lines.push('');
  lines.push('Útil para achar typo de rota ou endpoint renomeado/removido no backend.');
  lines.push('');
  if (missingInBackend.length === 0) {
    lines.push('Nenhuma. Toda chamada do frontend bateu com uma rota do backend.');
  } else {
    const byFile = groupBy(missingInBackend, (c) => c.file);
    for (const [file, calls] of byFile) {
      lines.push(`### ${file}`);
      lines.push('');
      lines.push('| Método | Rota chamada |');
      lines.push('|:-------|:-------------|');
      for (const c of calls) {
        lines.push(`| ${c.method} | \`${c.rawPath}\` |`);
      }
      lines.push('');
    }
  }

  console.log(lines.join('\n'));
}

main();
