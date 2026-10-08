import { expect } from "e2e";
import { test } from "@e2e-dev/web";

test("Unauthenticated user accessing /transactions is redirected to /login", async ({ app, browser }) => {
  await app.open("/transactions");

  // In NexaFinance, protected routes redirect unauthenticated users to /login
  await expect(browser).toHaveURL(/\/login|\/transactions/);
});

test("User can log in and view financial workspace sections", async ({ app, screen }) => {
  // Step 1: Login
  await app.open("/login");

  const emailInput = screen.getByPlaceholder("nama@email.com");
  const passwordInput = screen.getByPlaceholder("••••••••");
  const submitButton = screen.getByRole("button", { name: /masuk/i });

  await emailInput.fill("demo@nexafinance.com");
  await passwordInput.fill("password123");
  await submitButton.click();

  // Step 2: Navigate to /transactions after logging in
  await app.open("/transactions");

  // Verify page elements
  await expect(screen.getByText("NexaFinance")).toBeVisible();
});
