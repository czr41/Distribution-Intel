"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppUserRow, BillRow, BrandOption, GoodsReceiptRow, MaterialFlowRow, OrderRow, OutletRow, PaymentRow, ProcurementOffice, PurchaseOrderRow, SalesmanRow, SkuRow, SupplierPayableRow, TaskRow, TerritoryRow, VerificationDraftRecord } from "./types";

const statusMap = {
  Active: "active",
  Prospect: "prospect",
  Inactive: "inactive"
} as const;

const brandSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contact: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const procurementOfficeSchema = z.object({
  brand: z.string().min(1),
  officeName: z.string().min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  contact: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  procurementRole: z.string().min(1),
  leadTimeDays: z.string().optional(),
  replenishmentMode: z.string().min(1),
  status: z.enum(["Primary", "Alternate", "Inactive"])
});

const materialFlowSchema = z.object({
  brand: z.string().min(1),
  sku: z.string().min(1),
  movementType: z.enum(["Inbound procurement", "Outbound sale", "Billed dispatch", "Return / hold"]),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  quantity: z.string().min(1),
  value: z.string().optional(),
  expectedDate: z.string().optional(),
  status: z.string().min(1),
  documentRef: z.string().optional()
});

const purchaseOrderSchema = z.object({
  brand: z.string().min(1),
  officeName: z.string().min(1),
  poNumber: z.string().min(1),
  expectedDate: z.string().optional(),
  totalValue: z.string().optional(),
  status: z.enum(["Draft", "Sent", "Confirmed", "Partially received", "Received", "Cancelled"])
});

const goodsReceiptSchema = z.object({
  brand: z.string().min(1),
  officeName: z.string().optional(),
  poNumber: z.string().min(1),
  receiptNumber: z.string().min(1),
  receivedDate: z.string().optional(),
  warehouse: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.string().optional(),
  value: z.string().optional(),
  status: z.enum(["Draft", "Received", "Quality hold", "Posted", "Cancelled"])
});

const supplierPayableSchema = z.object({
  brand: z.string().min(1),
  officeName: z.string().optional(),
  poNumber: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().optional(),
  amountDue: z.string().min(1),
  amountPaid: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["Pending", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"])
});

const archiveSchema = z.object({
  type: z.enum(["brand", "procurementOffice", "materialFlow", "sku", "outlet", "salesman", "user", "task", "territory", "payment", "order", "bill", "purchaseOrder", "goodsReceipt", "supplierPayable"]),
  id: z.string().uuid()
});

const outletSchema = z.object({
  name: z.string().min(1),
  owner: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  channel: z.string().min(1),
  brand: z.string().optional(),
  territory: z.string().optional(),
  assignedSalesman: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Inactive"]),
  creditLimit: z.string().optional(),
  creditHoldStatus: z.enum(["Clear", "Watch", "Hold", "Blocked"])
});

const creditHoldStatusMap = {
  Clear: "clear",
  Watch: "watch",
  Hold: "hold",
  Blocked: "blocked"
} as const;

const salesmanSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  territory: z.string().min(1),
  status: z.enum(["Active", "Inactive"])
});

const userRoleMap = {
  Admin: "super_admin",
  Manager: "operations_manager",
  "Admin Operator": "admin_operator",
  "Sales Executive": "field_executive",
  "Brand Viewer": "brand_partner_viewer",
  "Brand Manager": "brand_partner_manager",
  "Finance": "finance_collections",
  "Integration": "integration_user"
} as const;

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  role: z.enum(["Admin", "Manager", "Admin Operator", "Sales Executive", "Brand Viewer", "Brand Manager", "Finance", "Integration"]),
  territory: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const taskStatusMap = {
  Open: "open",
  "In progress": "in_progress",
  "Waiting for response": "waiting_for_response",
  Completed: "completed",
  Cancelled: "cancelled",
  Overdue: "overdue"
} as const;

const taskPriorityMap = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical"
} as const;

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  taskType: z.string().min(1),
  assignedTo: z.string().optional(),
  outlet: z.string().min(1),
  brand: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Open", "In progress", "Waiting for response", "Completed", "Cancelled", "Overdue"])
});

const territorySchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  region: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const skuSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  brand: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  mrp: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"])
});

const paymentStatusMap = {
  Due: "due",
  "Partially paid": "partially_paid",
  Paid: "paid",
  Overdue: "overdue",
  Disputed: "disputed",
  "Written off": "written_off"
} as const;

const riskLevelMap = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical"
} as const;

const writeOffStatusMap = {
  "Not requested": "not_requested",
  Requested: "requested",
  Approved: "approved",
  Rejected: "rejected"
} as const;

const disputeStatusMap = {
  "Not disputed": "not_disputed",
  Opened: "opened",
  "Under review": "under_review",
  Resolved: "resolved",
  Rejected: "rejected"
} as const;

const settlementStatusMap = {
  Unreconciled: "unreconciled",
  Matched: "matched",
  Exception: "exception",
  Settled: "settled"
} as const;

