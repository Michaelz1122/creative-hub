import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium, expect } from "@playwright/test";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = "admin@creativehub.eg";
const LEARNER_EMAIL = "learner@creativehub.eg";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@CreativeHub2026";
const LEARNER_PASSWORD = process.env.SEED_LEARNER_PASSWORD || "Learner@CreativeHub2026";
const PENDING_EMAIL = "pending@creativehub.eg";
const EXPIRED_EMAIL = "expired@creativehub.eg";

const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s2son0AAAAASUVORK5CYII=";

function createReceiptFile(prefix) {
  const dir = mkdtempSync(join(tmpdir(), "creative-hub-"));
  const filePath = join(dir, `${prefix}.png`);
  writeFileSync(filePath, Buffer.from(ONE_PIXEL_PNG, "base64"));

  return {
    filePath,
    cleanup() {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Windows can hold a temporary upload handle briefly; cleanup should not fail the suite.
      }
    },
  };
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect
    .poll(() => {
      const pathname = new URL(page.url()).pathname;
      return pathname === "/login" ? "login" : "authenticated";
    }, { timeout: 15000 })
    .toBe("authenticated");
  await page.waitForLoadState("domcontentloaded");
}

async function expectUrlContains(page, text) {
  await expect(page).toHaveURL(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), {
    timeout: 15000,
  });
}

async function expectSearchParam(page, key, value) {
  await expect
    .poll(() => {
      const url = new URL(page.url());
      return url.searchParams.get(key);
    }, { timeout: 15000 })
    .toBe(value);
}

async function waitForSearchParam(page, key) {
  await page.waitForURL(
    (url) => url.searchParams.has(key),
    { timeout: 20000 },
  );
}

async function submitPayment(page, { email, receiptPrefix, couponCode = "" }) {
  const receipt = createReceiptFile(receiptPrefix);

  try {
    await login(page, email, LEARNER_PASSWORD);
    await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="phoneNumber"]').fill("01012345678");

    if (couponCode) {
      await page.locator('input[name="couponCode"]').fill(couponCode);
    }

    await page.locator('input[name="receipt"]').setInputFiles(receipt.filePath);
    await Promise.all([
      page.waitForURL((url) => url.searchParams.has("success") || url.searchParams.has("error"), {
        timeout: 20000,
      }),
      page.getByRole("button", { name: "Submit payment request" }).click(),
    ]);
    await page.waitForLoadState("domcontentloaded");
  } finally {
    receipt.cleanup();
  }
}

async function approveLatestSubmittedPayment(page, email, action) {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`${BASE_URL}/admin/payments`, { waitUntil: "domcontentloaded" });

  const requestCards = page.locator("article").filter({ hasText: email });
  await expect(requestCards).toHaveCount(1);

  const requestCard = requestCards.first();
  await expect(requestCard).toBeVisible();

  if (action === "approve") {
    await requestCard
      .locator('textarea[name="adminNote"]')
      .first()
      .fill("Approved during auth hardening verification.");
    await requestCard.getByRole("button", { name: "Approve and unlock access" }).click();
  } else {
    await requestCard
      .locator('textarea[name="adminNote"]')
      .nth(1)
      .fill("Rejected during auth hardening verification.");
    await requestCard.getByRole("button", { name: "Reject request" }).click();
  }

  await page.waitForLoadState("domcontentloaded");
}

