import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Anda harus login untuk mengakses layanan ini.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Anda tidak memiliki izin untuk mengakses workspace ini.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Retrieves the current authenticated session on the server.
 */
export async function getSession() {
  const reqHeaders = await headers();
  return await auth.api.getSession({
    headers: reqHeaders,
  });
}

/**
 * Enforces that a valid user session exists.
 * Throws UnauthorizedError if no active session is found.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}

/**
 * MANDATORY SECURITY CHECK:
 * Verifies that the user has verified membership in the specified workspace.
 * Prevents Insecure Direct Object References (IDOR).
 */
export async function requireWorkspaceAccess(
  userId: string,
  workspaceId: string,
  minRole?: WorkspaceRole
) {
  if (!workspaceId) {
    throw new ForbiddenError("Workspace ID tidak valid.");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Akses ditolak: Anda bukan anggota workspace ini.");
  }

  if (minRole) {
    const roleHierarchy: Record<WorkspaceRole, number> = {
      VIEWER: 1,
      MEMBER: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      throw new ForbiddenError(`Akses ditolak: Diperlukan role minimal ${minRole}.`);
    }
  }

  return {
    membership,
    workspace: membership.workspace,
    role: membership.role,
  };
}
