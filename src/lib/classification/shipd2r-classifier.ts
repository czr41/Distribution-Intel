import type { StructuredExtractionResult } from "@/domain/types";

export const shipd2rCategories = [
  "visit_update",
  "order_intent",
  "bill_or_invoice",
  "payment_update",
  "outlet_onboarding",
  "retailer_feedback",
  "competitor_intel",
  "sku_stock_update",
  "delivery_issue",
  "task_or_followup",
  "unclear"
] as const;

export type ShipD2RCategory = (typeof shipd2rCategories)[number];
export type DraftRecordType = "visit" | "order" | "bill" | "payment" | "outlet" | "feedback" | "competitor_insight" | "stock_update" | "delivery_issue" | "task";

export type ClassifiedSignal = {
  primaryCategory: ShipD2RCategory;
  secondaryCategories: ShipD2RCategory[];
  confidence: number;
  languageDetected: string;
  originalText: string;
  normalizedText: string;
  extractedEntities: Record<string, unknown>;
  requiresHumanReview: boolean;
  reasonForReview: string;
  draftRecords: Array<{
    recordType: DraftRecordType;
    title: string;
    confidence: number;
    draft: Record<string, unknown>;
  }>;
};

type KeywordRule = {
  keyword: string;
  normalized: string;
  categories: ShipD2RCategory[];
};

