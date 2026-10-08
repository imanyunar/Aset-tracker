import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { AccountType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const createAccountSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        name: val.name || val.accountName || val.title,
        type: val.type || val.accountType || AccountType.BANK,
        openingBalance: val.openingBalance !== undefined ? val.openingBalance : (val.balance || 0),
      };
    }
    return val;
  },
  z.object({
    name: z.string("Nama rekening wajib diisi").min(2, "Nama rekening minimal 2 karakter"),
    type: z.nativeEnum(AccountType).default(AccountType.BANK),
    openingBalance: z.number().or(z.string()).default(0).transform((val) => {
      const num = typeof val === "string" ? parseInt(val.replace(/[^0-9-]/g, "") || "0", 10) : Math.round(Number(val) || 0);
      return BigInt(num);
    }),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Format warna tidak valid").default("#187aba"),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/accounts - List all accounts in workspace
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id);

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const accounts = await prisma.financialAccount.findMany({
      where: {
        workspaceId: id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            outgoingTransactions: true,
            incomingTransactions: true,
          },
        },
      },
    });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.isArchived ? BigInt(0) : acc.balance),
      BigInt(0)
    );

    return NextResponse.json(
      serializeBigInt({
        accounts,
        totalBalance,
      })
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Gagal memuat daftar rekening" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/accounts - Create a new financial account
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const { name, type, openingBalance, color } = parsed.data;

    const newAccount = await prisma.financialAccount.create({
      data: {
        workspaceId: id,
        name,
        type,
        openingBalance,
        balance: openingBalance,
        color,
      },
    });

    return NextResponse.json(serializeBigInt({ account: newAccount }), { status: 201 });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Gagal membuat rekening baru" }, { status: 500 });
  }
}
