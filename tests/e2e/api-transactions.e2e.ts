import { expect } from "e2e";
import { test } from "@e2e-dev/web";

test("POST transactions API endpoint handles unauthenticated requests cleanly", async ({ app }) => {
  const baseUrl = app.baseUrl ?? "https://nexafinance-alpha.vercel.app";
  const targetUrl = `${baseUrl}/api/workspaces/cmuxngw7m0001uwdgs8mbj5iq/transactions`;
  
  // Send POST request with empty payload to test unauthenticated rejection before schema crash
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  // Verify response is cleanly handled (401 Unauthorized without session)
  expect(res.status).toBe(401);
  const data = await res.json();
  expect(data.error).toBeDefined();
  expect(typeof data.error).toBe("string");
  // Ensure it never returns the unhandled Zod internal undefined string crash
  expect(data.error).not.toBe("Invalid input: expected string, received undefined");
});

test("GET transactions API endpoint returns 401 cleanly when not authenticated", async ({ app }) => {
  const baseUrl = app.baseUrl ?? "https://nexafinance-alpha.vercel.app";
  const targetUrl = `${baseUrl}/api/workspaces/cmuxngw7m0001uwdgs8mbj5iq/transactions`;
  
  const res = await fetch(targetUrl, {
    method: "GET",
  });

  expect(res.status).toBe(401);
  const data = await res.json();
  expect(data.error).toBe("Anda harus login untuk mengakses layanan ini.");
});