const keywordRules: KeywordRule[] = [
  ...rule(["visited", "visit", "met", "went", "shop", "store", "outlet", "market"], "visit outlet store", ["visit_update"]),
  ...rule(["order", "need", "asked", "send", "boxes", "box", "carton", "qty", "quantity", "pieces", "units"], "order quantity boxes", ["order_intent"]),
  ...rule(["bill", "invoice", "gst", "tax", "total", "amount"], "bill invoice amount", ["bill_or_invoice"]),
  ...rule(["paid", "received", "upi", "cash", "pending", "due", "collected", "partial", "payment", "rs", "rupees"], "payment pending due collected", ["payment_update"]),
  ...rule(["new outlet", "new shop", "onboard", "owner", "phone", "address"], "new outlet onboarding owner phone address", ["outlet_onboarding"]),
  ...rule(["complaint", "feedback", "demand", "rejected", "price high", "replacement", "issue"], "retailer feedback complaint issue demand", ["retailer_feedback"]),
  ...rule(["competitor", "scheme", "margin", "offer", "discount", "free", "extra"], "competitor scheme margin offer discount", ["competitor_intel"]),
  ...rule(["stock", "stockout", "available", "shelf", "display", "pieces left", "inventory"], "stock shelf inventory", ["sku_stock_update"]),
  ...rule(["delivery", "delay", "damaged", "missing", "short", "late"], "delivery delay damaged missing", ["delivery_issue"]),
  ...rule(["follow up", "remind", "tomorrow", "call", "next week", "pending action"], "follow up reminder task", ["task_or_followup"]),

  ...rule(["\u0917\u092f\u093e", "\u0917\u0908", "\u092e\u093f\u0932\u093e", "\u0926\u0941\u0915\u093e\u0928", "\u0938\u094d\u091f\u094b\u0930"], "visited shop store outlet", ["visit_update"]),
  ...rule(["\u091a\u093e\u0939\u093f\u090f", "\u092d\u0947\u091c", "\u0911\u0930\u094d\u0921\u0930", "\u092c\u0949\u0915\u094d\u0938", "\u092a\u0940\u0938", "\u0928\u0917"], "order send boxes pieces quantity", ["order_intent"]),
  ...rule(["\u092c\u093f\u0932", "\u0907\u0928\u0935\u0949\u0907\u0938", "\u0930\u093e\u0936\u093f", "\u0915\u0941\u0932"], "bill invoice total amount", ["bill_or_invoice"]),
  ...rule(["\u092a\u0947\u092e\u0947\u0902\u091f", "\u092d\u0941\u0917\u0924\u093e\u0928", "\u092c\u093e\u0915\u0940", "\u0909\u0927\u093e\u0930", "\u0928\u0915\u0926"], "payment pending due cash", ["payment_update"]),
  ...rule(["\u0928\u092f\u093e \u0926\u0941\u0915\u093e\u0928", "\u092e\u093e\u0932\u093f\u0915", "\u092b\u094b\u0928", "\u092a\u0924\u093e"], "new outlet owner phone address", ["outlet_onboarding"]),
  ...rule(["\u0936\u093f\u0915\u093e\u092f\u0924", "\u092e\u093e\u0902\u0917", "\u0930\u0947\u091f", "\u092e\u0939\u0902\u0917\u093e", "\u092b\u0940\u0921\u092c\u0948\u0915"], "complaint demand price feedback", ["retailer_feedback"]),
  ...rule(["\u0938\u094d\u0915\u0940\u092e", "\u092e\u093e\u0930\u094d\u091c\u093f\u0928", "\u0911\u092b\u0930", "\u0921\u093f\u0938\u094d\u0915\u093e\u0909\u0902\u091f", "\u092a\u094d\u0930\u0924\u093f\u092f\u094b\u0917\u0940"], "competitor scheme margin offer discount", ["competitor_intel"]),
  ...rule(["\u0938\u094d\u091f\u0949\u0915", "\u0936\u0947\u0932\u094d\u092b", "\u0921\u093f\u0938\u094d\u092a\u094d\u0932\u0947"], "stock shelf display", ["sku_stock_update"]),
  ...rule(["\u0921\u093f\u0932\u093f\u0935\u0930\u0940", "\u0926\u0947\u0930\u0940", "\u091f\u0942\u091f\u093e", "\u0915\u092e"], "delivery delay damaged short", ["delivery_issue"]),
  ...rule(["\u092b\u0949\u0932\u094b", "\u0915\u0932", "\u0915\u0949\u0932", "\u092f\u093e\u0926"], "follow up tomorrow call reminder", ["task_or_followup"]),

  ...rule(["\u0aa6\u0ac1\u0a95\u0abe\u0aa8", "\u0ab8\u0acd\u0a9f\u0acb\u0ab0", "\u0aae\u0ab3\u0acd\u0aaf\u0abe"], "visited shop store outlet", ["visit_update"]),
  ...rule(["\u0a93\u0ab0\u0acd\u0aa1\u0ab0", "\u0a9c\u0acb\u0a88\u0a8f", "\u0aae\u0acb\u0a95\u0ab2\u0acb", "\u0aac\u0acb\u0a95\u0acd\u0ab8"], "order send boxes quantity", ["order_intent"]),
  ...rule(["\u0aac\u0abf\u0ab2", "\u0a87\u0aa8\u0ab5\u0acb\u0a87\u0ab8", "\u0ab0\u0a95\u0aae", "\u0a95\u0ac1\u0ab2"], "bill invoice amount total", ["bill_or_invoice"]),
  ...rule(["\u0aaa\u0ac7\u0aae\u0ac7\u0aa8\u0acd\u0a9f", "\u0aac\u0abe\u0a95\u0ac0", "\u0ab0\u0acb\u0a95\u0aa1", "\u0a89\u0aa7\u0abe\u0ab0"], "payment pending due cash", ["payment_update"]),
  ...rule(["\u0ab8\u0acd\u0a95\u0ac0\u0aae", "\u0aae\u0abe\u0ab0\u0acd\u0a9c\u0abf\u0aa8", "\u0a93\u0aab\u0ab0", "\u0aa1\u0abf\u0ab8\u0acd\u0a95\u0abe\u0a89\u0aa8\u0acd\u0a9f"], "competitor scheme margin offer discount", ["competitor_intel"]),
  ...rule(["\u0ab8\u0acd\u0a9f\u0acb\u0a95", "\u0ab6\u0ac7\u0ab2\u0acd\u0aab"], "stock shelf", ["sku_stock_update"]),

  ...rule(["\u0c85\u0c82\u0c97\u0ca1\u0cbf", "\u0cb8\u0ccd\u0c9f\u0ccb\u0cb0\u0ccd", "\u0cad\u0cc7\u0c9f\u0cbf"], "visited shop store outlet", ["visit_update"]),
  ...rule(["\u0c86\u0cb0\u0ccd\u0ca1\u0cb0\u0ccd", "\u0cac\u0cc7\u0c95\u0cc1", "\u0c95\u0cb3\u0cc1\u0cb9\u0cbf\u0cb8\u0cbf"], "order need send", ["order_intent"]),
  ...rule(["\u0cac\u0cbf\u0cb2\u0ccd", "\u0cae\u0cca\u0ca4\u0ccd\u0ca4"], "bill amount", ["bill_or_invoice"]),
  ...rule(["\u0caa\u0cc6\u0cae\u0cc6\u0c82\u0c9f\u0ccd", "\u0cac\u0cbe\u0c95\u0cbf", "\u0ca8\u0c97\u0ca6\u0cc1"], "payment pending cash", ["payment_update"]),

  ...rule(["\u0b95\u0b9f\u0bc8", "\u0bb8\u0bcd\u0b9f\u0bcb\u0bb0\u0bcd", "\u0b9a\u0ba8\u0bcd\u0ba4\u0bbf\u0ba4\u0bcd\u0ba4"], "visited shop store outlet", ["visit_update"]),
  ...rule(["\u0b86\u0bb0\u0bcd\u0b9f\u0bb0\u0bcd", "\u0bb5\u0bc7\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd", "\u0b85\u0ba9\u0bc1\u0baa\u0bcd\u0baa"], "order need send", ["order_intent"]),
  ...rule(["\u0baa\u0bbf\u0bb2\u0bcd", "\u0ba4\u0bca\u0b95\u0bc8"], "bill amount", ["bill_or_invoice"]),
  ...rule(["\u0baa\u0ba3\u0bae\u0bcd", "\u0baa\u0bc7\u0bae\u0bc6\u0ba3\u0bcd\u0b9f\u0bcd", "\u0baa\u0bbe\u0b95\u0bcd\u0b95\u0bbf"], "payment pending", ["payment_update"]),

  ...rule(["\u0c26\u0c41\u0c15\u0c3e\u0c23\u0c02", "\u0c38\u0c4d\u0c1f\u0c4b\u0c30\u0c4d", "\u0c15\u0c32\u0c3f\u0c38\u0c3f"], "visited shop store outlet", ["visit_update"]),
  ...rule(["\u0c06\u0c30\u0c4d\u0c21\u0c30\u0c4d", "\u0c15\u0c3e\u0c35\u0c3e\u0c32\u0c3f", "\u0c2a\u0c02\u0c2a\u0c02\u0c21\u0c3f"], "order need send", ["order_intent"]),
  ...rule(["\u0c2c\u0c3f\u0c32\u0c4d\u0c32\u0c41", "\u0c2e\u0c4a\u0c24\u0c4d\u0c24\u0c02"], "bill amount", ["bill_or_invoice"]),
  ...rule(["\u0c1a\u0c46\u0c32\u0c4d\u0c32\u0c3f\u0c02\u0c2a\u0c41", "\u0c2c\u0c3e\u0c15\u0c40"], "payment pending", ["payment_update"])
];

