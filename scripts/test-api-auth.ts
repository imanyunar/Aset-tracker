import { prisma } from "../src/lib/prisma";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[API Test] Testing live Better Auth API at ${BASE_URL}...`);

  // 1. Test Demo Login
  console.log("\n--- 1. Testing Demo Login (Alex Pratama) ---");
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": BASE_URL,
    },
    body: JSON.stringify({
      email: "demo@nexafinance.com",
      password: "password123",
    }),
  });

  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get("set-cookie");
  console.log("Demo Login HTTP Status:", loginRes.status);
  console.log("Demo Login Response:", {
    user: loginData.user?.email,
    name: loginData.user?.name,
    hasToken: !!loginData.token,
    hasCookie: !!cookies,
  });

  if (loginRes.status !== 200 || !loginData.user) {
    throw new Error(`Demo login failed! Status: ${loginRes.status}, Body: ${JSON.stringify(loginData)}`);
  }

  // 2. Test Get Session with Cookie
  console.log("\n--- 2. Testing Get Session with Cookie ---");
  const sessionRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
    headers: {
      Cookie: cookies || "",
      Origin: BASE_URL,
    },
  });
  const sessionData = await sessionRes.json();
  console.log("Get Session HTTP Status:", sessionRes.status);
  console.log("Active Session User:", sessionData?.user?.email, "ID:", sessionData?.user?.id);

  // 3. Test Live Registration via API
  console.log("\n--- 3. Testing User Registration via Live API ---");
  const randomSuffix = Math.floor(Math.random() * 100000);
  const newEmail = `dewi.sari.${randomSuffix}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": BASE_URL,
    },
    body: JSON.stringify({
      name: "Dewi Sari",
      email: newEmail,
      password: "passwordAman123!",
      whatsappNumber: "6281311223344",
    }),
  });

  const regData = await registerRes.json();
  console.log("Register HTTP Status:", registerRes.status);
  console.log("Register Response User:", regData.user?.email, "ID:", regData.user?.id);

  if (registerRes.status !== 200 || !regData.user) {
    throw new Error(`Registration failed! Status: ${registerRes.status}, Body: ${JSON.stringify(regData)}`);
  }

  // 4. Verify in DB for auto-created Workspace
  console.log("\n--- 4. Verifying DB Workspace Initialization for Dewi Sari ---");
  const createdUser = await prisma.user.findUnique({
    where: { email: newEmail },
    include: {
      memberships: {
        include: {
          workspace: {
            include: {
              accounts: true,
              categories: true,
            },
          },
        },
      },
    },
  });

  console.log("Created User from DB:", {
    id: createdUser?.id,
    name: createdUser?.name,
    email: createdUser?.email,
    whatsappNumber: createdUser?.whatsappNumber,
  });

  if (!createdUser || createdUser.memberships.length === 0) {
    throw new Error("Workspace was not created for new registered user!");
  }

  const ws = createdUser.memberships[0].workspace;
  console.log(`Workspace Created: "${ws.name}" (${ws.type})`);
  console.log(`Accounts Count: ${ws.accounts.length}`);
  console.log(`Accounts: ${ws.accounts.map(a => a.name).join(", ")}`);
  console.log(`Categories Count: ${ws.categories.length}`);

  // Cleanup test user
  console.log("\n--- 5. Cleaning up test user ---");
  await prisma.category.deleteMany({ where: { workspaceId: ws.id } });
  await prisma.financialAccount.deleteMany({ where: { workspaceId: ws.id } });
  await prisma.workspaceMember.deleteMany({ where: { workspaceId: ws.id } });
  await prisma.workspace.delete({ where: { id: ws.id } });
  await prisma.account.deleteMany({ where: { userId: createdUser.id } });
  await prisma.session.deleteMany({ where: { userId: createdUser.id } });
  await prisma.user.delete({ where: { id: createdUser.id } });
  console.log("Cleanup complete!");

  console.log("\n>>> ALL AUTH TESTS PASSED PERFECLY! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
