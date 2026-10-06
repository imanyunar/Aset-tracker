import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, "Nama workspace minimal 2 karakter").optional(),
  currency: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const { workspace, role } = await requireWorkspaceAccess(user.id, id);

    const fullWorkspace = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                whatsappNumber: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        accounts: {
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
        },
        categories: {
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json(
      serializeBigInt({
        workspace: fullWorkspace,
        currentRole: role,
      })
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching workspace details:", error);
    return NextResponse.json({ error: "Gagal memuat informasi workspace" }, { status: 500 });
  }
}

// PUT /api/workspaces/[id] - Update workspace (Requires ADMIN or OWNER)
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireWorkspaceAccess(user.id, id, WorkspaceRole.ADMIN);

    const body = await req.json();
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(serializeBigInt({ workspace: updated }));
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Gagal memperbarui workspace" }, { status: 500 });
  }
}
