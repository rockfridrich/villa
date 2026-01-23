import { test, expect } from "@playwright/test";

test.describe("Telemetry API Endpoints", () => {
  test("GET /api/health/production returns valid health data", async ({ request }) => {
    const response = await request.get("/api/health/production");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("environment", "production");
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("fetchedAt");
    expect(["ok", "error"]).toContain(data.status);
  });

  test("GET /api/health/construction returns valid health data", async ({ request }) => {
    const response = await request.get("/api/health/construction");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("environment", "construction");
    expect(data).toHaveProperty("status");
  });

  test("GET /api/health/key returns valid health data", async ({ request }) => {
    const response = await request.get("/api/health/key");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("environment", "key");
    expect(data).toHaveProperty("status");
  });

  test("GET /api/pipeline returns pipeline stages", async ({ request }) => {
    const response = await request.get("/api/pipeline");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("stages");
    expect(Array.isArray(data.stages)).toBe(true);
    expect(data.stages.length).toBeGreaterThan(0);
    
    const stage = data.stages[0];
    expect(stage).toHaveProperty("name");
    expect(stage).toHaveProperty("status");
  });

  test("GET /api/github/commits returns recent commits", async ({ request }) => {
    const response = await request.get("/api/github/commits");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("commits");
    expect(Array.isArray(data.commits)).toBe(true);
    
    if (data.commits.length > 0) {
      const commit = data.commits[0];
      expect(commit).toHaveProperty("sha");
      expect(commit).toHaveProperty("shortSha");
      expect(commit).toHaveProperty("message");
      expect(commit).toHaveProperty("author");
    }
  });

  test("GET /api/cloudflare returns traffic data structure", async ({ request }) => {
    const response = await request.get("/api/cloudflare");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("requests");
    expect(data).toHaveProperty("bandwidth");
    expect(data).toHaveProperty("fetchedAt");
  });

  test("GET /api/database returns database status structure", async ({ request }) => {
    const response = await request.get("/api/database");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("provider");
    expect(data).toHaveProperty("backups");
    expect(data).toHaveProperty("fetchedAt");
  });

  test("GET /api/version-status returns version info", async ({ request }) => {
    const response = await request.get("/api/version-status");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("fetchedAt");
  });

  test("GET /api/build-status returns build info", async ({ request }) => {
    const response = await request.get("/api/build-status");
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("fetchedAt");
  });
});
