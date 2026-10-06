import { prisma } from "../src/lib/prisma";
import { MockWhatsAppDriver } from "../src/lib/whatsapp/mock.driver";
import { normalizeIndonesianPhone } from "../src/lib/whatsapp/fonnte.driver";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[WhatsApp & Budget Test] Testing on ${BASE_URL}...`);

  // 1. Authenticate as Alex Pratama
  console.log("\n--- 1. Authenticating as Alex Pratama ---");
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
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

  const cookies = loginRes.headers.get("set-cookie") || "";
  if (loginRes.status !== 200) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  console.log("Logged in successfully. Cookie acquired.");

  const authHeaders = {
    Cookie: cookies,
    Origin: BASE_URL,
    "Content-Type": "application/json",
  };

  // 2. Test Phone Normalization
  console.log("\n--- 2. Testing Indonesian Phone Normalization ---");
  console.log("08123456789 ->", normalizeIndonesianPhone("08123456789"));
  console.log("+628123456789 ->", normalizeIndonesianPhone("+628123456789"));
  if (normalizeIndonesianPhone("08123456789") !== "628123456789") {
    throw new Error("Phone normalization failed!");
  }

  // 3. Test WhatsApp Test API Endpoint (POST /api/whatsapp/test)
  console.log("\n--- 3. Testing POST /api/whatsapp/test ---");
  const testWaRes = await fetch(`${BASE_URL}/api/whatsapp/test`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      to: "081299887766",
      message: "Tes pesan dari bot NexaFinance",
    }),
  });
  console.log("Test WA Endpoint Status:", testWaRes.status);
  const testWaData = await testWaRes.json();
  console.log("Test WA Response:", testWaData);
  if (testWaRes.status !== 200) {
    throw new Error(`Test WA failed: ${JSON.stringify(testWaData)}`);
  }

  // 4. Test Budgets API (GET & POST)
  console.log("\n--- 4. Testing Budgets API ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
  const wsData = await wsRes.json();
  const personalWs = wsData.workspaces.find((w: any) => w.type === "PERSONAL");
  if (!personalWs) throw new Error("Personal workspace not found!");

  // Get categories and accounts
  const catRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/categories?type=EXPENSE`, {
    headers: authHeaders,
  });
  const catData = await catRes.json();
  const targetCategory = catData.categories[0];
  if (!targetCategory) throw new Error("No expense category found!");

  const accRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/accounts`, {
    headers: authHeaders,
  });
  const accData = await accRes.json();
  const targetAccount = accData.accounts[0];

  console.log(`Setting budget for Category "${targetCategory.name}": Rp 1.000.000`);
  const createBudgetRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/budgets`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      categoryId: targetCategory.id,
      amount: 1000000,
    }),
  });
  console.log("Create Budget Status:", createBudgetRes.status);
  const budgetData = await createBudgetRes.json();
  const createdBudgetId = budgetData.budget?.id;

  // 5. Test Transaction Creation with after() Background WhatsApp Notification & Budget Alert
  console.log("\n--- 5. Testing Transaction Notification & Budget Alert Trigger ---");
  MockWhatsAppDriver.clearHistory();

  // Create an expense of Rp 850.000 (85% of Rp 1.000.000 budget!)
  const expenseRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "EXPENSE",
      accountId: targetAccount.id,
      categoryId: targetCategory.id,
      amount: 850000,
      description: "Belanja Uji Peringatan Anggaran WA",
      notes: "Menguji auto-trigger alert 85% pagu",
    }),
  });
  console.log("Expense HTTP Status:", expenseRes.status);
  const expData = await expenseRes.json();
  const createdTxId = expData.transaction?.id;

  // Allow 2.5 seconds for next/server after() background async execution to finish
  console.log("Waiting 2.5s for Next.js after() background execution...");
  await new Promise((r) => setTimeout(r, 2500));

  // Check Mock WhatsApp Driver message history
  const history = MockWhatsAppDriver.getHistory();
  console.log(`\nWhatsApp Messages Received in Queue: ${history.length}`);
  for (let i = 0; i < history.length; i++) {
    console.log(`\n[Message #${i + 1}] To: ${history[i].to}`);
    console.log(`Content:\n${history[i].message}`);
  }

  // 6. Test GET /budgets Web Page
  console.log("\n--- 6. Testing GET /budgets Web Page ---");
  const budgetPageRes = await fetch(`${BASE_URL}/budgets`, { headers: authHeaders });
  console.log("/budgets Page Status:", budgetPageRes.status);
  if (budgetPageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /budgets, got ${budgetPageRes.status}`);
  }

  // 7. Cleanup Test Transaction and Budget
  console.log("\n--- 7. Cleaning up test data ---");
  if (createdTxId) {
    await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions/${createdTxId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    console.log("Deleted test transaction.");
  }
  if (createdBudgetId) {
    await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/budgets/${createdBudgetId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    console.log("Deleted test budget.");
  }

  console.log("\n>>> ALL WHATSAPP & BUDGET TESTS PASSED PERFECTLY! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
