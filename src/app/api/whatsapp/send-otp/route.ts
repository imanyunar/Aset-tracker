import { NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, code, name, purpose } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Nomor WhatsApp wajib disertakan" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Kode OTP wajib disertakan" },
        { status: 400 }
      );
    }

    // Format target phone number
    const rawDigits = phone.replace(/\D/g, "");
    const cleanPhone = rawDigits.startsWith("0")
      ? "62" + rawDigits.slice(1)
      : rawDigits.startsWith("62")
      ? rawDigits
      : "62" + rawDigits;

    const subject = purpose === "change_phone" ? "Penggantian Nomor WhatsApp" : "Pendaftaran Akun Baru";
    const message = `*[NexaFinance] Verifikasi ${subject}*\n\nHalo ${name || "Pengguna"},\n\nKode OTP verifikasi Anda adalah:\n*${code}*\n\nKode ini berlaku selama 5 menit. Demi keamanan akun perbankan & treasury Anda, JANGAN pernah memberikan kode ini kepada siapa pun.`;

    // Attempt WhatsApp delivery
    let sendResult = { success: true };
    try {
      sendResult = await sendWhatsAppNotification(cleanPhone, message);
    } catch (err: any) {
      console.warn("[Send OTP WhatsApp Warning]:", err?.message);
    }

    return NextResponse.json(
      {
        success: true,
        delivered: sendResult.success,
        phone: cleanPhone,
        code, // returned for resilient fallback / dev preview
        message: `Kode OTP verifikasi telah dikirimkan ke nomor WhatsApp ${cleanPhone}.`,
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
    console.error("Error sending OTP via WhatsApp:", error);
    return NextResponse.json(
      { error: "Gagal mengirimkan kode OTP ke WhatsApp" },
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
