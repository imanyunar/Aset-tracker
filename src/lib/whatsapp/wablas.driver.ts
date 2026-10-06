import { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";
import { normalizeIndonesianPhone } from "./fonnte.driver";

export class WablasDriver implements WhatsAppDriver {
  readonly name = "wablas";
  private token: string;
  private endpoint: string;

  constructor(token?: string, endpoint?: string) {
    this.token = token || process.env.WABLAS_TOKEN || "";
    const server = process.env.WABLAS_SERVER || "https://bdg.wablas.com";
    this.endpoint = endpoint || `${server}/api/send-message`;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    if (!this.token) {
      return {
        success: false,
        error: "WABLAS_TOKEN belum dikonfigurasi di environment variables (.env).",
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
          phone: cleanTarget,
          message: options.message,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.status === false)) {
        return {
          success: false,
          error: data?.message || `HTTP error ${response.status}`,
          driver: this.name,
        };
      }

      return {
        success: true,
        messageId: data?.data?.id ? String(data.data.id) : "sent",
        driver: this.name,
      };
    } catch (err: any) {
      console.error("[WablasDriver] Error sending WhatsApp message:", err);
      return {
        success: false,
        error: err.message || "Gagal menghubungi server Wablas",
        driver: this.name,
      };
    }
  }
}
