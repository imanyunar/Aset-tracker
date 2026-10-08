import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import {
  getWorkspaceLearnedMemories,
  saveLearnedMemory,
  deleteLearnedMemory,
  MemoryCategory,
} from "@/lib/ai/learning-engine";
import { z } from "zod";

const createMemorySchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        category: val.category || "USER_PREFERENCE",
        title: val.title || val.name,
        fact: val.fact || val.description || val.content || val.rule,
      };
    }
    return val;
  },
  z.object({
    category: z.enum([
      "USER_PREFERENCE",
      "FINANCIAL_RULE",
      "FINANCIAL_GOAL",
      "USER_HABIT",
      "PERSONAL_CONTEXT",
    ]),
    title: z.string("Judul memori wajib diisi").min(2, "Judul memori minimal 2 karakter"),
    fact: z.string("Fakta memori wajib diisi").min(3, "Deskripsi fakta atau aturan minimal 3 karakter"),
    actionableRule: z.string().optional(),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/ai/memories
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const memories = await getWorkspaceLearnedMemories(workspaceId);

    return NextResponse.json({
      success: true,
      memories,
      count: memories.length,
    });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching AI memories:", error);
    return NextResponse.json({ error: "Gagal memuat memori AI" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/ai/memories
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const parsed = createMemorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Format memori tidak valid" },
        { status: 400 }
      );
    }

    const memory = await saveLearnedMemory(workspaceId, {
      category: parsed.data.category as MemoryCategory,
      title: parsed.data.title,
      fact: parsed.data.fact,
      actionableRule: parsed.data.actionableRule,
      confidence: 1.0, // Explicitly added by user
    });

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating AI memory:", error);
    return NextResponse.json({ error: "Gagal menyimpan memori AI" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/ai/memories?memoryId=...
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get("memoryId");

    if (!memoryId) {
      return NextResponse.json({ error: "ID memori wajib disertakan" }, { status: 400 });
    }

    const success = await deleteLearnedMemory(workspaceId, memoryId);

    return NextResponse.json({
      success,
      message: success ? "Memori berhasil dihapus" : "Memori tidak ditemukan",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
