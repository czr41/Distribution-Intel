import type { Confidence, ExtractionCategory, IncomingMessage, StructuredExtractionResult } from "@/domain/types";
import type {
  AIExtractionProvider,
  AudioInput,
  ExtractionInput,
  ImageClassificationResult,
  ImageInput,
  OCRResult,
  TranscriptionResult
} from "@/lib/providers";

type ProviderConfig = {
  provider: "gemini" | "sarvam" | "openai" | "ollama_gemma" | "manual";
  model: string;
  apiKey?: string | null;
  baseUrl?: string | null;
};

type OpenAIMessage = {
  role: "system" | "user";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
};

const extractionSchema = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: [
        "visit_update",
        "bill_upload",
        "order_request",
        "payment_update",
        "new_outlet_onboarding",
        "complaint",
        "competitor_information",
        "stock_issue",
        "merchandising_check",
        "delivery_update",
        "general_note",
        "unknown"
      ]
    },
    language: { type: "string" },
    summary: { type: "string" },
    entities: { type: "object", additionalProperties: true },
    suggestedActions: { type: "array", items: { type: "string" } },
    needsHumanReview: { type: "boolean" }
  },
  required: ["category", "summary", "entities", "suggestedActions", "needsHumanReview"]
};

function fallbackCategory(text: string, messageType?: IncomingMessage["messageType"]): ExtractionCategory {
  const normalized = text.toLowerCase();
  if (messageType === "image" || normalized.includes("bill") || normalized.includes("invoice")) return "bill_upload";
  if (normalized.includes("payment") || normalized.includes("paid") || normalized.includes("pending")) return "payment_update";
  if (normalized.includes("order")) return "order_request";
  if (normalized.includes("competitor") || normalized.includes("scheme")) return "competitor_information";
  if (normalized.includes("stock")) return "stock_issue";
  if (normalized.includes("visit")) return "visit_update";
  return text ? "general_note" : "unknown";
}

function fallbackExtraction(input: ExtractionInput): StructuredExtractionResult {
  const text = [input.message.textBody, input.transcriptText, input.ocrText, input.imageClassification].filter(Boolean).join("\n");
  return {
    category: fallbackCategory(text, input.message.messageType),
    language: "unknown",
    summary: text ? text.slice(0, 220) : "Media received and queued for human review.",
    entities: {},
    suggestedActions: ["review_extraction", "link_outlet", "create_follow_up_if_needed"],
    needsHumanReview: true
  };
}

function asConfidence(value: unknown): Confidence {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function normalizeEntities(value: unknown): StructuredExtractionResult["entities"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, entity]) => {
      if (entity && typeof entity === "object" && "value" in entity) {
        const candidate = entity as { value: unknown; confidence?: unknown };
        return [key, { value: candidate.value, confidence: asConfidence(candidate.confidence) }];
      }

      return [key, { value: entity, confidence: "low" as const }];
    })
  );
}

