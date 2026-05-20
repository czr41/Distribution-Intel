import { NextResponse } from "next/server";
import type { IncomingMessage } from "@/domain/types";
import { createAIExtractionProvider } from "@/lib/ai/extraction-provider";
import { parseMetaWebhookMessages, verifyMetaSignature } from "@/lib/messaging/meta-whatsapp-provider";
import type { NormalizedIncomingMessage } from "@/lib/providers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type IntegrationRow = {
  app_secret: string | null;
  webhook_verify_token: string | null;
};

type AIProviderRow = {
  provider: "gemini" | "ollama_gemma" | "manual";
  model: string;
  api_key: string | null;
  base_url: string | null;
};

export const dynamic = "force-dynamic";

function toIncomingMessage(rowId: string, message: NormalizedIncomingMessage): IncomingMessage {
  const now = new Date().toISOString();

  return {
    id: rowId,
    provider: message.provider,
    providerMessageId: message.providerMessageId,
    senderPhone: message.senderPhone,
    messageType: message.messageType,
    textBody: message.textBody,
    mediaStoragePath: message.mediaUrl,
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
    .select("app_secret,webhook_verify_token")
    .eq("provider", "meta_whatsapp")
    .eq("status", "connected")
    .maybeSingle();

  if (integrationError) return NextResponse.json({ error: integrationError.message }, { status: 500 });
  const integrationRow = integration as IntegrationRow | null;
  if (!integrationRow?.app_secret) return NextResponse.json({ error: "Meta WhatsApp integration is not connected" }, { status: 409 });

  const signatureOk = verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), integrationRow.app_secret);
  if (!signatureOk) return NextResponse.json({ error: "Invalid Meta webhook signature" }, { status: 401 });

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

    const structured = await aiProvider.extractStructuredData({
      message: toIncomingMessage(incoming.id, message),
      imageClassification: message.mediaUrl?.startsWith("meta-media:") ? "meta_media_pending_download" : undefined
    });

    const { data: extraction, error: extractionError } = await supabase
      .from("message_ai_extractions")
      .insert({
        incoming_message_id: incoming.id,
        extraction_type: structured.category,
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
  }

  return NextResponse.json({ received: true, messages: messages.length });
}
