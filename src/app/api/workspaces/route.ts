import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { WorkspaceRole, WorkspaceType, AccountType, CategoryType } from "@prisma/client";
import { z } from "zod";

const createWorkspaceSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        name: val.name || val.workspaceName || val.title,
      };
    }
    return val;
  },
  z.object({
    name: z.string("Nama workspace wajib diisi").min(2, "Nama workspace minimal 2 karakter"),
    type: z.nativeEnum(WorkspaceType).default(WorkspaceType.PERSONAL),
    currency: z.string().default("IDR"),
  })
);

// GET /api/workspaces - List all workspaces accessible by the logged-in user
export async function GET() {
  try {
    const user = await requireUser();

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            accounts: {
              where: { isArchived: false },
              select: {
                id: true,
                name: true,
                type: true,
                balance: true,
                color: true,
              },
            },
            _count: {
              select: {
                members: true,
                transactions: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const workspaces = memberships.map((m) => {
      const totalBalance = m.workspace.accounts.reduce(
        (acc, curr) => acc + curr.balance,
        BigInt(0)
      );

      return {
        id: m.workspace.id,
        name: m.workspace.name,
        type: m.workspace.type,
        currency: m.workspace.currency,
        role: m.role,
        accountsCount: m.workspace.accounts.length,
        totalBalance,
        accounts: m.workspace.accounts,
        membersCount: m.workspace._count.members,
        transactionsCount: m.workspace._count.transactions,
        createdAt: m.workspace.createdAt,
      };
    });

    return NextResponse.json(serializeBigInt({ workspaces }));
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Gagal memuat daftar workspace" }, { status: 500 });
  }
}

// POST /api/workspaces - Create a new workspace and seed initial accounts & categories
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const { name, type, currency } = parsed.data;

    // Create workspace with creator as OWNER in a transaction
    const newWorkspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          type,
          currency,
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      // Default accounts depending on type
      if (type === WorkspaceType.BUSINESS) {
        await tx.financialAccount.createMany({
          data: [
            { workspaceId: ws.id, name: "Rekening Operasional Bisnis", type: AccountType.BANK, openingBalance: BigInt(0), balance: BigInt(0), color: "#003061" },
            { workspaceId: ws.id, name: "Kas Kecil (Petty Cash)", type: AccountType.CASH, openingBalance: BigInt(0), balance: BigInt(0), color: "#187aba" },
          ],
        });

        // Default Business Categories
        await tx.category.createMany({
          data: [
            { workspaceId: ws.id, name: "Penjualan Produk/Jasa", type: CategoryType.INCOME, icon: "dollar-sign", color: "#27ae60" },
            { workspaceId: ws.id, name: "Pendapatan Proyek", type: CategoryType.INCOME, icon: "briefcase", color: "#2980b9" },
            { workspaceId: ws.id, name: "Gaji & Upah Karyawan", type: CategoryType.EXPENSE, icon: "users", color: "#c62234" },
            { workspaceId: ws.id, name: "Sewa Tempat & Kantor", type: CategoryType.EXPENSE, icon: "home", color: "#e67e22" },
            { workspaceId: ws.id, name: "Operasional & ATK", type: CategoryType.EXPENSE, icon: "printer", color: "#3860be" },
            { workspaceId: ws.id, name: "Pemasaran & Iklan", type: CategoryType.EXPENSE, icon: "megaphone", color: "#9b59b6" },
            { workspaceId: ws.id, name: "Pajak & Legalitas", type: CategoryType.EXPENSE, icon: "file-text", color: "#7f8c8d" },
          ],
        });
      } else {
        await tx.financialAccount.createMany({
          data: [
            { workspaceId: ws.id, name: "Dompet Tunai", type: AccountType.CASH, openingBalance: BigInt(0), balance: BigInt(0), color: "#187aba" },
            { workspaceId: ws.id, name: "Rekening Bank Utama", type: AccountType.BANK, openingBalance: BigInt(0), balance: BigInt(0), color: "#003061" },
          ],
        });

        await tx.category.createMany({
          data: [
            { workspaceId: ws.id, name: "Makanan & Minuman", type: CategoryType.EXPENSE, icon: "utensils", color: "#c62234" },
            { workspaceId: ws.id, name: "Transportasi", type: CategoryType.EXPENSE, icon: "car", color: "#187aba" },
            { workspaceId: ws.id, name: "Belanja Bulanan", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#3860be" },
            { workspaceId: ws.id, name: "Tagihan & Utilitas", type: CategoryType.EXPENSE, icon: "zap", color: "#e67e22" },
            { workspaceId: ws.id, name: "Gaji & Upah", type: CategoryType.INCOME, icon: "briefcase", color: "#27ae60" },
            { workspaceId: ws.id, name: "Bonus & Freelance", type: CategoryType.INCOME, icon: "gift", color: "#2980b9" },
          ],
        });
      }

      return ws;
    });

    return NextResponse.json(serializeBigInt({ workspace: newWorkspace }), { status: 201 });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Gagal membuat workspace baru" }, { status: 500 });
  }
}
