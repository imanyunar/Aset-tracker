import { NextRequest, NextResponse } from "next/server";
import {
  processInboundWhatsAppMessage,
  sendWhatsAppNotification,
  getWhatsAppDriver,
} from "@/lib/whatsapp";
import { enforceRateLimit } from "@/lib/rate-limit";

// GET /api/whatsapp/webhook - Healthcheck & Webhook Verification
export async function GET(req: NextRequest) {
  const driver = getWhatsAppDriver();
  return NextResponse.json({
    status: "online",
    service: "NexaFinance 2-Way WhatsApp Interactive Bot",
    driver: driver.name,
    timestamp: new Date().toISOString(),
  });
}

// POST /api/whatsapp/webhook - Inbound Message Receiver
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: protect against spam / DoS
    const rateLimitError = await enforceRateLimit(req, "wa-webhook", 60, 60);
    if (rateLimitError) return rateLimitError;

    // 2. Secret validation (if WHATSAPP_WEBHOOK_SECRET is configured)
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-fonnte-token") ||
        req.nextUrl.searchParams.get("secret");

      if (providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: "Akses ditolak: Webhook secret tidak valid." },
          { status: 401 }
        );
      }
    }

    let sender = "";
    let message = "";
    let senderName = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      sender = body.sender || body.phone || body.from || body.wa_number || "";
      message = body.message || body.text || body.body || body.msg || "";
      senderName = body.name || body.pushName || body.senderName || "";
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData().catch(() => new FormData());
      sender = (formData.get("sender") ||
        formData.get("phone") ||
        formData.get("from") ||
        "") as string;
      message = (formData.get("message") ||
        formData.get("text") ||
        formData.get("body") ||
        "") as string;
      senderName = (formData.get("name") ||
        formData.get("pushName") ||
        "") as string;
    } else {
      const rawText = await req.text();
      try {
        const body = JSON.parse(rawText);
        sender = body.sender || body.phone || body.from || "";
        message = body.message || body.text || body.body || "";
        senderName = body.name || body.pushName || "";
      } catch {
        sender = "";
        message = rawText;
      }
    }

    // Input sanitization & validation
    sender = (sender || "").replace(/[^0-9+]/g, "").trim();
    message = (message || "").trim();

    if (!sender || !message) {
      return NextResponse.json(
        {
          error: "Payload webhook tidak valid. Diperlukan 'sender' (nomor WA) dan 'message' (isi pesan).",
        },
        { status: 400 }
      );
    }

    if (sender.length < 8 || sender.length > 20) {
      return NextResponse.json(
        { error: "Format nomor telepon tidak valid." },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Pesan melebihi batas maksimum 1000 karakter." },
        { status: 400 }
      );
    }

    // 3. Process the message through our intelligent bot handler
    const botResult = await processInboundWhatsAppMessage({
      sender,
      message,
      senderName,
      source: "webhook",
    });

    // 4. Dispatch the reply message back to the sender via WhatsApp Gateway
    const sendResult = await sendWhatsAppNotification(sender, botResult.reply);

    return NextResponse.json({
      success: true,
      actionTaken: botResult.actionTaken,
      workspaceName: botResult.workspaceName,
      transactionId: botResult.transactionId,
      replySent: sendResult.success,
      replyPreview: botResult.reply,
      driver: sendResult.driver,
    });
  } catch (error: any) {
    console.error("[WhatsAppWebhook Error]:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses webhook." },
      { status: 500 }
    );
  }
}
