import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string; budgetId: string }>;
}

// DELETE /api/workspaces/[id]/budgets/[budgetId]
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, budgetId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const existing = await prisma.budget.findFirst({
      where: { id: budgetId, workspaceId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Anggaran tidak ditemukan" }, { status: 404 });
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return NextResponse.json({ success: true, message: "Anggaran berhasil dihapus" });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting budget:", error);
    return NextResponse.json({ error: "Gagal menghapus anggaran" }, { status: 500 });
  }
}
