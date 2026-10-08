import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        whatsappNumber: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { user: dbUser || user },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, email, whatsappNumber } = body;

    const dataToUpdate: Record<string, any> = {};

    // 1. Update Name
    if (name && typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }

    // 2. Update Email (with unique check)
    if (email && typeof email === "string" && email.trim() && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Alamat email ini sudah terdaftar di akun lain." },
          { status: 400 }
        );
      }
      dataToUpdate.email = cleanEmail;
    }

    // 3. Update WhatsApp Number (with unique check)
    if (whatsappNumber !== undefined) {
      const cleanWaRaw = String(whatsappNumber).replace(/\D/g, "");
      if (cleanWaRaw.length >= 8) {
        const canonical62 = cleanWaRaw.startsWith("0")
          ? "62" + cleanWaRaw.slice(1)
          : cleanWaRaw.startsWith("62")
          ? cleanWaRaw
          : "62" + cleanWaRaw;

        const candidateNumbers = [canonical62, "0" + canonical62.slice(2), "+" + canonical62, cleanWaRaw];

        const existingPhone = await prisma.user.findFirst({
          where: {
            whatsappNumber: { in: candidateNumbers },
            id: { not: user.id },
          },
        });

        if (existingPhone) {
          return NextResponse.json(
            { error: "Nomor WhatsApp ini sudah terdaftar di akun lain." },
            { status: 400 }
          );
        }
        dataToUpdate.whatsappNumber = canonical62;
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "Tidak ada data yang diubah", user });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        whatsappNumber: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, user: updated, message: "Profil berhasil diperbarui" },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui profil" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
