import { NextResponse, after } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { createTransactionAtomic, TransactionError } from "@/lib/transaction-service";
import { dispatchTransactionNotifications } from "@/lib/budget-service";
import { TransactionType, WorkspaceRole, Prisma } from "@prisma/client";
import { z } from "zod";

const createTransactionSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      const desc =
        (val.description && String(val.description).trim()) ||
        (val.title && String(val.title).trim()) ||
        (val.name && String(val.name).trim()) ||
        "Transaksi";

      const accId =
        (val.accountId && String(val.accountId).trim()) ||
        (val.sourceAccountId && String(val.sourceAccountId).trim()) ||
        undefined;

      return {
        ...val,
        type: val.type || "EXPENSE",
        accountId: accId,
        toAccountId: val.toAccountId !== undefined ? val.toAccountId : val.destinationAccountId,
        transactedAt: val.transactedAt || val.date,
        description: desc,
      };
    }
    return val;
  },
  z.object({
    type: z.nativeEnum(TransactionType, "Tipe transaksi wajib dipilih").default(TransactionType.EXPENSE),
    accountId: z.string().optional(),
    toAccountId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    amount: z.number().or(z.string()).transform((val) => {
      const num = typeof val === "string" ? parseInt(val.replace(/[^0-9]/g, "") || "0", 10) : Math.round(Number(val) || 0);
      return BigInt(num);
    }),
    description: z.string().default("Transaksi"),
    notes: z.string().optional().nullable(),
    transactedAt: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/transactions
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const typeFilter = searchParams.get("type");
    const accountFilter = searchParams.get("accountId");
    const categoryFilter = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Construct Prisma where clause
    const where: Prisma.TransactionWhereInput = {
      workspaceId: id,
    };

    if (typeFilter && ["EXPENSE", "INCOME", "TRANSFER"].includes(typeFilter)) {
      where.type = typeFilter as TransactionType;
    }

    if (accountFilter) {
      where.OR = [
        { accountId: accountFilter },
        { toAccountId: accountFilter },
      ];
    }

    if (categoryFilter) {
      where.categoryId = categoryFilter;
    }

    if (startDate || endDate) {
      where.transactedAt = {};
      if (startDate) {
        where.transactedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Include full day if only date is passed
        const end = new Date(endDate);
        if (endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.transactedAt.lte = end;
      }
    }

    if (search && search.trim()) {
      where.description = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Execute query and total count in parallel
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transactedAt: "desc" },
        skip,
        take: limit,
        include: {
          account: {
            select: { id: true, name: true, type: true, color: true },
          },
          toAccount: {
            select: { id: true, name: true, type: true, color: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Period summary for the current filter
    const stats = await prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: {
        amount: true,
      },
    });

    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);
    let totalTransfer = BigInt(0);

    stats.forEach((st) => {
      const sum = st._sum.amount || BigInt(0);
      if (st.type === TransactionType.INCOME) totalIncome += sum;
      else if (st.type === TransactionType.EXPENSE) totalExpense += sum;
      else if (st.type === TransactionType.TRANSFER) totalTransfer += sum;
    });

    const netCashflow = totalIncome - totalExpense;

    return NextResponse.json(
      serializeBigInt({
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        summary: {
          totalIncome,
          totalExpense,
          totalTransfer,
          netCashflow,
        },
      })
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/transactions
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const { type, accountId, toAccountId, categoryId, amount, description, notes, transactedAt } =
      parsed.data;

    let effectiveAccountId = accountId;
    if (!effectiveAccountId) {
      const defaultAcc = await prisma.financialAccount.findFirst({
        where: { workspaceId: id, isArchived: false },
        orderBy: { createdAt: "asc" },
      });
      if (!defaultAcc) {
        return NextResponse.json(
          { error: "Workspace ini belum memiliki rekening aktif. Tambahkan rekening terlebih dahulu." },
          { status: 400 }
        );
      }
      effectiveAccountId = defaultAcc.id;
    }

    const transaction = await createTransactionAtomic({
      workspaceId: id,
      userId: user.id,
      accountId: effectiveAccountId,
      toAccountId: toAccountId || null,
      categoryId: categoryId || null,
      type,
      amount,
      description: description || "Transaksi",
      notes: notes || null,
      transactedAt,
    });

    // Asynchronously dispatch WhatsApp notifications via Next.js after()
    after(async () => {
      await dispatchTransactionNotifications({
        transactionId: transaction.id,
        workspaceId: id,
        userId: user.id,
      });
    });

    return NextResponse.json(serializeBigInt({ transaction }), { status: 201 });
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
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Gagal mencatat transaksi" }, { status: 500 });
  }
}
