import { createHmac, timingSafeEqual } from "node:crypto";
import type { MessagingProvider, NormalizedIncomingMessage } from "@/lib/providers";

type MetaWhatsAppConfig = {
  accessToken: string;
  appSecret: string;
  phoneNumberId: string;
  graphApiVersion: string;
};

type MetaMediaResponse = {
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
  id?: string;
};

export type DownloadedMetaMedia = {
  mediaId: string;
  bytes: ArrayBuffer;
  mimeType: string;
  sha256?: string;
  fileSize?: number;
};

type MetaWebhookMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  audio?: { id?: string; mime_type?: string };
  document?: { id?: string; mime_type?: string; filename?: string; caption?: string };
  video?: { id?: string; mime_type?: string; caption?: string };
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
};

type MetaWebhookChange = {
  value?: {
    metadata?: { phone_number_id?: string };
    messages?: MetaWebhookMessage[];
  };
};

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: MetaWebhookChange[];
  }>;
};

function toMessageType(type?: string): NormalizedIncomingMessage["messageType"] {
  if (type === "audio") return "voice";
  if (type === "image" || type === "document" || type === "location" || type === "video") return type;
  return "text";
}

function mediaIdFor(message: MetaWebhookMessage) {
  return message.image?.id ?? message.audio?.id ?? message.document?.id ?? message.video?.id;
}

function mediaMimeTypeFor(message: MetaWebhookMessage) {
  return message.image?.mime_type ?? message.audio?.mime_type ?? message.document?.mime_type ?? message.video?.mime_type;
}

function mediaFilenameFor(message: MetaWebhookMessage) {
  return message.document?.filename;
}

export function parseMetaMediaId(mediaUrl?: string) {
  return mediaUrl?.startsWith("meta-media:") ? mediaUrl.replace("meta-media:", "") : undefined;
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=") || !appSecret) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function parseMetaWebhookMessages(payload: unknown): NormalizedIncomingMessage[] {
  const metaPayload = payload as MetaWebhookPayload;
  const messages: NormalizedIncomingMessage[] = [];

  for (const entry of metaPayload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value?.metadata?.phone_number_id;

      for (const message of change.value?.messages ?? []) {
        const messageType = toMessageType(message.type);
        const mediaId = mediaIdFor(message);

        messages.push({
          provider: "meta_whatsapp",
          providerMessageId: message.id ?? `${phoneNumberId ?? "unknown"}-${message.timestamp ?? Date.now()}`,
          senderPhone: message.from ?? "unknown",
          messageType,
          textBody: message.text?.body ?? message.image?.caption ?? message.document?.caption ?? message.video?.caption,
          mediaUrl: mediaId ? `meta-media:${mediaId}` : undefined,
          mediaMimeType: mediaMimeTypeFor(message),
          mediaFilename: mediaFilenameFor(message),
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          rawPayloadJson: message
        });
      }
    }
  }

  return messages;
}

export class MetaWhatsAppProvider implements MessagingProvider {
  constructor(private readonly config: MetaWhatsAppConfig) {}

  async verifyWebhookSignature(request: Request) {
    const clone = request.clone();
    return verifyMetaSignature(await clone.text(), request.headers.get("x-hub-signature-256"), this.config.appSecret);
  }

  async parseIncomingMessage(payload: unknown) {
    const [message] = parseMetaWebhookMessages(payload);
    if (!message) throw new Error("Meta webhook payload did not include a WhatsApp message");
    return message;
  }

  async sendTextMessage(to: string, message: string) {
    const response = await fetch(`https://graph.facebook.com/${this.config.graphApiVersion}/${this.config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: message }
      })
    });

    if (!response.ok) {
      throw new Error(`Meta send failed: ${response.status} ${await response.text()}`);
    }
  }

  async downloadMedia(mediaId: string): Promise<DownloadedMetaMedia> {
    const mediaResponse = await fetch(
      `https://graph.facebook.com/${this.config.graphApiVersion}/${mediaId}?phone_number_id=${this.config.phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`
        }
      }
    );

    if (!mediaResponse.ok) {
      throw new Error(`Meta media URL lookup failed: ${mediaResponse.status} ${await mediaResponse.text()}`);
    }

    const media = (await mediaResponse.json()) as MetaMediaResponse;
    if (!media.url) throw new Error("Meta media lookup did not return a download URL");

    const downloadResponse = await fetch(media.url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`
      }
    });

    if (!downloadResponse.ok) {
      throw new Error(`Meta media download failed: ${downloadResponse.status} ${await downloadResponse.text()}`);
    }

    return {
      mediaId,
      bytes: await downloadResponse.arrayBuffer(),
      mimeType: media.mime_type ?? downloadResponse.headers.get("content-type") ?? "application/octet-stream",
      sha256: media.sha256,
      fileSize: media.file_size
    };
  }
}
