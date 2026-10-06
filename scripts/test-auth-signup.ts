import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function main() {
  const testEmail = `test_${Date.now()}@nexafinance.com`;
  console.log(`[Test] Registering new user: ${testEmail}`);

  try {
    const res = await auth.api.signUpEmail({
      body: {
        name: "Test Budi Santoso",
        email: testEmail,
        password: "passwordSuper123!",
        whatsappNumber: "081298765432",
      },
    });

    console.log("[Test] Sign up response user:", res?.user?.email, "ID:", res?.user?.id);

    // Verify user in database
    const userInDb = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    console.log("[Test] User in DB:", {
      id: userInDb?.id,
      name: userInDb?.name,
      email: userInDb?.email,
      whatsappNumber: userInDb?.whatsappNumber,
    });

    if (!userInDb) {
      throw new Error("User not found in DB!");
    }

    // Check workspace
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: userInDb.id },
      include: {
        workspace: {
          include: {
            accounts: true,
            categories: true,
          },
        },
      },
    });

    console.log("[Test] Workspaces found for user:", memberships.length);
    for (const m of memberships) {
      console.log(`- Workspace: "${m.workspace.name}" (${m.workspace.type}), Role: ${m.role}`);
      console.log(`  Accounts count: ${m.workspace.accounts.length}`);
      console.log(`  Categories count: ${m.workspace.categories.length}`);
    }

    if (memberships.length === 0) {
      console.warn("WARNING: Workspace was not auto-created by databaseHooks. We need to verify if databaseHooks was triggered!");
    } else {
      console.log("SUCCESS: Workspace, accounts, and categories auto-created successfully!");
    }

    // Clean up test user
    console.log("[Test] Cleaning up test data...");
    for (const m of memberships) {
      await prisma.category.deleteMany({ where: { workspaceId: m.workspaceId } });
      await prisma.financialAccount.deleteMany({ where: { workspaceId: m.workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId: m.workspaceId } });
      await prisma.workspace.delete({ where: { id: m.workspaceId } });
    }
    await prisma.account.deleteMany({ where: { userId: userInDb.id } });
    await prisma.session.deleteMany({ where: { userId: userInDb.id } });
    await prisma.user.delete({ where: { id: userInDb.id } });
    console.log("[Test] Clean up complete.");
  } catch (err) {
    console.error("[Test] Error during sign up test:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
