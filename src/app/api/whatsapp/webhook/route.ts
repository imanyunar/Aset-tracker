import { NextRequest, NextResponse } from "next/server";
import {
  processInboundWhatsAppMessage,
  sendWhatsAppNotification,
  getWhatsAppDriver,
} from "@/lib/whatsapp";

// GET /api/whatsapp/webhook - Healthcheck & Webhook Verification
export async function GET(req: NextRequest) {
  const driver = getWhatsAppDriver();
  return NextResponse.json({
    status: "online",
    service: "NexaFinance 2-Way WhatsApp Interactive Bot",
    driver: driver.name,
    timestamp: new Date().toISOString(),
    guide: "Kirim POST request dengan { sender, message } dari gateway Fonnte / Wablas.",
  });
}

// POST /api/whatsapp/webhook - Inbound Message Receiver
export async function POST(req: NextRequest) {
  try {
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

    if (!sender || !message) {
      return NextResponse.json(
        {
          error: "Payload webhook tidak valid. Diperlukan 'sender' (nomor WA) dan 'message' (isi pesan).",
        },
        { status: 400 }
      );
    }

    // 1. Process the message through our intelligent bot handler
    const botResult = await processInboundWhatsAppMessage({
      sender,
      message,
      senderName,
      source: "webhook",
    });

    // 2. Dispatch the reply message back to the sender via WhatsApp Gateway
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
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