const legacyCategoryMap: Record<string, ShipD2RCategory> = {
  bill_upload: "bill_or_invoice",
  order_request: "order_intent",
  new_outlet_onboarding: "outlet_onboarding",
  complaint: "retailer_feedback",
  competitor_information: "competitor_intel",
  stock_issue: "sku_stock_update",
  merchandising_check: "sku_stock_update",
  delivery_update: "delivery_issue",
  general_note: "unclear",
  unknown: "unclear"
};

function rule(keywords: string[], normalized: string, categories: ShipD2RCategory[]): KeywordRule[] {
  return keywords.map((keyword) => ({ keyword, normalized, categories }));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectInputLanguage(text: string, languageHint?: string) {
  if (languageHint && languageHint !== "auto" && languageHint !== "unknown") return languageHint;
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
  if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa-IN";
  return text.trim() ? "en-IN" : "unknown";
}

export function normalizeBusinessText(text: string, structured?: StructuredExtractionResult) {
  const normalized = normalizeText(text);
  const hints = keywordRules
    .filter((item) => normalized.includes(normalizeText(item.keyword)))
    .map((item) => item.normalized);
  const summary = structured?.summary && normalizeText(structured.summary) !== normalized ? structured.summary : "";

  return unique([text, summary, ...hints])
    .filter(Boolean)
    .join("\n")
    .trim();
}

function scoreCategories(originalText: string, normalizedText: string, structured?: StructuredExtractionResult) {
  const searchable = normalizeText(`${originalText}\n${normalizedText}`);
  const scores = new Map<ShipD2RCategory, number>();

  shipd2rCategories.forEach((category) => scores.set(category, 0));
  keywordRules.forEach((item) => {
    if (searchable.includes(normalizeText(item.keyword)) || searchable.includes(normalizeText(item.normalized))) {
      item.categories.forEach((category) => scores.set(category, (scores.get(category) ?? 0) + 1));
    }
  });

  const aiCategory = structured?.category
    ? legacyCategoryMap[structured.category] ?? ((shipd2rCategories as readonly string[]).includes(structured.category) ? structured.category as ShipD2RCategory : undefined)
    : undefined;
  if (aiCategory) scores.set(aiCategory, (scores.get(aiCategory) ?? 0) + 2);

  return scores;
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function numberFromText(value: string) {
  const cleaned = value.replace(/[,\u20B9\s]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function extractEntities(originalText: string, normalizedText: string, structured?: StructuredExtractionResult) {
  const text = `${originalText}\n${normalizedText}`;
  const entityValues = Object.fromEntries(
    Object.entries(structured?.entities ?? {}).map(([key, entity]) => [key, entity?.value])
  );
  const amountText = firstMatch(text, [
    /(?:pending|due|amount|total|payment|bill|invoice|rupees|rs|[\u0930][\u093e][\u0936][\u093f]|[\u0ab0][\u0a95][\u0aae]|[\u092c][\u093e][\u0915][\u0940])[^\d\u20B9]{0,24}(\u20B9?\s?[\d,]+)/i,
    /(\u20B9\s?[\d,]+)/,
    /\brs\.?\s?([\d,]+)/i
  ]);
  const quantity = firstMatch(text, [
    /(\d+\s?(?:boxes|box|cartons|carton|pcs|pieces|units|case|cases))/i,
    /(\d+\s?(?:\u092c\u0949\u0915\u094d\u0938|\u092a\u0940\u0938|\u0aac\u0acb\u0a95\u0acd\u0ab8))/i
  ]);
  const margin = firstMatch(text, [/(\d+(?:\.\d+)?\s?%\s?(?:margin|scheme|discount)?)/i]);
  const outletName =
    String(entityValues.outlet_name ?? "") ||
    firstMatch(text, [
      /(?:visited|met|outlet|shop|store|dukan|dokan|\u0926\u0941\u0915\u093e\u0928|\u0aa6\u0ac1\u0a95\u0abe\u0aa8)[:\s-]*([A-Za-z0-9\u0900-\u097F\u0A80-\u0AFF\u0C80-\u0CFF\u0B80-\u0BFF\u0C00-\u0C7F&.\-\s]{3,55}?)(?: today| asked| owner| pending|$|,|\n)/i,
      /^([A-Za-z0-9\u0900-\u097F\u0A80-\u0AFF\u0C80-\u0CFF\u0B80-\u0BFF\u0C00-\u0C7F&.\-\s]{3,55}?)(?:\s+(?:store|stores|shop|mart|\u0926\u0941\u0915\u093e\u0928|\u0aa6\u0ac1\u0a95\u0abe\u0aa8))/i
    ]);

  return {
    ...entityValues,
    outlet_name: outletName || entityValues.outlet_name || null,
    amount: numberFromText(amountText) ?? entityValues.bill_amount ?? entityValues.payment_pending ?? null,
    amount_pending: numberFromText(amountText) ?? entityValues.payment_pending ?? null,
    sku: entityValues.sku || firstMatch(text, [/\b(SKU\s?[A-Za-z0-9-]+)/i, /(?:product|item|sku)\s+([A-Za-z0-9&.\-\s]{2,40})/i]) || null,
    quantity: quantity || entityValues.quantity || null,
    competitor_margin: margin || entityValues.competitor_margin || null,
    payment_status: /pending|due|baaki|udhar|\u092c\u093e\u0915\u0940|\u0909\u0927\u093e\u0930|\u0aac\u0abe\u0a95\u0ac0/i.test(text) ? "pending" : /paid|received|collected|upi|cash/i.test(text) ? "collected" : null,
    visit_date: /today|\u0906\u091c/i.test(text) ? "today" : null,
    follow_up_date: /tomorrow|\u0915\u0932/i.test(text) ? "tomorrow" : null
  };
}

function titleFor(type: DraftRecordType, outletName: unknown) {
  const outlet = typeof outletName === "string" && outletName ? outletName : "Unassigned outlet";
  const titles: Record<DraftRecordType, string> = {
    visit: `Visit update - ${outlet}`,
    order: `Order intent - ${outlet}`,
    bill: `Bill / invoice - ${outlet}`,
    payment: `Payment follow-up - ${outlet}`,
    outlet: `Outlet onboarding - ${outlet}`,
    feedback: `Retailer feedback - ${outlet}`,
    competitor_insight: `Competitor intel - ${outlet}`,
    stock_update: `SKU stock update - ${outlet}`,
    delivery_issue: `Delivery issue - ${outlet}`,
    task: `Follow-up task - ${outlet}`
  };
  return titles[type];
}

function draftTypeForCategory(category: ShipD2RCategory): DraftRecordType | undefined {
  const mapping: Partial<Record<ShipD2RCategory, DraftRecordType>> = {
    visit_update: "visit",
    order_intent: "order",
    bill_or_invoice: "bill",
    payment_update: "payment",
    outlet_onboarding: "outlet",
    retailer_feedback: "feedback",
    competitor_intel: "competitor_insight",
    sku_stock_update: "stock_update",
    delivery_issue: "delivery_issue",
    task_or_followup: "task"
  };
  return mapping[category];
}

export function classifyShipD2RSignal(input: {
  text: string;
  structured?: StructuredExtractionResult;
  sourceMessageId?: string;
  languageHint?: string;
}): ClassifiedSignal {
  const originalText = input.text.trim();
  const languageDetected = detectInputLanguage(originalText, input.languageHint || input.structured?.language);
  const normalizedText = normalizeBusinessText(originalText, input.structured);
  const scores = scoreCategories(originalText, normalizedText, input.structured);
  const ranked = [...scores.entries()]
    .filter(([category, score]) => category !== "unclear" && score > 0)
    .sort((a, b) => b[1] - a[1]);
  const primaryCategory = ranked[0]?.[0] ?? "unclear";
  const secondaryCategories = ranked.slice(1, 5).map(([category]) => category);
  const entities = extractEntities(originalText, normalizedText, input.structured);
  const multiEvent = secondaryCategories.length > 0;
  const missingOutlet = !entities.outlet_name && primaryCategory !== "unclear";
  const confidence = primaryCategory === "unclear" ? 0.45 : Math.min(0.96, 0.58 + (ranked[0]?.[1] ?? 0) * 0.09 + secondaryCategories.length * 0.03);
  const requiresHumanReview = Boolean(input.structured?.needsHumanReview) || multiEvent || missingOutlet || confidence < 0.85 || languageDetected !== "en-IN";
  const reasonForReview = primaryCategory === "unclear"
    ? "Not enough signal to classify safely"
    : multiEvent
      ? "Multiple business events found in one message"
      : missingOutlet
        ? "Outlet name is missing or unclear"
        : languageDetected !== "en-IN"
          ? "Non-English input should be checked by admin"
          : confidence < 0.85
            ? "Classifier confidence is below auto-approval threshold"
            : "Ready for admin confirmation";
  const categories = primaryCategory === "unclear" ? ["task_or_followup" as ShipD2RCategory] : unique([primaryCategory, ...secondaryCategories]);
  const draftRecords = categories
    .map((category) => draftTypeForCategory(category))
    .filter((type): type is DraftRecordType => Boolean(type))
    .map((recordType) => ({
      recordType,
      title: titleFor(recordType, entities.outlet_name),
      confidence,
      draft: {
        ...entities,
        source_text: originalText,
        normalized_text: normalizedText,
        language_detected: languageDetected,
        source_message_id: input.sourceMessageId ?? null,
        category: primaryCategory,
        secondary_categories: secondaryCategories
      }
    }));

  return {
    primaryCategory,
    secondaryCategories,
    confidence,
    languageDetected,
    originalText,
    normalizedText,
    extractedEntities: entities,
    requiresHumanReview,
    reasonForReview,
    draftRecords
  };
}
