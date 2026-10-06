import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTransactionAtomic,
  deleteTransactionAtomic,
  updateTransactionAtomic,
} from "@/lib/transaction-service";
import { TransactionType, AccountType, WorkspaceType, WorkspaceRole } from "@prisma/client";

describe("Atomic Transaction ACID Integrity", () => {
  let testWorkspaceId: string;
  let bankAccountId: string;
  let cashAccountId: string;

  beforeAll(async () => {
    // Setup isolated test workspace and accounts
    const ws = await prisma.workspace.create({
      data: {
        name: "Test Vitest Workspace",
        type: WorkspaceType.PERSONAL,
      },
    });
    testWorkspaceId = ws.id;

    const bank = await prisma.financialAccount.create({
      data: {
        workspaceId: ws.id,
        name: "Test Bank",
        type: AccountType.BANK,
        openingBalance: BigInt(5000000),
        balance: BigInt(5000000),
      },
    });
    bankAccountId = bank.id;

    const cash = await prisma.financialAccount.create({
      data: {
        workspaceId: ws.id,
        name: "Test Cash",
        type: AccountType.CASH,
        openingBalance: BigInt(1000000),
        balance: BigInt(1000000),
      },
    });
    cashAccountId = cash.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.financialAccount.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    await prisma.$disconnect();
  });

  it("should decrement balance atomically on EXPENSE", async () => {
    const tx = await createTransactionAtomic({
      workspaceId: testWorkspaceId,
      accountId: bankAccountId,
      type: TransactionType.EXPENSE,
      amount: BigInt(200000),
      description: "Beli Alat Tulis",
    });

    const acc = await prisma.financialAccount.findUnique({ where: { id: bankAccountId } });
    expect(acc?.balance).toBe(BigInt(4800000));

    // Rollback by delete
    await deleteTransactionAtomic(tx.id, testWorkspaceId);
    const accRestored = await prisma.financialAccount.findUnique({ where: { id: bankAccountId } });
    expect(accRestored?.balance).toBe(BigInt(5000000));
  });

  it("should execute dual balance mutations atomically on TRANSFER", async () => {
    const tx = await createTransactionAtomic({
      workspaceId: testWorkspaceId,
      accountId: bankAccountId,
      toAccountId: cashAccountId,
      type: TransactionType.TRANSFER,
      amount: BigInt(500000),
      description: "Tarik Tunai Bank ke Kas",
    });

    const bank = await prisma.financialAccount.findUnique({ where: { id: bankAccountId } });
    const cash = await prisma.financialAccount.findUnique({ where: { id: cashAccountId } });

    expect(bank?.balance).toBe(BigInt(4500000));
    expect(cash?.balance).toBe(BigInt(1500000));

    // Rollback by delete
    await deleteTransactionAtomic(tx.id, testWorkspaceId);

    const bankRestored = await prisma.financialAccount.findUnique({ where: { id: bankAccountId } });
    const cashRestored = await prisma.financialAccount.findUnique({ where: { id: cashAccountId } });

    expect(bankRestored?.balance).toBe(BigInt(5000000));
    expect(cashRestored?.balance).toBe(BigInt(1000000));
  });

  it("should reject negative transaction amount", async () => {
    await expect(
      createTransactionAtomic({
        workspaceId: testWorkspaceId,
        accountId: bankAccountId,
        type: TransactionType.EXPENSE,
        amount: BigInt(-100000),
        description: "Invalid Negative",
      })
    ).rejects.toThrow();
  });
});
