import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";

const prisma = new PrismaClient();

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const ADMIN_EMAIL = "admin@creativehub.eg";
const EXPIRED_EMAIL = "expired@creativehub.eg";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@CreativeHub2026";
const LEARNER_PASSWORD = process.env.SEED_LEARNER_PASSWORD || "Learner@CreativeHub2026";
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
        // ignore temp cleanup errors on Windows
      }
    },
  };
}

async function waitForEmailLog(template, toEmail, afterDate) {
  return expect
    .poll(
      async () => {
        const log = await prisma.emailDeliveryLog.findFirst({
          where: {
            template,
            toEmail,
            createdAt: {
              gt: afterDate,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return log;
      },
      { timeout: 20000 },
    )
    .not.toBeNull();
}

async function getLatestEmailLog(template, toEmail, afterDate) {
  const log = await prisma.emailDeliveryLog.findFirst({
    where: {
      template,
      toEmail,
      createdAt: {
        gt: afterDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!log) {
    throw new Error(`Missing email log for template ${template} and ${toEmail}`);
  }

  return log;
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
    }, { timeout: 20000 })
    .toBe("authenticated");
}

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const unique = Date.now();
  const signupEmail = `launch.${unique}@example.com`;
  const signupPassword = "LaunchFlow2026A";
  const resetPassword = "LaunchReset2026B";
  const results = [];
  let feedbackTitle = `Launch feedback ${unique}`;

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
    await check("signup creates learner and verification email log", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const startedAt = new Date();

      await page.goto(`${BASE_URL}/signup`, { waitUntil: "domcontentloaded" });
      await page.locator('input[name="name"]').fill("Launch Learner");
      await page.locator('input[name="email"]').fill(signupEmail);
      await page.locator('input[name="password"]').fill(signupPassword);
      await page.getByRole("button", { name: "Create account" }).click();
      await page.waitForURL(/\/signup\?success=verify-email/, { timeout: 20000 });

      await waitForEmailLog("auth-email-verification", signupEmail, startedAt);
      await context.close();
    });

    await check("email verification link activates the new account", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const verificationLog = await getLatestEmailLog("auth-email-verification", signupEmail, new Date(0));
      const verificationUrl = verificationLog.payload?.actionUrl;

      if (typeof verificationUrl !== "string") {
        throw new Error("Verification email log did not include a preview action URL.");
      }

      await page.goto(verificationUrl, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/verify-email/);

      const user = await prisma.user.findUnique({ where: { email: signupEmail } });
      if (!user?.emailVerifiedAt) {
        throw new Error("User email was not marked as verified.");
      }

      await context.close();
    });

    await check("verified learner can log in and is separated from admin routes", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, signupEmail, signupPassword);
      await expect(page).toHaveURL(/\/dashboard/);
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/admin\/users$/);
      await context.close();
    });

    await check("password reset email and reset flow work", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const startedAt = new Date();

      await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: "domcontentloaded" });
      await page.locator('input[name="email"]').fill(signupEmail);
      await page.getByRole("button", { name: "Send reset link" }).click();
      await page.waitForURL(/\/forgot-password\?success=reset-link-sent/, { timeout: 20000 });

      await waitForEmailLog("auth-password-reset", signupEmail, startedAt);
      const resetLog = await getLatestEmailLog("auth-password-reset", signupEmail, startedAt);
      const resetUrl = resetLog.payload?.actionUrl;

      if (typeof resetUrl !== "string") {
        throw new Error("Password reset email log did not include a preview action URL.");
      }

      await page.goto(resetUrl, { waitUntil: "domcontentloaded" });
      await page.locator('input[name="password"]').fill(resetPassword);
      await page.getByRole("button", { name: "Update password" }).click();
      await page.waitForURL(/\/login\?success=password-reset/, { timeout: 20000 });
      await login(page, signupEmail, resetPassword);
      await expect(page).toHaveURL(/\/dashboard/);

      await context.close();
    });

    await check("learner submits payment and admin approves with transactional email", async () => {
      const learnerContext = await browser.newContext();
      const learnerPage = await learnerContext.newPage();
      const receipt = createReceiptFile(`launch-approve-${unique}`);
      const startedAt = new Date();

      try {
        await login(learnerPage, signupEmail, resetPassword);
        await learnerPage.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
        await learnerPage.locator('input[name="phoneNumber"]').fill("01012345678");
        await learnerPage.locator('input[name="receipt"]').setInputFiles(receipt.filePath);
        await Promise.all([
          learnerPage.waitForURL((url) => url.searchParams.has("success"), { timeout: 20000 }),
          learnerPage.getByRole("button", { name: "Submit payment request" }).click(),
        ]);

        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
        await adminPage.goto(`${BASE_URL}/admin/payments`, { waitUntil: "domcontentloaded" });

        const requestCard = adminPage.locator("article").filter({ hasText: signupEmail }).first();
        await expect(requestCard).toBeVisible();
        await requestCard.locator('textarea[name="adminNote"]').first().fill("Approved during launch readiness smoke test.");
        await Promise.all([
          adminPage.waitForURL((url) => url.searchParams.get("success") === "approved", { timeout: 20000 }),
          requestCard.getByRole("button", { name: "Approve and unlock access" }).click(),
        ]);

        await waitForEmailLog("payment-approved", signupEmail, startedAt);
        await adminContext.close();
      } finally {
        receipt.cleanup();
        await learnerContext.close();
      }
    });

    await check("approved learner sees unlocked track and community", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, signupEmail, resetPassword);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Active learner workspace")).toBeVisible();
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toBeVisible();
      await page.goto(`${BASE_URL}/dashboard/community`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "Open WhatsApp community" })).toBeVisible();
      await context.close();
    });

    await check("expired learner rejection flow sends email and keeps access blocked", async () => {
      const learnerContext = await browser.newContext();
      const learnerPage = await learnerContext.newPage();
      const receipt = createReceiptFile(`launch-reject-${unique}`);
      const startedAt = new Date();

      try {
        await login(learnerPage, EXPIRED_EMAIL, LEARNER_PASSWORD);
        await learnerPage.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
        await learnerPage.locator('input[name="phoneNumber"]').fill("01012345678");
        await learnerPage.locator('input[name="receipt"]').setInputFiles(receipt.filePath);
        await Promise.all([
          learnerPage.waitForURL((url) => url.searchParams.has("success"), { timeout: 20000 }),
          learnerPage.getByRole("button", { name: "Submit payment request" }).click(),
        ]);

        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
        await adminPage.goto(`${BASE_URL}/admin/payments`, { waitUntil: "domcontentloaded" });
        const requestCard = adminPage.locator("article").filter({ hasText: EXPIRED_EMAIL }).first();
        await expect(requestCard).toBeVisible();
        await requestCard.locator('textarea[name="adminNote"]').nth(1).fill("Rejected during launch readiness smoke test.");
        await Promise.all([
          adminPage.waitForURL((url) => url.searchParams.get("success") === "rejected", { timeout: 20000 }),
          requestCard.getByRole("button", { name: "Reject request" }).click(),
        ]);
        await waitForEmailLog("payment-rejected", EXPIRED_EMAIL, startedAt);
        await adminContext.close();

        await learnerPage.goto(`${BASE_URL}/dashboard/community`, { waitUntil: "domcontentloaded" });
        await expect(learnerPage.getByRole("link", { name: "Open WhatsApp community" })).toHaveCount(0);
      } finally {
        receipt.cleanup();
        await learnerContext.close();
      }
    });

    await check("free coupon redemption sends email and unlocks access", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const startedAt = new Date();

      await login(page, EXPIRED_EMAIL, LEARNER_PASSWORD);
      await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: "domcontentloaded" });
      await page.locator("#freeCouponCode").fill("FREEGD");
      await Promise.all([
        page.waitForURL((url) => url.searchParams.get("success") === "free-redeemed", { timeout: 20000 }),
        page.getByRole("button", { name: "Redeem free coupon" }).click(),
      ]);
      await waitForEmailLog("free-coupon-redeemed", EXPIRED_EMAIL, startedAt);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Active learner workspace")).toBeVisible();
      await context.close();
    });

    await check("task completion updates learner progress", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, signupEmail, resetPassword);
      await page.goto(`${BASE_URL}/dashboard/tracks/graphic-design`, { waitUntil: "domcontentloaded" });
      const markComplete = page.getByRole("button", { name: "Mark complete" }).first();
      await expect(markComplete).toBeVisible();
      await markComplete.click();
      await expect(page.getByText("Completed").first()).toBeVisible();
      await context.close();
    });

    await check("feedback reply creates notification and transactional email", async () => {
      const learnerContext = await browser.newContext();
      const learnerPage = await learnerContext.newPage();
      const startedAt = new Date();

      await login(learnerPage, signupEmail, resetPassword);
      await learnerPage.goto(`${BASE_URL}/dashboard/feedback`, { waitUntil: "domcontentloaded" });
      await learnerPage.locator('input[name="title"]').fill(feedbackTitle);
      await learnerPage.locator('input[name="submissionUrl"]').fill("https://example.com/launch-feedback");
      await learnerPage.locator('textarea[name="note"]').fill("Please review hierarchy and call-to-action in this launch smoke submission.");
      await Promise.all([
        learnerPage.waitForURL((url) => url.searchParams.get("success") === "created", { timeout: 20000 }),
        learnerPage.getByRole("button", { name: "Submit feedback request" }).click(),
      ]);

      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
      await adminPage.goto(`${BASE_URL}/admin/feedback`, { waitUntil: "domcontentloaded" });
      const thread = adminPage.locator("article").filter({ hasText: feedbackTitle }).first();
      await expect(thread).toBeVisible();
      await thread.locator('select[name="status"]').selectOption("REVIEWED");
      await thread.locator('textarea[name="reply"]').fill("Reviewed during launch readiness smoke test.");
      await Promise.all([
        adminPage.waitForURL((url) => url.searchParams.get("success") === "updated", { timeout: 20000 }),
        thread.getByRole("button", { name: "Save reply and status" }).click(),
      ]);

      await waitForEmailLog("feedback-updated", signupEmail, startedAt);
      await adminContext.close();

      await learnerPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await expect(learnerPage.getByText("Reviewed during launch readiness smoke test.")).toBeVisible();
      await learnerPage.goto(`${BASE_URL}/dashboard/feedback`, { waitUntil: "domcontentloaded" });
      await expect(learnerPage.getByText("Reviewed during launch readiness smoke test.")).toBeVisible();
      await learnerContext.close();
    });

    await check("admin still reaches permission-sensitive route", async () => {
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
    await prisma.$disconnect();
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
