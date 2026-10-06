import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { AccountType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z.string().min(2, "Nama rekening minimal 2 karakter").optional(),
  type: z.nativeEnum(AccountType).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Format warna tidak valid").optional(),
  isArchived: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string; accountId: string }>;
}

// PUT /api/workspaces/[id]/accounts/[accountId]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, accountId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    // Verify account belongs to workspace
    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, workspaceId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rekening tidak ditemukan di workspace ini" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.financialAccount.update({
      where: { id: accountId },
      data: parsed.data,
    });

    return NextResponse.json(serializeBigInt({ account: updated }));
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Gagal memperbarui rekening" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/accounts/[accountId]
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, accountId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.ADMIN);

    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, workspaceId: id },
      include: {
        _count: {
          select: {
            outgoingTransactions: true,
            incomingTransactions: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rekening tidak ditemukan di workspace ini" }, { status: 404 });
    }

    const txCount = existing._count.outgoingTransactions + existing._count.incomingTransactions;
    if (txCount > 0) {
      return NextResponse.json(
        {
          error: `Rekening tidak dapat dihapus karena memiliki ${txCount} riwayat transaksi. Silakan gunakan fitur arsipkan jika rekening tidak lagi digunakan.`,
        },
        { status: 400 }
      );
    }

    await prisma.financialAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true, message: "Rekening berhasil dihapus" });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Gagal menghapus rekening" }, { status: 500 });
  }
}
