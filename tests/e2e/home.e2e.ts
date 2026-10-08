import { test, expect } from "e2e";

test("Landing page loads with NexaFinance institutional branding", async ({ app, screen }) => {
  await app.open("/");

  // Check branding heading
  await expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(screen.getByText("NexaFinance")).toBeVisible();

  // Check CTA buttons
  await expect(screen.getByText("Masuk ke Portal Keuangan")).toBeVisible();
  await expect(screen.getByText("Daftar Akun Baru")).toBeVisible();
});
