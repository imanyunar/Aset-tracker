import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import {
  sendWhatsAppNotification,
  formatTransactionNotification,
  formatBudgetAlert,
} from "@/lib/whatsapp";

/**
 * Checks if category expense has reached 80% or exceeded 100% of the active monthly budget.
 * If threshold is met, dispatches a WhatsApp alert to the user's number.
 */
export async function checkAndSendBudgetAlert({
  workspaceId,
  categoryId,
  whatsappNumber,
  workspaceName,
}: {
  workspaceId: string;
  categoryId: string;
  whatsappNumber?: string | null;
  workspaceName: string;
}) {
  if (!whatsappNumber) return;

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Find active budget for category and current period
  const budget = await prisma.budget.findUnique({
    where: {
      workspaceId_categoryId_period: {
        workspaceId,
        categoryId,
        period: currentPeriod,
      },
    },
    include: {
      category: true,
    },
  });

  if (!budget || budget.amount <= BigInt(0)) {
    return;
  }

  // Calculate current month's total expenses for this category
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const aggregate = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      categoryId,
      type: TransactionType.EXPENSE,
      transactedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const spentAmount = aggregate._sum.amount || BigInt(0);
  const budgetAmountNum = Number(budget.amount);
  const spentAmountNum = Number(spentAmount);

  if (budgetAmountNum <= 0) return;

  const percentage = Math.round((spentAmountNum / budgetAmountNum) * 100);

  // Trigger alert if >= 80%
  if (percentage >= 80) {
    const alertMessage = formatBudgetAlert({
      workspaceName,
      categoryName: budget.category.name,
      budgetAmount: budget.amount,
      spentAmount,
      percentage,
    });

    await sendWhatsAppNotification(whatsappNumber, alertMessage);
  }
}

/**
 * Dispatches WhatsApp notification for a new transaction,
 * and checks budget threshold if transaction is an expense.
 */
export async function dispatchTransactionNotifications({
  transactionId,
  workspaceId,
  userId,
}: {
  transactionId: string;
  workspaceId: string;
  userId?: string | null;
}) {
  try {
    // 1. Fetch full transaction with workspace, accounts, category
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        workspace: true,
        account: true,
        toAccount: true,
        category: true,
      },
    });

    if (!tx) return;

    // 2. Fetch recipient user's whatsappNumber
    let recipientWa: string | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { whatsappNumber: true },
      });
      recipientWa = user?.whatsappNumber || null;
    }

    // Fallback to workspace OWNER's whatsappNumber if current user has none
    if (!recipientWa) {
      const ownerMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId, role: "OWNER" },
        include: { user: { select: { whatsappNumber: true } } },
      });
      recipientWa = ownerMember?.user.whatsappNumber || null;
    }

    if (!recipientWa) {
      console.log(`[Notification] No WhatsApp number found for workspace ${workspaceId}. Skipping.`);
      return;
    }

    // 3. Send transaction notification
    const message = formatTransactionNotification({
      workspaceName: tx.workspace.name,
      type: tx.type,
      amount: tx.amount,
      accountName: tx.account.name,
      toAccountName: tx.toAccount?.name,
      categoryName: tx.category?.name,
      description: tx.description,
      notes: tx.notes,
      accountBalance: tx.account.balance,
      transactedAt: tx.transactedAt,
    });

    // Timeout safeguard (max 2500ms)
    await Promise.race([
      (async () => {
        await sendWhatsAppNotification(recipientWa, message);

        // 4. If EXPENSE, check budget alert
        if (tx.type === TransactionType.EXPENSE && tx.categoryId) {
          await checkAndSendBudgetAlert({
            workspaceId,
            categoryId: tx.categoryId,
            whatsappNumber: recipientWa,
            workspaceName: tx.workspace.name,
          });
        }
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Notification timeout")), 2500)),
    ]);
  } catch (err: any) {
    console.warn("[Notification] Background dispatch notice:", err?.message || err);
  }
}
