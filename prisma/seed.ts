import { PrismaClient, WorkspaceType, WorkspaceRole, AccountType, CategoryType, TransactionType } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting NexaFinance seed...");

  // 1. Clean existing data in order of foreign key dependencies
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.financialAccount.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash password for Better Auth credential login
  const hashedPassword = await hashPassword("password123");

  // 3. Create demo user: Alex Pratama
  const user = await prisma.user.create({
    data: {
      name: "Alex Pratama",
      email: "demo@nexafinance.com",
      emailVerified: true,
      whatsappNumber: "081234567890",
    },
  });

  // 4. Create Better Auth credentials account
  await prisma.account.create({
    data: {
      id: `cred_${user.id}`,
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`👤 User created: ${user.name} (${user.email})`);

  // =========================================================================
  // WORKSPACE 1: Keuangan Pribadi (PERSONAL)
  // =========================================================================
  const personalWs = await prisma.workspace.create({
    data: {
      name: "Keuangan Pribadi",
      type: WorkspaceType.PERSONAL,
      currency: "IDR",
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  // Accounts
  const bca = await prisma.financialAccount.create({
    data: {
      workspaceId: personalWs.id,
      name: "BCA Prioritas",
      type: AccountType.BANK,
      openingBalance: BigInt(0),
      balance: BigInt(36865000), // Saldo real-time setelah seluruh mutasi
      color: "#187aba",
    },
  });

  const cash = await prisma.financialAccount.create({
    data: {
      workspaceId: personalWs.id,
      name: "Dompet Tunai",
      type: AccountType.CASH,
      openingBalance: BigInt(0),
      balance: BigInt(1055000),
      color: "#003061",
    },
  });

  const ewallet = await prisma.financialAccount.create({
    data: {
      workspaceId: personalWs.id,
      name: "GoPay & Dana",
      type: AccountType.EWALLET,
      openingBalance: BigInt(0),
      balance: BigInt(777000),
      color: "#3860be",
    },
  });

  // Categories
  const catFood = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Makanan & Minuman", type: CategoryType.EXPENSE, icon: "utensils", color: "#c62234" },
  });
  const catTransport = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Transportasi", type: CategoryType.EXPENSE, icon: "car", color: "#187aba" },
  });
  const catShopping = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Belanja Bulanan", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#3860be" },
  });
  const catBills = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Tagihan & Utilitas", type: CategoryType.EXPENSE, icon: "zap", color: "#e67e22" },
  });
  const catEntertainment = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Hiburan", type: CategoryType.EXPENSE, icon: "film", color: "#9b59b6" },
  });
  const catHealth = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Kesehatan", type: CategoryType.EXPENSE, icon: "heart-pulse", color: "#2ecc71" },
  });
  const catMiscExpense = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Lain-lain", type: CategoryType.EXPENSE, icon: "tag", color: "#7f8c8d" },
  });

  const catSalary = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Gaji & Upah", type: CategoryType.INCOME, icon: "briefcase", color: "#27ae60" },
  });
  const catBonus = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Bonus & Freelance", type: CategoryType.INCOME, icon: "gift", color: "#2980b9" },
  });
  const catInvestment = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Investasi & Dividen", type: CategoryType.INCOME, icon: "trending-up", color: "#16a085" },
  });
  const catMiscIncome = await prisma.category.create({
    data: { workspaceId: personalWs.id, name: "Pemasukan Lain", type: CategoryType.INCOME, icon: "plus-circle", color: "#7f8c8d" },
  });

  // Budgets (Target bulanan untuk warning WhatsApp)
  await prisma.budget.create({
    data: {
      workspaceId: personalWs.id,
      categoryId: catFood.id,
      amount: BigInt(1500000), // Budget Rp 1.500.000
      period: "2026-10",
    },
  });

  await prisma.budget.create({
    data: {
      workspaceId: personalWs.id,
      categoryId: catShopping.id,
      amount: BigInt(2000000), // Budget Rp 2.000.000
      period: "2026-10",
    },
  });

  // Transactions (Rupiah integer)
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Income
  await prisma.transaction.create({
    data: {
      workspaceId: personalWs.id,
      accountId: bca.id,
      categoryId: catSalary.id,
      userId: user.id,
      type: TransactionType.INCOME,
      amount: BigInt(17500000),
      description: "Gaji Pokok Bulanan",
      notes: "Transfer payroll kantor",
      transactedAt: daysAgo(6),
    },
  });

  await prisma.transaction.create({
    data: {
      workspaceId: personalWs.id,
      accountId: bca.id,
      categoryId: catBonus.id,
      userId: user.id,
      type: TransactionType.INCOME,
      amount: BigInt(4500000),
      description: "Side Project UI/UX Design",
      notes: "Pelunasan landing page",
      transactedAt: daysAgo(4),
    },
  });

  // Transfer BCA -> GoPay
  await prisma.transaction.create({
    data: {
      workspaceId: personalWs.id,
      accountId: bca.id,
      toAccountId: ewallet.id,
      userId: user.id,
      type: TransactionType.TRANSFER,
      amount: BigInt(1000000),
      description: "Top Up GoPay",
      notes: "Untuk transportasi dan jajan",
      transactedAt: daysAgo(8),
    },
  });

  // Expenses
  const personalExpenses = [
    { amount: BigInt(45000), acc: cash.id, cat: catFood.id, desc: "Makan Siang Nasi Padang", days: 1 },
    { amount: BigInt(38000), acc: ewallet.id, cat: catFood.id, desc: "Kopi Kenangan & Snack", days: 2 },
    { amount: BigInt(250000), acc: bca.id, cat: catBills.id, desc: "Token Listrik PLN 200rb", days: 3 },
    { amount: BigInt(450000), acc: bca.id, cat: catBills.id, desc: "Tagihan Internet MyRepublic", days: 5 },
    { amount: BigInt(850000), acc: bca.id, cat: catShopping.id, desc: "Belanja Mingguan Superindo", days: 6 },
    { amount: BigInt(150000), acc: cash.id, cat: catTransport.id, desc: "Bensin Pertamax", days: 8 },
    { amount: BigInt(65000), acc: ewallet.id, cat: catTransport.id, desc: "Grab Car ke Stasiun", days: 9 },
    { amount: BigInt(120000), acc: ewallet.id, cat: catFood.id, desc: "Dinner bareng teman di Resto", days: 11 },
  ];

  for (const exp of personalExpenses) {
    await prisma.transaction.create({
      data: {
        workspaceId: personalWs.id,
        accountId: exp.acc,
        categoryId: exp.cat,
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: exp.amount,
        description: exp.desc,
        transactedAt: daysAgo(exp.days),
      },
    });
  }

  // =========================================================================
  // WORKSPACE 2: Nexa Creative Studio (BUSINESS)
  // =========================================================================
  const businessWs = await prisma.workspace.create({
    data: {
      name: "Nexa Creative Studio",
      type: WorkspaceType.BUSINESS,
      currency: "IDR",
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  const bizBank = await prisma.financialAccount.create({
    data: {
      workspaceId: businessWs.id,
      name: "Mandiri Bisnis",
      type: AccountType.BANK,
      openingBalance: BigInt(0),
      balance: BigInt(43800000),
      color: "#187aba",
    },
  });

  const bizPetty = await prisma.financialAccount.create({
    data: {
      workspaceId: businessWs.id,
      name: "Kas Kecil (Petty Cash)",
      type: AccountType.CASH,
      openingBalance: BigInt(0),
      balance: BigInt(4500000),
      color: "#003061",
    },
  });

  // Business Categories
  const catOffice = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Operasional Kantor", type: CategoryType.EXPENSE, icon: "briefcase", color: "#187aba" },
  });
  const catPayroll = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Gaji Karyawan", type: CategoryType.EXPENSE, icon: "users", color: "#3860be" },
  });
  const catRent = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Sewa & Utilitas", type: CategoryType.EXPENSE, icon: "home", color: "#e67e22" },
  });
  const catAds = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Pemasaran & Iklan", type: CategoryType.EXPENSE, icon: "megaphone", color: "#9b59b6" },
  });
  const catStock = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Stok & Bahan Baku", type: CategoryType.EXPENSE, icon: "package", color: "#c62234" },
  });
  const catLogistics = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Transport & Logistik", type: CategoryType.EXPENSE, icon: "truck", color: "#f39c12" },
  });
  const catBizMisc = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Biaya Lainnya", type: CategoryType.EXPENSE, icon: "tag", color: "#7f8c8d" },
  });

  const catProductSales = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Penjualan Produk", type: CategoryType.INCOME, icon: "shopping-cart", color: "#27ae60" },
  });
  const catServiceIncome = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Pendapatan Jasa", type: CategoryType.INCOME, icon: "file-text", color: "#2980b9" },
  });
  const catBizIncomeMisc = await prisma.category.create({
    data: { workspaceId: businessWs.id, name: "Pendapatan Lain", type: CategoryType.INCOME, icon: "plus-circle", color: "#7f8c8d" },
  });

  // Business Transactions
  await prisma.transaction.create({
    data: {
      workspaceId: businessWs.id,
      accountId: bizBank.id,
      categoryId: catServiceIncome.id,
      userId: user.id,
      type: TransactionType.INCOME,
      amount: BigInt(45000000),
      description: "Pelunasan Project Web Portal Klien PT Mega",
      transactedAt: daysAgo(5),
    },
  });

  await prisma.transaction.create({
    data: {
      workspaceId: businessWs.id,
      accountId: bizBank.id,
      categoryId: catServiceIncome.id,
      userId: user.id,
      type: TransactionType.INCOME,
      amount: BigInt(18500000),
      description: "Monthly Retainer Maintenance IT",
      transactedAt: daysAgo(12),
    },
  });

  await prisma.transaction.create({
    data: {
      workspaceId: businessWs.id,
      accountId: bizBank.id,
      categoryId: catPayroll.id,
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: BigInt(14000000),
      description: "Gaji 2 Frontend Developer",
      transactedAt: daysAgo(3),
    },
  });

  await prisma.transaction.create({
    data: {
      workspaceId: businessWs.id,
      accountId: bizBank.id,
      categoryId: catOffice.id,
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: BigInt(2500000),
      description: "Sewa Dedicated Desk Coworking Space",
      transactedAt: daysAgo(7),
    },
  });

  await prisma.transaction.create({
    data: {
      workspaceId: businessWs.id,
      accountId: bizBank.id,
      categoryId: catAds.id,
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: BigInt(3200000),
      description: "Meta & Google Ads Campaign Q4",
      transactedAt: daysAgo(10),
    },
  });

  console.log("✅ Seed completed successfully! Both Personal and Business workspaces populated with realistic transactions.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