async function run() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const results = [];

  async function check(name, fn) {
    try {
      await fn();
      results.push({ name, status: "passed" });
    } catch (error) {
      results.push({ name, status: "failed", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  try {
    await check("learner login succeeds", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
      await expectUrlContains(page, "/dashboard");
      await context.close();
    });

    await check("learner cannot access admin users route", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/admin\/users$/);
      await expectUrlContains(page, "/dashboard");
      await context.close();
    });

    await check("expired membership gating hides track and community", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, EXPIRED_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/community`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toHaveCount(0);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Locked track")).toBeVisible();
      await context.close();
    });

    await check("pending user submits payment and duplicate pending is blocked", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await submitPayment(page, { email: PENDING_EMAIL, receiptPrefix: "pending-approval" });
      await expect(page.getByText(/SUBMITTED/).first()).toBeVisible();
      await page.locator('input[name="phoneNumber"]').fill("01012345678");

      const duplicateReceipt = createReceiptFile("pending-duplicate");

      try {
        await page.locator('input[name="receipt"]').setInputFiles(duplicateReceipt.filePath);
        await Promise.all([
          waitForSearchParam(page, "error"),
          page.getByRole("button", { name: "Submit payment request" }).click(),
        ]);
        await page.waitForLoadState("domcontentloaded");
        await expect(page.getByText(/SUBMITTED/).first()).toBeVisible();
      } finally {
        duplicateReceipt.cleanup();
      }

      await context.close();
    });

    await check("expired user submits payment for rejection path", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await submitPayment(page, { email: EXPIRED_EMAIL, receiptPrefix: "expired-reject" });
      await expect(page.getByText(/SUBMITTED/).first()).toBeVisible();
      await context.close();
    });

    await check("admin approves pending user payment over HTTP path", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await approveLatestSubmittedPayment(page, PENDING_EMAIL, "approve");
      await expectSearchParam(page, "success", "approved");
      await context.close();
    });

    await check("admin rejects expired user payment over HTTP path", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await approveLatestSubmittedPayment(page, EXPIRED_EMAIL, "reject");
      await expectSearchParam(page, "success", "rejected");
      await context.close();
    });

    await check("approved payment unlocks track access and community visibility", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, PENDING_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Payment submitted")).toHaveCount(0);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Active learner workspace")).toBeVisible();
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toBeVisible();
      await page.goto(`${BASE_URL}/dashboard/community`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toBeVisible();
      await context.close();
    });

    await check("rejected payment does not unlock access and shows review note", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, EXPIRED_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Rejected during auth hardening verification.").first()).toBeVisible();
      await page.goto(`${BASE_URL}/dashboard/community`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toHaveCount(0);
      await context.close();
    });

    await check("free coupon redemption unlocks expired user safely", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, EXPIRED_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
      await page.locator("#freeCouponCode").fill("FREEGD");
      await Promise.all([
        waitForSearchParam(page, "success"),
        page.getByRole("button", { name: "Redeem free coupon" }).click(),
      ]);
      await page.waitForLoadState("domcontentloaded");
      await expectSearchParam(page, "success", "free-redeemed");
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Active learner workspace")).toBeVisible();
      await context.close();
    });

    await check("task completion updates learner track state", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      const firstMarkComplete = page.getByRole("button", { name: "Mark complete" }).first();
      await expect(firstMarkComplete).toBeVisible();
      await firstMarkComplete.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("Completed").first()).toBeVisible();
      await context.close();
    });

    const feedbackTitle = `Auth hardening feedback ${Date.now()}`;

    await check("learner creates feedback thread", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/feedback`, { waitUntil: "domcontentloaded" });
      await page.locator('input[name="title"]').fill(feedbackTitle);
      await page.locator('input[name="submissionUrl"]').fill("https://example.com/auth-hardening-feedback");
      await page
        .locator('textarea[name="note"]')
        .fill("Please review hierarchy, CTA, and spacing in this verification submission.");
      await Promise.all([
        waitForSearchParam(page, "success"),
        page.getByRole("button", { name: "Submit feedback request" }).click(),
      ]);
      await page.waitForLoadState("domcontentloaded");
      await expectSearchParam(page, "success", "created");
      await expect(page.getByText(feedbackTitle)).toBeVisible();
      await context.close();
    });

    await check("admin replies to feedback and updates status", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto(`${BASE_URL}/admin/feedback`, { waitUntil: "domcontentloaded" });
      const thread = page.locator("article").filter({ hasText: feedbackTitle }).first();
      await expect(thread).toBeVisible();
      await thread.locator('select[name="status"]').selectOption("REVIEWED");
      await thread
        .locator('textarea[name="reply"]')
        .fill("Reviewed during auth hardening verification. CTA is clearer now.");
      await Promise.all([
        waitForSearchParam(page, "success"),
        thread.getByRole("button", { name: "Save reply and status" }).click(),
      ]);
      await page.waitForLoadState("domcontentloaded");
      await expectSearchParam(page, "success", "updated");
      await context.close();
    });

    await check("feedback notification persists for learner", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Reviewed during auth hardening verification. CTA is clearer now.")).toBeVisible();
      await page.goto(`${BASE_URL}/dashboard/feedback`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Reviewed during auth hardening verification. CTA is clearer now.")).toBeVisible();
      await context.close();
    });

    await check("admin user can access permission-sensitive route", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/admin\/users/);
      await expect(page.getByText("Users & Memberships")).toBeVisible();
      await context.close();
    });
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
