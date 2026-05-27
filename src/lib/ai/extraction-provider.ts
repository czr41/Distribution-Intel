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
  transcriptionModel?: string | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

function sarvamErrorMessage(status: number, payload: unknown) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const normalized = text.toLowerCase();

  if (status === 403 || normalized.includes("invalid_api_key")) {
    return "Sarvam API key is invalid or does not have access to Document Intelligence.";
  }

  if (status === 429 || normalized.includes("insufficient_quota") || normalized.includes("quota")) {
    return "Sarvam quota exceeded. Check Sarvam credits or rate limits.";
  }

  return `Sarvam Vision failed: ${status} ${text}`;
}

async function sarvamJson(input: { url: string; apiKey: string; init?: RequestInit }) {
  const headers = new Headers(input.init?.headers);
  headers.set("api-subscription-key", input.apiKey);
  headers.set("Content-Type", "application/json");

  const response = await fetch(input.url, {
    ...input.init,
    headers
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(sarvamErrorMessage(response.status, payload));
  }

  return payload;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeFileName(name: string, fallback: string) {
  const cleaned = name.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "";
  return cleaned || fallback;
}

function fileExtension(fileName: string, mimeType: string) {
  const existing = fileName.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (existing) return existing;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  return "bin";
}

let crcTable: number[] | null = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
  return crcTable;
}

function crc32(buffer: Buffer) {
  const table = getCrcTable();
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function createStoredZip(fileName: string, bytes: ArrayBuffer) {
  const data = Buffer.from(bytes);
  const name = Buffer.from(fileName);
  const crc = crc32(data);
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(data.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(name.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(0, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(data.length, 20);
  centralHeader.writeUInt32LE(data.length, 24);
  centralHeader.writeUInt16LE(name.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(0, 42);

  const localPart = Buffer.concat([localHeader, name, data]);
  const centralPart = Buffer.concat([centralHeader, name]);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(1, 8);
  endRecord.writeUInt16LE(1, 10);
  endRecord.writeUInt32LE(centralPart.length, 12);
  endRecord.writeUInt32LE(localPart.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localPart, centralPart, endRecord]);
}

function findUrl(value: unknown): string | undefined {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findUrl(item);
      if (match) return match;
    }
  }
  if (isRecord(value)) {
    const preferredKeys = ["upload_url", "uploadUrl", "file_url", "fileUrl", "url", "signed_url", "signedUrl"];
    for (const key of preferredKeys) {
      const match = findUrl(value[key]);
      if (match) return match;
    }
    for (const item of Object.values(value)) {
      const match = findUrl(item);
      if (match) return match;
    }
  }
  return undefined;
}

function selectDownloadEntry(downloadUrls: unknown) {
  if (!isRecord(downloadUrls)) return undefined;

  const entries = Object.entries(downloadUrls);
  return (
    entries.find(([name]) => name.toLowerCase().endsWith(".json")) ??
    entries.find(([name]) => name.toLowerCase().endsWith(".md")) ??
    entries.find(([name]) => name.toLowerCase().endsWith(".html")) ??
    entries[0]
  );
}

function collectDocumentText(value: unknown, lines: string[] = [], depth = 0) {
  if (depth > 8) return lines;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 2 && !/^https?:\/\//i.test(trimmed)) lines.push(trimmed);
    return lines;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectDocumentText(item, lines, depth + 1));
    return lines;
  }
  if (isRecord(value)) {
    const priorityKeys = ["text", "content", "markdown", "html", "page_content", "pageContent", "transcription"];
    priorityKeys.forEach((key) => collectDocumentText(value[key], lines, depth + 1));
    Object.entries(value)
      .filter(([key]) => !priorityKeys.includes(key))
      .forEach(([, item]) => collectDocumentText(item, lines, depth + 1));
  }
  return lines;
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

  private get documentLanguage() {
    return process.env.SARVAM_VISION_LANGUAGE || "en-IN";
  }

  private async uploadDocument(input: { bytes: Buffer; fileName: string; mimeType: string; jobId: string; apiKey: string }) {
    const uploadLinks = await sarvamJson({
      url: `${this.baseUrl}/doc-digitization/job/v1/upload-files`,
      apiKey: input.apiKey,
      init: {
        method: "POST",
        body: JSON.stringify({
          job_id: input.jobId,
          files: [input.fileName]
        })
      }
    });
    const uploadUrls = isRecord(uploadLinks.upload_urls) ? uploadLinks.upload_urls : uploadLinks.uploadUrls;
    const uploadEntry = isRecord(uploadUrls) ? uploadUrls[input.fileName] ?? Object.values(uploadUrls)[0] : uploadUrls;
    const uploadUrl = findUrl(uploadEntry);

    if (!uploadUrl) throw new Error("Sarvam Vision did not return a document upload URL.");

    const headers: Record<string, string> = { "Content-Type": input.mimeType };
    if (uploadUrl.includes(".blob.core.windows.net")) {
      headers["x-ms-blob-type"] = "BlockBlob";
    }

    const uploadBody = new Uint8Array(input.bytes);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: uploadBody
    });

    if (!uploadResponse.ok) {
      throw new Error(`Sarvam Vision upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
    }
  }

  private async waitForDocumentJob(input: { jobId: string; apiKey: string }) {
    let latestStatus: Record<string, unknown> = {};

    for (let attempt = 0; attempt < 18; attempt += 1) {
      latestStatus = await sarvamJson({
        url: `${this.baseUrl}/doc-digitization/job/v1/${input.jobId}/status`,
        apiKey: input.apiKey,
        init: { method: "GET" }
      });
      const state = String(latestStatus.job_state ?? latestStatus.jobState ?? "");

      if (state === "Completed" || state === "PartiallyCompleted") return latestStatus;
      if (state === "Failed") {
        const detail = latestStatus.error_message ?? latestStatus.errorMessage ?? JSON.stringify(latestStatus);
        throw new Error(`Sarvam Vision job failed: ${detail}`);
      }

      await sleep(1500);
    }

    const state = String(latestStatus.job_state ?? latestStatus.jobState ?? "unknown");
    throw new Error(`Sarvam Vision job is still processing (${state}). Try again with a smaller file or retry in a moment.`);
  }

  private async downloadDocumentOutput(input: { jobId: string; apiKey: string }) {
    const downloadLinks = await sarvamJson({
      url: `${this.baseUrl}/doc-digitization/job/v1/${input.jobId}/download-files`,
      apiKey: input.apiKey,
      init: {
        method: "POST",
        body: JSON.stringify({})
      }
    });
    const entry = selectDownloadEntry(downloadLinks.download_urls ?? downloadLinks.downloadUrls);
    const downloadUrl = entry ? findUrl(entry[1]) : undefined;

    if (!downloadUrl) throw new Error("Sarvam Vision completed but did not return a readable output URL.");

    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Sarvam Vision output download failed: ${response.status} ${await response.text()}`);

    const name = entry[0].toLowerCase();
    const text = await response.text();
    if (name.endsWith(".json")) {
      try {
        const json = JSON.parse(text) as unknown;
        return collectDocumentText(json).join("\n").trim() || text;
      } catch {
        return text;
      }
    }

    return text;
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

  async runOCR(input: ImageInput): Promise<OCRResult> {
    const apiKey = this.apiKey;
    const bytes = await loadBytes(input);
    if (!apiKey || !bytes) return { text: "", confidenceScore: 0.2 };

    const ext = fileExtension(input.storagePath, input.mimeType);
    const sourceFileName = sanitizeFileName(input.storagePath, `document.${ext}`);
    const isPdf = input.mimeType === "application/pdf" || sourceFileName.toLowerCase().endsWith(".pdf");
    const isImage = input.mimeType === "image/png" || input.mimeType === "image/jpeg" || /\.(png|jpe?g)$/i.test(sourceFileName);

    if (!isPdf && !isImage) {
      throw new Error("Sarvam Vision supports PDF, PNG, and JPEG documents.");
    }

    const uploadName = isPdf ? sourceFileName.replace(/\.[^.]+$/, ".pdf") : `${sourceFileName.replace(/\.[^.]+$/, "")}.zip`;
    const uploadBytes = isPdf ? Buffer.from(bytes) : createStoredZip(sourceFileName, bytes);
    const uploadMimeType = isPdf ? "application/pdf" : "application/zip";
    const job = await sarvamJson({
      url: `${this.baseUrl}/doc-digitization/job/v1`,
      apiKey,
      init: {
        method: "POST",
        body: JSON.stringify({
          job_parameters: {
            language: this.documentLanguage,
            output_format: "json"
          }
        })
      }
    });
    const jobId = typeof job.job_id === "string" ? job.job_id : typeof job.jobId === "string" ? job.jobId : "";
    if (!jobId) throw new Error("Sarvam Vision did not return a job id.");

    await this.uploadDocument({ bytes: uploadBytes, fileName: uploadName, mimeType: uploadMimeType, jobId, apiKey });
    await sarvamJson({
      url: `${this.baseUrl}/doc-digitization/job/v1/${jobId}/start`,
      apiKey,
      init: {
        method: "POST",
        body: JSON.stringify({})
      }
    });
    await this.waitForDocumentJob({ jobId, apiKey });

    const text = await this.downloadDocumentOutput({ jobId, apiKey });
    return { text, confidenceScore: text ? 0.88 : 0.35 };
  }

  async classifyImage(input: ImageInput): Promise<ImageClassificationResult> {
    const ocr = await this.runOCR(input);
    const normalized = ocr.text.toLowerCase();

    return {
      label: normalized.includes("invoice") || normalized.includes("bill") ? "bill_or_invoice" : ocr.text ? "field_photo_with_text" : "media_needs_review",
      confidenceScore: ocr.confidenceScore
    };
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

    const requestChat = (body: unknown) =>
      fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

    const requestBody = {
      model: this.model,
      response_format: { type: "json_object" },
      messages
    };
    let response = await requestChat(requestBody);

    if (!response.ok) {
      const firstError = await response.text();
      let lastError = firstError;
      const normalizedError = firstError.toLowerCase();
      const fallbackBodies: unknown[] = [];

      if (response.status === 400 && normalizedError.includes("response_format")) {
        fallbackBodies.push({ model: this.model, messages });
      }

      if ((response.status === 400 || response.status === 404) && (normalizedError.includes("model") || normalizedError.includes("unsupported"))) {
        fallbackBodies.push({ model: "gpt-4.1-mini", response_format: { type: "json_object" }, messages });
        fallbackBodies.push({ model: "gpt-4.1-mini", messages });
      }

      for (const fallbackBody of fallbackBodies) {
        response = await requestChat(fallbackBody);
        if (response.ok) break;
        lastError = await response.text();
      }

      const providerError = lastError || firstError;
      const normalizedProviderError = providerError.toLowerCase();

      if (!response.ok && normalizedProviderError.includes("insufficient_quota")) {
        throw new Error("OpenAI quota exceeded. Check billing, credits, or the API key configured in Integrations.");
      }

      if (!response.ok && normalizedProviderError.includes("invalid_api_key")) {
        throw new Error("OpenAI API key is invalid. Replace the key in Integrations and try again.");
      }

      if (!response.ok) throw new Error(`OpenAI extraction failed: ${response.status} ${providerError}`);
    }

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
    formData.append("model", this.config.transcriptionModel || process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
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
