import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { TransactionType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Current month start & end
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Last month start & end
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 6 Months ago start date
    const startOf6MonthsAgo = new Date(currentYear, currentMonth - 5, 1);

    // 1. Fetch Accounts Total Balance
    const accounts = await prisma.financialAccount.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true, type: true, balance: true, color: true },
      orderBy: { balance: "desc" },
    });

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, BigInt(0));

    // 2. Fetch all transactions for the last 6 months
    const sixMonthsTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        transactedAt: {
          gte: startOf6MonthsAgo,
          lte: endOfCurrentMonth,
        },
      },
      select: {
        type: true,
        amount: true,
        transactedAt: true,
        categoryId: true,
      },
    });

    // 3. Build 6-Month Trend Data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyMap = new Map<string, { label: string; income: bigint; expense: bigint }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap.set(key, { label, income: BigInt(0), expense: BigInt(0) });
    }

    let currentMonthIncome = BigInt(0);
    let currentMonthExpense = BigInt(0);
    let lastMonthIncome = BigInt(0);
    let lastMonthExpense = BigInt(0);

    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthCategoryExpenseMap = new Map<string, bigint>();

    sixMonthsTransactions.forEach((tx) => {
      const txDate = new Date(tx.transactedAt);
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;

      const bucket = monthlyMap.get(key);
      if (bucket) {
        if (tx.type === TransactionType.INCOME) bucket.income += tx.amount;
        else if (tx.type === TransactionType.EXPENSE) bucket.expense += tx.amount;
      }

      // Check current vs last month
      if (key === currentMonthKey) {
        if (tx.type === TransactionType.INCOME) currentMonthIncome += tx.amount;
        else if (tx.type === TransactionType.EXPENSE) {
          currentMonthExpense += tx.amount;
          if (tx.categoryId) {
            const prev = currentMonthCategoryExpenseMap.get(tx.categoryId) || BigInt(0);
            currentMonthCategoryExpenseMap.set(tx.categoryId, prev + tx.amount);
          }
        }
      } else if (key === lastMonthKey) {
        if (tx.type === TransactionType.INCOME) lastMonthIncome += tx.amount;
        else if (tx.type === TransactionType.EXPENSE) lastMonthExpense += tx.amount;
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([key, data]) => ({
      key,
      month: data.label,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

    // 4. Category breakdown for current month
    const categories = await prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true, color: true, icon: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const categoryBreakdown = Array.from(currentMonthCategoryExpenseMap.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        const totalExpNum = Number(currentMonthExpense);
        const percentage = totalExpNum > 0 ? Math.round((Number(amount) / totalExpNum) * 100) : 0;
        return {
          categoryId: catId,
          name: cat?.name || "Lain-lain",
          color: cat?.color || "#187aba",
          icon: cat?.icon || "tag",
          amount,
          percentage,
        };
      })
      .sort((a, b) => Number(b.amount - a.amount));

    // 5. Savings rate
    const incomeNum = Number(currentMonthIncome);
    const expenseNum = Number(currentMonthExpense);
    const savingsRate =
      incomeNum > 0
        ? Math.max(0, Math.min(100, Math.round(((incomeNum - expenseNum) / incomeNum) * 100)))
        : 0;

    // 6. Recent 5 Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { workspaceId },
      orderBy: { transactedAt: "desc" },
      take: 5,
      include: {
        account: { select: { id: true, name: true, color: true } },
        toAccount: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json(
      serializeBigInt({
        kpi: {
          totalBalance,
          currentMonthIncome,
          currentMonthExpense,
          netCashflow: currentMonthIncome - currentMonthExpense,
          lastMonthIncome,
          lastMonthExpense,
          savingsRate,
          activeAccountsCount: accounts.length,
        },
        monthlyTrend,
        categoryBreakdown,
        topAccounts: accounts.slice(0, 4),
        recentTransactions,
      })
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Gagal memuat analitik dashboard" }, { status: 500 });
  }
}
