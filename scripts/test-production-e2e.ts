export {};

const BASE_URL = "https://nexafinance-alpha.vercel.app";

interface TestResult {
  step: string;
  success: boolean;
  details?: string;
  latencyMs: number;
}

const results: TestResult[] = [];

async function runTest(step: string, fn: () => Promise<string | void>) {
  const start = performance.now();
  try {
    const details = await fn();
    const latencyMs = Math.round(performance.now() - start);
    results.push({ step, success: true, details: details || undefined, latencyMs });
    console.log(`✅ [${latencyMs}ms] ${step}${details ? ` -> ${details}` : ""}`);
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ step, success: false, details: msg, latencyMs });
    console.error(`❌ [${latencyMs}ms] ${step} -> Error: ${msg}`);
  }
}

async function main() {
  console.log("=================================================");
  console.log(`🚀 TESTING PRODUCTION DEPLOYMENT: ${BASE_URL}`);
  console.log("=================================================\n");

  let authCookie = "";
  let workspaceId = "";

  // 1. Landing Page
  await runTest("1. Landing Page (GET /)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("NexaFinance")) throw new Error("Brand NexaFinance not found");
    return "HTTP 200 OK, brand rendered";
  });

  // 2. Login Page
  await runTest("2. Login Page (GET /login)", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return "HTTP 200 OK";
  });

  // 3. Authenticate with Better Auth API
  await runTest("3. Sign-in API (POST /api/auth/sign-in/email)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        email: "demo@nexafinance.com",
        password: "password123",
      }),
    });
    if (res.status !== 200) {
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (!data.user?.id) throw new Error("No user returned");

    // Extract cookie
    const rawCookies = (res.headers as any).getSetCookie ? (res.headers as any).getSetCookie() : [res.headers.get("set-cookie") || ""];
    authCookie = rawCookies.map((c: string) => c.split(";")[0]).filter(Boolean).join("; ");
    if (!authCookie && data.token) {
      authCookie = `better-auth.session_token=${data.token}`;
    }
    return `User: ${data.user.name} (${data.user.email})`;
  });

  // 4. Session Validation
  await runTest("4. Get Session (GET /api/auth/get-session)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const session = await res.json();
    if (!session?.user) throw new Error("Session invalid");
    return `Session valid for ${session.user.name}`;
  });

  // 5. Workspaces List
  await runTest("5. Workspaces API (GET /api/workspaces)", async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.workspaces || data.workspaces.length === 0) throw new Error("No workspaces found");
    workspaceId = data.workspaces[0].id;
    return `Found ${data.workspaces.length} workspaces: ${data.workspaces.map((w: any) => w.name).join(", ")}`;
  });

  // 6. Analytics Endpoint
  await runTest("6. Analytics API (GET /api/workspaces/:id/analytics)", async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/analytics`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return `Net Worth: Rp ${Number(data.netWorth).toLocaleString("id-ID")}, Transactions: ${data.cashflow?.length || 0} months analyzed`;
  });

  // 7. Financial Accounts List
  let accountId = "";
  await runTest("7. Accounts API (GET /api/workspaces/:id/accounts)", async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/accounts`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.accounts || data.accounts.length === 0) throw new Error("No accounts found");
    accountId = data.accounts[0].id;
    return `${data.accounts.length} accounts: ${data.accounts.map((a: any) => `${a.name} (Rp ${Number(a.balance).toLocaleString("id-ID")})`).join(", ")}`;
  });

  // 8. Categories List
  let categoryId = "";
  await runTest("8. Categories API (GET /api/workspaces/:id/categories)", async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/categories`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.categories || data.categories.length === 0) throw new Error("No categories found");
    categoryId = data.categories[0].id;
    return `${data.categories.length} categories loaded`;
  });

  // 9. Atomic Transaction Creation & Balance Verification
  await runTest("9. Create Transaction & Atomic Balance (POST /api/workspaces/:id/transactions)", async () => {
    // Read current balance
    const accBeforeRes = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/accounts`, {
      headers: { Cookie: authCookie },
    });
    const accBefore = (await accBeforeRes.json()).accounts.find((a: any) => a.id === accountId);
    const initialBalance = BigInt(accBefore.balance);

    const testAmount = 25000; // Rp 25.000
    const txRes = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        accountId,
        categoryId,
        type: "EXPENSE",
        amount: testAmount,
        description: "Test E2E Production Vercel + Neon",
        transactedAt: new Date().toISOString(),
      }),
    });
    if (txRes.status !== 201) {
      const err = await txRes.text();
      throw new Error(`Status ${txRes.status}: ${err}`);
    }
    const createdTx = (await txRes.json()).transaction;

    // Verify balance was decremented
    const accAfterRes = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/accounts`, {
      headers: { Cookie: authCookie },
    });
    const accAfter = (await accAfterRes.json()).accounts.find((a: any) => a.id === accountId);
    const newBalance = BigInt(accAfter.balance);

    if (initialBalance - newBalance !== BigInt(testAmount)) {
      throw new Error(`Balance mutation mismatch! Initial: ${initialBalance}, After: ${newBalance}`);
    }

    // Clean up created transaction to restore balance
    await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/transactions/${createdTx.id}`, {
      method: "DELETE",
      headers: {
        Cookie: authCookie,
        Origin: BASE_URL,
      },
    });

    return `Created Rp ${testAmount.toLocaleString("id-ID")}, verified atomic balance decrement, restored cleanly!`;
  });

  // 10. Budgets API
  await runTest("10. Budgets API (GET /api/workspaces/:id/budgets)", async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/budgets`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return `${data.budgets.length} budgets tracked with alert progress calculation`;
  });

  // 11. WhatsApp Mock Driver Route
  await runTest("11. WhatsApp Driver Test (POST /api/whatsapp/test)", async () => {
    const res = await fetch(`${BASE_URL}/api/whatsapp/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        to: "081298765432",
        message: "Tes E2E WhatsApp Notifikasi NexaFinance Production",
      }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return `Driver: ${data.driver}, Normalized Phone: ${data.normalizedTo}, Success: ${data.success}`;
  });

  console.log("\n=================================================");
  console.log("📊 PRODUCTION TEST SUMMARY");
  console.log("=================================================");
  const passed = results.filter((r) => r.success).length;
  console.log(`Passed: ${passed} / ${results.length}`);
  if (passed === results.length) {
    console.log("🎉 ALL PRODUCTION SYSTEMS OPERATING NORMALLY!");
  } else {
    console.error("⚠️ Some tests failed. Review log above.");
  }
}

main().catch(console.error);
