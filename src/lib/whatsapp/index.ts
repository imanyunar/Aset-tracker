import { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";
import { FonnteDriver } from "./fonnte.driver";
import { WablasDriver } from "./wablas.driver";
import { MockWhatsAppDriver } from "./mock.driver";

let currentDriver: WhatsAppDriver | null = null;

export function getWhatsAppDriver(): WhatsAppDriver {
  const driverType = process.env.WHATSAPP_DRIVER?.toLowerCase();

  if (driverType === "wablas" || (!driverType && process.env.WABLAS_TOKEN && !process.env.FONNTE_TOKEN)) {
    return new WablasDriver();
  }

  if (driverType === "fonnte" || process.env.FONNTE_TOKEN) {
    return new FonnteDriver();
  }

  // Fallback to MockDriver for development / tests
  return new MockWhatsAppDriver();
}

/**
 * Sends a WhatsApp notification using the configured driver.
 * Returns SendMessageResult without throwing exceptions.
 */
export async function sendWhatsAppNotification(
  to: string,
  message: string
): Promise<SendMessageResult> {
  const driver = getWhatsAppDriver();
  try {
    const result = await driver.sendMessage({ to, message });
    return result;
  } catch (err: any) {
    console.error(`[WhatsApp] Failed to send via ${driver.name}:`, err);
    return {
      success: false,
      error: err.message || "Unknown error",
      driver: driver.name,
    };
  }
}

export * from "./types";
export * from "./templates";
export * from "./fonnte.driver";
export * from "./wablas.driver";
export * from "./mock.driver";
