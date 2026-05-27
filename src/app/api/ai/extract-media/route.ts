import { NextResponse } from "next/server";
import type { FieldMessageType, IncomingMessage } from "@/domain/types";
import { createAIExtractionProvider } from "@/lib/ai/extraction-provider";
import { createSupabaseReadClient } from "@/lib/supabase/admin";

type AIProviderRow = {
  provider: "gemini" | "sarvam" | "openai" | "ollama_gemma" | "manual";
  model: string;
  api_key: string | null;
  base_url: string | null;
  config_json: unknown;
};

type OpenAIFallbackConfig = {
  status?: string;
  model?: string;
  transcriptionModel?: string;
  baseUrl?: string;
  apiKey?: string;
};
type MediaProviderMode = "auto" | "sarvam" | "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function mediaKind(mimeType: string | undefined, hasFile: boolean): FieldMessageType {
  if (!hasFile) return "text";
  if (mimeType?.startsWith("audio/")) return "voice";
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "document";
  if (mimeType?.startsWith("video/")) return "video";
  return "document";
}

function createLabMessage(input: {
  id: string;
  messageType: FieldMessageType;
  textBody?: string;
  fileName?: string;
}): IncomingMessage {
  const now = new Date().toISOString();

  return {
    id: input.id,
    provider: "media_lab",
    providerMessageId: input.id,
    senderPhone: "media-lab",
    messageType: input.messageType,
    textBody: input.textBody,
    mediaStoragePath: input.fileName,
    receivedAt: now,
    processingStatus: "needs_review",
    rawPayloadJson: { source: "media_lab", fileName: input.fileName },
    createdAt: now,
    updatedAt: now
  };
}

async function getConnectedAIProvider() {
  try {
    const supabase = createSupabaseReadClient();
    const { data } = await supabase
      .from("ai_provider_settings")
      .select("provider,model,api_key,base_url,config_json")
      .eq("status", "connected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data as AIProviderRow | null;
  } catch {
    return null;
  }
}

function getOpenAIFallbackConfig(config: unknown): OpenAIFallbackConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  const openAI = (config as { openaiFallback?: unknown }).openaiFallback;
  if (!openAI || typeof openAI !== "object" || Array.isArray(openAI)) return {};
  return openAI as OpenAIFallbackConfig;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Media extraction failed. Check provider settings and try again.";
}

function mediaProviderMode(value: FormDataEntryValue | null): MediaProviderMode {
  const normalized = String(value ?? "auto").trim().toLowerCase();
  return normalized === "sarvam" || normalized === "openai" ? normalized : "auto";
}

