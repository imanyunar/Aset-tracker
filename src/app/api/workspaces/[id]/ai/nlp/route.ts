import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseNaturalLanguageTransaction } from "@/lib/ai/groq";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const nlpSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        text: val.text || val.prompt || val.message || val.query || val.input,
      };
    }
    return val;
  },
  z.object({
    text: z
      .string("Teks perintah transaksi wajib diisi")
      .min(2, "Teks perintah transaksi minimal 2 karakter"),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const rateLimitError = await enforceRateLimit(req, "ai-nlp", 30, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const parsed = nlpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    // Fetch available accounts & categories in this workspace
    const [accounts, categories] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { workspaceId, isArchived: false },
        select: { id: true, name: true, type: true },
      }),
      prisma.category.findMany({
        where: { workspaceId },
        select: { id: true, name: true, type: true },
      }),
    ]);

    const result = await parseNaturalLanguageTransaction(
      parsed.data.text,
      accounts,
      categories
    );

    return NextResponse.json({ success: true, parsed: result });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in NLP route:", error);
    return NextResponse.json({ error: "Gagal memproses kalimat dengan AI" }, { status: 500 });
  }
}
