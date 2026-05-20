import type { ExtractionCategory, IncomingMessage, StructuredExtractionResult } from "@/domain/types";
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
  provider: "gemini" | "ollama_gemma" | "manual";
  model: string;
  apiKey?: string | null;
  baseUrl?: string | null;
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

  return new FallbackExtractionProvider();
}
