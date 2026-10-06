import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import {
  updateTransactionAtomic,
  deleteTransactionAtomic,
  TransactionError,
} from "@/lib/transaction-service";
import { TransactionType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  amount: z
    .number()
    .or(z.string())
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val.replace(/[^0-9]/g, "") || "0", 10) : Math.round(val);
      return BigInt(num);
    })
    .optional(),
  description: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  transactedAt: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string; transactionId: string }>;
}

// GET /api/workspaces/[id]/transactions/[transactionId]
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, transactionId } = await params;

    await requireWorkspaceAccess(user.id, id);

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, workspaceId: id },
      include: {
        account: true,
        toAccount: true,
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(serializeBigInt({ transaction }));
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

// PUT /api/workspaces/[id]/transactions/[transactionId]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, transactionId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const body = await req.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await updateTransactionAtomic({
      transactionId,
      workspaceId: id,
      ...parsed.data,
    });

    return NextResponse.json(serializeBigInt({ transaction: updated }));
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Gagal memperbarui transaksi" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/transactions/[transactionId]
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id, transactionId } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const deleted = await deleteTransactionAtomic(transactionId, id);

    return NextResponse.json(
      serializeBigInt({ success: true, message: "Transaksi berhasil dihapus", deleted })
    );
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
