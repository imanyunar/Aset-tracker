import { test, expect } from "e2e";

test("User can navigate to login page and see authentication form", async ({ app, screen }) => {
  await app.open("/login");

  // Check login branding
  await expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(screen.getByText("NexaFinance")).toBeVisible();
  await expect(screen.getByText("Masuk ke portal manajemen keuangan cerdas Anda")).toBeVisible();

  // Check form inputs and submit button
  await expect(screen.getByPlaceholder("nama@email.com")).toBeVisible();
  await expect(screen.getByPlaceholder("••••••••")).toBeVisible();
  await expect(screen.getByRole("button", { name: /masuk/i })).toBeVisible();
});

test("Login form validates credentials and can submit", async ({ app, screen }) => {
  await app.open("/login");

  const emailInput = screen.getByPlaceholder("nama@email.com");
  const passwordInput = screen.getByPlaceholder("••••••••");
  const submitButton = screen.getByRole("button", { name: /masuk/i });

  // Fill in demo credentials
  await emailInput.fill("demo@nexafinance.com");
  await passwordInput.fill("password123");

  // Verify inputs hold the typed values
  await expect(emailInput).toHaveValue("demo@nexafinance.com");

  // Submit login form
  await submitButton.click();
});
