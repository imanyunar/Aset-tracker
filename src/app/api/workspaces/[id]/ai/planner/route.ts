import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generate503020FinancialPlan } from "@/lib/ai/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { TransactionType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const rateLimitError = await enforceRateLimit(req, "ai-planner", 15, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;

    const { workspace } = await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json().catch(() => ({}));
    const customIncome = body.monthlyIncome ? Number(body.monthlyIncome) : undefined;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Fetch current month income
    const incomeAgg = await prisma.transaction.aggregate({
      where: {
        workspaceId,
        type: TransactionType.INCOME,
        transactedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const realIncome = Number(incomeAgg._sum.amount || BigInt(0));
    const effectiveIncome = customIncome || (realIncome > 0 ? realIncome : 10000000);

    // 2. Fetch current month expense grouped by category
    const expenseByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        workspaceId,
        type: TransactionType.EXPENSE,
        categoryId: { not: null },
        transactedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    const catNameMap = new Map(categories.map((c) => [c.id, c.name]));

    const categoryBreakdown = expenseByCategory.map((e) => ({
      name: catNameMap.get(e.categoryId!) || "Lain-lain",
      amount: Number(e._sum.amount || BigInt(0)),
    }));

    const plan = await generate503020FinancialPlan({
      workspaceName: workspace.name,
      monthlyIncome: effectiveIncome,
      categoryBreakdown,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in 50/30/20 planner route:", error);
    return NextResponse.json({ error: "Gagal membuat rencana 50/30/20" }, { status: 500 });
  }
}
