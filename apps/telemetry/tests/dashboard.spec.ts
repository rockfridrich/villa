import { test, expect } from "@playwright/test";

test.describe("Telemetry Dashboard", () => {
  test("renders main dashboard with header", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=Villa Telemetry")).toBeVisible();
    await expect(page.locator("text=Delivery Pipeline")).toBeVisible();
  });

  test("displays pipeline stages", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.getByRole("link", { name: /Code/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /CI\/CD/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Staging/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Production/ }).first()).toBeVisible();
  });

  test("displays environment cards", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.getByText("Local development server")).toBeVisible();
    await expect(page.getByText("Live production environment")).toBeVisible();
    await expect(page.getByText("Staging environment")).toBeVisible();
    await expect(page.getByText("Auth & passkey service")).toBeVisible();
    await expect(page.getByText("Developer documentation")).toBeVisible();
  });

  test("displays quick actions section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=Quick Actions")).toBeVisible();
    await expect(page.locator("text=Deploy to Staging")).toBeVisible();
    await expect(page.locator("text=Run E2E Tests")).toBeVisible();
    await expect(page.locator("text=Launch Docker")).toBeVisible();
    await expect(page.locator("text=Verify All")).toBeVisible();
  });

  test("displays quick links section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=Quick Links")).toBeVisible();
    await expect(page.locator("text=Repository")).toBeVisible();
    await expect(page.locator("text=Pull Requests")).toBeVisible();
  });

  test("has working GitHub link in header", async ({ page }) => {
    await page.goto("/");
    
    const githubLink = page.locator('a[href="https://github.com/rockfridrich/villa"]').first();
    await expect(githubLink).toBeVisible();
  });

  test("service cards have Open and Railway links", async ({ page }) => {
    await page.goto("/");
    
    const openButtons = page.locator("text=Open");
    await expect(openButtons.first()).toBeVisible();
    
    const railwayButtons = page.locator("text=Railway");
    await expect(railwayButtons.first()).toBeVisible();
  });

  test("displays Recent Activity section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=Recent Activity")).toBeVisible();
  });

  test("displays Traffic section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=Traffic (24h)")).toBeVisible();
  });

  test("displays Database section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.getByRole("heading", { name: "Database" })).toBeVisible();
  });

  test("refresh button is present", async ({ page }) => {
    await page.goto("/");
    
    const refreshButton = page.locator('button[title="Refresh"]');
    await expect(refreshButton).toBeVisible();
  });

  test("services eventually show status", async ({ page }) => {
    await page.goto("/");
    
    await page.waitForTimeout(3000);
    
    const statusIndicators = page.locator(".rounded-full");
    await expect(statusIndicators.first()).toBeVisible();
  });
});
