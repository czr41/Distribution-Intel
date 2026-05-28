import type { SupabaseClient } from "@supabase/supabase-js";
import type { StructuredExtractionResult } from "@/domain/types";
import { classifyShipD2RSignal } from "./shipd2r-classifier";

type PersistInput = {
  supabase: SupabaseClient;
  incomingMessageId: string;
  extractionId: string;
  text: string;
  structured: StructuredExtractionResult;
  languageHint?: string;
};

export async function persistClassificationDrafts(input: PersistInput) {
  const classification = classifyShipD2RSignal({
    text: input.text,
    structured: input.structured,
    sourceMessageId: input.incomingMessageId,
    languageHint: input.languageHint
  });

  const { data: classificationRow, error: classificationError } = await input.supabase
    .from("message_classifications")
    .insert({
      incoming_message_id: input.incomingMessageId,
      extraction_id: input.extractionId,
      primary_category: classification.primaryCategory,
      secondary_categories: classification.secondaryCategories,
      confidence: classification.confidence,
      language_detected: classification.languageDetected,
      original_text: classification.originalText,
      normalized_text: classification.normalizedText,
      extracted_entities: classification.extractedEntities,
      requires_review: classification.requiresHumanReview,
      reason_for_review: classification.reasonForReview,
      status: "pending_admin_review"
    })
    .select("id")
    .single();

  if (classificationError) throw new Error(classificationError.message);

  if (classification.draftRecords.length > 0) {
    const { error: draftError } = await input.supabase.from("draft_business_records").insert(
      classification.draftRecords.map((draft) => ({
        incoming_message_id: input.incomingMessageId,
        extraction_id: input.extractionId,
        classification_id: classificationRow.id,
        record_type: draft.recordType,
        title: draft.title,
        draft_json: draft.draft,
        confidence: draft.confidence,
        status: "needs_review"
      }))
    );

    if (draftError) throw new Error(draftError.message);
  }

  return classification;
}
