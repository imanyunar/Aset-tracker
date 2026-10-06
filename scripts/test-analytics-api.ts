import { prisma } from "../src/lib/prisma";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[Analytics Test] Testing Analytics API & Dashboard on ${BASE_URL}...`);

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

  // 2. Fetch User Workspaces
  console.log("\n--- 2. Fetching User Workspaces ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
  const wsData = await wsRes.json();
  const personalWs = wsData.workspaces.find((w: any) => w.type === "PERSONAL");
  const businessWs = wsData.workspaces.find((w: any) => w.type === "BUSINESS");
  if (!personalWs) throw new Error("Personal workspace not found!");

  // 3. Test Analytics for Personal Workspace
  console.log(`\n--- 3. Testing Analytics for "${personalWs.name}" ---`);
  const analyticsRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/analytics`, {
    headers: authHeaders,
  });
  console.log("Analytics HTTP Status:", analyticsRes.status);
  const analyticsData = await analyticsRes.json();

  console.log("KPI Summary:", {
    totalBalance: `Rp ${Number(analyticsData.kpi.totalBalance).toLocaleString("id-ID")}`,
    currentMonthIncome: `Rp ${Number(analyticsData.kpi.currentMonthIncome).toLocaleString("id-ID")}`,
    currentMonthExpense: `Rp ${Number(analyticsData.kpi.currentMonthExpense).toLocaleString("id-ID")}`,
    netCashflow: `Rp ${Number(analyticsData.kpi.netCashflow).toLocaleString("id-ID")}`,
    savingsRate: `${analyticsData.kpi.savingsRate}%`,
    activeAccounts: analyticsData.kpi.activeAccountsCount,
  });

  console.log(`Monthly Trend (6 Months): ${analyticsData.monthlyTrend.length} periods:`);
  for (const m of analyticsData.monthlyTrend) {
    console.log(`- ${m.month}: Income Rp ${Number(m.income).toLocaleString("id-ID")} | Expense Rp ${Number(m.expense).toLocaleString("id-ID")} | Net Rp ${Number(m.net).toLocaleString("id-ID")}`);
  }

  console.log(`Category Breakdown (${analyticsData.categoryBreakdown.length} categories):`);
  for (const cat of analyticsData.categoryBreakdown.slice(0, 4)) {
    console.log(`- ${cat.name}: Rp ${Number(cat.amount).toLocaleString("id-ID")} (${cat.percentage}%)`);
  }

  console.log(`Recent Transactions (${analyticsData.recentTransactions.length}):`);
  for (const tx of analyticsData.recentTransactions) {
    console.log(`- [${tx.type}] ${tx.description} : Rp ${Number(tx.amount).toLocaleString("id-ID")}`);
  }

  // 4. Test Analytics for Business Workspace
  if (businessWs) {
    console.log(`\n--- 4. Testing Analytics for "${businessWs.name}" ---`);
    const bizAnalyticsRes = await fetch(`${BASE_URL}/api/workspaces/${businessWs.id}/analytics`, {
      headers: authHeaders,
    });
    console.log("Business Analytics HTTP Status:", bizAnalyticsRes.status);
    const bizData = await bizAnalyticsRes.json();
    console.log("Business Total Balance:", `Rp ${Number(bizData.kpi.totalBalance).toLocaleString("id-ID")}`);
  }

  // 5. Test Web Page /dashboard
  console.log("\n--- 5. Testing GET /dashboard Page ---");
  const pageRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
  console.log("/dashboard HTTP Status:", pageRes.status);
  if (pageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /dashboard, got ${pageRes.status}`);
  }

  console.log("\n>>> ALL DASHBOARD & ANALYTICS TESTS PASSED! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
