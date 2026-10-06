import { prisma } from "../src/lib/prisma";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[Atomic Test] Testing Atomic Transactions on ${BASE_URL}...`);

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

  // 2. Fetch Personal Workspace
  console.log("\n--- 2. Fetching Personal Workspace & Accounts ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
  const wsData = await wsRes.json();
  const personalWs = wsData.workspaces.find((w: any) => w.type === "PERSONAL");
  if (!personalWs) throw new Error("Personal workspace not found!");

  const accRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/accounts`, {
    headers: authHeaders,
  });
  const accData = await accRes.json();
  const accounts = accData.accounts;
  console.log(`Found ${accounts.length} accounts in "${personalWs.name}":`);
  for (const a of accounts) {
    console.log(`- ${a.name} (${a.type}): Rp ${Number(a.balance).toLocaleString("id-ID")}`);
  }

  const bankAcc = accounts.find((a: any) => a.type === "BANK");
  const cashAcc = accounts.find((a: any) => a.type === "CASH");
  if (!bankAcc || !cashAcc) throw new Error("Requires at least 1 BANK and 1 CASH account!");

  const catRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/categories?type=EXPENSE`, {
    headers: authHeaders,
  });
  const catData = await catRes.json();
  const foodCat = catData.categories[0];

  const initialBankBalance = BigInt(bankAcc.balance);
  const initialCashBalance = BigInt(cashAcc.balance);
  console.log(`Initial Bank Balance: Rp ${initialBankBalance.toLocaleString("id-ID")}`);
  console.log(`Initial Cash Balance: Rp ${initialCashBalance.toLocaleString("id-ID")}`);

  // 3. Test CREATE EXPENSE (Rp 150.000)
  console.log("\n--- 3. Testing CREATE EXPENSE (Rp 150.000) ---");
  const expenseRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "EXPENSE",
      accountId: bankAcc.id,
      categoryId: foodCat?.id,
      amount: 150000,
      description: "Makan Siang Tim Uji Atomik",
      notes: "Testing ACID transaction decrement",
    }),
  });
  const expenseData = await expenseRes.json();
  console.log("Create Expense Status:", expenseRes.status);
  const expenseId = expenseData.transaction?.id;
  if (!expenseId) throw new Error("Expense creation failed!");

  // Verify Bank Balance decremented
  const bankAfterExpense = await prisma.financialAccount.findUnique({ where: { id: bankAcc.id } });
  console.log(`Bank Balance After Expense: Rp ${bankAfterExpense?.balance.toLocaleString("id-ID")}`);
  if (bankAfterExpense?.balance !== initialBankBalance - BigInt(150000)) {
    throw new Error("Bank balance was not decremented correctly!");
  }
  console.log("PASS: Expense correctly decremented bank balance.");

  // 4. Test CREATE TRANSFER (Rp 200.000 from Bank to Cash)
  console.log("\n--- 4. Testing CREATE TRANSFER (Rp 200.000 from Bank to Cash) ---");
  const transferRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "TRANSFER",
      accountId: bankAcc.id,
      toAccountId: cashAcc.id,
      amount: 200000,
      description: "Tarik Tunai ATM",
    }),
  });
  const transferData = await transferRes.json();
  console.log("Create Transfer Status:", transferRes.status);
  const transferId = transferData.transaction?.id;
  if (!transferId) throw new Error("Transfer creation failed!");

  const bankAfterTransfer = await prisma.financialAccount.findUnique({ where: { id: bankAcc.id } });
  const cashAfterTransfer = await prisma.financialAccount.findUnique({ where: { id: cashAcc.id } });
  console.log(`Bank Balance After Transfer: Rp ${bankAfterTransfer?.balance.toLocaleString("id-ID")}`);
  console.log(`Cash Balance After Transfer: Rp ${cashAfterTransfer?.balance.toLocaleString("id-ID")}`);

  if (bankAfterTransfer?.balance !== initialBankBalance - BigInt(350000)) {
    throw new Error("Bank balance was not debited correctly for transfer!");
  }
  if (cashAfterTransfer?.balance !== initialCashBalance + BigInt(200000)) {
    throw new Error("Cash balance was not credited correctly for transfer!");
  }
  console.log("PASS: Transfer debited source and credited destination simultaneously.");

  // 5. Test UPDATE TRANSFER (Change amount from Rp 200.000 to Rp 300.000)
  console.log("\n--- 5. Testing UPDATE TRANSFER (Change amount to Rp 300.000) ---");
  const updateTransferRes = await fetch(
    `${BASE_URL}/api/workspaces/${personalWs.id}/transactions/${transferId}`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        amount: 300000,
        description: "Tarik Tunai ATM Revisi Rp 300k",
      }),
    }
  );
  console.log("Update Transfer Status:", updateTransferRes.status);
  const bankAfterUpdate = await prisma.financialAccount.findUnique({ where: { id: bankAcc.id } });
  const cashAfterUpdate = await prisma.financialAccount.findUnique({ where: { id: cashAcc.id } });
  console.log(`Bank Balance After Update: Rp ${bankAfterUpdate?.balance.toLocaleString("id-ID")}`);
  console.log(`Cash Balance After Update: Rp ${cashAfterUpdate?.balance.toLocaleString("id-ID")}`);

  if (bankAfterUpdate?.balance !== initialBankBalance - BigInt(450000)) {
    throw new Error("Bank balance was not updated correctly after transfer change!");
  }
  if (cashAfterUpdate?.balance !== initialCashBalance + BigInt(300000)) {
    throw new Error("Cash balance was not updated correctly after transfer change!");
  }
  console.log("PASS: Transfer update recalculated differences atomically.");

  // 6. Test DELETE TRANSFER (Rollback)
  console.log("\n--- 6. Testing DELETE TRANSFER (Rollback to prior balances) ---");
  const deleteTransferRes = await fetch(
    `${BASE_URL}/api/workspaces/${personalWs.id}/transactions/${transferId}`,
    {
      method: "DELETE",
      headers: authHeaders,
    }
  );
  console.log("Delete Transfer Status:", deleteTransferRes.status);
  const bankAfterDelTransfer = await prisma.financialAccount.findUnique({ where: { id: bankAcc.id } });
  const cashAfterDelTransfer = await prisma.financialAccount.findUnique({ where: { id: cashAcc.id } });

  if (cashAfterDelTransfer?.balance !== initialCashBalance) {
    throw new Error("Cash balance did not restore after transfer deletion!");
  }
  if (bankAfterDelTransfer?.balance !== initialBankBalance - BigInt(150000)) {
    throw new Error("Bank balance did not restore properly after transfer deletion!");
  }
  console.log("PASS: Deleting transfer cleanly rolled back both accounts.");

  // 7. Test DELETE EXPENSE (Rollback)
  console.log("\n--- 7. Testing DELETE EXPENSE (Rollback to initial balances) ---");
  const deleteExpenseRes = await fetch(
    `${BASE_URL}/api/workspaces/${personalWs.id}/transactions/${expenseId}`,
    {
      method: "DELETE",
      headers: authHeaders,
    }
  );
  console.log("Delete Expense Status:", deleteExpenseRes.status);
  const bankFinal = await prisma.financialAccount.findUnique({ where: { id: bankAcc.id } });
  if (bankFinal?.balance !== initialBankBalance) {
    throw new Error("Bank balance did not restore to exact initial balance!");
  }
  console.log(`Final Bank Balance: Rp ${bankFinal?.balance.toLocaleString("id-ID")} (Exact match with initial!)`);
  console.log("PASS: All balances returned to exact starting points. Zero drift!");

  // 8. Test Validation Rejections
  console.log("\n--- 8. Testing Business Rule Rejections ---");
  // Negative amount
  const negRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "EXPENSE",
      accountId: bankAcc.id,
      amount: -50000,
      description: "Invalid Negative",
    }),
  });
  console.log("Negative Amount Rejection Status:", negRes.status);
  if (negRes.status !== 400) throw new Error("Expected 400 for negative amount!");

  // Transfer to same account
  const sameAccRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "TRANSFER",
      accountId: bankAcc.id,
      toAccountId: bankAcc.id,
      amount: 50000,
      description: "Invalid Same Account Transfer",
    }),
  });
  console.log("Same Account Transfer Rejection Status:", sameAccRes.status);
  if (sameAccRes.status !== 400) throw new Error("Expected 400 for same-account transfer!");

  console.log("\n>>> ALL ATOMIC TRANSACTION TESTS PASSED WITH 100% PRECISION! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
