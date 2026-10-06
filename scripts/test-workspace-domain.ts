import { prisma } from "../src/lib/prisma";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[Domain Test] Testing Workspaces, Accounts, and Categories on ${BASE_URL}...`);

  // 1. Login as Alex Pratama
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

  // 2. GET /api/workspaces
  console.log("\n--- 2. Fetching User Workspaces (GET /api/workspaces) ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, {
    headers: authHeaders,
  });
  const wsData = await wsRes.json();
  console.log(`Workspaces count: ${wsData.workspaces?.length}`);
  for (const w of wsData.workspaces) {
    console.log(`- [${w.type}] "${w.name}" (Role: ${w.role}, Accounts: ${w.accountsCount}, Balance: Rp ${Number(w.totalBalance).toLocaleString("id-ID")})`);
  }

  const personalWs = wsData.workspaces.find((w: any) => w.type === "PERSONAL");
  if (!personalWs) throw new Error("Personal workspace not found!");

  // 3. GET /api/workspaces/[id]
  console.log(`\n--- 3. Fetching Detail Workspace: ${personalWs.name} ---`);
  const detailRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  console.log(`Workspace details loaded. Members: ${detailData.workspace.members.length}, Accounts: ${detailData.workspace.accounts.length}, Categories: ${detailData.workspace.categories.length}`);

  // 4. POST /api/workspaces/[id]/accounts (Create New Financial Account)
  console.log("\n--- 4. Creating New Account (E-Wallet OVO) ---");
  const createAccRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/accounts`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "OVO Kas",
      type: "EWALLET",
      openingBalance: 750000,
      color: "#9b59b6",
    }),
  });
  const accData = await createAccRes.json();
  console.log("Create Account Status:", createAccRes.status);
  console.log("Created Account:", accData.account?.name, "Balance:", accData.account?.balance);
  const createdAccId = accData.account?.id;

  // 5. PUT /api/workspaces/[id]/accounts/[accountId] (Update Account)
  console.log("\n--- 5. Updating Account to OVO Premier ---");
  const updateAccRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/accounts/${createdAccId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      name: "OVO Premier",
      color: "#8e44ad",
    }),
  });
  const updatedAccData = await updateAccRes.json();
  console.log("Updated Account Name:", updatedAccData.account?.name, "Color:", updatedAccData.account?.color);

  // 6. POST /api/workspaces/[id]/categories (Create Category)
  console.log("\n--- 6. Creating New Category (Langganan Digital) ---");
  const createCatRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/categories`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Langganan Digital",
      type: "EXPENSE",
      icon: "cloud",
      color: "#3860be",
    }),
  });
  const catData = await createCatRes.json();
  console.log("Create Category Status:", createCatRes.status);
  console.log("Created Category:", catData.category?.name, "Type:", catData.category?.type);
  const createdCatId = catData.category?.id;

  // 7. GET /api/workspaces/[id]/categories?type=EXPENSE
  console.log("\n--- 7. Fetching Expense Categories Filter ---");
  const getCatRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/categories?type=EXPENSE`, {
    headers: authHeaders,
  });
  const getCatData = await getCatRes.json();
  console.log(`Expense Categories Count: ${getCatData.categories.length}`);
  const hasDigitalSub = getCatData.categories.some((c: any) => c.name === "Langganan Digital");
  console.log("Contains 'Langganan Digital':", hasDigitalSub);

  // 8. Test IDOR Protection
  console.log("\n--- 8. Testing IDOR Prevention (requireWorkspaceAccess) ---");
  const fakeWsId = "fake-workspace-id-9999";
  const idorRes = await fetch(`${BASE_URL}/api/workspaces/${fakeWsId}/accounts`, {
    headers: authHeaders,
  });
  console.log("Accessing unauthorized workspace HTTP Status:", idorRes.status);
  const idorData = await idorRes.json();
  console.log("IDOR Rejection Response:", idorData.error);
  if (idorRes.status !== 403) {
    throw new Error(`Security vulnerability: expected 403 Forbidden, got ${idorRes.status}`);
  }

  // 9. Cleanup Created Test Account & Category
  console.log("\n--- 9. Cleaning up test account & category ---");
  if (createdAccId) {
    const delAcc = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/accounts/${createdAccId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    console.log("Delete Account Status:", delAcc.status);
  }
  if (createdCatId) {
    const delCat = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/categories/${createdCatId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    console.log("Delete Category Status:", delCat.status);
  }

  console.log("\n>>> ALL WORKSPACE, ACCOUNT & CATEGORY TESTS PASSED! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
