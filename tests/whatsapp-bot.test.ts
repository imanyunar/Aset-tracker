import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { processInboundWhatsAppMessage } from "@/lib/whatsapp/bot-handler";
import { AccountType, WorkspaceType, WorkspaceRole, CategoryType } from "@prisma/client";

describe("2-Way WhatsApp Interactive Bot", () => {
  let testUserId: string;
  let testWorkspaceId: string;
  let bankAccountId: string;
  let testCategoryId: string;
  const testPhone = "6289998887771";

  beforeAll(async () => {
    // 1. Create test user with WhatsApp number
    const user = await prisma.user.create({
      data: {
        name: "Budi Santoso",
        email: `budi.wa.${Date.now()}@example.com`,
        whatsappNumber: testPhone,
      },
    });
    testUserId = user.id;

    // 2. Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Keuangan Budi",
        type: WorkspaceType.PERSONAL,
      },
    });
    testWorkspaceId = workspace.id;

    // 3. Connect user to workspace
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
    });

    // 4. Create bank account
    const bank = await prisma.financialAccount.create({
      data: {
        workspaceId: workspace.id,
        name: "BCA Utama",
        type: AccountType.BANK,
        openingBalance: BigInt(2000000),
        balance: BigInt(2000000),
      },
    });
    bankAccountId = bank.id;

    // 5. Create category
    const cat = await prisma.category.create({
      data: {
        workspaceId: workspace.id,
        name: "Makanan & Minuman",
        type: CategoryType.EXPENSE,
      },
    });
    testCategoryId = cat.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.transaction.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.financialAccount.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.category.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it("should return USER_NOT_FOUND when message comes from unregistered number", async () => {
    const result = await processInboundWhatsAppMessage({
      sender: "6281111111111",
      message: "halo apa kabar",
    });

    expect(result.actionTaken).toBe("USER_NOT_FOUND");
    expect(result.reply).toContain("belum terdaftar");
  });

  it("should return COMMAND_HELP when user types 'menu' or 'bantuan'", async () => {
    const result = await processInboundWhatsAppMessage({
      sender: testPhone,
      message: "menu",
    });

    expect(result.actionTaken).toBe("COMMAND_HELP");
    expect(result.reply).toContain("NEXAFINANCE ASISTEN WHATSAPP");
    expect(result.reply).toContain("saldo");
    expect(result.reply).toContain("ringkasan");
    expect(result.workspaceName).toBe("Keuangan Budi");
  });

  it("should return CHECK_BALANCE with account breakdown when user types 'saldo'", async () => {
    const result = await processInboundWhatsAppMessage({
      sender: testPhone,
      message: "saldo",
    });

    expect(result.actionTaken).toBe("CHECK_BALANCE");
    expect(result.reply).toContain("SALDO REKENING");
    expect(result.reply).toContain("BCA Utama");
    expect(result.reply).toContain("2.000.000");
  });

  it("should return CHECK_SUMMARY when user types 'ringkasan'", async () => {
    const result = await processInboundWhatsAppMessage({
      sender: testPhone,
      message: "ringkasan",
    });

    expect(result.actionTaken).toBe("CHECK_SUMMARY");
    expect(result.reply).toContain("RINGKASAN ARUS KAS");
    expect(result.reply).toContain("Total Pemasukan");
    expect(result.reply).toContain("Total Pengeluaran");
  });

  it("should parse casual Indonesian text and create transaction atomically via NLP", async () => {
    const result = await processInboundWhatsAppMessage({
      sender: testPhone,
      message: "Makan siang soto ayam 45rb bayar bca",
    });

    expect(result.actionTaken).toBe("TRANSACTION_CREATED");
    expect(result.reply).toContain("TRANSAKSI BERHASIL DICATAT");
    expect(result.reply).toContain("45.000");

    // Verify balance is decremented from 2.000.000 to 1.955.000
    const account = await prisma.financialAccount.findUnique({
      where: { id: bankAccountId },
    });
    expect(account?.balance).toBe(BigInt(1955000));
  });
});
