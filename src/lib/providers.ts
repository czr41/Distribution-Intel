import type { IncomingMessage, StructuredExtractionResult } from "../domain/types";

export interface NormalizedIncomingMessage {
  provider: string;
  providerMessageId: string;
  senderPhone: string;
  messageType: IncomingMessage["messageType"];
  textBody?: string;
  mediaUrl?: string;
  latitude?: number;
  longitude?: number;
  rawPayloadJson: unknown;
}

export interface MessagingProvider {
  verifyWebhookSignature(request: Request): Promise<boolean>;
  parseIncomingMessage(payload: unknown): Promise<NormalizedIncomingMessage>;
  sendTextMessage(to: string, message: string): Promise<void>;
  sendMediaMessage?(to: string, mediaUrl: string, caption?: string): Promise<void>;
}

export interface AudioInput {
  storagePath: string;
  mimeType: string;
}

export interface ImageInput {
  storagePath: string;
  mimeType: string;
}

export interface ExtractionInput {
  message: IncomingMessage;
  transcriptText?: string;
  ocrText?: string;
  imageClassification?: string;
}

export interface TranscriptionResult {
  originalText: string;
  detectedLanguage?: string;
  translatedText?: string;
  confidenceScore: number;
}

export interface OCRResult {
  text: string;
  confidenceScore: number;
}

export interface ImageClassificationResult {
  label: string;
  confidenceScore: number;
}

export interface AIExtractionProvider {
  transcribeAudio(input: AudioInput): Promise<TranscriptionResult>;
  runOCR(input: ImageInput): Promise<OCRResult>;
  extractStructuredData(input: ExtractionInput): Promise<StructuredExtractionResult>;
  classifyImage?(input: ImageInput): Promise<ImageClassificationResult>;
}

export interface EvidenceStorageProvider {
  putObject(input: { bytes: ArrayBuffer; path: string; mimeType: string }): Promise<{ storagePath: string }>;
  createSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>;
}
