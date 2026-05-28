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

const categoryRules: Record<ShipD2RCategory, string[]> = {
  visit_update: ["visited", "visit", "met", "went", "shop", "store", "outlet", "आज गया", "मिला"],
  order_intent: ["order", "need", "asked", "send", "boxes", "carton", "qty", "quantity", "चाहिए", "भेज", "ऑर्डर"],
  bill_or_invoice: ["bill", "invoice", "gst", "tax", "total", "amount", "बिल", "इनवॉइस", "राशि"],
  payment_update: ["paid", "received", "upi", "cash", "pending", "due", "collected", "partial", "payment", "₹", "rs", "पेमेंट", "बाकी", "उधार"],
  outlet_onboarding: ["new outlet", "new shop", "onboard", "owner", "phone", "address", "नया दुकान"],
  retailer_feedback: ["complaint", "feedback", "demand", "rejected", "price high", "replacement", "issue", "मांग", "शिकायत"],
  competitor_intel: ["competitor", "scheme", "margin", "offer", "discount", "free", "extra", "प्रतियोगी", "स्कीम", "मार्जिन"],
  sku_stock_update: ["stock", "stockout", "available", "shelf", "display", "pieces left", "inventory", "स्टॉक"],
  delivery_issue: ["delivery", "delay", "damaged", "missing", "short", "late", "टूटा", "देरी"],
  task_or_followup: ["follow up", "remind", "tomorrow", "call", "next week", "pending action", "फॉलो"],
  unclear: []
};

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

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreCategories(text: string, structured?: StructuredExtractionResult) {
  const normalized = normalizeText(text);
  const scores = new Map<ShipD2RCategory, number>();

  shipd2rCategories.forEach((category) => scores.set(category, 0));
  Object.entries(categoryRules).forEach(([category, keywords]) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    scores.set(category as ShipD2RCategory, score);
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
  const cleaned = value.replace(/[,₹\s]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function extractEntities(text: string, structured?: StructuredExtractionResult) {
  const entityValues = Object.fromEntries(
    Object.entries(structured?.entities ?? {}).map(([key, entity]) => [key, entity?.value])
  );
  const amountText = firstMatch(text, [
    /(?:pending|due|amount|total|payment|राशि|बाकी)[^\d₹]{0,20}(₹?\s?[\d,]+)/i,
    /(₹\s?[\d,]+)/,
    /\brs\.?\s?([\d,]+)/i
  ]);
  const quantity = firstMatch(text, [/(\d+\s?(?:boxes|box|cartons|carton|pcs|pieces|units|case|cases))/i, /(\d+\s?(?:बॉक्स|पीस))/i]);
  const margin = firstMatch(text, [/(\d+(?:\.\d+)?\s?%\s?(?:margin|scheme|discount)?)/i]);
  const outletName =
    String(entityValues.outlet_name ?? "") ||
    firstMatch(text, [
      /(?:visited|met|outlet|shop|store|दुकान[:\s]*)([A-Za-z0-9\u0900-\u097F&.\-\s]{3,50}?)(?: today| asked| owner| pending|$|,|\n)/i,
      /^([A-Za-z0-9\u0900-\u097F&.\-\s]{3,50}?)(?:\s+(?:store|stores|shop|mart|दुकान))/i
    ]);

  return {
    ...entityValues,
    outlet_name: outletName || entityValues.outlet_name || null,
    amount: numberFromText(amountText) ?? entityValues.bill_amount ?? entityValues.payment_pending ?? null,
    amount_pending: numberFromText(amountText) ?? entityValues.payment_pending ?? null,
    sku: entityValues.sku || firstMatch(text, [/\b(SKU\s?[A-Za-z0-9-]+)/i, /(?:product|item)\s+([A-Za-z0-9&.\-\s]{2,40})/i]) || null,
    quantity: quantity || entityValues.quantity || null,
    competitor_margin: margin || entityValues.competitor_margin || null,
    payment_status: /pending|due|बाकी|उधार/i.test(text) ? "pending" : /paid|received|collected|upi|cash/i.test(text) ? "collected" : null,
    visit_date: /today|आज/i.test(text) ? "today" : null,
    follow_up_date: /tomorrow|कल/i.test(text) ? "tomorrow" : null
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
}): ClassifiedSignal {
  const text = input.text.trim();
  const scores = scoreCategories(text, input.structured);
  const ranked = [...scores.entries()]
    .filter(([category, score]) => category !== "unclear" && score > 0)
    .sort((a, b) => b[1] - a[1]);
  const primaryCategory = ranked[0]?.[0] ?? "unclear";
  const secondaryCategories = ranked.slice(1, 5).map(([category]) => category);
  const entities = extractEntities(text, input.structured);
  const multiEvent = secondaryCategories.length > 0;
  const missingOutlet = !entities.outlet_name && primaryCategory !== "unclear";
  const confidence = primaryCategory === "unclear" ? 0.45 : Math.min(0.96, 0.58 + (ranked[0]?.[1] ?? 0) * 0.09 + secondaryCategories.length * 0.03);
  const requiresHumanReview = Boolean(input.structured?.needsHumanReview) || multiEvent || missingOutlet || confidence < 0.85;
  const reasonForReview = primaryCategory === "unclear"
    ? "Not enough signal to classify safely"
    : multiEvent
      ? "Multiple business events found in one message"
      : missingOutlet
        ? "Outlet name is missing or unclear"
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
        source_text: text,
        source_message_id: input.sourceMessageId ?? null,
        category: primaryCategory,
        secondary_categories: secondaryCategories
      }
    }));

  return {
    primaryCategory,
    secondaryCategories,
    confidence,
    extractedEntities: entities,
    requiresHumanReview,
    reasonForReview,
    draftRecords
  };
}
