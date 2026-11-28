import { test, expect, Page } from '@playwright/test';

/**
 * E2E: full dispute resolution flow
 * create trade -> fund -> open dispute -> mediator login -> resolve
 *
 * Requires a local dev stack seeded with a test wallet that holds cNGN.
 * Seeded credentials are provided via env vars (see .github/workflows/e2e.yml).
 */

const BUYER = {
  email: process.env.E2E_BUYER_EMAIL ?? 'buyer@example.test',
  password: process.env.E2E_BUYER_PASSWORD ?? 'password123',
};

const MEDIATOR = {
  email: process.env.E2E_MEDIATOR_EMAIL ?? 'mediator@example.test',
  password: process.env.E2E_MEDIATOR_PASSWORD ?? 'password123',
};

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function createAndFundTrade(page: Page): Promise<string> {
  await page.goto('/trades/new');

  // Seeded wallet must have cNGN balance for funding to succeed.
  await expect(page.getByTestId('wallet-balance')).toContainText(/cNGN/i);

  await page.getByLabel(/amount/i).fill('1000');
  await page.getByLabel(/asset|currency/i).fill('cNGN');
  await page.getByRole('button', { name: /create trade/i }).click();

  await expect(page).toHaveURL(/\/trades\/[^/]+/);
  const tradeId = page.url().split('/trades/')[1].split(/[/?#]/)[0];
  expect(tradeId).toBeTruthy();

  await page.getByRole('button', { name: /fund trade/i }).click();
  await expect(page.getByTestId('trade-status')).toContainText(/funded/i);

  return tradeId;
}

async function openDispute(page: Page) {
  await page.getByRole('button', { name: /open dispute/i }).click();
  await page.getByLabel(/reason/i).fill('Counterparty did not deliver as agreed');
  await page.getByRole('button', { name: /submit dispute/i }).click();
  await expect(page.getByTestId('trade-status')).toContainText(/disputed/i);
}

test.describe('dispute resolution flow', () => {
  test('buyer opens a dispute and mediator resolves it', async ({ page }) => {
    await login(page, BUYER);
    const tradeId = await createAndFundTrade(page);
    await openDispute(page);

    // Mediator logs in and resolves the dispute.
    await page.getByRole('button', { name: /log ?out|sign ?out/i }).click();
    await login(page, MEDIATOR);

    await page.goto(`/mediator/disputes/${tradeId}`);
    await expect(page.getByTestId('dispute-details')).toBeVisible();

    await page.getByRole('button', { name: /resolve/i }).click();
    await page.getByLabel(/resolution/i).fill('Refund buyer in full');
    await page.getByRole('button', { name: /confirm resolution/i }).click();

    await expect(page.getByTestId('dispute-status')).toContainText(/resolved/i);
  });
});