function normalizeStructuredExtraction(value: unknown, input: ExtractionInput): StructuredExtractionResult {
  const fallback = fallbackExtraction(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  const result = value as Partial<StructuredExtractionResult>;
  return {
    category: typeof result.category === "string" ? (result.category as ExtractionCategory) : fallback.category,
    language: typeof result.language === "string" ? result.language : fallback.language,
    summary: typeof result.summary === "string" && result.summary ? result.summary : fallback.summary,
    entities: normalizeEntities(result.entities),
    suggestedActions: Array.isArray(result.suggestedActions) ? result.suggestedActions.map(String) : fallback.suggestedActions,
    needsHumanReview: typeof result.needsHumanReview === "boolean" ? result.needsHumanReview : true
  };
}

async function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

async function loadBytes(input: { bytes?: ArrayBuffer; mediaUrl?: string }) {
  if (input.bytes) return input.bytes;
  if (!input.mediaUrl || input.mediaUrl.startsWith("meta-media:")) return undefined;

  const response = await fetch(input.mediaUrl);
  if (!response.ok) return undefined;
  return response.arrayBuffer();
}

class GeminiExtractionProvider implements AIExtractionProvider {
  constructor(private readonly config: ProviderConfig) {}

  private async generateJson(contents: unknown[]) {
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API key");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: contents }],
        generationConfig: {
          response_mime_type: "application/json",
          response_json_schema: extractionSchema
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini extraction failed: ${response.status} ${await response.text()}`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini did not return structured text");
    return JSON.parse(text) as StructuredExtractionResult;
  }

  async transcribeAudio(input: AudioInput): Promise<TranscriptionResult> {
    const bytes = await loadBytes(input);
    if (!bytes) {
      return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
    }

    const result = await this.generateJson([
      { text: "Transcribe and translate this field sales voice note. Return structured JSON for the distribution command center." },
      { inline_data: { mime_type: input.mimeType, data: await arrayBufferToBase64(bytes) } }
    ]);

    return {
      originalText: result.summary,
      detectedLanguage: result.language,
      translatedText: result.summary,
      confidenceScore: result.needsHumanReview ? 0.65 : 0.9
    };
  }

  async runOCR(input: ImageInput): Promise<OCRResult> {
    const bytes = await loadBytes(input);
    if (!bytes) return { text: "", confidenceScore: 0.2 };

    const result = await this.generateJson([
      { text: "Read this image or bill and extract visible business text, amounts, dates, outlet names, SKUs, and payment details." },
      { inline_data: { mime_type: input.mimeType, data: await arrayBufferToBase64(bytes) } }
    ]);

    return { text: result.summary, confidenceScore: result.needsHumanReview ? 0.65 : 0.9 };
  }

  async classifyImage(input: ImageInput): Promise<ImageClassificationResult> {
    const ocr = await this.runOCR(input);
    return {
      label: ocr.text.toLowerCase().includes("bill") || ocr.text.toLowerCase().includes("invoice") ? "bill_or_invoice" : "field_photo",
      confidenceScore: ocr.confidenceScore
    };
  }

  async extractStructuredData(input: ExtractionInput): Promise<StructuredExtractionResult> {
    return this.generateJson([
      {
        text: `Convert this WhatsApp field update into JSON for human verification.
Message type: ${input.message.messageType}
Text: ${input.message.textBody ?? ""}
Transcript: ${input.transcriptText ?? ""}
OCR: ${input.ocrText ?? ""}
Image classification: ${input.imageClassification ?? ""}
Do not invent missing bill numbers or amounts. Mark uncertain fields for review.`
      }
    ]);
  }
}

class SarvamExtractionProvider implements AIExtractionProvider {
  constructor(private readonly config: ProviderConfig) {}

  private get apiKey() {
    return this.config.apiKey || process.env.SARVAM_API_KEY;
  }

  private get baseUrl() {
    return (this.config.baseUrl || "https://api.sarvam.ai").replace(/\/$/, "");
  }

  async transcribeAudio(input: AudioInput): Promise<TranscriptionResult> {
    const apiKey = this.apiKey;
    const bytes = await loadBytes(input);
    if (!apiKey || !bytes) {
      return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
    }

    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: input.mimeType }), `voice-note.${input.mimeType.split("/")[1] ?? "bin"}`);
    formData.append("model", this.config.model || "saaras:v3");
    formData.append("with_timestamps", "false");

    const response = await fetch(`${this.baseUrl}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey
      },
      body: formData
    });

    if (!response.ok) {
      return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
    }

    const data = await response.json();
    const text = data?.transcript ?? data?.transcript_text ?? data?.text ?? "";
    const language = data?.language_code ?? data?.language ?? data?.detected_language ?? "unknown";
    const confidence = typeof data?.confidence === "number" ? data.confidence : 0.82;

    return {
      originalText: text,
      detectedLanguage: language,
      translatedText: data?.translated_text ?? text,
      confidenceScore: confidence
    };
  }

  async runOCR(): Promise<OCRResult> {
    return { text: "", confidenceScore: 0.2 };
  }

  async classifyImage(): Promise<ImageClassificationResult> {
    return { label: "media_needs_review", confidenceScore: 0.2 };
  }

  async extractStructuredData(input: ExtractionInput): Promise<StructuredExtractionResult> {
    return fallbackExtraction(input);
  }
}

class OpenAIExtractionProvider implements AIExtractionProvider {
  constructor(private readonly config: ProviderConfig) {}

  private get apiKey() {
    return this.config.apiKey || process.env.OPENAI_API_KEY;
  }

