import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, type Browser, type BrowserContext } from '@playwright/test';

/**
 * Logs an admin account in once and shares the session across specs and
 * workers via a file under test-results/ (gitignored). The API allows five
 * login attempts per minute per IP, so per-test logins make suites flaky.
 * Files hold only cookies for local development accounts and expire after
 * MAX_AGE_MS; the file name is a hash, never the email.
 */

export type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const AUTH_DIR = path.join('test-results', '.auth');
const MAX_AGE_MS = 20 * 60 * 1000;

function sessionFile(email: string): string {
  const id = createHash('sha256').update(`${adminUrl}|${email}`).digest('hex').slice(0, 16);
  return path.join(AUTH_DIR, `${id}.json`);
}

function readFresh(file: string): StorageState | null {
  try {
    if (Date.now() - statSync(file).mtimeMs > MAX_AGE_MS) return null;
    return JSON.parse(readFileSync(file, 'utf8')) as StorageState;
  } catch {
    return null;
  }
}

export async function adminSession(
  browser: Browser,
  email: string,
  password: string,
): Promise<StorageState> {
  const file = sessionFile(email);
  const cached = readFresh(file);
  if (cached) return cached;

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${adminUrl}/login`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

  const state = await context.storageState();
  await context.close();
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(file, JSON.stringify(state));
  return state;
}
