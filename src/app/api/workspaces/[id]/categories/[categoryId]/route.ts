import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Format warna tidak valid").optional(),
});

interface RouteParams {
  params: Promise<{ id: string; categoryId: string }>;
}

// PUT /api/workspaces/[id]/categories/[categoryId]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, categoryId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const existing = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan di workspace ini" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: parsed.data,
    });

    return NextResponse.json({ category: updated });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/categories/[categoryId]
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, categoryId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.ADMIN);

    const existing = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId: id },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan di workspace ini" }, { status: 404 });
    }

    if (existing._count.transactions > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena telah digunakan pada ${existing._count.transactions} transaksi.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
