import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { TransactionType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const upsertBudgetSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        categoryId: val.categoryId || val.category_id || val.category,
      };
    }
    return val;
  },
  z.object({
    categoryId: z.string("Kategori anggaran wajib dipilih").min(1, "Kategori anggaran wajib dipilih"),
    amount: z.number().or(z.string()).transform((val) => {
      const num = typeof val === "string" ? parseInt(val.replace(/[^0-9]/g, "") || "0", 10) : Math.round(val);
      return BigInt(num);
    }),
    period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM").optional(),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/budgets
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId);

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const period = searchParams.get("period") || defaultPeriod;

    // Period date range
    const [year, month] = period.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch budgets for this period
    const budgets = await prisma.budget.findMany({
      where: { workspaceId, period },
      include: {
        category: true,
      },
      orderBy: { amount: "desc" },
    });

    // 2. Fetch expenses for all categories in this month
    const expenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        workspaceId,
        type: TransactionType.EXPENSE,
        categoryId: { not: null },
        transactedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const expenseMap = new Map<string, bigint>();
    expenses.forEach((e) => {
      if (e.categoryId) {
        expenseMap.set(e.categoryId, e._sum.amount || BigInt(0));
      }
    });

    // 3. Map budgets with progress
    let totalBudget = BigInt(0);
    let totalSpent = BigInt(0);

    const budgetList = budgets.map((b) => {
      const spent = expenseMap.get(b.categoryId) || BigInt(0);
      const budgetNum = Number(b.amount);
      const spentNum = Number(spent);
      const percentage = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;
      const remaining = b.amount > spent ? b.amount - spent : BigInt(0);

      totalBudget += b.amount;
      totalSpent += spent;

      let status = "NORMAL";
      if (percentage >= 100) status = "EXCEEDED";
      else if (percentage >= 80) status = "WARNING";

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        categoryColor: b.category.color,
        categoryIcon: b.category.icon,
        amount: b.amount,
        spent,
        remaining,
        percentage,
        period: b.period,
        status,
      };
    });

    const overallPercentage = totalBudget > BigInt(0) ? Math.round((Number(totalSpent) / Number(totalBudget)) * 100) : 0;

    return NextResponse.json(
      serializeBigInt({
        period,
        budgets: budgetList,
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining: totalBudget > totalSpent ? totalBudget - totalSpent : BigInt(0),
          overallPercentage,
        },
      })
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Gagal memuat anggaran" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/budgets - Create or Update (Upsert) category budget
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId, WorkspaceRole.MEMBER);

    const body = await req.json();
    const parsed = upsertBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const period = parsed.data.period || defaultPeriod;
    const { categoryId, amount } = parsed.data;

    // Verify category belongs to workspace
    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId },
    });
    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan di workspace ini" }, { status: 404 });
    }

    const budget = await prisma.budget.upsert({
      where: {
        workspaceId_categoryId_period: {
          workspaceId,
          categoryId,
          period,
        },
      },
      update: {
        amount,
      },
      create: {
        workspaceId,
        categoryId,
        amount,
        period,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(serializeBigInt({ budget }), { status: 201 });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating/updating budget:", error);
    return NextResponse.json({ error: "Gagal menyimpan anggaran" }, { status: 500 });
  }
}