  private get baseUrl() {
    return (this.config.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  }

  private get model() {
    return this.config.model || process.env.OPENAI_MODEL || "gpt-5.4-mini";
  }

  private async generateJson(messages: OpenAIMessage[]) {
    const apiKey = this.apiKey;
    if (!apiKey) throw new Error("Missing OpenAI API key");

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages
      })
    });

    if (!response.ok) throw new Error(`OpenAI extraction failed: ${response.status} ${await response.text()}`);

    const data = (await response.json()) as OpenAIChatResponse;
    const content = data.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : content?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error("OpenAI did not return structured text");

    return JSON.parse(text) as unknown;
  }

  async transcribeAudio(input: AudioInput): Promise<TranscriptionResult> {
    const apiKey = this.apiKey;
    const bytes = await loadBytes(input);
    if (!apiKey || !bytes) {
      return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
    }

    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: input.mimeType }), `voice-note.${input.mimeType.split("/")[1] ?? "bin"}`);
    formData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
    formData.append("response_format", "json");

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
    }

    const data = (await response.json()) as { text?: string; language?: string };
    return {
      originalText: data.text ?? "",
      detectedLanguage: data.language ?? "unknown",
      translatedText: data.text ?? "",
      confidenceScore: data.text ? 0.86 : 0.2
    };
  }

  async runOCR(input: ImageInput): Promise<OCRResult> {
    const bytes = await loadBytes(input);
    if (!bytes || !input.mimeType.startsWith("image/")) return { text: "", confidenceScore: 0.2 };

    const dataUrl = `data:${input.mimeType};base64,${await arrayBufferToBase64(bytes)}`;
    const result = (await this.generateJson([
      {
        role: "system",
        content: "You extract text from Indian field-sales evidence. Return JSON only."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Read this image carefully. Return {"text":"all visible text, amounts, dates, outlet names, SKU names, payment details","is_bill_or_invoice":true|false,"confidence":0.0}.'
          },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ])) as { text?: string; confidence?: number };

    return {
      text: result.text ?? "",
      confidenceScore: typeof result.confidence === "number" ? result.confidence : 0.82
    };
  }

  async classifyImage(input: ImageInput): Promise<ImageClassificationResult> {
    const ocr = await this.runOCR(input);
    const text = ocr.text.toLowerCase();

    return {
      label: text.includes("invoice") || text.includes("bill") ? "bill_or_invoice" : text ? "field_photo_with_text" : "field_photo",
      confidenceScore: ocr.confidenceScore
    };
  }

  async extractStructuredData(input: ExtractionInput): Promise<StructuredExtractionResult> {
    const result = await this.generateJson([
      {
        role: "system",
        content:
          "You convert WhatsApp field-sales inputs into human-review drafts for a distribution command center. Return JSON only with category, language, summary, entities, suggestedActions, needsHumanReview."
      },
      {
        role: "user",
        content: `Message type: ${input.message.messageType}
Text: ${input.message.textBody ?? ""}
Transcript: ${input.transcriptText ?? ""}
OCR: ${input.ocrText ?? ""}
Image classification: ${input.imageClassification ?? ""}

Return JSON using this shape:
{
  "category": "visit_update | bill_upload | order_request | payment_update | new_outlet_onboarding | complaint | competitor_information | stock_issue | merchandising_check | delivery_update | general_note | unknown",
  "language": "detected language",
  "summary": "short operational summary",
  "entities": {
    "outlet_name": { "value": "string or null", "confidence": "high | medium | low" }
  },
  "suggestedActions": ["review_extraction"],
  "needsHumanReview": true
}
Do not invent missing bill numbers, outlet names, dates, quantities, or amounts.`
      }
    ]);

    return normalizeStructuredExtraction(result, input);
  }
}

class FallbackExtractionProvider implements AIExtractionProvider {
  async transcribeAudio(): Promise<TranscriptionResult> {
    return { originalText: "", detectedLanguage: "unknown", translatedText: "", confidenceScore: 0.2 };
  }

  async runOCR(): Promise<OCRResult> {
    return { text: "", confidenceScore: 0.2 };
  }

  async extractStructuredData(input: ExtractionInput) {
    return fallbackExtraction(input);
  }

  async classifyImage(): Promise<ImageClassificationResult> {
    return { label: "media_needs_review", confidenceScore: 0.2 };
  }
}

export function createAIExtractionProvider(config?: ProviderConfig | null): AIExtractionProvider {
  if (config?.provider === "gemini" && (config.apiKey || process.env.GEMINI_API_KEY)) {
    return new GeminiExtractionProvider(config);
  }

  if (config?.provider === "sarvam" && (config.apiKey || process.env.SARVAM_API_KEY)) {
    return new SarvamExtractionProvider(config);
  }

  if (config?.provider === "openai" && (config.apiKey || process.env.OPENAI_API_KEY)) {
    return new OpenAIExtractionProvider(config);
  }

  return new FallbackExtractionProvider();
}
