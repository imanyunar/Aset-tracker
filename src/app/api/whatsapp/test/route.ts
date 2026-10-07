import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { sendWhatsAppNotification, getWhatsAppDriver } from "@/lib/whatsapp";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate limiting: max 5 test notifications per minute per user
    const rateLimitError = await enforceRateLimit(req, "wa-test", 5, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    // 2. Security: Only allow sending to the authenticated user's registered phone number
    const targetNumber = user.whatsappNumber;
    if (!targetNumber) {
      return NextResponse.json(
        { error: "Nomor WhatsApp belum terdaftar di profil akun Anda." },
        { status: 400 }
      );
    }

    if (body.to && body.to.replace(/\D/g, "") !== targetNumber.replace(/\D/g, "")) {
      return NextResponse.json(
        {
          error:
            "Demi keamanan, Anda hanya dapat mengirim notifikasi uji coba ke nomor WhatsApp Anda sendiri yang terdaftar.",
        },
        { status: 403 }
      );
    }

    const driver = getWhatsAppDriver();
    const message =
      body.message ||
      `🎉 *Halo ${user.name}!*\nIni adalah pesan uji coba dari *NexaFinance* menggunakan driver *${driver.name}*.\nSistem notifikasi transaksi dan peringatan anggaran Anda telah aktif!`;

    const result = await sendWhatsAppNotification(targetNumber, message);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Gagal mengirim pesan WhatsApp",
          driver: result.driver,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pesan uji coba berhasil dikirim via ${result.driver}`,
      messageId: result.messageId,
      driver: result.driver,
    });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error sending test WhatsApp message:", error);
    return NextResponse.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}
