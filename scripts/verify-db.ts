import { prisma } from "../src/lib/prisma";

async function verify() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, whatsappNumber: true },
  });

  const workspaces = await prisma.workspace.findMany({
    include: {
      _count: {
        select: {
          accounts: true,
          categories: true,
          transactions: true,
          budgets: true,
          members: true,
        },
      },
    },
  });

  const accounts = await prisma.financialAccount.findMany({
    select: {
      id: true,
      workspaceId: true,
      name: true,
      type: true,
      balance: true,
    },
  });

  const transactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { transactedAt: "desc" },
    select: {
      id: true,
      description: true,
      type: true,
      amount: true,
      transactedAt: true,
      account: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  console.log("=== USERS ===");
  console.log(users);

  console.log("\n=== WORKSPACES ===");
  console.log(
    workspaces.map((w) => ({
      name: w.name,
      type: w.type,
      currency: w.currency,
      counts: w._count,
    }))
  );

  console.log("\n=== ACCOUNTS (Integer Rupiah) ===");
  console.log(
    accounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: a.balance.toString(),
    }))
  );

  console.log("\n=== SAMPLE TRANSACTIONS (Integer Rupiah) ===");
  console.log(
    transactions.map((t) => ({
      desc: t.description,
      type: t.type,
      amount: t.amount.toString(),
      account: t.account.name,
      category: t.category?.name,
      date: t.transactedAt.toISOString().split("T")[0],
    }))
  );
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
