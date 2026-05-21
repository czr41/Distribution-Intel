import { NextResponse } from "next/server";
import type { IncomingMessage } from "@/domain/types";
import { createAIExtractionProvider } from "@/lib/ai/extraction-provider";
import { MetaWhatsAppProvider, parseMetaMediaId, parseMetaWebhookMessages, verifyMetaSignature } from "@/lib/messaging/meta-whatsapp-provider";
import type { NormalizedIncomingMessage } from "@/lib/providers";
import { createWhatsAppMediaPath, storeWhatsAppMedia } from "@/lib/storage/whatsapp-media";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type IntegrationRow = {
  app_secret: string | null;
  webhook_verify_token: string | null;
  access_token: string | null;
  phone_number_id: string | null;
  graph_api_version: string | null;
};

type AIProviderRow = {
  provider: "gemini" | "ollama_gemma" | "manual";
  model: string;
  api_key: string | null;
  base_url: string | null;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toIncomingMessage(rowId: string, message: NormalizedIncomingMessage, mediaStoragePath?: string): IncomingMessage {
  const now = new Date().toISOString();

  return {
    id: rowId,
    provider: message.provider,
    providerMessageId: message.providerMessageId,
    senderPhone: message.senderPhone,
    messageType: message.messageType,
    textBody: message.textBody,
    mediaStoragePath,
    latitude: message.latitude,
    longitude: message.longitude,
    receivedAt: now,
    processingStatus: "needs_review",
    rawPayloadJson: message.rawPayloadJson,
    createdAt: now,
    updatedAt: now
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integration_settings")
    .select("webhook_verify_token")
    .eq("provider", "meta_whatsapp")
    .neq("status", "disabled")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (mode === "subscribe" && challenge && token && token === data?.webhook_verify_token) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid webhook verification token" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  const messages = parseMetaWebhookMessages(payload);

  const supabase = createSupabaseAdminClient();
  const { data: integration, error: integrationError } = await supabase
    .from("integration_settings")
    .select("app_secret,webhook_verify_token,access_token,phone_number_id,graph_api_version")
    .eq("provider", "meta_whatsapp")
    .eq("status", "connected")
    .maybeSingle();

  if (integrationError) return NextResponse.json({ error: integrationError.message }, { status: 500 });
  const integrationRow = integration as IntegrationRow | null;
  if (!integrationRow?.app_secret || !integrationRow.access_token || !integrationRow.phone_number_id) {
    return NextResponse.json({ error: "Meta WhatsApp integration is not fully connected" }, { status: 409 });
  }

  const signatureOk = verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), integrationRow.app_secret);
  if (!signatureOk) return NextResponse.json({ error: "Invalid Meta webhook signature" }, { status: 401 });

  const metaProvider = new MetaWhatsAppProvider({
    accessToken: integrationRow.access_token,
    appSecret: integrationRow.app_secret,
    phoneNumberId: integrationRow.phone_number_id,
    graphApiVersion: integrationRow.graph_api_version ?? "v25.0"
  });

  const { data: aiSettings } = await supabase
    .from("ai_provider_settings")
    .select("provider,model,api_key,base_url")
    .eq("status", "connected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const aiSettingsRow = aiSettings as AIProviderRow | null;
  const aiProvider = createAIExtractionProvider(
    aiSettingsRow
      ? {
          provider: aiSettingsRow.provider,
          model: aiSettingsRow.model,
          apiKey: aiSettingsRow.api_key,
          baseUrl: aiSettingsRow.base_url
        }
      : null
  );

  for (const message of messages) {
    const { data: incoming, error: incomingError } = await supabase
      .from("incoming_messages")
      .upsert(
        {
          provider: message.provider,
          provider_message_id: message.providerMessageId,
          sender_phone: message.senderPhone,
          message_type: message.messageType,
          text_body: message.textBody,
          media_url: message.mediaUrl,
          latitude: message.latitude,
          longitude: message.longitude,
          received_at: new Date().toISOString(),
          processing_status: "needs_review",
          raw_payload_json: message.rawPayloadJson
        },
        { onConflict: "provider,provider_message_id" }
      )
      .select("id")
      .single();

    if (incomingError) throw new Error(incomingError.message);

    let mediaStoragePath: string | undefined;
    let mediaBytes: ArrayBuffer | undefined;
    let mediaMimeType = message.mediaMimeType;
    const mediaId = parseMetaMediaId(message.mediaUrl);

    if (mediaId) {
      const media = await metaProvider.downloadMedia(mediaId);
      mediaBytes = media.bytes;
      mediaMimeType = media.mimeType;
      mediaStoragePath = await storeWhatsAppMedia({
        bytes: media.bytes,
        mimeType: media.mimeType,
        path: createWhatsAppMediaPath({
          incomingMessageId: incoming.id,
          mediaId,
          mimeType: media.mimeType,
          fallbackFilename: message.mediaFilename
        })
      });

      await supabase
        .from("incoming_messages")
        .update({
          media_storage_path: mediaStoragePath,
          media_url: message.mediaUrl,
          processing_status: "processing"
        })
        .eq("id", incoming.id);
    }

    let transcriptText: string | undefined;
    let ocrText: string | undefined;
    let imageClassification: string | undefined;

    if (mediaBytes && mediaStoragePath && mediaMimeType) {
      if (message.messageType === "voice") {
        const transcription = await aiProvider.transcribeAudio({
          bytes: mediaBytes,
          storagePath: mediaStoragePath,
          mimeType: mediaMimeType
        });
        transcriptText = transcription.originalText || transcription.translatedText;
      }

      if (message.messageType === "image" || message.messageType === "document") {
        const [ocr, classification] = await Promise.all([
          aiProvider.runOCR({
            bytes: mediaBytes,
            storagePath: mediaStoragePath,
            mimeType: mediaMimeType
          }),
          aiProvider.classifyImage?.({
            bytes: mediaBytes,
            storagePath: mediaStoragePath,
            mimeType: mediaMimeType
          })
        ]);
        ocrText = ocr.text;
        imageClassification = classification?.label;
      }

      if (message.messageType === "video") {
        imageClassification = "video_media_stored_for_review";
      }
    }

    const structured = await aiProvider.extractStructuredData({
      message: toIncomingMessage(incoming.id, message, mediaStoragePath),
      transcriptText,
      ocrText,
      imageClassification
    });

    const { data: extraction, error: extractionError } = await supabase
      .from("message_ai_extractions")
      .insert({
        incoming_message_id: incoming.id,
        extraction_type: structured.category,
        transcript_text: transcriptText,
        ocr_text: ocrText,
        detected_language: structured.language,
        translated_text: transcriptText,
        structured_json: structured,
        confidence_score: structured.needsHumanReview ? 0.62 : 0.88,
        status: "needs_review"
      })
      .select("id")
      .single();

    if (extractionError) throw new Error(extractionError.message);

    await supabase.from("verification_queue").insert({
      incoming_message_id: incoming.id,
      extraction_id: extraction.id,
      queue_status: "needs_review",
      priority: structured.needsHumanReview ? "high" : "medium"
    });

    await supabase.from("incoming_messages").update({ processing_status: "needs_review" }).eq("id", incoming.id);
  }

  return NextResponse.json({ received: true, messages: messages.length });
}
