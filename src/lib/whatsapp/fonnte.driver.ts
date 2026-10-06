import { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";

export function normalizeIndonesianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return digits;
}

export class FonnteDriver implements WhatsAppDriver {
  readonly name = "fonnte";
  private token: string;
  private endpoint: string;

  constructor(token?: string, endpoint = "https://api.fonnte.com/send") {
    this.token = token || process.env.FONNTE_TOKEN || "";
    this.endpoint = endpoint;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    if (!this.token) {
      return {
        success: false,
        error: "FONNTE_TOKEN belum dikonfigurasi di environment variables (.env).",
        driver: this.name,
      };
    }

    const cleanTarget = normalizeIndonesianPhone(options.to);
    if (!cleanTarget || cleanTarget.length < 9) {
      return {
        success: false,
        error: `Nomor telepon tujuan tidak valid: ${options.to}`,
        driver: this.name,
      };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: this.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: cleanTarget,
          message: options.message,
          countryCode: "62",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.status === false)) {
        return {
          success: false,
          error: data?.reason || data?.message || `HTTP error ${response.status}`,
          driver: this.name,
        };
      }

      const messageId = Array.isArray(data?.id) ? data.id[0] : data?.id;

      return {
        success: true,
        messageId: String(messageId || "sent"),
        driver: this.name,
      };
    } catch (err: any) {
      console.error("[FonnteDriver] Error sending WhatsApp message:", err);
      return {
        success: false,
        error: err.message || "Gagal menghubungi server Fonnte",
        driver: this.name,
      };
    }
  }
}
