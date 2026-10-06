import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CategoryType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  type: z.nativeEnum(CategoryType),
  icon: z.string().default("tag"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Format warna tidak valid").default("#187aba"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/categories - List categories in workspace
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id);

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    const categories = await prisma.category.findMany({
      where: {
        workspaceId: id,
        ...(typeFilter && (typeFilter === "INCOME" || typeFilter === "EXPENSE")
          ? { type: typeFilter as CategoryType }
          : {}),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/categories - Create category
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.MEMBER);

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const { name, type, icon, color } = parsed.data;

    // Check unique constraint [workspaceId, type, name]
    const existing = await prisma.category.findUnique({
      where: {
        workspaceId_type_name: {
          workspaceId: id,
          type,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kategori "${name}" dengan tipe yang sama sudah ada di workspace ini.` },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        workspaceId: id,
        name,
        type,
        icon,
        color,
      },
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Gagal membuat kategori baru" }, { status: 500 });
  }
}
