import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const WHATSAPP_MEDIA_BUCKET = "whatsapp-media";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/aac": "aac",
  "audio/amr": "amr",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "video/mp4": "mp4",
  "video/3gpp": "3gp"
};

function safeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "media";
}

export function fileExtensionForMimeType(mimeType: string, fallbackFilename?: string) {
  const extension = extensionByMimeType[mimeType.toLowerCase()];
  if (extension) return extension;

  const fallbackExtension = fallbackFilename?.split(".").pop()?.toLowerCase();
  return fallbackExtension && fallbackExtension.length <= 6 ? fallbackExtension : "bin";
}

export function createWhatsAppMediaPath(input: {
  incomingMessageId: string;
  mediaId: string;
  mimeType: string;
  fallbackFilename?: string;
}) {
  const date = new Date().toISOString().slice(0, 10);
  const extension = fileExtensionForMimeType(input.mimeType, input.fallbackFilename);
  const filename = safeFilenamePart(input.fallbackFilename ?? input.mediaId);
  return `incoming/${date}/${input.incomingMessageId}/${filename}.${extension}`;
}

export async function storeWhatsAppMedia(input: {
  bytes: ArrayBuffer;
  path: string;
  mimeType: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(WHATSAPP_MEDIA_BUCKET).upload(input.path, Buffer.from(input.bytes), {
    contentType: input.mimeType,
    upsert: true
  });

  if (error) throw new Error(error.message);
  return input.path;
}