async function extractMedia(request: Request) {
  const formData = await request.formData();
  const fileInput = formData.get("file");
  const file = fileInput instanceof File && fileInput.size > 0 ? fileInput : null;
  const note = String(formData.get("note") ?? "").trim();
  const providerMode = mediaProviderMode(formData.get("providerMode"));
  const bytes = file ? await file.arrayBuffer() : undefined;
  const kind = mediaKind(file?.type, Boolean(file));
  const providerSettings = await getConnectedAIProvider();
  const openAIConfig = getOpenAIFallbackConfig(providerSettings?.config_json);
  const primaryProvider = createAIExtractionProvider(
    providerSettings
      ? {
          provider: providerSettings.provider,
          model: providerSettings.model,
          apiKey: providerSettings.api_key,
          baseUrl: providerSettings.base_url
        }
      : null
  );
  const openAIAvailable = openAIConfig.status !== "Disabled" && Boolean(openAIConfig.apiKey || process.env.OPENAI_API_KEY);
  const openAIFallbackProvider = openAIAvailable
    ? createAIExtractionProvider({
        provider: "openai",
        model: openAIConfig.model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
        transcriptionModel: openAIConfig.transcriptionModel || process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
        apiKey: openAIConfig.apiKey || process.env.OPENAI_API_KEY,
        baseUrl: openAIConfig.baseUrl || null
      })
    : null;
  const sarvamProvider = createAIExtractionProvider({
    provider: "sarvam",
    model: providerSettings?.provider === "sarvam" ? providerSettings.model : "saaras:v3",
    apiKey: providerSettings?.provider === "sarvam" ? providerSettings.api_key : process.env.SARVAM_API_KEY,
    baseUrl: providerSettings?.provider === "sarvam" ? providerSettings.base_url : null
  });
  let mediaProvider = providerMode === "sarvam" ? sarvamProvider : providerMode === "openai" && openAIFallbackProvider ? openAIFallbackProvider : primaryProvider;
  let mediaProviderName = providerMode === "sarvam" ? "sarvam" : providerMode === "openai" ? "openai" : providerSettings?.provider ?? "fallback";
  let mediaModel =
    providerMode === "sarvam"
      ? providerSettings?.provider === "sarvam" ? providerSettings.model : "saaras:v3"
      : providerMode === "openai"
        ? openAIConfig.model || process.env.OPENAI_MODEL || "gpt-5.4-mini"
        : providerSettings?.model ?? "fallback";
  let fallbackWarning = "";
  const geminiFallbackProvider =
    process.env.GEMINI_API_KEY && (kind === "image" || kind === "document")
      ? createAIExtractionProvider({
          provider: "gemini",
          model: "gemini-2.5-flash",
          apiKey: process.env.GEMINI_API_KEY,
          baseUrl: null
        })
      : null;

  let transcriptText = "";
  let ocrText = "";
  let imageClassification = "";

  if (providerMode === "openai" && !openAIFallbackProvider) {
    throw new Error("OpenAI is not configured. Save an OpenAI API key in Integrations first.");
  }

  if (bytes && file?.type && kind === "voice") {
    const transcription = await mediaProvider.transcribeAudio({
      bytes,
      storagePath: file.name,
      mimeType: file.type
    });
    transcriptText = transcription.translatedText || transcription.originalText;

    if (!transcriptText && providerMode === "auto" && openAIFallbackProvider) {
      const fallbackTranscription = await openAIFallbackProvider.transcribeAudio({
        bytes,
        storagePath: file.name,
        mimeType: file.type
      });
      transcriptText = fallbackTranscription.translatedText || fallbackTranscription.originalText;
    }
  }

  if (bytes && file?.type && (kind === "image" || kind === "document")) {
    let ocr: { text: string; confidenceScore: number };

    try {
      ocr = await mediaProvider.runOCR({ bytes, storagePath: file.name, mimeType: file.type });
    } catch (primaryError) {
      const primaryMessage = errorMessage(primaryError);

      if (geminiFallbackProvider) {
        fallbackWarning = `${mediaProviderName} OCR failed: ${primaryMessage}. Used Gemini fallback.`;
        mediaProvider = geminiFallbackProvider;
        mediaProviderName = "gemini";
        mediaModel = "gemini-2.5-flash";
        ocr = await mediaProvider.runOCR({ bytes, storagePath: file.name, mimeType: file.type });
      } else if (providerMode === "auto" && openAIFallbackProvider && mediaProviderName !== "openai") {
        fallbackWarning = `${mediaProviderName} OCR failed: ${primaryMessage}. Used OpenAI fallback.`;
        mediaProvider = openAIFallbackProvider;
        mediaProviderName = "openai";
        mediaModel = openAIConfig.model || process.env.OPENAI_MODEL || "gpt-5.4-mini";
        ocr = await mediaProvider.runOCR({ bytes, storagePath: file.name, mimeType: file.type });
      } else {
        throw primaryError;
      }
    }

    ocrText = ocr.text;
    imageClassification = ocrText.toLowerCase().includes("invoice") || ocrText.toLowerCase().includes("bill")
      ? "bill_or_invoice"
      : ocrText
        ? "field_photo_with_text"
        : "";

    if (!imageClassification && mediaProvider.classifyImage) {
      const classification = await mediaProvider.classifyImage({ bytes, storagePath: file.name, mimeType: file.type });
      imageClassification = classification.label;
    }
  }

  if (kind === "video") {
    imageClassification = "video_media_uploaded_for_review";
  }

  const message = createLabMessage({
    id: `media-lab-${Date.now()}`,
    messageType: kind,
    textBody: note,
    fileName: file?.name
  });
  const structured = await mediaProvider.extractStructuredData({
    message,
    transcriptText,
    ocrText,
    imageClassification
  });

  return NextResponse.json({
    fileName: file?.name ?? "Text only",
    fileType: file?.type ?? "text/plain",
    mediaKind: kind,
    provider: mediaProviderName,
    model: mediaModel,
    providerMode,
    fallbackProvider: fallbackWarning ? mediaProviderName : "",
    transcriptText,
    ocrText,
    imageClassification,
    extractedText: [note, transcriptText, ocrText].filter(Boolean).join("\n\n"),
    structured,
    warning: fallbackWarning
      ? fallbackWarning
      : !transcriptText && !ocrText && kind !== "text"
        ? "No machine text was extracted yet. Check the connected provider or route this media for manual review."
        : ""
  });
}

export async function POST(request: Request) {
  try {
    return await extractMedia(request);
  } catch (error) {
    console.error("Media extraction failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
