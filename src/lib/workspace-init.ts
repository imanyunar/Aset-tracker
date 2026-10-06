import { prisma } from "@/lib/prisma";
import { WorkspaceType, WorkspaceRole, AccountType, CategoryType } from "@prisma/client";

/**
 * Initializes the default personal workspace, accounts, and 11 categories
 * for a newly registered user.
 */
export async function initializeUserDefaultWorkspace(userId: string) {
  // Check if user already has an active workspace membership
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId },
  });

  if (existing) {
    return existing.workspaceId;
  }

  // Create workspace, member, default accounts and categories in a single transaction
  return await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: "Keuangan Pribadi",
        type: WorkspaceType.PERSONAL,
        currency: "IDR",
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });

    // Default accounts: Dompet Tunai & Rekening Bank
    await tx.financialAccount.createMany({
      data: [
        {
          workspaceId: workspace.id,
          name: "Dompet Tunai",
          type: AccountType.CASH,
          openingBalance: BigInt(0),
          balance: BigInt(0),
          color: "#187aba",
        },
        {
          workspaceId: workspace.id,
          name: "Rekening Bank",
          type: AccountType.BANK,
          openingBalance: BigInt(0),
          balance: BigInt(0),
          color: "#003061",
        },
      ],
    });

    // 11 Default categories (7 Expense, 4 Income)
    await tx.category.createMany({
      data: [
        { workspaceId: workspace.id, name: "Makanan & Minuman", type: CategoryType.EXPENSE, icon: "utensils", color: "#c62234" },
        { workspaceId: workspace.id, name: "Transportasi", type: CategoryType.EXPENSE, icon: "car", color: "#187aba" },
        { workspaceId: workspace.id, name: "Belanja Bulanan", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#3860be" },
        { workspaceId: workspace.id, name: "Tagihan & Utilitas", type: CategoryType.EXPENSE, icon: "zap", color: "#e67e22" },
        { workspaceId: workspace.id, name: "Hiburan", type: CategoryType.EXPENSE, icon: "film", color: "#9b59b6" },
        { workspaceId: workspace.id, name: "Kesehatan", type: CategoryType.EXPENSE, icon: "heart-pulse", color: "#2ecc71" },
        { workspaceId: workspace.id, name: "Lain-lain", type: CategoryType.EXPENSE, icon: "tag", color: "#7f8c8d" },
        { workspaceId: workspace.id, name: "Gaji & Upah", type: CategoryType.INCOME, icon: "briefcase", color: "#27ae60" },
        { workspaceId: workspace.id, name: "Bonus & Freelance", type: CategoryType.INCOME, icon: "gift", color: "#2980b9" },
        { workspaceId: workspace.id, name: "Investasi & Dividen", type: CategoryType.INCOME, icon: "trending-up", color: "#16a085" },
        { workspaceId: workspace.id, name: "Pemasukan Lain", type: CategoryType.INCOME, icon: "plus-circle", color: "#7f8c8d" },
      ],
    });

    return workspace.id;
  });
}
