import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { executeFinancialRag } from "@/lib/rag/rag-service";
import { FinancialPersona } from "@/lib/rag/personas";
import { seedAcademicKnowledgeBase } from "@/lib/rag/seed-knowledge";
import { enforceRateLimit } from "@/lib/rate-limit";

let isSeeded = false;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitError = await enforceRateLimit(req, "rag-query", 20, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    // Lazy seed initial academic papers into Neon on first call
    if (!isSeeded) {
      seedAcademicKnowledgeBase().catch((err) => console.error("[RAG Seed Error]:", err));
      isSeeded = true;
    }

    const body = await req.json();
    const { query, persona = "FINANCIAL_CONSULTANT", enableLiveAcademicSearch = true } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query pertanyaan wajib diisi" }, { status: 400 });
    }

    const validPersonas: FinancialPersona[] = [
      "INVESTMENT_BANKING",
      "ASSET_MANAGEMENT",
      "AUDITOR",
      "FINANCIAL_CONSULTANT",
    ];

    const activePersona: FinancialPersona = validPersonas.includes(persona)
      ? persona
      : "FINANCIAL_CONSULTANT";

    const result = await executeFinancialRag({
      workspaceId,
      query,
      persona: activePersona,
      enableLiveAcademicSearch,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[RAG Query API Error]:", error);
    return NextResponse.json(
      { error: "Gagal memproses RAG query", details: error.message },
      { status: 500 }
    );
  }
}
