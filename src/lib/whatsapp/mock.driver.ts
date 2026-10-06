import { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";
import { normalizeIndonesianPhone } from "./fonnte.driver";

export interface SentLogMessage {
  to: string;
  message: string;
  timestamp: Date;
  id: string;
}

export class MockWhatsAppDriver implements WhatsAppDriver {
  readonly name = "mock";
  public static messageHistory: SentLogMessage[] = [];

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const cleanTarget = normalizeIndonesianPhone(options.to);
    const messageId = `mock_wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const logEntry: SentLogMessage = {
      to: cleanTarget,
      message: options.message,
      timestamp: new Date(),
      id: messageId,
    };

    MockWhatsAppDriver.messageHistory.push(logEntry);

    console.log("\n=======================================================");
    console.log(`[MockWhatsAppDriver] SENDING WHATSAPP MESSAGE`);
    console.log(`To: ${cleanTarget}`);
    console.log(`Message Content:\n${options.message}`);
    console.log("=======================================================\n");

    return {
      success: true,
      messageId,
      driver: this.name,
    };
  }

  static getHistory(): SentLogMessage[] {
    return this.messageHistory;
  }

  static clearHistory(): void {
    this.messageHistory = [];
  }
}
