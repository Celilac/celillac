#!/usr/bin/env node
// scripts/test-api-smoke.mjs
//
// Smoke test automatizado para validação de endpoints essenciais do CeLiLac Backend.
// Executa requisições HTTP nativas (sem dependências externas) contra a API local ou remota.
//
// Uso:
//   node scripts/test-api-smoke.mjs
//   node scripts/test-api-smoke.mjs --url=http://localhost:3000
//   API_URL=https://api.celilac.com.br node scripts/test-api-smoke.mjs

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const BASE_URL = (urlArg ? urlArg.split('=')[1] : process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CeLiLac-SmokeTest/1.0';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

async function runRequest(name, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  const expectedStatus = options.expectedStatus ?? 200;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = Date.now() - start;
    let data = null;

    try {
      data = await res.json();
    } catch {
      // resposta não-JSON (caso especial)
    }

    const isStatusOk = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    if (isStatusOk) {
      console.log(
        `  ${colors.green}✔${colors.reset} [${res.status}] ${colors.bold}${name}${colors.reset} ${colors.gray}(${path}) - ${duration}ms${colors.reset}`
      );
      return { success: true, status: res.status, data, duration };
    } else {
      console.error(
        `  ${colors.red}✖${colors.reset} [${res.status}] ${colors.bold}${name}${colors.reset} ${colors.gray}(${path}) - Esperado: ${expectedStatus}, Recebido: ${res.status}${colors.reset}`
      );
      if (data) {
        console.error(`    ${colors.gray}Payload de resposta: ${JSON.stringify(data)}${colors.reset}`);
      }
      return { success: false, status: res.status, data, duration };
    }
  } catch (err) {
    const duration = Date.now() - start;
    const isConnRefused = err?.cause?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED');
    
    if (isConnRefused) {
      console.error(
        `  ${colors.red}✖${colors.reset} ${colors.bold}${name}${colors.reset} - Conexão recusada em ${url}. O servidor backend está rodando?`
      );
    } else if (err.name === 'AbortError') {
      console.error(
        `  ${colors.red}✖${colors.reset} ${colors.bold}${name}${colors.reset} - Timeout após ${options.timeoutMs ?? 5000}ms em ${url}`
      );
    } else {
      console.error(
        `  ${colors.red}✖${colors.reset} ${colors.bold}${name}${colors.reset} - Falha na requisição: ${err.message}`
      );
    }
    return { success: false, error: err, duration };
  }
}

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}=== CeLiLac API Smoke Test Runner ===${colors.reset}`);
  console.log(`${colors.gray}Alvo: ${BASE_URL}${colors.reset}\n`);

  const isCI = Boolean(process.env.CI || process.env.CONTINUOUS_INTEGRATION || process.env.GITHUB_ACTIONS);
  const allowOffline = !isCI && args.includes('--allow-offline');
  const results = [];

  // 1. Healthcheck
  const healthRes = await runRequest('Healthcheck & Conexão DB', '/health', {
    expectedStatus: [200, 503], // 503 se o DB estiver iniciando
  });

  const isOffline = !healthRes.success && (
    healthRes.error?.cause?.code === 'ECONNREFUSED' ||
    healthRes.error?.message?.includes('ECONNREFUSED') ||
    healthRes.error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
  );

  if (isOffline) {
    if (allowOffline) {
      console.log(`\n${colors.yellow}${colors.bold}⚠ [AVISO] Servidor backend offline em ${BASE_URL}.${colors.reset}`);
      console.log(`${colors.gray}Smoke tests HTTP foram pulados pois a flag '--allow-offline' foi informada.${colors.reset}`);
      console.log(`${colors.gray}Para validar endpoints ao vivo, execute 'npm run dev' em backend/ e repita a verificação.${colors.reset}\n`);
      process.exitCode = 0;
      return;
    } else {
      if (isCI) {
        console.error(`\n${colors.red}${colors.bold}🚨 [CI STRICT FAIL]: A API está inacessível em ${BASE_URL}.${colors.reset}`);
        console.error(`${colors.red}Em pipelines de CI, a tolerância offline é expressamente proibida.${colors.reset}\n`);
      } else {
        console.error(`\n${colors.red}${colors.bold}✖ [ERRO]: Backend offline em ${BASE_URL}.${colors.reset}`);
        console.error(`${colors.gray}Inicie o servidor com 'npm run dev' em backend/ ou passe '--allow-offline' para checagem puramente estática local.${colors.reset}\n`);
      }
      process.exitCode = 1;
      return;
    }
  }

  results.push(healthRes);

  if (healthRes.success && healthRes.data?.database === 'DISCONNECTED') {
    console.log(`    ${colors.yellow}⚠ Alerta: Backend ativo, mas banco reportou DISCONNECTED.${colors.reset}`);
  }

  // 2. Catálogo de Produtos (público)
  results.push(await runRequest('Catálogo de Produtos (Listagem pública)', '/catalog/products'));

  // 3. Categorias de Produtos (público)
  results.push(await runRequest('Categorias de Produtos', '/catalog/categories'));

  // 4. Parceiros / Locais públicos
  results.push(await runRequest('Listagem de Parceiros Públicos', '/partners'));

  // 5. Teste de Resiliência 404 (Rota Inexistente deve responder JSON 404 sem derrubar o Express)
  results.push(
    await runRequest('Tratamento de Rota Inexistente', '/probe-404-check-route-smoke', {
      expectedStatus: 404,
    })
  );

  // Consolidação
  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = total - passed;

  console.log(`\n${colors.bold}Resultado dos Smoke Tests:${colors.reset}`);
  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}✔ Todos os ${passed}/${total} endpoints responderam com sucesso!${colors.reset}\n`);
    process.exitCode = 0;
  } else {
    console.error(`${colors.red}${colors.bold}✖ ${failed}/${total} testes falharam.${colors.reset}\n`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Erro fatal durante execução do smoke test:', err);
  process.exitCode = 1;
});
