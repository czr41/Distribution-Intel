export type UserRole =
  | "super_admin"
  | "operations_manager"
  | "admin_operator"
  | "field_executive"
  | "brand_partner_viewer"
  | "brand_partner_manager";

export type RecordStatus =
  | "received"
  | "processing"
  | "extraction_ready"
  | "needs_review"
  | "clarification_required"
  | "verified"
  | "rejected"
  | "linked_to_record";

export type VerificationDecision = "approved" | "edited" | "rejected" | "clarification_requested" | "merged";

export type FieldMessageType = "text" | "voice" | "image" | "document" | "location" | "video";

export type ExtractionCategory =
  | "visit_update"
  | "bill_upload"
  | "order_request"
  | "payment_update"
  | "new_outlet_onboarding"
  | "complaint"
  | "competitor_information"
  | "stock_issue"
  | "merchandising_check"
  | "delivery_update"
  | "general_note"
  | "unknown";

export type Confidence = "high" | "medium" | "low";

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
}

export interface User extends AuditFields {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive";
}

export interface Brand extends AuditFields {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "active" | "inactive";
}

export interface Territory {
  id: string;
  name: string;
  city: string;
  state: string;
  region?: string;
  managerId?: string;
  status: "active" | "inactive";
}

export interface FieldExecutive extends AuditFields {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  whatsappNumber: string;
  territoryId?: string;
  managerId?: string;
  status: "active" | "inactive";
}

export interface Outlet extends AuditFields {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  channelType?: string;
  territoryId?: string;
  assignedExecutiveId?: string;
  status: "active" | "inactive" | "prospect" | "blacklisted";
}

export interface IncomingMessage extends AuditFields {
  id: string;
  provider: string;
  providerMessageId: string;
  senderPhone: string;
  senderUserId?: string;
  messageType: FieldMessageType;
  textBody?: string;
  mediaStoragePath?: string;
  latitude?: number;
  longitude?: number;
  receivedAt: string;
  processingStatus: RecordStatus;
  rawPayloadJson: unknown;
}

export interface StructuredExtractionResult {
  category: ExtractionCategory;
  language?: string;
  summary: string;
  entities: Record<string, { value: unknown; confidence: Confidence }>;
  suggestedActions: string[];
  needsHumanReview: boolean;
}

export interface MessageAIExtraction extends AuditFields {
  id: string;
  incomingMessageId: string;
  extractionType: ExtractionCategory;
  transcriptText?: string;
  ocrText?: string;
  detectedLanguage?: string;
  translatedText?: string;
  structuredJson: StructuredExtractionResult;
  confidenceScore: number;
  status: RecordStatus;
}

export interface VerificationQueueItem extends AuditFields {
  id: string;
  incomingMessageId: string;
  extractionId: string;
  assignedAdminId?: string;
  queueStatus: RecordStatus;
  priority: "low" | "medium" | "high" | "critical";
  reviewNotes?: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValueJson?: unknown;
  newValueJson?: unknown;
  createdAt: string;
}
