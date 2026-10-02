#!/usr/bin/env node
// scripts/agent-verify.mjs
//
// Orquestrador Central de Validação e Auto-Cura do Agente de IA para CeLiLac.
// Executa a pirâmide de testes em camadas e fornece diagnóstico para auto-resolução.
//
// Modos de Uso:
//   node scripts/agent-verify.mjs          # Execução padrão (Backend Typecheck + Jest + Paridade + Smoke)
//   node scripts/agent-verify.mjs --quick  # Validação rápida de backend e regras de negócio
//   node scripts/agent-verify.mjs --smoke  # Apenas Smoke Tests de API HTTP
//   node scripts/agent-verify.mjs --full   # Pipeline completa (Backend + Frontend Next.js build + Jest + Smoke)

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isSmokeOnly = args.includes('--smoke');
const isFull = args.includes('--full');
const isFrontendOnly = args.includes('--frontend');
const isBackendOnly = args.includes('--backend');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function runStep(name, cmd, cmdArgs, cwd) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}▶ Executando: ${colors.bold}${name}${colors.reset} ${colors.gray}(${cmd} ${cmdArgs.join(' ')})${colors.reset}`);
    const start = Date.now();

    const isWindows = process.platform === 'win32';
    const child = isWindows && (cmd === 'npm' || cmd === 'npx')
      ? spawn('cmd.exe', ['/d', '/s', '/c', cmd, ...cmdArgs], {
          cwd,
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' },
        })
      : spawn(cmd, cmdArgs, {
          cwd,
          stdio: 'inherit',
          shell: false,
          env: { ...process.env, FORCE_COLOR: '1' },
        });

    child.on('close', (code) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`${colors.green}✔ ${name} concluído com sucesso em ${duration}s.${colors.reset}`);
        resolve({ name, success: true, duration });
      } else {
        console.error(`${colors.red}✖ ${name} falhou com código de saída ${code} após ${duration}s.${colors.reset}`);
        resolve({ name, success: false, code, duration });
      }
    });

    child.on('error', (err) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.error(`${colors.red}✖ Erro ao iniciar processo [${name}]: ${err.message}${colors.reset}`);
      resolve({ name, success: false, error: err, duration });
    });
  });
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   CeLiLac Autonomous Test & Verification Protocol${colors.reset}`);
  console.log(`${colors.gray}   "Encontrou um problema? Corriga. Achou um bug? Resolva."${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}══════════════════════════════════════════════════════════════${colors.reset}`);

  const results = [];

  // Se for apenas smoke test
  if (isSmokeOnly) {
    const smokeRes = await runStep(
      'API Smoke Tests',
      'node',
      [path.join(ROOT, 'scripts', 'test-api-smoke.mjs')],
      ROOT
    );
    results.push(smokeRes);
  } else {
    // 1. Backend Build / Typecheck (salvo se --frontend for especificado)
    if (!isFrontendOnly) {
      const backendBuildRes = await runStep(
        'Backend TypeScript Compilation (Build Check)',
        'npm',
        ['run', 'build'],
        path.join(ROOT, 'backend')
      );
      results.push(backendBuildRes);

      // 2. Testes Unitários de Domínio Jest
      const backendTestRes = await runStep(
        'Backend Jest Unit Tests',
        'npm',
        ['test'],
        path.join(ROOT, 'backend')
      );
      results.push(backendTestRes);
    }

    // 3. Auditoria de Paridade API-Frontend
    if (!isBackendOnly) {
      const parityRes = await runStep(
        'API-Frontend Route Parity Audit',
        'node',
        [path.join(ROOT, 'scripts', 'audit-api-frontend-parity.mjs')],
        ROOT
      );
      results.push(parityRes);
    }

    // 4. Frontend Web-App Typecheck & Build
    if (!isBackendOnly) {
      const frontendTypecheckRes = await runStep(
        'Frontend Web-App TypeScript (Typecheck)',
        'npm',
        ['run', 'typecheck'],
        path.join(ROOT, 'frontend', 'web-app')
      );
      results.push(frontendTypecheckRes);

      if (isFull || isFrontendOnly) {
        const frontendBuildRes = await runStep(
          'Frontend Web-App Next.js Build',
          'npm',
          ['run', 'build'],
          path.join(ROOT, 'frontend', 'web-app')
        );
        results.push(frontendBuildRes);
      }
    }

    // 5. Smoke Tests de API (sempre no modo padrão e full, a menos que --quick seja usado)
    if (!isQuick && !isFrontendOnly) {
      const smokeRes = await runStep(
        'API HTTP Smoke Tests',
        'node',
        [path.join(ROOT, 'scripts', 'test-api-smoke.mjs'), '--allow-offline'],
        ROOT
      );
      results.push(smokeRes);
    }
  }

  // Resumo
  console.log(`\n${colors.bold}${colors.magenta}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}Resumo da Bateria de Testes Autônoma:${colors.reset}`);
  
  let allPassed = true;
  for (const r of results) {
    if (r.success) {
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${r.name} ${colors.gray}(${r.duration}s)${colors.reset}`);
    } else {
      allPassed = false;
      console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${colors.bold}${r.name}${colors.reset} ${colors.gray}(${r.duration}s)${colors.reset}`);
    }
  }

  if (allPassed) {
    console.log(`\n${colors.green}${colors.bold}✨ SUCESSO TOTAL: Todos os testes passaram sem erros!${colors.reset}`);
    console.log(`${colors.gray}O sistema está validado, integro e pronto para entrega.${colors.reset}\n`);
    process.exitCode = 0;
  } else {
    console.log(`\n${colors.red}${colors.bold}🚨 FALHA IDENTIFICADA: Um ou mais testes reportaram erro.${colors.reset}`);
    console.log(`${colors.yellow}${colors.bold}[PROTOCOLO DE AUTO-CURA]:${colors.reset}`);
    console.log(`  1. Isole o erro e o arquivo afetado nos logs acima.`);
    console.log(`  2. Aplique a correção necessária diretamente no código.`);
    console.log(`  3. Re-execute 'node scripts/agent-verify.mjs' até obter 100% verde.\n`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Erro inesperado no runner de verificação:', err);
  process.exitCode = 1;
});
