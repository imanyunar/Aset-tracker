import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, whatsappNumber, excludeUserId } = body;

    let emailTaken = false;
    let phoneTaken = false;
    let emailMessage: string | null = null;
    let phoneMessage: string | null = null;

    // 1. Check Email Uniqueness
    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
        select: { id: true },
      });

      if (existingUserWithEmail) {
        emailTaken = true;
        emailMessage = "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.";
      }
    }

    // 2. Check WhatsApp / Phone Number Uniqueness
    if (whatsappNumber && typeof whatsappNumber === "string" && whatsappNumber.trim()) {
      const rawDigits = whatsappNumber.replace(/\D/g, "");
      if (rawDigits.length >= 8) {
        const canonical62 = rawDigits.startsWith("0")
          ? "62" + rawDigits.slice(1)
          : rawDigits.startsWith("62")
          ? rawDigits
          : "62" + rawDigits;

        const canonical08 = "0" + canonical62.slice(2);
        const canonicalPlus62 = "+" + canonical62;

        const candidateNumbers = [canonical62, canonical08, canonicalPlus62, rawDigits];

        const existingUserWithPhone = await prisma.user.findFirst({
          where: {
            whatsappNumber: { in: candidateNumbers },
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
          },
          select: { id: true },
        });

        if (existingUserWithPhone) {
          phoneTaken = true;
          phoneMessage = "Nomor WhatsApp/telepon ini sudah terdaftar di akun lain. Silakan gunakan nomor lain.";
        }
      }
    }

    return NextResponse.json(
      {
        available: !emailTaken && !phoneTaken,
        emailTaken,
        phoneTaken,
        emailMessage,
        phoneMessage,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Check unique error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi keunikan data", available: true },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
