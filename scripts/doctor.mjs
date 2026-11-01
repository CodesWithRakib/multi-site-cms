#!/usr/bin/env node
/**
 * Local environment doctor.
 *
 * Fails on prerequisites that prevent development. Port and Docker findings are
 * warnings because a developer may already have the relevant service running.
 */
import { access, readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];

function ok(message) {
  console.log(`[ok]   ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.log(`[warn] ${message}`);
}

function fail(message) {
  failures.push(message);
  console.log(`[fail] ${message}`);
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value.trim());
  return match ? match.slice(1).map(Number) : undefined;
}

function atLeast(actual, minimum) {
  for (let index = 0; index < 3; index += 1) {
    const left = actual[index] ?? 0;
    const right = minimum[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

function commandVersion(command) {
  const result = spawnSync(command, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });

  return result.status === 0 ? result.stdout.trim() : undefined;
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1', exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function main() {
  console.log('Multi-Site CMS environment doctor\n');

  let pkg;
  try {
    pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  } catch {
    fail('package.json is missing or invalid. Run this script from the repository.');
    return;
  }

  const requiredNode = parseVersion(pkg.engines?.node?.replace('>=', '') ?? '24.11.0');
  const currentNode = parseVersion(process.versions.node);

  if (!currentNode || !requiredNode) {
    fail(`Cannot compare Node versions (current: ${process.versions.node}).`);
  } else if (!atLeast(currentNode, requiredNode)) {
    fail(
      `Node ${process.versions.node} is below the required >=${requiredNode.join('.')}. Use .nvmrc (24).`,
    );
  } else {
    ok(`Node ${process.versions.node}`);
  }

  const requiredPnpm = parseVersion(pkg.packageManager?.replace('pnpm@', '') ?? '12.4.2');
  const pnpmVersion = commandVersion('pnpm --version');

  if (!pnpmVersion) {
    fail('pnpm is not available on PATH.');
  } else if (!requiredPnpm || !atLeast(parseVersion(pnpmVersion) ?? [], requiredPnpm)) {
    fail(`pnpm ${pnpmVersion} is below the required >=${requiredPnpm?.join('.')}.`);
  } else {
    ok(`pnpm ${pnpmVersion}`);
  }

  const requiredPaths = [
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'turbo.json',
    'AGENTS.md',
    'README.md',
    'apps/admin/package.json',
    'apps/api/package.json',
    'apps/sites/travel-blog/package.json',
    'apps/sites/air-sports/package.json',
    'packages/ui/package.json',
    'infrastructure/docker/docker-compose.yml',
  ];

  for (const relativePath of requiredPaths) {
    if (await exists(relativePath)) {
      ok(relativePath);
    } else {
      fail(`${relativePath} is missing.`);
    }
  }

  if (await exists('node_modules/.modules.yaml')) {
    ok('dependencies installed');
  } else {
    fail('node_modules is missing. Run: pnpm install');
  }

  if (await exists('apps/api/.env')) {
    ok('apps/api/.env exists');
  } else {
    warn('apps/api/.env is missing. Copy apps/api/.env.example before running the API.');
  }

  if (await exists('apps/admin/.env')) {
    ok('apps/admin/.env exists');
  } else {
    warn('apps/admin/.env is missing. Defaults work locally; copy the example for clarity.');
  }

  const dockerVersion = commandVersion('docker compose version --short');

  if (dockerVersion) {
    ok(`Docker Compose ${dockerVersion}`);
  } else {
    warn('Docker Compose is unavailable. Database commands will not work on this machine.');
  }

  const ports = [
    [5000, 'admin'],
    [5001, 'travel-blog'],
    [5002, 'air-sports'],
    [4000, 'api'],
    [5432, 'postgres'],
  ];

  for (const [port, service] of ports) {
    if (await portIsFree(port)) {
      ok(`port ${port} is free (${service})`);
    } else {
      warn(`port ${port} is already in use (${service}). This is fine if it is already running.`);
    }
  }

  console.log(`\n${warnings.length} warning(s), ${failures.length} failure(s).`);

  if (failures.length > 0) {
    console.log('Resolve the failures above before starting development.');
    process.exitCode = 1;
  } else {
    console.log('Environment is ready.');
  }
}

await main();
