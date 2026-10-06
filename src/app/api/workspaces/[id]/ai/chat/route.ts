import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chatWithFinancialAssistant } from "@/lib/ai/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { TransactionType } from "@prisma/client";
import { z } from "zod";

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const rateLimitError = await enforceRateLimit(req, "ai-chat", 20, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;

    const { workspace } = await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Format pesan tidak valid" },
        { status: 400 }
      );
    }

    // Prepare live financial context
    const accounts = await prisma.financialAccount.findMany({
      where: { workspaceId, isArchived: false },
      select: { name: true, balance: true },
    });

    const totalBalance = Number(
      accounts.reduce((acc, a) => acc + a.balance, BigInt(0))
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          workspaceId,
          type: TransactionType.INCOME,
          transactedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          workspaceId,
          type: TransactionType.EXPENSE,
          transactedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const reply = await chatWithFinancialAssistant({
      messages: parsed.data.messages,
      workspaceContext: {
        workspaceName: workspace.name,
        workspaceType: workspace.type,
        totalBalance,
        monthlyIncome: Number(incomeAgg._sum.amount || BigInt(0)),
        monthlyExpense: Number(expenseAgg._sum.amount || BigInt(0)),
        accounts: accounts.map((a) => a.name),
      },
    });

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in AI Chat route:", error);
    return NextResponse.json({ error: "Gagal berkomunikasi dengan asisten AI" }, { status: 500 });
  }
}
