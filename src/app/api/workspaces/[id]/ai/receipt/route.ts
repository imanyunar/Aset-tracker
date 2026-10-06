import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseReceiptVision } from "@/lib/ai/gemini";
import { z } from "zod";

const receiptSchema = z.object({
  imageBase64: z.string().min(10, "Data gambar struk tidak valid"),
  mimeType: z.string().default("image/jpeg"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const parsed = receiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input gambar tidak valid" },
        { status: 400 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { workspaceId, type: "EXPENSE" },
      select: { id: true, name: true },
    });

    const result = await parseReceiptVision(
      parsed.data.imageBase64,
      parsed.data.mimeType,
      categories
    );

    return NextResponse.json({ success: true, receipt: result });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in Receipt Vision route:", error);
    return NextResponse.json({ error: "Gagal menganalisis struk belanja" }, { status: 500 });
  }
}
