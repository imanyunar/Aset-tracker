import { prisma } from "@/lib/prisma";
import { TransactionType, Prisma } from "@prisma/client";

export interface CreateTransactionInput {
  workspaceId: string;
  userId?: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amount: bigint;
  description: string;
  notes?: string | null;
  transactedAt?: Date;
}

export interface UpdateTransactionInput {
  transactionId: string;
  workspaceId: string;
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  type?: TransactionType;
  amount?: bigint;
  description?: string;
  notes?: string | null;
  transactedAt?: Date;
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Creates a transaction and updates account balance(s) atomically.
 */
export async function createTransactionAtomic(input: CreateTransactionInput) {
  const {
    workspaceId,
    userId,
    accountId,
    toAccountId,
    categoryId,
    type,
    amount,
    description,
    notes,
    transactedAt = new Date(),
  } = input;

  if (amount <= BigInt(0)) {
    throw new TransactionError("Nominal transaksi harus lebih besar dari 0 Rupiah.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Validate source account
    const sourceAccount = await tx.financialAccount.findFirst({
      where: { id: accountId, workspaceId },
    });
    if (!sourceAccount) {
      throw new TransactionError("Rekening sumber tidak ditemukan di workspace ini.");
    }

    // 2. Validate destination account for TRANSFER
    let destinationAccount = null;
    if (type === TransactionType.TRANSFER) {
      if (!toAccountId) {
        throw new TransactionError("Rekening tujuan wajib diisi untuk transfer dana.");
      }
      if (toAccountId === accountId) {
        throw new TransactionError("Rekening tujuan tidak boleh sama dengan rekening sumber.");
      }
      destinationAccount = await tx.financialAccount.findFirst({
        where: { id: toAccountId, workspaceId },
      });
      if (!destinationAccount) {
        throw new TransactionError("Rekening tujuan tidak ditemukan di workspace ini.");
      }
    }

    // 3. Validate category if provided
    if (categoryId) {
      const category = await tx.category.findFirst({
        where: { id: categoryId, workspaceId },
      });
      if (!category) {
        throw new TransactionError("Kategori tidak ditemukan di workspace ini.");
      }
    }

    // 4. Update balances according to transaction type
    if (type === TransactionType.EXPENSE) {
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
    } else if (type === TransactionType.INCOME) {
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
    } else if (type === TransactionType.TRANSFER) {
      // Debit source account
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
      // Credit destination account
      await tx.financialAccount.update({
        where: { id: toAccountId! },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
    }

    // 5. Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        workspaceId,
        userId,
        accountId,
        toAccountId: type === TransactionType.TRANSFER ? toAccountId : null,
        categoryId: type === TransactionType.TRANSFER ? null : categoryId,
        type,
        amount,
        description,
        notes,
        transactedAt,
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return transaction;
  });
}

/**
 * Deletes a transaction and rolls back account balance(s) atomically.
 */
export async function deleteTransactionAtomic(transactionId: string, workspaceId: string) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id: transactionId, workspaceId },
    });

    if (!existing) {
      throw new TransactionError("Transaksi tidak ditemukan.");
    }

    const { accountId, toAccountId, type, amount } = existing;

    // Rollback balance mutation
    if (type === TransactionType.EXPENSE) {
      // Was subtracted, so add it back
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
    } else if (type === TransactionType.INCOME) {
      // Was added, so subtract it back
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
    } else if (type === TransactionType.TRANSFER) {
      // Add back to source, subtract from destination
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
      if (toAccountId) {
        await tx.financialAccount.update({
          where: { id: toAccountId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });
      }
    }

    // Delete record
    await tx.transaction.delete({
      where: { id: transactionId },
    });

    return existing;
  });
}

/**
 * Updates a transaction and adjusts balances atomically by reverting the old mutation
 * and applying the new mutation.
 */
export async function updateTransactionAtomic(input: UpdateTransactionInput) {
  const { transactionId, workspaceId } = input;

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id: transactionId, workspaceId },
    });

    if (!existing) {
      throw new TransactionError("Transaksi tidak ditemukan.");
    }

    // Step 1: Revert old mutation
    if (existing.type === TransactionType.EXPENSE) {
      await tx.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
    } else if (existing.type === TransactionType.INCOME) {
      await tx.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
    } else if (existing.type === TransactionType.TRANSFER) {
      await tx.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
      if (existing.toAccountId) {
        await tx.financialAccount.update({
          where: { id: existing.toAccountId },
          data: { balance: { decrement: existing.amount } },
        });
      }
    }

    // Step 2: Determine new values
    const newType = input.type ?? existing.type;
    const newAmount = input.amount ?? existing.amount;
    const newAccountId = input.accountId ?? existing.accountId;
    const newToAccountId =
      newType === TransactionType.TRANSFER
        ? (input.toAccountId !== undefined ? input.toAccountId : existing.toAccountId)
        : null;
    const newCategoryId =
      newType === TransactionType.TRANSFER
        ? null
        : (input.categoryId !== undefined ? input.categoryId : existing.categoryId);
    const newDescription = input.description ?? existing.description;
    const newNotes = input.notes !== undefined ? input.notes : existing.notes;
    const newTransactedAt = input.transactedAt ?? existing.transactedAt;

    if (newAmount <= BigInt(0)) {
      throw new TransactionError("Nominal transaksi harus lebih besar dari 0 Rupiah.");
    }

    // Validate accounts
    const sourceAcc = await tx.financialAccount.findFirst({
      where: { id: newAccountId, workspaceId },
    });
    if (!sourceAcc) {
      throw new TransactionError("Rekening sumber tidak ditemukan di workspace ini.");
    }

    if (newType === TransactionType.TRANSFER) {
      if (!newToAccountId) {
        throw new TransactionError("Rekening tujuan wajib diisi untuk transfer.");
      }
      if (newToAccountId === newAccountId) {
        throw new TransactionError("Rekening tujuan tidak boleh sama dengan rekening sumber.");
      }
      const destAcc = await tx.financialAccount.findFirst({
        where: { id: newToAccountId, workspaceId },
      });
      if (!destAcc) {
        throw new TransactionError("Rekening tujuan tidak ditemukan di workspace ini.");
      }
    }

    // Step 3: Apply new mutation
    if (newType === TransactionType.EXPENSE) {
      await tx.financialAccount.update({
        where: { id: newAccountId },
        data: { balance: { decrement: newAmount } },
      });
    } else if (newType === TransactionType.INCOME) {
      await tx.financialAccount.update({
        where: { id: newAccountId },
        data: { balance: { increment: newAmount } },
      });
    } else if (newType === TransactionType.TRANSFER) {
      await tx.financialAccount.update({
        where: { id: newAccountId },
        data: { balance: { decrement: newAmount } },
      });
      await tx.financialAccount.update({
        where: { id: newToAccountId! },
        data: { balance: { increment: newAmount } },
      });
    }

    // Step 4: Update transaction record
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        accountId: newAccountId,
        toAccountId: newToAccountId,
        categoryId: newCategoryId,
        type: newType,
        amount: newAmount,
        description: newDescription,
        notes: newNotes,
        transactedAt: newTransactedAt,
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return updated;
  });
}
