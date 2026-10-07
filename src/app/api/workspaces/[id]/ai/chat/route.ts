import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chatWithFinancialAssistant } from "@/lib/ai/gemini";
import {
  getWorkspaceLearnedMemories,
  synthesizeInformationContext,
  detectAndExtractMemory,
  saveLearnedMemory,
} from "@/lib/ai/learning-engine";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getLiveMarketContextForQuery } from "@/lib/ai/market-data";
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
    const rateLimitError = await enforceRateLimit(req, "ai-chat", 25, 60);
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

    const messages = parsed.data.messages;
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Prepare live financial context
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

    const monthlyIncome = Number(incomeAgg._sum.amount || BigInt(0));
    const monthlyExpense = Number(expenseAgg._sum.amount || BigInt(0));

    // 2. Continuous Learning Retrieval & Information Processing
    const recentContextText = messages.slice(-3).map((m) => m.content).join(" ");
    const [learnedMemories, marketContext] = await Promise.all([
      getWorkspaceLearnedMemories(workspaceId),
      getLiveMarketContextForQuery(recentContextText || lastUserMessage),
    ]);

    const synthesized = synthesizeInformationContext({
      workspaceName: workspace.name,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      accounts: accounts.map((a) => a.name),
      learnedMemories,
      userQuery: lastUserMessage,
    });

    // 3. Generate response with integrated intelligence & real-time grounding
    const assistantResult = await chatWithFinancialAssistant({
      messages,
      workspaceContext: {
        workspaceName: workspace.name,
        workspaceType: workspace.type,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        accounts: accounts.map((a) => a.name),
        memoryContext: synthesized.synthesizedPromptContext,
        liveMarketContext: marketContext.marketContextText,
      },
    });

    // 4. Background Active Learning: Extract new facts or rules stated by user in this chat
    let newlyLearnedMemory: any = null;
    try {
      const memoryDetection = await detectAndExtractMemory(lastUserMessage);
      if (memoryDetection.hasMemory && memoryDetection.category && memoryDetection.fact) {
        newlyLearnedMemory = await saveLearnedMemory(workspaceId, {
          category: memoryDetection.category,
          title: memoryDetection.title || "Preferensi Baru",
          fact: memoryDetection.fact,
          actionableRule: memoryDetection.actionableRule,
          confidence: memoryDetection.confidence,
        });
      }
    } catch (memErr) {
      console.warn("[AiChat] Non-blocking memory extraction notice:", memErr);
    }

    return NextResponse.json({
      success: true,
      reply: assistantResult.reply,
      sources: assistantResult.sources || [],
      isGrounded: assistantResult.isGrounded,
      toolExecuted: {
        name: assistantResult.isGrounded ? "google_search_grounding" : "active_cognitive_reasoning",
        label: assistantResult.toolExecutedName,
        status: "success",
      },
      learnedMemory: newlyLearnedMemory
        ? {
            id: newlyLearnedMemory.id,
            category: newlyLearnedMemory.category,
            title: newlyLearnedMemory.title,
            fact: newlyLearnedMemory.fact,
            actionableRule: newlyLearnedMemory.actionableRule,
          }
        : null,
      activeGoalsCount: synthesized.activeGoals.length,
      activeRulesCount: synthesized.activeRules.length,
    });
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