const paymentSchema = z.object({
  outlet: z.string().min(1),
  brand: z.string().min(1),
  billNumber: z.string().optional(),
  amountDue: z.string().min(1),
  amountCollected: z.string().optional(),
  dueDate: z.string().optional(),
  promisedPaymentDate: z.string().optional(),
  paymentMode: z.string().optional(),
  status: z.enum(["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
  receiptNumber: z.string().optional(),
  collectorName: z.string().optional(),
  allocationSummary: z.string().optional(),
  writeOffStatus: z.enum(["Not requested", "Requested", "Approved", "Rejected"]),
  disputeStatus: z.enum(["Not disputed", "Opened", "Under review", "Resolved", "Rejected"]),
  settlementStatus: z.enum(["Unreconciled", "Matched", "Exception", "Settled"]),
  settlementReference: z.string().optional(),
  settlementDate: z.string().optional()
});

const orderStatusMap = {
  "Intent captured": "intent_captured",
  Confirmed: "confirmed",
  Billed: "billed",
  Delivered: "delivered",
  Cancelled: "cancelled",
  "On hold": "on_hold"
} as const;

const orderSchema = z.object({
  outlet: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.string().min(1),
  unitPrice: z.string().optional(),
  expectedValue: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  status: z.enum(["Intent captured", "Confirmed", "Billed", "Delivered", "Cancelled", "On hold"])
});

const billSchema = z.object({
  outlet: z.string().min(1),
  brand: z.string().min(1),
  linkedOrderId: z.string().uuid().optional().or(z.literal("")),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  totalAmount: z.string().min(1),
  paymentStatus: z.enum(["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]),
  billImagePath: z.string().optional()
});

const connectionStatusMap = {
  Connected: "connected",
  Draft: "draft",
  Disabled: "disabled"
} as const;

const metaIntegrationSchema = z.object({
  displayName: z.string().min(1),
  phoneNumberId: z.string().min(1),
  whatsappBusinessAccountId: z.string().min(1),
  businessPortfolioId: z.string().optional(),
  graphApiVersion: z.string().min(1),
  webhookVerifyToken: z.string().optional(),
  accessToken: z.string().optional(),
  appSecret: z.string().optional(),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const aiProviderSchema = z.object({
  provider: z.enum(["gemini", "sarvam", "openai", "ollama_gemma", "manual"]),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  extractionMode: z.enum(["structured_json", "draft_only"]),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const openAIIntegrationSchema = z.object({
  model: z.string().min(1),
  transcriptionModel: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const verificationDraftSchema = z.object({
  id: z.string().uuid(),
  recordType: z.string().min(1),
  title: z.string().min(1),
  outletName: z.string().optional(),
  brandName: z.string().optional(),
  amount: z.string().optional(),
  quantity: z.string().optional(),
  sku: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  reviewNotes: z.string().optional()
});

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formId(formData: FormData) {
  return z.string().uuid().parse(formValue(formData, "id"));
}

function objectJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function brandStatus(status?: string | null): BrandOption["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function procurementOfficeStatus(status?: string | null): ProcurementOffice["status"] {
  if (status === "alternate") return "Alternate";
  if (status === "inactive") return "Inactive";
  return "Primary";
}

function procurementOfficeDbStatus(status: ProcurementOffice["status"]) {
  if (status === "Alternate") return "alternate";
  if (status === "Inactive") return "inactive";
  return "primary";
}

function materialMovementDbType(type: MaterialFlowRow["movementType"]) {
  if (type === "Outbound sale") return "outbound_sale";
  if (type === "Billed dispatch") return "billed_dispatch";
  if (type === "Return / hold") return "return_hold";
  return "inbound_procurement";
}

function materialMovementType(type?: string | null): MaterialFlowRow["movementType"] {
  if (type === "outbound_sale") return "Outbound sale";
  if (type === "billed_dispatch") return "Billed dispatch";
  if (type === "return_hold") return "Return / hold";
  return "Inbound procurement";
}

function purchaseOrderDbStatus(status: PurchaseOrderRow["status"]) {
  if (status === "Sent") return "sent";
  if (status === "Confirmed") return "confirmed";
  if (status === "Partially received") return "partially_received";
  if (status === "Received") return "received";
  if (status === "Cancelled") return "cancelled";
  return "draft";
}

function purchaseOrderStatus(status?: string | null): PurchaseOrderRow["status"] {
  if (status === "sent") return "Sent";
  if (status === "confirmed") return "Confirmed";
  if (status === "partially_received") return "Partially received";
  if (status === "received") return "Received";
  if (status === "cancelled") return "Cancelled";
  return "Draft";
}

function goodsReceiptDbStatus(status: GoodsReceiptRow["status"]) {
  if (status === "Received") return "received";
  if (status === "Quality hold") return "quality_hold";
  if (status === "Posted") return "posted";
  if (status === "Cancelled") return "cancelled";
  return "draft";
}

function goodsReceiptStatus(status?: string | null): GoodsReceiptRow["status"] {
  if (status === "received") return "Received";
  if (status === "quality_hold") return "Quality hold";
  if (status === "posted") return "Posted";
  if (status === "cancelled") return "Cancelled";
  return "Draft";
}

function supplierPayableDbStatus(status: SupplierPayableRow["status"]) {
  if (status === "Partially paid") return "partially_paid";
  if (status === "Paid") return "paid";
  if (status === "Overdue") return "overdue";
  if (status === "Disputed") return "disputed";
  if (status === "Written off") return "written_off";
  return "pending";
}

function supplierPayableStatus(status?: string | null): SupplierPayableRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Pending";
}

function outletStatus(status?: string | null): OutletRow["status"] {
  if (status === "inactive") return "Inactive";
  if (status === "prospect") return "Prospect";
  return "Active";
}

function skuStatus(status?: string | null): SkuRow["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function taskStatus(status?: string | null): TaskRow["status"] {
  if (status === "in_progress") return "In progress";
  if (status === "waiting_for_response") return "Waiting for response";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "overdue") return "Overdue";
  return "Open";
}

function taskPriority(priority?: string | null): TaskRow["priority"] {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function paymentStatus(status?: string | null): PaymentRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Due";
}

function riskLevel(risk?: string | null): PaymentRow["riskLevel"] {
  if (risk === "low") return "Low";
  if (risk === "high") return "High";
  if (risk === "critical") return "Critical";
  return "Medium";
}

function creditHoldStatus(status?: string | null): OutletRow["creditHoldStatus"] {
  if (status === "watch") return "Watch";
  if (status === "hold") return "Hold";
  if (status === "blocked") return "Blocked";
  return "Clear";
}

function writeOffStatus(status?: string | null): PaymentRow["writeOffStatus"] {
  if (status === "requested") return "Requested";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Not requested";
}

function disputeStatus(status?: string | null): PaymentRow["disputeStatus"] {
  if (status === "opened") return "Opened";
  if (status === "under_review") return "Under review";
  if (status === "resolved") return "Resolved";
  if (status === "rejected") return "Rejected";
  return "Not disputed";
}

function settlementStatus(status?: string | null): PaymentRow["settlementStatus"] {
  if (status === "matched") return "Matched";
  if (status === "exception") return "Exception";
  if (status === "settled") return "Settled";
  return "Unreconciled";
}

function orderStatus(status?: string | null): OrderRow["status"] {
  if (status === "confirmed") return "Confirmed";
  if (status === "billed") return "Billed";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "on_hold") return "On hold";
  return "Intent captured";
}

function userStatus(status?: string | null): AppUserRow["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function roleLabel(role: AppUserRow["role"]) {
  const labels: Record<AppUserRow["role"], string> = {
    super_admin: "Admin",
    operations_manager: "Manager",
    admin_operator: "Admin Operator",
    field_executive: "Sales Executive",
    brand_partner_viewer: "Brand Viewer",
    brand_partner_manager: "Brand Manager",
    finance_collections: "Finance",
    integration_user: "Integration"
  };
  return labels[role] ?? role;
}

function appUserFromData(data: { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, territory = "Managed in Sales App & Team"): AppUserRow {
  return {
    id: data.id,
    name: data.name,
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role,
    roleLabel: roleLabel(data.role),
    territory,
    status: userStatus(data.status)
  };
}

function numberInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Enter a valid number.");
  return numeric;
}

function optionalNumberInput(value?: string) {
  if (!value) return 0;
  return numberInput(value);
}

function numberValue(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function findBrandIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, brandName?: string) {
  if (!brandName || brandName === "Unassigned") return null;
  const { data, error } = await supabase.from("brands").select("id").eq("name", brandName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findOutletIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, outletName?: string) {
  if (!outletName || outletName === "Unassigned") return null;
  const { data, error } = await supabase.from("outlets").select("id").eq("name", outletName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findSkuForOrder(supabase: ReturnType<typeof createSupabaseAdminClient>, skuLabel?: string) {
  if (!skuLabel || skuLabel === "Unassigned") return null;
  const codeMatch = skuLabel.match(/\(([^()]+)\)\s*$/);
  const code = codeMatch?.[1]?.trim();
  const name = code ? skuLabel.replace(/\s*\([^()]+\)\s*$/, "").trim() : skuLabel.trim();

  const byCode = code
    ? await supabase
      .from("skus")
      .select("id,name,code,mrp,brand_id,brands(name)")
      .eq("code", code)
      .limit(1)
      .maybeSingle()
    : null;

  if (byCode?.error) throw new Error(byCode.error.message);
  const byName = byCode?.data
    ? byCode
    : await supabase
    .from("skus")
    .select("id,name,code,mrp,brand_id,brands(name)")
    .eq("name", name)
    .limit(1)
    .maybeSingle();

  const { data, error } = byName;
  if (error) throw new Error(error.message);
  if (!data) return null;
  const brand = Array.isArray(data.brands) ? data.brands[0] : data.brands;
  return {
    id: data.id as string,
    name: data.name as string,
    code: (data.code ?? "") as string,
    mrp: numberValue(data.mrp as number | string | null),
    brandId: data.brand_id as string,
    brandName: brand?.name ?? "Unassigned"
  };
}

async function findProcurementOfficeIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, brandId: string | null, officeName?: string) {
  if (!brandId || !officeName || officeName === "Unassigned source office") return null;
  const { data, error } = await supabase
    .from("brand_branches")
    .select("id")
    .eq("brand_id", brandId)
    .eq("office_name", officeName)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findPurchaseOrderByNumber(supabase: ReturnType<typeof createSupabaseAdminClient>, poNumber?: string) {
  if (!poNumber || poNumber === "Draft PO") return null;
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id,po_number,brand_id,branch_id,total_value,brands(name),brand_branches(office_name)")
    .eq("po_number", poNumber)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const brand = Array.isArray(data.brands) ? data.brands[0] : data.brands;
  const branch = Array.isArray(data.brand_branches) ? data.brand_branches[0] : data.brand_branches;
  return {
    id: data.id as string,
    poNumber: (data.po_number ?? poNumber) as string,
    brandId: data.brand_id as string | null,
    branchId: data.branch_id as string | null,
    totalValue: numberValue(data.total_value as number | string | null),
    brandName: brand?.name ?? "Unassigned",
    officeName: branch?.office_name ?? "Unassigned source office"
  };
}

async function findBillIdByNumber(supabase: ReturnType<typeof createSupabaseAdminClient>, billNumber?: string) {
  if (!billNumber || billNumber === "Unallocated" || billNumber === "Draft receipt") return null;
  const { data, error } = await supabase
    .from("bills")
    .select("id")
    .eq("bill_number", billNumber)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findUserIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, userName?: string) {
  if (!userName || userName === "Unassigned") return null;
  const { data, error } = await supabase.from("users").select("id").eq("name", userName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findTerritoryIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, territoryName?: string) {
  if (!territoryName || territoryName === "Unassigned") return null;
  const { data, error } = await supabase.from("territories").select("id").eq("name", territoryName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findExecutiveIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, executiveName?: string) {
  if (!executiveName || executiveName === "Unassigned") return null;
  const { data, error } = await supabase
    .from("field_executives")
    .select("id,users!field_executives_user_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ id: string; users?: { name?: string | null } | { name?: string | null }[] | null }>;
  const match = rows.find((person) => {
    const user = Array.isArray(person.users) ? person.users[0] : person.users;
    return user?.name === executiveName;
  });
  return match?.id ?? null;
}

function draftStatus(status?: string | null): VerificationDraftRecord["status"] {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Needs review";
}

function verificationDraftFromRow(row: {
  id: string;
  record_type: string;
  title: string;
  status: string | null;
  confidence: number | string | null;
  draft_json: Record<string, unknown> | null;
  created_at: string;
}, reviewNotes = ""): VerificationDraftRecord {
  const draftJson = row.draft_json ?? {};
  return {
    id: row.id,
    recordType: row.record_type,
    title: row.title,
    status: draftStatus(row.status),
    confidence: numberValue(row.confidence),
    primaryCategory: typeof draftJson.category === "string" ? draftJson.category : "unclear",
    secondaryCategories: Array.isArray(draftJson.secondary_categories) ? draftJson.secondary_categories.map(String) : [],
    languageDetected: typeof draftJson.language_detected === "string" ? draftJson.language_detected : "unknown",
    normalizedText: typeof draftJson.normalized_text === "string" ? draftJson.normalized_text : "",
    reasonForReview: reviewNotes || "Needs admin confirmation",
    rawText: typeof draftJson.source_text === "string" ? draftJson.source_text : "",
    transcriptText: "",
    ocrText: "",
    draftJson,
    outletName: typeof draftJson.outlet_name === "string" ? draftJson.outlet_name : "Unassigned",
    brandName: typeof draftJson.brand_name === "string" ? draftJson.brand_name : "Unassigned",
    amount: numberValue(
      typeof draftJson.amount === "number" || typeof draftJson.amount === "string"
        ? draftJson.amount
        : typeof draftJson.amount_pending === "number" || typeof draftJson.amount_pending === "string"
          ? draftJson.amount_pending
          : 0
    ),
    quantity: typeof draftJson.quantity === "string" ? draftJson.quantity : "",
    sku: typeof draftJson.sku === "string" ? draftJson.sku : "",
    createdAt: row.created_at
  };
}

async function findOrCreateTerritory(supabase: ReturnType<typeof createSupabaseAdminClient>, name: string, city: string) {
  const { data: existing, error: existingError } = await supabase
    .from("territories")
    .select("id")
    .eq("name", name)
    .eq("city", city)
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

  const { data: territory, error } = await supabase
    .from("territories")
    .insert({
      name,
      city,
      state: "Unassigned",
      status: "active"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return territory.id as string;
}

export async function createBrandAction(formData: FormData): Promise<BrandOption> {
  const input = brandSchema.parse({
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    contact: formValue(formData, "contact"),
    contactEmail: formValue(formData, "contactEmail"),
    contactPhone: formValue(formData, "contactPhone"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: input.name,
      category: input.category,
      contact_person: input.contact,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      status: statusMap[input.status]
    })
    .select("id,name,category,contact_person,contact_email,contact_phone,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    category: data.category ?? "Uncategorized",
    contact: data.contact_person ?? "Internal ops",
    contactEmail: data.contact_email ?? "",
    contactPhone: data.contact_phone ?? "",
    status: brandStatus(data.status)
  };
}

export async function updateBrandAction(formData: FormData): Promise<BrandOption> {
  const id = formId(formData);
  const input = brandSchema.parse({
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    contact: formValue(formData, "contact"),
    contactEmail: formValue(formData, "contactEmail"),
    contactPhone: formValue(formData, "contactPhone"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update({
      name: input.name,
      category: input.category,
      contact_person: input.contact,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      status: statusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,category,contact_person,contact_email,contact_phone,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    category: data.category ?? "Uncategorized",
    contact: data.contact_person ?? "Internal ops",
    contactEmail: data.contact_email ?? "",
    contactPhone: data.contact_phone ?? "",
    status: brandStatus(data.status)
  };
}

export async function createProcurementOfficeAction(formData: FormData): Promise<ProcurementOffice> {
  const input = procurementOfficeSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    region: formValue(formData, "region"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    contact: formValue(formData, "contact"),
    phone: formValue(formData, "phone"),
    email: formValue(formData, "email"),
    procurementRole: formValue(formData, "procurementRole"),
    leadTimeDays: formValue(formData, "leadTimeDays"),
    replenishmentMode: formValue(formData, "replenishmentMode"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before adding a procurement office.");
  const { data, error } = await supabase
    .from("brand_branches")
    .insert({
      brand_id: brandId,
      office_name: input.officeName,
      region: input.region,
      city: input.city,
      state: input.state,
      contact_person: input.contact,
      contact_phone: input.phone || null,
      contact_email: input.email || null,
      procurement_role: input.procurementRole,
      lead_time_days: input.leadTimeDays ? numberInput(input.leadTimeDays) : 0,
      replenishment_mode: input.replenishmentMode,
      status: procurementOfficeDbStatus(input.status)
    })
    .select("id,office_name,region,city,state,contact_person,contact_phone,contact_email,procurement_role,lead_time_days,replenishment_mode,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    officeName: data.office_name,
    region: data.region ?? "Unassigned",
    city: data.city ?? "Unassigned",
    state: data.state ?? "Unassigned",
    contact: data.contact_person ?? "Unassigned",
    phone: data.contact_phone ?? "",
    email: data.contact_email ?? "",
    procurementRole: data.procurement_role ?? "Distributor procurement",
    leadTimeDays: numberValue(data.lead_time_days),
    replenishmentMode: data.replenishment_mode ?? "Purchase order",
    status: procurementOfficeStatus(data.status)
  };
}

export async function updateProcurementOfficeAction(formData: FormData): Promise<ProcurementOffice> {
  const id = formId(formData);
  const input = procurementOfficeSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    region: formValue(formData, "region"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    contact: formValue(formData, "contact"),
    phone: formValue(formData, "phone"),
    email: formValue(formData, "email"),
    procurementRole: formValue(formData, "procurementRole"),
    leadTimeDays: formValue(formData, "leadTimeDays"),
    replenishmentMode: formValue(formData, "replenishmentMode"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before updating a procurement office.");
  const { data, error } = await supabase
    .from("brand_branches")
    .update({
      brand_id: brandId,
      office_name: input.officeName,
      region: input.region,
      city: input.city,
      state: input.state,
      contact_person: input.contact,
      contact_phone: input.phone || null,
      contact_email: input.email || null,
      procurement_role: input.procurementRole,
      lead_time_days: input.leadTimeDays ? numberInput(input.leadTimeDays) : 0,
      replenishment_mode: input.replenishmentMode,
      status: procurementOfficeDbStatus(input.status),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,office_name,region,city,state,contact_person,contact_phone,contact_email,procurement_role,lead_time_days,replenishment_mode,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    officeName: data.office_name,
    region: data.region ?? "Unassigned",
    city: data.city ?? "Unassigned",
    state: data.state ?? "Unassigned",
    contact: data.contact_person ?? "Unassigned",
    phone: data.contact_phone ?? "",
    email: data.contact_email ?? "",
    procurementRole: data.procurement_role ?? "Distributor procurement",
    leadTimeDays: numberValue(data.lead_time_days),
    replenishmentMode: data.replenishment_mode ?? "Purchase order",
    status: procurementOfficeStatus(data.status)
  };
}

export async function createSkuAction(formData: FormData): Promise<SkuRow> {
  const input = skuSchema.parse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code"),
    brand: formValue(formData, "brand"),
    category: formValue(formData, "category"),
    unit: formValue(formData, "unit"),
    mrp: formValue(formData, "mrp"),
    imageUrl: formValue(formData, "imageUrl"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before adding a product/SKU.");

  const { data, error } = await supabase
    .from("skus")
    .insert({
      brand_id: brandId,
      name: input.name,
      code: input.code || null,
      category: input.category || null,
      unit: input.unit || null,
      mrp: input.mrp ? numberInput(input.mrp) : 0,
      image_url: input.imageUrl || null,
      status: statusMap[input.status]
    })
    .select("id,name,code,category,unit,mrp,image_url,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    code: data.code ?? "",
    brand: input.brand,
    category: data.category ?? "Uncategorized",
    unit: data.unit ?? "Unit",
    mrp: numberValue(data.mrp),
    imageUrl: data.image_url ?? "",
    status: skuStatus(data.status)
  };
}

export async function updateSkuAction(formData: FormData): Promise<SkuRow> {
  const id = formId(formData);
  const input = skuSchema.parse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code"),
    brand: formValue(formData, "brand"),
    category: formValue(formData, "category"),
    unit: formValue(formData, "unit"),
    mrp: formValue(formData, "mrp"),
    imageUrl: formValue(formData, "imageUrl"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before updating a product/SKU.");

  const { data, error } = await supabase
    .from("skus")
    .update({
      brand_id: brandId,
      name: input.name,
      code: input.code || null,
      category: input.category || null,
      unit: input.unit || null,
      mrp: input.mrp ? numberInput(input.mrp) : 0,
      image_url: input.imageUrl || null,
      status: statusMap[input.status]
    })
    .eq("id", id)
    .select("id,name,code,category,unit,mrp,image_url,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    code: data.code ?? "",
    brand: input.brand,
    category: data.category ?? "Uncategorized",
    unit: data.unit ?? "Unit",
    mrp: numberValue(data.mrp),
    imageUrl: data.image_url ?? "",
    status: skuStatus(data.status)
  };
}

export async function createOutletAction(formData: FormData): Promise<OutletRow> {
  const input = outletSchema.parse({
    name: formValue(formData, "name"),
    owner: formValue(formData, "owner"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    channel: formValue(formData, "channel"),
    brand: formValue(formData, "brand"),
    territory: formValue(formData, "territory"),
    assignedSalesman: formValue(formData, "assignedSalesman"),
    status: formValue(formData, "status"),
    creditLimit: formValue(formData, "creditLimit"),
    creditHoldStatus: formValue(formData, "creditHoldStatus") || "Clear"
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, territoryId, assignedExecutiveId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findTerritoryIdByName(supabase, input.territory),
    findExecutiveIdByName(supabase, input.assignedSalesman)
  ]);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .insert({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
      territory_id: territoryId,
      assigned_executive_id: assignedExecutiveId,
      status: statusMap[input.status],
      credit_limit: optionalNumberInput(input.creditLimit) ?? 0,
      credit_hold_status: creditHoldStatusMap[input.creditHoldStatus]
    })
    .select("id,name,owner_name,phone,city,channel_type,status,credit_limit,credit_hold_status")
    .single();

  if (outletError) throw new Error(outletError.message);

  if (brandId) {
    const { error: linkError } = await supabase.from("outlet_brands").insert({
      outlet_id: outlet.id,
      brand_id: brandId,
      status: "active",
      onboarded_at: new Date().toISOString()
    });
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/");
  return {
    id: outlet.id,
    name: outlet.name,
    owner: outlet.owner_name ?? "",
    phone: outlet.phone ?? "",
    city: outlet.city,
    channel: outlet.channel_type ?? "Unassigned",
    brand: input.brand || "Unassigned",
    territory: input.territory || "Unassigned",
    assignedSalesman: input.assignedSalesman || "Unassigned",
    status: outletStatus(outlet.status),
    creditLimit: numberValue(outlet.credit_limit),
    creditHoldStatus: creditHoldStatus(outlet.credit_hold_status)
  };
}

export async function updateOutletAction(formData: FormData): Promise<OutletRow> {
  const id = formId(formData);
  const input = outletSchema.parse({
    name: formValue(formData, "name"),
    owner: formValue(formData, "owner"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    channel: formValue(formData, "channel"),
    brand: formValue(formData, "brand"),
    territory: formValue(formData, "territory"),
    assignedSalesman: formValue(formData, "assignedSalesman"),
    status: formValue(formData, "status"),
    creditLimit: formValue(formData, "creditLimit"),
    creditHoldStatus: formValue(formData, "creditHoldStatus") || "Clear"
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, territoryId, assignedExecutiveId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findTerritoryIdByName(supabase, input.territory),
    findExecutiveIdByName(supabase, input.assignedSalesman)
  ]);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .update({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
      territory_id: territoryId,
      assigned_executive_id: assignedExecutiveId,
      status: statusMap[input.status],
      credit_limit: optionalNumberInput(input.creditLimit) ?? 0,
      credit_hold_status: creditHoldStatusMap[input.creditHoldStatus],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,owner_name,phone,city,channel_type,status,credit_limit,credit_hold_status")
    .single();

  if (outletError) throw new Error(outletError.message);

  const { error: unlinkError } = await supabase.from("outlet_brands").delete().eq("outlet_id", id);
  if (unlinkError) throw new Error(unlinkError.message);
  if (brandId) {
    const { error: linkError } = await supabase.from("outlet_brands").insert({
      outlet_id: id,
      brand_id: brandId,
      status: "active",
      onboarded_at: new Date().toISOString()
    });
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/");
  return {
    id: outlet.id,
    name: outlet.name,
    owner: outlet.owner_name ?? "",
    phone: outlet.phone ?? "",
    city: outlet.city,
    channel: outlet.channel_type ?? "Unassigned",
    brand: input.brand || "Unassigned",
    territory: input.territory || "Unassigned",
    assignedSalesman: input.assignedSalesman || "Unassigned",
    status: outletStatus(outlet.status),
    creditLimit: numberValue(outlet.credit_limit),
    creditHoldStatus: creditHoldStatus(outlet.credit_hold_status)
  };
}

export async function createUserAction(formData: FormData): Promise<AppUserRow> {
  const input = userSchema.parse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    role: formValue(formData, "role"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const role = userRoleMap[input.role];
  const email = input.email || `${input.phone.replace(/[^0-9]+/g, "") || Date.now()}@shipd2r.local`;

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email,
      phone: input.phone,
      role,
      status: statusMap[input.status]
    })
    .select("id,name,email,phone,role,status")
    .single();

  if (userError) throw new Error(userError.message);

  if (role === "field_executive") {
    const territoryId = await findOrCreateTerritory(supabase, input.territory || "Unassigned", "Unassigned");
    const { error: executiveError } = await supabase.from("field_executives").insert({
      user_id: user.id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status]
    });
    if (executiveError) throw new Error(executiveError.message);
  }

  revalidatePath("/");
  return appUserFromData(user as { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, input.territory || "Managed in Sales App & Team");
}

export async function updateUserAction(formData: FormData): Promise<AppUserRow> {
  const id = formId(formData);
  const input = userSchema.parse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    role: formValue(formData, "role"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const role = userRoleMap[input.role];
  const email = input.email || `${input.phone.replace(/[^0-9]+/g, "") || Date.now()}@shipd2r.local`;
  const now = new Date().toISOString();

  const { data: user, error: userError } = await supabase
    .from("users")
    .update({
      name: input.name,
      email,
      phone: input.phone,
      role,
      status: statusMap[input.status],
      updated_at: now
    })
    .eq("id", id)
    .select("id,name,email,phone,role,status")
    .single();

  if (userError) throw new Error(userError.message);

  if (role === "field_executive") {
    const territoryId = await findOrCreateTerritory(supabase, input.territory || "Unassigned", "Unassigned");
    const { data: existingExecutive, error: existingError } = await supabase
      .from("field_executives")
      .select("id")
      .eq("user_id", id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const payload = {
      user_id: id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status],
      updated_at: now
    };
    const { error: executiveError } = existingExecutive?.id
      ? await supabase.from("field_executives").update(payload).eq("id", existingExecutive.id)
      : await supabase.from("field_executives").insert(payload);
    if (executiveError) throw new Error(executiveError.message);
  }

  revalidatePath("/");
  return appUserFromData(user as { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, input.territory || "Managed in Sales App & Team");
}

export async function createSalesmanAction(formData: FormData): Promise<SalesmanRow> {
  const input = salesmanSchema.parse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const email = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\\.|\\.$/g, "")}.${Date.now()}@sales-app.local`;
  const territoryId = await findOrCreateTerritory(supabase, input.territory, input.city);

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email,
      phone: input.phone,
      role: "field_executive",
      status: statusMap[input.status]
    })
    .select("id")
    .single();

  if (userError) throw new Error(userError.message);

  const { data: executive, error: executiveError } = await supabase
    .from("field_executives")
    .insert({
      user_id: user.id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status]
    })
    .select("id")
    .single();

  if (executiveError) throw new Error(executiveError.message);
  revalidatePath("/");
  return {
    id: executive.id,
    name: input.name,
    phone: input.phone,
    city: input.city,
    territory: input.territory,
    status: brandStatus(statusMap[input.status])
  };
}

export async function updateSalesmanAction(formData: FormData): Promise<SalesmanRow> {
  const id = formId(formData);
  const input = salesmanSchema.parse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: executive, error: executiveReadError } = await supabase
    .from("field_executives")
    .select("id,user_id")
    .eq("id", id)
    .single();

  if (executiveReadError) throw new Error(executiveReadError.message);

  const territoryId = await findOrCreateTerritory(supabase, input.territory, input.city);
  const now = new Date().toISOString();

  if (executive.user_id) {
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: input.name,
        phone: input.phone,
        status: statusMap[input.status],
        updated_at: now
      })
      .eq("id", executive.user_id);
    if (userError) throw new Error(userError.message);
  }

  const { error: executiveError } = await supabase
    .from("field_executives")
    .update({
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status],
      updated_at: now
    })
    .eq("id", id);

  if (executiveError) throw new Error(executiveError.message);
  revalidatePath("/");
  return {
    id,
    name: input.name,
    phone: input.phone,
    city: input.city,
    territory: input.territory,
    status: brandStatus(statusMap[input.status])
  };
}

export async function createTaskAction(formData: FormData): Promise<TaskRow> {
  const input = taskSchema.parse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    taskType: formValue(formData, "taskType"),
    assignedTo: formValue(formData, "assignedTo"),
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, assignedToId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findOutletIdByName(supabase, input.outlet),
    findUserIdByName(supabase, input.assignedTo)
  ]);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
      assigned_to: assignedToId,
      outlet_id: outletId,
      brand_id: brandId,
      due_date: input.dueDate || null,
      priority: taskPriorityMap[input.priority],
      status: taskStatusMap[input.status]
    })
    .select("id,title,description,task_type,due_date,priority,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "Created from verified sales or retailer signal.",
    taskType: data.task_type,
    assignedTo: input.assignedTo || "Unassigned",
    outlet: input.outlet || "Unassigned",
    brand: input.brand || "Unassigned",
    dueDate: data.due_date ?? "No due date",
    priority: taskPriority(data.priority),
    status: taskStatus(data.status)
  };
}

export async function updateTaskAction(formData: FormData): Promise<TaskRow> {
  const id = formId(formData);
  const input = taskSchema.parse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    taskType: formValue(formData, "taskType"),
    assignedTo: formValue(formData, "assignedTo"),
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, assignedToId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findOutletIdByName(supabase, input.outlet),
    findUserIdByName(supabase, input.assignedTo)
  ]);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
      assigned_to: assignedToId,
      outlet_id: outletId,
      brand_id: brandId,
      due_date: input.dueDate || null,
      priority: taskPriorityMap[input.priority],
      status: taskStatusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,title,description,task_type,due_date,priority,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "Created from verified sales or retailer signal.",
    taskType: data.task_type,
    assignedTo: input.assignedTo || "Unassigned",
    outlet: input.outlet || "Unassigned",
    brand: input.brand || "Unassigned",
    dueDate: data.due_date ?? "No due date",
    priority: taskPriority(data.priority),
    status: taskStatus(data.status)
  };
}

export async function createTerritoryAction(formData: FormData): Promise<TerritoryRow> {
  const input = territorySchema.parse({
    name: formValue(formData, "name"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territories")
    .insert({
      name: input.name,
      city: input.city,
      state: input.state,
      region: input.region || null,
      status: statusMap[input.status]
    })
    .select("id,name,city,state,region,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    region: data.region ?? "Unassigned",
    status: brandStatus(data.status)
  };
}

export async function updateTerritoryAction(formData: FormData): Promise<TerritoryRow> {
  const id = formId(formData);
  const input = territorySchema.parse({
    name: formValue(formData, "name"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territories")
    .update({
      name: input.name,
      city: input.city,
      state: input.state,
      region: input.region || null,
      status: statusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,city,state,region,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    region: data.region ?? "Unassigned",
    status: brandStatus(data.status)
  };
}

export async function createPaymentAction(formData: FormData): Promise<PaymentRow> {
  const input = paymentSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    billNumber: formValue(formData, "billNumber"),
    amountDue: formValue(formData, "amountDue"),
    amountCollected: formValue(formData, "amountCollected"),
    dueDate: formValue(formData, "dueDate"),
    promisedPaymentDate: formValue(formData, "promisedPaymentDate"),
    paymentMode: formValue(formData, "paymentMode"),
    status: formValue(formData, "status"),
    riskLevel: formValue(formData, "riskLevel"),
    receiptNumber: formValue(formData, "receiptNumber"),
    collectorName: formValue(formData, "collectorName"),
    allocationSummary: formValue(formData, "allocationSummary"),
    writeOffStatus: formValue(formData, "writeOffStatus") || "Not requested",
    disputeStatus: formValue(formData, "disputeStatus") || "Not disputed",
    settlementStatus: formValue(formData, "settlementStatus") || "Unreconciled",
    settlementReference: formValue(formData, "settlementReference"),
    settlementDate: formValue(formData, "settlementDate")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, billId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet), findBillIdByNumber(supabase, input.billNumber)]);
  const generatedReceiptNumber = input.receiptNumber || `RCPT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { data, error } = await supabase
    .from("payments")
    .insert({
      outlet_id: outletId,
      brand_id: brandId,
      bill_id: billId,
      amount_due: numberInput(input.amountDue),
      amount_collected: input.amountCollected ? numberInput(input.amountCollected) : 0,
      due_date: input.dueDate || null,
      promised_payment_date: input.promisedPaymentDate || null,
      payment_mode: input.paymentMode || null,
      receipt_number: generatedReceiptNumber,
      collector_name: input.collectorName || null,
      allocation_summary: input.allocationSummary || null,
      write_off_status: writeOffStatusMap[input.writeOffStatus],
      dispute_status: disputeStatusMap[input.disputeStatus],
      settlement_status: settlementStatusMap[input.settlementStatus],
      settlement_reference: input.settlementReference || null,
      settlement_date: input.settlementDate || null,
      status: paymentStatusMap[input.status],
      risk_level: riskLevelMap[input.riskLevel]
    })
    .select("id,bill_id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,receipt_number,collector_name,allocation_summary,write_off_status,dispute_status,settlement_status,settlement_reference,settlement_date,status,risk_level")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    billId: data.bill_id ?? "",
    billNumber: input.billNumber || "Unallocated",
    amountDue: Number(data.amount_due ?? 0),
    amountCollected: Number(data.amount_collected ?? 0),
    dueDate: data.due_date ?? "No due date",
    promisedPaymentDate: data.promised_payment_date ?? "No promise",
    paymentMode: data.payment_mode ?? "Unassigned",
    status: paymentStatus(data.status),
    riskLevel: riskLevel(data.risk_level),
    receiptNumber: data.receipt_number ?? generatedReceiptNumber,
    collectorName: data.collector_name ?? "Unassigned",
    allocationSummary: data.allocation_summary ?? "",
    writeOffStatus: writeOffStatus(data.write_off_status),
    disputeStatus: disputeStatus(data.dispute_status),
    settlementStatus: settlementStatus(data.settlement_status),
    settlementReference: data.settlement_reference ?? "",
    settlementDate: data.settlement_date ?? "No settlement date"
  };
}

export async function updatePaymentAction(formData: FormData): Promise<PaymentRow> {
  const id = formId(formData);
  const input = paymentSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    billNumber: formValue(formData, "billNumber"),
    amountDue: formValue(formData, "amountDue"),
    amountCollected: formValue(formData, "amountCollected"),
    dueDate: formValue(formData, "dueDate"),
    promisedPaymentDate: formValue(formData, "promisedPaymentDate"),
    paymentMode: formValue(formData, "paymentMode"),
    status: formValue(formData, "status"),
    riskLevel: formValue(formData, "riskLevel"),
    receiptNumber: formValue(formData, "receiptNumber"),
    collectorName: formValue(formData, "collectorName"),
    allocationSummary: formValue(formData, "allocationSummary"),
    writeOffStatus: formValue(formData, "writeOffStatus") || "Not requested",
    disputeStatus: formValue(formData, "disputeStatus") || "Not disputed",
    settlementStatus: formValue(formData, "settlementStatus") || "Unreconciled",
    settlementReference: formValue(formData, "settlementReference"),
    settlementDate: formValue(formData, "settlementDate")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, billId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet), findBillIdByNumber(supabase, input.billNumber)]);
  const { data, error } = await supabase
    .from("payments")
    .update({
      outlet_id: outletId,
      brand_id: brandId,
      bill_id: billId,
      amount_due: numberInput(input.amountDue),
      amount_collected: input.amountCollected ? numberInput(input.amountCollected) : 0,
      due_date: input.dueDate || null,
      promised_payment_date: input.promisedPaymentDate || null,
      payment_mode: input.paymentMode || null,
      receipt_number: input.receiptNumber || null,
      collector_name: input.collectorName || null,
      allocation_summary: input.allocationSummary || null,
      write_off_status: writeOffStatusMap[input.writeOffStatus],
      dispute_status: disputeStatusMap[input.disputeStatus],
      settlement_status: settlementStatusMap[input.settlementStatus],
      settlement_reference: input.settlementReference || null,
      settlement_date: input.settlementDate || null,
      status: paymentStatusMap[input.status],
      risk_level: riskLevelMap[input.riskLevel],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,bill_id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,receipt_number,collector_name,allocation_summary,write_off_status,dispute_status,settlement_status,settlement_reference,settlement_date,status,risk_level")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    billId: data.bill_id ?? "",
    billNumber: input.billNumber || "Unallocated",
    amountDue: Number(data.amount_due ?? 0),
    amountCollected: Number(data.amount_collected ?? 0),
    dueDate: data.due_date ?? "No due date",
    promisedPaymentDate: data.promised_payment_date ?? "No promise",
    paymentMode: data.payment_mode ?? "Unassigned",
    status: paymentStatus(data.status),
    riskLevel: riskLevel(data.risk_level),
    receiptNumber: data.receipt_number ?? "Draft receipt",
    collectorName: data.collector_name ?? "Unassigned",
    allocationSummary: data.allocation_summary ?? "",
    writeOffStatus: writeOffStatus(data.write_off_status),
    disputeStatus: disputeStatus(data.dispute_status),
    settlementStatus: settlementStatus(data.settlement_status),
    settlementReference: data.settlement_reference ?? "",
    settlementDate: data.settlement_date ?? "No settlement date"
  };
}

export async function createOrderAction(formData: FormData): Promise<OrderRow> {
  const input = orderSchema.parse({
    outlet: formValue(formData, "outlet"),
    sku: formValue(formData, "sku"),
    quantity: formValue(formData, "quantity"),
    unitPrice: formValue(formData, "unitPrice"),
    expectedValue: formValue(formData, "expectedValue"),
    expectedDeliveryDate: formValue(formData, "expectedDeliveryDate"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [sku, outletId] = await Promise.all([findSkuForOrder(supabase, input.sku), findOutletIdByName(supabase, input.outlet)]);
  if (!sku) throw new Error("Choose a valid product/SKU before capturing an order.");
  const quantity = numberInput(input.quantity);
  const unitPrice = input.unitPrice ? numberInput(input.unitPrice) : sku.mrp;
  const itemTotal = quantity * unitPrice;
  const expectedValue = input.expectedValue ? numberInput(input.expectedValue) : itemTotal;
  const { data, error } = await supabase
    .from("orders")
    .insert({
      outlet_id: outletId,
      brand_id: sku.brandId,
      expected_value: expectedValue,
      expected_delivery_date: input.expectedDeliveryDate || null,
      status: orderStatusMap[input.status]
    })
    .select("id,expected_value,expected_delivery_date,status")
    .single();

  if (error) throw new Error(error.message);
  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: data.id,
    sku_id: sku.id,
    quantity,
    unit_price: unitPrice,
    total_value: itemTotal
  });
  if (itemError) throw new Error(itemError.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: sku.brandName,
    sku: sku.name,
    skuCode: sku.code,
    quantity,
    unitPrice,
    expectedValue: Number(data.expected_value ?? 0),
    expectedDeliveryDate: data.expected_delivery_date ?? "No delivery date",
    status: orderStatus(data.status)
  };
}

export async function updateOrderAction(formData: FormData): Promise<OrderRow> {
  const id = formId(formData);
  const input = orderSchema.parse({
    outlet: formValue(formData, "outlet"),
    sku: formValue(formData, "sku"),
    quantity: formValue(formData, "quantity"),
    unitPrice: formValue(formData, "unitPrice"),
    expectedValue: formValue(formData, "expectedValue"),
    expectedDeliveryDate: formValue(formData, "expectedDeliveryDate"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [sku, outletId] = await Promise.all([findSkuForOrder(supabase, input.sku), findOutletIdByName(supabase, input.outlet)]);
  if (!sku) throw new Error("Choose a valid product/SKU before updating an order.");
  const quantity = numberInput(input.quantity);
  const unitPrice = input.unitPrice ? numberInput(input.unitPrice) : sku.mrp;
  const itemTotal = quantity * unitPrice;
  const expectedValue = input.expectedValue ? numberInput(input.expectedValue) : itemTotal;
  const { data, error } = await supabase
    .from("orders")
    .update({
      outlet_id: outletId,
      brand_id: sku.brandId,
      expected_value: expectedValue,
      expected_delivery_date: input.expectedDeliveryDate || null,
      status: orderStatusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,expected_value,expected_delivery_date,status")
    .single();

  if (error) throw new Error(error.message);
  const { error: deleteItemError } = await supabase.from("order_items").delete().eq("order_id", id);
  if (deleteItemError) throw new Error(deleteItemError.message);
  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: id,
    sku_id: sku.id,
    quantity,
    unit_price: unitPrice,
    total_value: itemTotal
  });
  if (itemError) throw new Error(itemError.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: sku.brandName,
    sku: sku.name,
    skuCode: sku.code,
    quantity,
    unitPrice,
    expectedValue: Number(data.expected_value ?? 0),
    expectedDeliveryDate: data.expected_delivery_date ?? "No delivery date",
    status: orderStatus(data.status)
  };
}

export async function createMaterialFlowAction(formData: FormData): Promise<MaterialFlowRow> {
  const input = materialFlowSchema.parse({
    brand: formValue(formData, "brand"),
    sku: formValue(formData, "sku"),
    movementType: formValue(formData, "movementType"),
    fromLocation: formValue(formData, "fromLocation"),
    toLocation: formValue(formData, "toLocation"),
    quantity: formValue(formData, "quantity"),
    value: formValue(formData, "value"),
    expectedDate: formValue(formData, "expectedDate"),
    status: formValue(formData, "status"),
    documentRef: formValue(formData, "documentRef")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, sku] = await Promise.all([findBrandIdByName(supabase, input.brand), findSkuForOrder(supabase, input.sku)]);
  if (!brandId) throw new Error("Choose a valid brand client before adding material movement.");
  const quantity = numberInput(input.quantity);
  const value = input.value ? numberInput(input.value) : quantity * (sku?.mrp ?? 0);
  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      brand_id: brandId,
      sku_id: sku?.id ?? null,
      movement_type: materialMovementDbType(input.movementType),
      from_location: input.fromLocation,
      to_location: input.toLocation,
      quantity,
      movement_value: value,
      expected_date: input.expectedDate || null,
      status: input.status,
      document_ref: input.documentRef || null
    })
    .select("id,movement_type,from_location,to_location,quantity,movement_value,expected_date,status,document_ref")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    sku: sku?.name ?? input.sku,
    skuCode: sku?.code ?? "",
    movementType: materialMovementType(data.movement_type),
    fromLocation: data.from_location ?? "",
    toLocation: data.to_location ?? "",
    quantity: numberValue(data.quantity),
    value: numberValue(data.movement_value),
    expectedDate: data.expected_date ?? "No expected date",
    status: data.status ?? "Open",
    documentRef: data.document_ref ?? ""
  };
}

export async function updateMaterialFlowAction(formData: FormData): Promise<MaterialFlowRow> {
  const id = formId(formData);
  const input = materialFlowSchema.parse({
    brand: formValue(formData, "brand"),
    sku: formValue(formData, "sku"),
    movementType: formValue(formData, "movementType"),
    fromLocation: formValue(formData, "fromLocation"),
    toLocation: formValue(formData, "toLocation"),
    quantity: formValue(formData, "quantity"),
    value: formValue(formData, "value"),
    expectedDate: formValue(formData, "expectedDate"),
    status: formValue(formData, "status"),
    documentRef: formValue(formData, "documentRef")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, sku] = await Promise.all([findBrandIdByName(supabase, input.brand), findSkuForOrder(supabase, input.sku)]);
  if (!brandId) throw new Error("Choose a valid brand client before updating material movement.");
  const quantity = numberInput(input.quantity);
  const value = input.value ? numberInput(input.value) : quantity * (sku?.mrp ?? 0);
  const { data, error } = await supabase
    .from("inventory_movements")
    .update({
      brand_id: brandId,
      sku_id: sku?.id ?? null,
      movement_type: materialMovementDbType(input.movementType),
      from_location: input.fromLocation,
      to_location: input.toLocation,
      quantity,
      movement_value: value,
      expected_date: input.expectedDate || null,
      status: input.status,
      document_ref: input.documentRef || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,movement_type,from_location,to_location,quantity,movement_value,expected_date,status,document_ref")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    sku: sku?.name ?? input.sku,
    skuCode: sku?.code ?? "",
    movementType: materialMovementType(data.movement_type),
    fromLocation: data.from_location ?? "",
    toLocation: data.to_location ?? "",
    quantity: numberValue(data.quantity),
    value: numberValue(data.movement_value),
    expectedDate: data.expected_date ?? "No expected date",
    status: data.status ?? "Open",
    documentRef: data.document_ref ?? ""
  };
}

export async function createPurchaseOrderAction(formData: FormData): Promise<PurchaseOrderRow> {
  const input = purchaseOrderSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    expectedDate: formValue(formData, "expectedDate"),
    totalValue: formValue(formData, "totalValue"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before creating a purchase order.");
  const branchId = await findProcurementOfficeIdByName(supabase, brandId, input.officeName);
  const totalValue = optionalNumberInput(input.totalValue);
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      brand_id: brandId,
      branch_id: branchId,
      po_number: input.poNumber,
      expected_date: input.expectedDate || null,
      total_value: totalValue,
      status: purchaseOrderDbStatus(input.status)
    })
    .select("id,po_number,expected_date,total_value,status")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    officeName: input.officeName,
    poNumber: data.po_number ?? input.poNumber,
    expectedDate: data.expected_date ?? "No expected date",
    totalValue: numberValue(data.total_value),
    status: purchaseOrderStatus(data.status)
  };
}

export async function updatePurchaseOrderAction(formData: FormData): Promise<PurchaseOrderRow> {
  const id = formId(formData);
  const input = purchaseOrderSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    expectedDate: formValue(formData, "expectedDate"),
    totalValue: formValue(formData, "totalValue"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before updating a purchase order.");
  const branchId = await findProcurementOfficeIdByName(supabase, brandId, input.officeName);
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({
      brand_id: brandId,
      branch_id: branchId,
      po_number: input.poNumber,
      expected_date: input.expectedDate || null,
      total_value: optionalNumberInput(input.totalValue),
      status: purchaseOrderDbStatus(input.status),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,po_number,expected_date,total_value,status")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: input.brand,
    officeName: input.officeName,
    poNumber: data.po_number ?? input.poNumber,
    expectedDate: data.expected_date ?? "No expected date",
    totalValue: numberValue(data.total_value),
    status: purchaseOrderStatus(data.status)
  };
}

export async function createGoodsReceiptAction(formData: FormData): Promise<{ receipt: GoodsReceiptRow; movement?: MaterialFlowRow }> {
  const input = goodsReceiptSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    receiptNumber: formValue(formData, "receiptNumber"),
    receivedDate: formValue(formData, "receivedDate"),
    warehouse: formValue(formData, "warehouse"),
    sku: formValue(formData, "sku"),
    quantity: formValue(formData, "quantity"),
    value: formValue(formData, "value"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const po = await findPurchaseOrderByNumber(supabase, input.poNumber);
  const brandId = po?.brandId ?? await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before creating a goods receipt.");
  const { data, error } = await supabase
    .from("goods_receipts")
    .insert({
      purchase_order_id: po?.id ?? null,
      receipt_number: input.receiptNumber,
      received_date: input.receivedDate || null,
      warehouse: input.warehouse,
      status: goodsReceiptDbStatus(input.status)
    })
    .select("id,receipt_number,received_date,warehouse,status")
    .single();
  if (error) throw new Error(error.message);

  let movement: MaterialFlowRow | undefined;
  const sku = input.sku ? await findSkuForOrder(supabase, input.sku) : null;
  if (sku && input.quantity) {
    const quantity = numberInput(input.quantity);
    const value = input.value ? numberInput(input.value) : quantity * sku.mrp;
    const { data: movementData, error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        brand_id: brandId,
        sku_id: sku.id,
        movement_type: "inbound_procurement",
        from_location: po?.officeName ?? (input.officeName || "Brand source office"),
        to_location: input.warehouse,
        quantity,
        movement_value: value,
        expected_date: input.receivedDate || null,
        status: input.status === "Posted" ? "GRN posted" : "GRN received",
        document_ref: input.receiptNumber
      })
      .select("id,movement_type,from_location,to_location,quantity,movement_value,expected_date,status,document_ref")
      .single();
    if (movementError) throw new Error(movementError.message);
    movement = {
      id: movementData.id,
      brand: input.brand,
      sku: sku.name,
      skuCode: sku.code,
      movementType: materialMovementType(movementData.movement_type),
      fromLocation: movementData.from_location ?? "",
      toLocation: movementData.to_location ?? "",
      quantity: numberValue(movementData.quantity),
      value: numberValue(movementData.movement_value),
      expectedDate: movementData.expected_date ?? "No expected date",
      status: movementData.status ?? "GRN received",
      documentRef: movementData.document_ref ?? ""
    };
  }

  revalidatePath("/");
  return {
    receipt: {
      id: data.id,
      brand: po?.brandName ?? input.brand,
      officeName: po?.officeName ?? (input.officeName || "Unassigned source office"),
      poNumber: po?.poNumber ?? input.poNumber,
      receiptNumber: data.receipt_number ?? input.receiptNumber,
      receivedDate: data.received_date ?? "No receipt date",
      warehouse: data.warehouse ?? input.warehouse,
      status: goodsReceiptStatus(data.status)
    },
    movement
  };
}

export async function updateGoodsReceiptAction(formData: FormData): Promise<GoodsReceiptRow> {
  const id = formId(formData);
  const input = goodsReceiptSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    receiptNumber: formValue(formData, "receiptNumber"),
    receivedDate: formValue(formData, "receivedDate"),
    warehouse: formValue(formData, "warehouse"),
    sku: formValue(formData, "sku"),
    quantity: formValue(formData, "quantity"),
    value: formValue(formData, "value"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const po = await findPurchaseOrderByNumber(supabase, input.poNumber);
  const { data, error } = await supabase
    .from("goods_receipts")
    .update({
      purchase_order_id: po?.id ?? null,
      receipt_number: input.receiptNumber,
      received_date: input.receivedDate || null,
      warehouse: input.warehouse,
      status: goodsReceiptDbStatus(input.status),
    })
    .eq("id", id)
    .select("id,receipt_number,received_date,warehouse,status")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: po?.brandName ?? input.brand,
    officeName: po?.officeName ?? (input.officeName || "Unassigned source office"),
    poNumber: po?.poNumber ?? input.poNumber,
    receiptNumber: data.receipt_number ?? input.receiptNumber,
    receivedDate: data.received_date ?? "No receipt date",
    warehouse: data.warehouse ?? input.warehouse,
    status: goodsReceiptStatus(data.status)
  };
}

export async function createSupplierPayableAction(formData: FormData): Promise<SupplierPayableRow> {
  const input = supplierPayableSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    invoiceNumber: formValue(formData, "invoiceNumber"),
    invoiceDate: formValue(formData, "invoiceDate"),
    amountDue: formValue(formData, "amountDue"),
    amountPaid: formValue(formData, "amountPaid"),
    dueDate: formValue(formData, "dueDate"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const po = await findPurchaseOrderByNumber(supabase, input.poNumber);
  const brandId = po?.brandId ?? await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before adding a supplier payable.");
  const amountDue = numberInput(input.amountDue);
  const amountPaid = optionalNumberInput(input.amountPaid);
  const { data, error } = await supabase
    .from("supplier_payables")
    .insert({
      purchase_order_id: po?.id ?? null,
      brand_id: brandId,
      branch_id: po?.branchId ?? null,
      invoice_number: input.invoiceNumber,
      invoice_date: input.invoiceDate || null,
      amount_due: amountDue,
      amount_paid: amountPaid,
      due_date: input.dueDate || null,
      status: supplierPayableDbStatus(input.status)
    })
    .select("id,invoice_number,invoice_date,amount_due,amount_paid,due_date,status")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: po?.brandName ?? input.brand,
    officeName: po?.officeName ?? (input.officeName || "Unassigned source office"),
    poNumber: po?.poNumber ?? input.poNumber,
    invoiceNumber: data.invoice_number ?? input.invoiceNumber,
    invoiceDate: data.invoice_date ?? "No invoice date",
    amountDue: numberValue(data.amount_due),
    amountPaid: numberValue(data.amount_paid),
    dueDate: data.due_date ?? "No due date",
    status: supplierPayableStatus(data.status)
  };
}

export async function updateSupplierPayableAction(formData: FormData): Promise<SupplierPayableRow> {
  const id = formId(formData);
  const input = supplierPayableSchema.parse({
    brand: formValue(formData, "brand"),
    officeName: formValue(formData, "officeName"),
    poNumber: formValue(formData, "poNumber"),
    invoiceNumber: formValue(formData, "invoiceNumber"),
    invoiceDate: formValue(formData, "invoiceDate"),
    amountDue: formValue(formData, "amountDue"),
    amountPaid: formValue(formData, "amountPaid"),
    dueDate: formValue(formData, "dueDate"),
    status: formValue(formData, "status")
  });
  const supabase = createSupabaseAdminClient();
  const po = await findPurchaseOrderByNumber(supabase, input.poNumber);
  const brandId = po?.brandId ?? await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before updating a supplier payable.");
  const { data, error } = await supabase
    .from("supplier_payables")
    .update({
      purchase_order_id: po?.id ?? null,
      brand_id: brandId,
      branch_id: po?.branchId ?? null,
      invoice_number: input.invoiceNumber,
      invoice_date: input.invoiceDate || null,
      amount_due: numberInput(input.amountDue),
      amount_paid: optionalNumberInput(input.amountPaid),
      due_date: input.dueDate || null,
      status: supplierPayableDbStatus(input.status),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,invoice_number,invoice_date,amount_due,amount_paid,due_date,status")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    brand: po?.brandName ?? input.brand,
    officeName: po?.officeName ?? (input.officeName || "Unassigned source office"),
    poNumber: po?.poNumber ?? input.poNumber,
    invoiceNumber: data.invoice_number ?? input.invoiceNumber,
    invoiceDate: data.invoice_date ?? "No invoice date",
    amountDue: numberValue(data.amount_due),
    amountPaid: numberValue(data.amount_paid),
    dueDate: data.due_date ?? "No due date",
    status: supplierPayableStatus(data.status)
  };
}

export async function archiveRecordAction(formData: FormData): Promise<{ type: string; id: string }> {
  const input = archiveSchema.parse({
    type: formValue(formData, "type"),
    id: formValue(formData, "id")
  });
  const supabase = createSupabaseAdminClient();
  const updates: Record<typeof input.type, { table: string; values: Record<string, string> }> = {
    brand: { table: "brands", values: { status: "inactive" } },
    procurementOffice: { table: "brand_branches", values: { status: "inactive" } },
    materialFlow: { table: "inventory_movements", values: { status: "Archived" } },
    sku: { table: "skus", values: { status: "inactive" } },
    outlet: { table: "outlets", values: { status: "inactive" } },
    salesman: { table: "field_executives", values: { status: "inactive" } },
    user: { table: "users", values: { status: "inactive" } },
    task: { table: "tasks", values: { status: "cancelled" } },
    territory: { table: "territories", values: { status: "inactive" } },
    payment: { table: "payments", values: { status: "written_off" } },
    order: { table: "orders", values: { status: "cancelled" } },
    bill: { table: "bills", values: { payment_status: "written_off" } },
    purchaseOrder: { table: "purchase_orders", values: { status: "cancelled" } },
    goodsReceipt: { table: "goods_receipts", values: { status: "cancelled" } },
    supplierPayable: { table: "supplier_payables", values: { status: "written_off" } }
  };
  const update = updates[input.type];
  const updateValues = input.type === "goodsReceipt" ? update.values : { ...update.values, updated_at: new Date().toISOString() };
  const { error } = await supabase.from(update.table).update(updateValues).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return input;
}

export async function createBillAction(formData: FormData): Promise<BillRow> {
  const input = billSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    linkedOrderId: formValue(formData, "linkedOrderId"),
    billNumber: formValue(formData, "billNumber"),
    billDate: formValue(formData, "billDate"),
    totalAmount: formValue(formData, "totalAmount"),
    paymentStatus: formValue(formData, "paymentStatus"),
    billImagePath: formValue(formData, "billImagePath")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("bills")
    .insert({
      order_id: input.linkedOrderId || null,
      outlet_id: outletId,
      brand_id: brandId,
      bill_number: input.billNumber || null,
      bill_date: input.billDate || null,
      total_amount: numberInput(input.totalAmount),
      payment_status: paymentStatusMap[input.paymentStatus],
      bill_image_path: input.billImagePath || null
    })
    .select("id,order_id,bill_number,bill_date,total_amount,payment_status,bill_image_path")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    orderId: data.order_id ?? "",
    billNumber: data.bill_number ?? "Unnumbered",
    billDate: data.bill_date ?? "No bill date",
    totalAmount: Number(data.total_amount ?? 0),
    paymentStatus: paymentStatus(data.payment_status),
    billImagePath: data.bill_image_path ?? ""
  };
}

export async function updateBillAction(formData: FormData): Promise<BillRow> {
  const id = formId(formData);
  const input = billSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    linkedOrderId: formValue(formData, "linkedOrderId"),
    billNumber: formValue(formData, "billNumber"),
    billDate: formValue(formData, "billDate"),
    totalAmount: formValue(formData, "totalAmount"),
    paymentStatus: formValue(formData, "paymentStatus"),
    billImagePath: formValue(formData, "billImagePath")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("bills")
    .update({
      order_id: input.linkedOrderId || null,
      outlet_id: outletId,
      brand_id: brandId,
      bill_number: input.billNumber || null,
      bill_date: input.billDate || null,
      total_amount: numberInput(input.totalAmount),
      payment_status: paymentStatusMap[input.paymentStatus],
      bill_image_path: input.billImagePath || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,order_id,bill_number,bill_date,total_amount,payment_status,bill_image_path")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    orderId: data.order_id ?? "",
    billNumber: data.bill_number ?? "Unnumbered",
    billDate: data.bill_date ?? "No bill date",
    totalAmount: Number(data.total_amount ?? 0),
    paymentStatus: paymentStatus(data.payment_status),
    billImagePath: data.bill_image_path ?? ""
  };
}

function draftInput(formData: FormData) {
  const input = verificationDraftSchema.parse({
    id: formValue(formData, "id"),
    recordType: formValue(formData, "recordType"),
    title: formValue(formData, "title"),
    outletName: formValue(formData, "outletName"),
    brandName: formValue(formData, "brandName"),
    amount: formValue(formData, "amount"),
    quantity: formValue(formData, "quantity"),
    sku: formValue(formData, "sku"),
    notes: formValue(formData, "notes"),
    dueDate: formValue(formData, "dueDate"),
    reviewNotes: formValue(formData, "reviewNotes")
  });

  return {
    ...input,
    outletName: input.outletName || "Unassigned",
    brandName: input.brandName || "Unassigned",
    amount: input.amount || "0",
    notes: input.notes || ""
  };
}

async function readDraftForDecision(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await supabase
    .from("draft_business_records")
    .select("id,incoming_message_id,record_type,title,draft_json,confidence,status,created_at")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as {
    id: string;
    incoming_message_id: string;
    record_type: string;
    title: string;
    draft_json: Record<string, unknown> | null;
    confidence: number | string | null;
    status: string | null;
    created_at: string;
  };
}

function editedDraftJson(existing: Record<string, unknown> | null, input: ReturnType<typeof draftInput>): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    outlet_name: input.outletName,
    brand_name: input.brandName,
    amount: optionalNumberInput(input.amount),
    amount_pending: optionalNumberInput(input.amount),
    quantity: input.quantity || null,
    sku: input.sku || null,
    notes: input.notes || null,
    due_date: input.dueDate || null,
    admin_review_notes: input.reviewNotes || null
  };
}

export async function updateVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      review_notes: input.reviewNotes || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes);
}

export async function rejectVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      status: "rejected",
      review_notes: input.reviewNotes || "Rejected by admin",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes || "Rejected by admin");
}

export async function approveVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);
  const [outletId, brandId] = await Promise.all([
    findOutletIdByName(supabase, input.outletName),
    findBrandIdByName(supabase, input.brandName)
  ]);
  const amount = optionalNumberInput(input.amount);
  const now = new Date().toISOString();
  let approvedEntityType = input.recordType;
  let approvedEntityId: string | null = null;

  if (input.recordType === "visit") {
    const { data, error } = await supabase
      .from("visits")
      .insert({
        outlet_id: outletId,
        visit_datetime: now,
        visit_type: "routine_visit",
        productive: amount > 0 || Boolean(input.quantity),
        outcome: input.notes || input.title,
        notes: input.notes || String(draftJson.source_text ?? ""),
        source_message_id: current.incoming_message_id,
        verified_at: now
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "order") {
    const sku = await findSkuForOrder(supabase, input.sku);
    const quantity = optionalNumberInput(input.quantity) || 1;
    const unitPrice = sku?.mrp ?? amount;
    const expectedValue = amount || quantity * unitPrice;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        outlet_id: outletId,
        brand_id: sku?.brandId ?? brandId,
        expected_value: expectedValue,
        expected_delivery_date: input.dueDate || null,
        status: "intent_captured",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
    if (sku) {
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: data.id,
        sku_id: sku.id,
        quantity,
        unit_price: unitPrice,
        total_value: quantity * unitPrice
      });
      if (itemError) throw new Error(itemError.message);
    }
  } else if (input.recordType === "bill") {
    const { data, error } = await supabase
      .from("bills")
      .insert({
        outlet_id: outletId,
        brand_id: brandId,
        total_amount: amount,
        payment_status: "due",
        ocr_text: String(draftJson.source_text ?? ""),
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "payment") {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        outlet_id: outletId,
        brand_id: brandId,
        amount_due: amount,
        amount_collected: String(draftJson.payment_status ?? "") === "collected" ? amount : 0,
        due_date: input.dueDate || null,
        promised_payment_date: input.dueDate || null,
        status: String(draftJson.payment_status ?? "") === "collected" ? "paid" : "due",
        risk_level: amount > 10000 ? "high" : "medium",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "outlet") {
    const existingOutletId = outletId;
    if (existingOutletId) {
      approvedEntityId = existingOutletId;
    } else {
      const { data, error } = await supabase
        .from("outlets")
        .insert({
          name: input.outletName,
          city: "Unassigned",
          status: "prospect",
          channel_type: "Unassigned"
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      approvedEntityId = data.id;
    }
  } else if (input.recordType === "competitor_insight") {
    const { data, error } = await supabase
      .from("competitor_insights")
      .insert({
        brand_id: brandId,
        outlet_id: outletId,
        competitor_name: typeof draftJson.competitor_name === "string" && draftJson.competitor_name ? draftJson.competitor_name : "Unassigned competitor",
        margin_or_scheme: typeof draftJson.competitor_margin === "string" ? draftJson.competitor_margin : null,
        insight_text: input.notes || String(draftJson.source_text ?? input.title),
        impact_level: amount > 0 ? "high" : "medium",
        evidence_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else {
    approvedEntityType = "task";
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: input.title,
        description: input.notes || String(draftJson.source_text ?? ""),
        task_type: input.recordType,
        outlet_id: outletId,
        brand_id: brandId,
        due_date: input.dueDate || null,
        priority: current.confidence && Number(current.confidence) < 0.75 ? "high" : "medium",
        status: "open",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  }

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      status: "approved",
      review_notes: input.reviewNotes || "Approved by admin",
      approved_entity_type: approvedEntityType,
      approved_entity_id: approvedEntityId,
      approved_at: now,
      updated_at: now
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes || "Approved by admin");
}

export async function saveMetaIntegrationAction(formData: FormData) {
  const input = metaIntegrationSchema.parse({
    displayName: formValue(formData, "displayName"),
    phoneNumberId: formValue(formData, "phoneNumberId"),
    whatsappBusinessAccountId: formValue(formData, "whatsappBusinessAccountId"),
    businessPortfolioId: formValue(formData, "businessPortfolioId"),
    graphApiVersion: formValue(formData, "graphApiVersion"),
    webhookVerifyToken: formValue(formData, "webhookVerifyToken"),
    accessToken: formValue(formData, "accessToken"),
    appSecret: formValue(formData, "appSecret"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("integration_settings")
    .select("id,webhook_verify_token,access_token,app_secret")
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    provider: "meta_whatsapp",
    display_name: input.displayName,
    status: connectionStatusMap[input.status],
    phone_number_id: input.phoneNumberId,
    whatsapp_business_account_id: input.whatsappBusinessAccountId,
    business_portfolio_id: input.businessPortfolioId || null,
    graph_api_version: input.graphApiVersion,
    webhook_verify_token: input.webhookVerifyToken || existing?.webhook_verify_token || null,
    access_token: input.accessToken || existing?.access_token || null,
    app_secret: input.appSecret || existing?.app_secret || null,
    last_test_status: "Configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("integration_settings").update(payload).eq("id", existing.id)
    : await supabase.from("integration_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function saveAIProviderAction(formData: FormData) {
  const input = aiProviderSchema.parse({
    provider: formValue(formData, "provider"),
    model: formValue(formData, "model"),
    baseUrl: formValue(formData, "baseUrl"),
    apiKey: formValue(formData, "apiKey"),
    extractionMode: formValue(formData, "extractionMode"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("ai_provider_settings")
    .select("id,api_key")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    provider: input.provider,
    model: input.model,
    status: connectionStatusMap[input.status],
    base_url: input.baseUrl || null,
    api_key: input.apiKey || existing?.api_key || null,
    extraction_mode: input.extractionMode,
    last_test_status: "Configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("ai_provider_settings").update(payload).eq("id", existing.id)
    : await supabase.from("ai_provider_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function saveOpenAIIntegrationAction(formData: FormData) {
  const input = openAIIntegrationSchema.parse({
    model: formValue(formData, "model"),
    transcriptionModel: formValue(formData, "transcriptionModel"),
    baseUrl: formValue(formData, "baseUrl"),
    apiKey: formValue(formData, "apiKey"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("ai_provider_settings")
    .select("id,config_json")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const currentConfig = objectJson(existing?.config_json);
  const currentOpenAI = objectJson(currentConfig.openaiFallback);
  const existingOpenAIKey = typeof currentOpenAI.apiKey === "string" && currentOpenAI.apiKey ? currentOpenAI.apiKey : null;
  const savedApiKey = input.apiKey || existingOpenAIKey;
  const savedStatus = input.status === "Draft" && savedApiKey ? "Connected" : input.status;
  const openaiFallback = {
    ...currentOpenAI,
    status: savedStatus,
    model: input.model,
    transcriptionModel: input.transcriptionModel,
    baseUrl: input.baseUrl || "https://api.openai.com/v1",
    apiKey: savedApiKey,
    lastTestStatus: savedApiKey ? "Configuration saved. API key is stored." : "Configuration saved without API key",
    lastError: null,
    updatedAt: new Date().toISOString()
  };

  const payload = {
    config_json: {
      ...currentConfig,
      openaiFallback
    },
    last_test_status: "OpenAI fallback configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("ai_provider_settings").update(payload).eq("id", existing.id)
    : await supabase.from("ai_provider_settings").insert({
        provider: "sarvam",
        model: "saaras:v3",
        status: "draft",
        extraction_mode: "structured_json",
        ...payload
      });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
