export interface SendMessageOptions {
  to: string; // Nomor telepon tujuan (contoh: 0812... atau 62812...)
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  driver: string;
}

export interface WhatsAppDriver {
  readonly name: string;
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
}
