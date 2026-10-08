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

const updateTransactionSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      const accId =
        (val.accountId && String(val.accountId).trim()) ||
        (val.sourceAccountId && String(val.sourceAccountId).trim()) ||
        undefined;

      const toAccId =
        val.toAccountId !== undefined
          ? (val.toAccountId && String(val.toAccountId).trim() !== "" ? String(val.toAccountId).trim() : null)
          : val.destinationAccountId !== undefined
          ? (val.destinationAccountId && String(val.destinationAccountId).trim() !== "" ? String(val.destinationAccountId).trim() : null)
          : undefined;

      const catId =
        val.categoryId !== undefined
          ? (val.categoryId && String(val.categoryId).trim() !== "" ? String(val.categoryId).trim() : null)
          : undefined;

      const desc =
        val.description !== undefined
          ? String(val.description).trim()
          : val.title !== undefined
          ? String(val.title).trim()
          : val.name !== undefined
          ? String(val.name).trim()
          : undefined;

      const noteText =
        val.notes !== undefined
          ? (val.notes && String(val.notes).trim() !== "" ? String(val.notes).trim() : null)
          : undefined;

      let cleanDate: Date | undefined = undefined;
      const rawDate = val.transactedAt || val.date;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) cleanDate = d;
      }

      return {
        ...val,
        accountId: accId,
        toAccountId: toAccId,
        categoryId: catId,
        description: desc,
        notes: noteText,
        transactedAt: cleanDate,
      };
    }
    return val;
  },
  z.object({
    type: z.nativeEnum(TransactionType).optional(),
    accountId: z.string().optional(),
    toAccountId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    amount: z
      .preprocess((v: any) => {
        if (v === undefined || v === null || v === "") return undefined;
        if (typeof v === "string") {
          const cleaned = v.replace(/[^0-9]/g, "");
          return cleaned ? parseInt(cleaned, 10) : 0;
        }
        return Math.round(Number(v) || 0);
      }, z.number().min(1, "Nominal transaksi harus lebih besar dari 0 Rupiah").optional())
      .transform((val) => (val !== undefined ? BigInt(val) : undefined)),
    description: z.string().min(1, "Keterangan transaksi minimal 1 karakter").optional(),
    notes: z.string().optional().nullable(),
    transactedAt: z.date().optional(),
  })
);

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
