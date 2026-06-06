import { createSupabaseReadClient } from "@/lib/supabase/admin";
import type {
  AIProviderSettings,
  AppUserRow,
  BillRow,
  BrandOption,
  CommandCenterData,
  CommandRecord,
  GoodsReceiptRow,
  InventoryPositionRow,
  MaterialFlowRow,
  MetaIntegrationSettings,
  OpenAIIntegrationSettings,
  OrderRow,
  OutletRow,
  PaymentRow,
  ProcurementOffice,
  PurchaseOrderRow,
  SalesmanRow,
  SkuRow,
  SupplierPayableRow,
  TaskRow,
  TerritoryRow,
  VerificationDraftRecord
} from "./types";

type SupabaseMaybeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

type OutletBrandJoin = {
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type OutletResult = {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  city: string;
  channel_type: string | null;
  status: string | null;
  credit_limit: number | string | null;
  credit_hold_status: string | null;
  outlet_brands?: OutletBrandJoin[] | null;
  territories?: { name?: string | null } | { name?: string | null }[] | null;
  field_executives?: {
    users?: { name?: string | null } | { name?: string | null }[] | null;
  } | {
    users?: { name?: string | null } | { name?: string | null }[] | null;
  }[] | null;
};

type SalesmanResult = {
  id: string;
  phone: string;
  status: string | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
  territories?: { name?: string | null; city?: string | null } | { name?: string | null; city?: string | null }[] | null;
};

type AppUserResult = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: AppUserRow["role"];
  status: string | null;
};

type TaskResult = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

type TerritoryResult = {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string | null;
  status: string | null;
};

type SkuResult = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  unit: string | null;
  mrp: number | string | null;
  image_url: string | null;
  status: string | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type PaymentResult = {
  id: string;
  bill_id: string | null;
  amount_due: number | string | null;
  amount_collected: number | string | null;
  due_date: string | null;
  promised_payment_date: string | null;
  payment_mode: string | null;
  receipt_number: string | null;
  collector_name: string | null;
  allocation_summary: string | null;
  write_off_status: string | null;
  dispute_status: string | null;
  settlement_status: string | null;
  settlement_reference: string | null;
  settlement_date: string | null;
  status: string | null;
  risk_level: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  bills?: { bill_number?: string | null } | { bill_number?: string | null }[] | null;
};

type OrderResult = {
  id: string;
  expected_value: number | string | null;
  expected_delivery_date: string | null;
  status: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  order_items?: {
    quantity?: number | string | null;
    unit_price?: number | string | null;
    total_value?: number | string | null;
    skus?: {
      name?: string | null;
      code?: string | null;
      brands?: { name?: string | null } | { name?: string | null }[] | null;
    } | {
      name?: string | null;
      code?: string | null;
      brands?: { name?: string | null } | { name?: string | null }[] | null;
    }[] | null;
  }[] | null;
};

type BillResult = {
  id: string;
  order_id: string | null;
  bill_number: string | null;
  bill_date: string | null;
  total_amount: number | string | null;
  payment_status: string | null;
  bill_image_path: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type ProcurementOfficeResult = {
  id: string;
  office_name: string;
  region: string | null;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  procurement_role: string | null;
  lead_time_days: number | string | null;
  replenishment_mode: string | null;
  status: string | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type MaterialFlowResult = {
  id: string;
  movement_type: string | null;
  from_location: string | null;
  to_location: string | null;
  quantity: number | string | null;
  movement_value: number | string | null;
  expected_date: string | null;
  status: string | null;
  document_ref: string | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  skus?: { name?: string | null; code?: string | null } | { name?: string | null; code?: string | null }[] | null;
};

type PurchaseOrderResult = {
  id: string;
  po_number: string | null;
  expected_date: string | null;
  total_value: number | string | null;
  status: string | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  brand_branches?: { office_name?: string | null } | { office_name?: string | null }[] | null;
};

type GoodsReceiptResult = {
  id: string;
  receipt_number: string | null;
  received_date: string | null;
  warehouse: string | null;
  status: string | null;
  purchase_orders?: {
    po_number?: string | null;
    brands?: { name?: string | null } | { name?: string | null }[] | null;
    brand_branches?: { office_name?: string | null } | { office_name?: string | null }[] | null;
  } | {
    po_number?: string | null;
    brands?: { name?: string | null } | { name?: string | null }[] | null;
    brand_branches?: { office_name?: string | null } | { office_name?: string | null }[] | null;
  }[] | null;
};

type SupplierPayableResult = {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  amount_due: number | string | null;
  amount_paid: number | string | null;
  due_date: string | null;
  status: string | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
  brand_branches?: { office_name?: string | null } | { office_name?: string | null }[] | null;
  purchase_orders?: { po_number?: string | null } | { po_number?: string | null }[] | null;
};

type VerificationDraftResult = {
  id: string;
  record_type: string;
  title: string;
  draft_json: Record<string, unknown> | null;
  confidence: number | string | null;
  status: string | null;
  created_at: string;
  message_classifications?: {
    primary_category?: string | null;
    secondary_categories?: string[] | null;
    language_detected?: string | null;
    original_text?: string | null;
    normalized_text?: string | null;
    reason_for_review?: string | null;
  } | { primary_category?: string | null; secondary_categories?: string[] | null; language_detected?: string | null; original_text?: string | null; normalized_text?: string | null; reason_for_review?: string | null }[] | null;
  message_ai_extractions?: {
    transcript_text?: string | null;
    ocr_text?: string | null;
  } | { transcript_text?: string | null; ocr_text?: string | null }[] | null;
  incoming_messages?: {
    text_body?: string | null;
  } | { text_body?: string | null }[] | null;
};

type IntegrationSettingsResult = {
  id: string;
  display_name: string | null;
  status: string | null;
  phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  business_portfolio_id: string | null;
  graph_api_version: string | null;
  webhook_verify_token: string | null;
  access_token: string | null;
  app_secret: string | null;
  last_test_status: string | null;
  last_error: string | null;
  updated_at: string | null;
};

type AIProviderSettingsResult = {
  id: string;
  provider: string | null;
  model: string | null;
  status: string | null;
  base_url: string | null;
  api_key: string | null;
  extraction_mode: string | null;
  config_json: unknown;
  last_test_status: string | null;
  last_error: string | null;
  updated_at: string | null;
};

function isMissingRelationError(error?: SupabaseMaybeError | null) {
  if (!error) return false;
  const text = [error.message, error.details, error.hint].filter(Boolean).join(" ").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST200" ||
    text.includes("could not find the table") ||
    text.includes("could not find a relationship") ||
    text.includes("schema cache")
  );
}

function displayStatus(status?: string | null): "Active" | "Prospect" | "Inactive" {
  if (status === "prospect") return "Prospect";
  if (status === "inactive") return "Inactive";
  return "Active";
}

function displayBrandStatus(status?: string | null): "Active" | "Inactive" {
  return status === "inactive" ? "Inactive" : "Active";
}

function displayTaskStatus(status?: string | null): TaskRow["status"] {
  if (status === "in_progress") return "In progress";
  if (status === "waiting_for_response") return "Waiting for response";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "overdue") return "Overdue";
  return "Open";
}

function displayTaskPriority(priority?: string | null): TaskRow["priority"] {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function numberValue(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function displayRiskLevel(risk?: string | null): PaymentRow["riskLevel"] {
  if (risk === "low") return "Low";
  if (risk === "high") return "High";
  if (risk === "critical") return "Critical";
  return "Medium";
}

function displayCreditHoldStatus(status?: string | null): OutletRow["creditHoldStatus"] {
  if (status === "watch") return "Watch";
  if (status === "hold") return "Hold";
  if (status === "blocked") return "Blocked";
  return "Clear";
}

function displayWriteOffStatus(status?: string | null): PaymentRow["writeOffStatus"] {
  if (status === "requested") return "Requested";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Not requested";
}

function displayDisputeStatus(status?: string | null): PaymentRow["disputeStatus"] {
  if (status === "opened") return "Opened";
  if (status === "under_review") return "Under review";
  if (status === "resolved") return "Resolved";
  if (status === "rejected") return "Rejected";
  return "Not disputed";
}

function displaySettlementStatus(status?: string | null): PaymentRow["settlementStatus"] {
  if (status === "matched") return "Matched";
  if (status === "exception") return "Exception";
  if (status === "settled") return "Settled";
  return "Unreconciled";
}

function displayPaymentStatus(status?: string | null): PaymentRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Due";
}

function displayOrderStatus(status?: string | null): OrderRow["status"] {
  if (status === "confirmed") return "Confirmed";
  if (status === "billed") return "Billed";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "on_hold") return "On hold";
  return "Intent captured";
}

function displayProcurementOfficeStatus(status?: string | null): ProcurementOffice["status"] {
  if (status === "alternate") return "Alternate";
  if (status === "inactive") return "Inactive";
  return "Primary";
}

function displayMaterialMovementType(type?: string | null): MaterialFlowRow["movementType"] {
  if (type === "outbound_sale") return "Outbound sale";
  if (type === "billed_dispatch") return "Billed dispatch";
  if (type === "return_hold") return "Return / hold";
  return "Inbound procurement";
}

function displayPurchaseOrderStatus(status?: string | null): PurchaseOrderRow["status"] {
  if (status === "sent") return "Sent";
  if (status === "confirmed") return "Confirmed";
  if (status === "partially_received") return "Partially received";
  if (status === "received") return "Received";
  if (status === "cancelled") return "Cancelled";
  return "Draft";
}

function displayGoodsReceiptStatus(status?: string | null): GoodsReceiptRow["status"] {
  if (status === "received") return "Received";
  if (status === "quality_hold") return "Quality hold";
  if (status === "posted") return "Posted";
  if (status === "cancelled") return "Cancelled";
  return "Draft";
}

function displaySupplierPayableStatus(status?: string | null): SupplierPayableRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Pending";
}

function displayConnectionStatus(status?: string | null): "Connected" | "Draft" | "Disabled" {
  if (status === "connected") return "Connected";
  if (status === "disabled") return "Disabled";
  return "Draft";
}

function displayOpenAIStatus(status?: string | null): "Connected" | "Draft" | "Disabled" {
  if (status === "Connected" || status === "Draft" || status === "Disabled") return status;
  return displayConnectionStatus(status);
}

function displayUserStatus(status?: string | null): AppUserRow["status"] {
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

function seededDemoUsers(): AppUserRow[] {
  return [
    {
      id: "seeded-ops-manager",
      name: "Ops Manager",
      email: "ops.manager@example.com",
      phone: "+91 98888 19999",
      role: "operations_manager",
      roleLabel: "Manager",
      territory: "All territories",
      status: "Active"
    },
    {
      id: "seeded-meera-field",
      name: "Meera S.",
      email: "meera.field@example.com",
      phone: "+91 98888 10001",
      role: "field_executive",
      roleLabel: "Sales Executive",
      territory: "Pune West",
      status: "Active"
    },
    {
      id: "seeded-arjun-field",
      name: "Arjun K.",
      email: "arjun.field@example.com",
      phone: "+91 98888 10002",
      role: "field_executive",
      roleLabel: "Sales Executive",
      territory: "Nashik Core",
      status: "Active"
    },
    {
      id: "seeded-ravi-field",
      name: "Ravi M.",
      email: "ravi.field@example.com",
      phone: "+91 98888 10003",
      role: "field_executive",
      roleLabel: "Sales Executive",
      territory: "Thane Retail",
      status: "Active"
    }
  ];
}

function defaultMetaIntegration(): MetaIntegrationSettings {
  return {
    displayName: "Meta WhatsApp Cloud API",
    status: "Draft",
    phoneNumberId: "",
    whatsappBusinessAccountId: "",
    businessPortfolioId: "",
    graphApiVersion: "v25.0",
    webhookUrl: "/api/webhooks/whatsapp",
    hasAccessToken: false,
    hasAppSecret: false,
    hasVerifyToken: false,
    lastTestStatus: "Not tested",
    lastError: "",
    updatedAt: "--"
  };
}

function defaultAIProvider(): AIProviderSettings {
  return {
    provider: "sarvam",
    model: "saaras:v3",
    status: "Draft",
    baseUrl: "",
    hasApiKey: false,
    extractionMode: "structured_json",
    lastTestStatus: "Not tested",
    lastError: "",
    updatedAt: "--"
  };
}

function defaultOpenAIIntegration(): OpenAIIntegrationSettings {
  return {
    status: "Draft",
    model: "gpt-5.4-mini",
    transcriptionModel: "gpt-4o-mini-transcribe",
    baseUrl: "https://api.openai.com/v1",
    hasApiKey: false,
    lastTestStatus: "Not configured",
    lastError: "",
    updatedAt: "--"
  };
}

function openAIConfigFromJson(config: unknown): Partial<OpenAIIntegrationSettings> & { apiKey?: string } {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  const openAI = (config as { openaiFallback?: unknown }).openaiFallback;
  if (!openAI || typeof openAI !== "object" || Array.isArray(openAI)) return {};

  return openAI as Partial<OpenAIIntegrationSettings> & { apiKey?: string };
}

function procurementOfficesForBrand(brand: BrandOption): ProcurementOffice[] {
  if (brand.name.toLowerCase().includes("nestle")) {
    return [
      {
        id: `${brand.id}-south`,
        brand: brand.name,
        officeName: "Nestle South Regional HQ",
        region: "South India",
        city: "Bengaluru",
        state: "Karnataka",
        contact: brand.contact,
        phone: brand.contactPhone || "+91 80 4000 2200",
        email: brand.contactEmail || "south.procurement@nestle.example",
        procurementRole: "Primary procurement, schemes, stock allocation, and distributor replenishment approvals",
        leadTimeDays: 3,
        replenishmentMode: "Regional PO, distributor GRN, invoice-backed dispatch",
        status: "Primary"
      },
      {
        id: `${brand.id}-west`,
        brand: brand.name,
        officeName: "Nestle West Supply Office",
        region: "West India",
        city: "Mumbai",
        state: "Maharashtra",
        contact: "Regional supply desk",
        phone: "+91 22 6000 1144",
        email: "west.supply@nestle.example",
        procurementRole: "Alternate replenishment point for inter-region shortages and promotional stock",
        leadTimeDays: 5,
        replenishmentMode: "Transfer order and distributor invoice",
        status: "Alternate"
      },
      {
        id: `${brand.id}-north`,
        brand: brand.name,
        officeName: "Nestle North Procurement Office",
        region: "North India",
        city: "Gurugram",
        state: "Haryana",
        contact: "National procurement desk",
        phone: "+91 124 500 7000",
        email: "national.procurement@nestle.example",
        procurementRole: "Central policy, price lists, credit terms, and distributor onboarding documentation",
        leadTimeDays: 7,
        replenishmentMode: "Head office approval and regional release",
        status: "Alternate"
      }
    ];
  }

  return [
    {
      id: `${brand.id}-primary`,
      brand: brand.name,
      officeName: `${brand.name} primary procurement office`,
      region: "Assigned region",
      city: "Unassigned",
      state: "Unassigned",
      contact: brand.contact,
      phone: brand.contactPhone || "Not captured",
      email: brand.contactEmail || "Not captured",
      procurementRole: "Distributor purchase orders, price list confirmation, stock allocation, and scheme communication",
      leadTimeDays: 4,
      replenishmentMode: "Purchase order, goods receipt, and invoice reconciliation",
      status: "Primary"
    }
  ];
}

function buildMaterialFlows(procurementOffices: ProcurementOffice[], skus: SkuRow[], orders: OrderRow[], bills: BillRow[]): MaterialFlowRow[] {
  const flows: MaterialFlowRow[] = [];
  skus.slice(0, 8).forEach((sku) => {
    const office = procurementOffices.find((item) => item.brand === sku.brand && item.status === "Primary") ?? procurementOffices.find((item) => item.brand === sku.brand);
    flows.push({
      id: `inbound-${sku.id}`,
      brand: sku.brand,
      sku: sku.name,
      skuCode: sku.code,
      movementType: "Inbound procurement",
      fromLocation: office ? `${office.officeName}, ${office.city}` : `${sku.brand} procurement office`,
      toLocation: "Distributor warehouse",
      quantity: 240,
      value: Math.round(sku.mrp * 240 * 0.78),
      expectedDate: office ? `${office.leadTimeDays} day lead time` : "Lead time not captured",
      status: "Planned replenishment",
      documentRef: "PO pending"
    });
  });

  orders.slice(0, 8).forEach((order) => {
    flows.push({
      id: `order-${order.id}`,
      brand: order.brand,
      sku: order.sku,
      skuCode: order.skuCode,
      movementType: "Outbound sale",
      fromLocation: "Distributor warehouse",
      toLocation: order.outlet,
      quantity: order.quantity,
      value: order.expectedValue,
      expectedDate: order.expectedDeliveryDate,
      status: order.status,
      documentRef: "Sales order"
    });
  });

  bills.slice(0, 6).forEach((bill) => {
    flows.push({
      id: `bill-${bill.id}`,
      brand: bill.brand,
      sku: "Mixed invoice",
      skuCode: bill.billNumber,
      movementType: "Billed dispatch",
      fromLocation: "Distributor billing desk",
      toLocation: bill.outlet,
      quantity: 1,
      value: bill.totalAmount,
      expectedDate: bill.billDate,
      status: bill.paymentStatus,
      documentRef: bill.billNumber
    });
  });

  return flows;
}

function buildInventoryPositions(skus: SkuRow[], materialFlows: MaterialFlowRow[]): InventoryPositionRow[] {
  return skus.map((sku) => {
    const skuFlows = materialFlows.filter((flow) => flow.skuCode === sku.code || flow.sku === sku.name);
    const inbound = skuFlows.filter((flow) => flow.movementType === "Inbound procurement").reduce((sum, flow) => sum + flow.quantity, 0);
    const outbound = skuFlows.filter((flow) => flow.movementType === "Outbound sale" || flow.movementType === "Billed dispatch").reduce((sum, flow) => sum + flow.quantity, 0);
    const damaged = skuFlows.filter((flow) => flow.movementType === "Return / hold").reduce((sum, flow) => sum + flow.quantity, 0);
    const onHand = Math.max(inbound - outbound, 0);
    const reserved = Math.min(outbound, onHand);
    const available = Math.max(onHand - reserved - damaged, 0);
    const reorderLevel = 48;
    const status: InventoryPositionRow["status"] = available <= 0 || available < reorderLevel ? "Reorder due" : available < reorderLevel * 2 ? "Low stock" : "Healthy";
    return {
      id: `inventory-${sku.id}`,
      brand: sku.brand,
      sku: sku.name,
      skuCode: sku.code,
      onHand,
      reserved,
      available,
      inbound,
      damaged,
      reorderLevel,
      warehouse: "Distributor warehouse",
      status
    };
  });
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const supabase = createSupabaseReadClient();

  const [
    brandsResult,
    usersResult,
    outletsResult,
    salesmenResult,
    tasksResult,
    territoriesResult,
    skusResult,
    paymentsResult,
    ordersResult,
    billsResult,
    procurementOfficesResult,
    materialFlowsResult,
    purchaseOrdersResult,
    goodsReceiptsResult,
    supplierPayablesResult,
    verificationDraftsResult,
    metaIntegrationResult,
    aiProviderResult
  ] = await Promise.all([
    supabase.from("brands").select("id,name,category,contact_person,contact_email,contact_phone,status").order("created_at", { ascending: false }),
    supabase.from("users").select("id,name,email,phone,role,status").order("created_at", { ascending: false }),
    supabase
      .from("outlets")
      .select("id,name,owner_name,phone,city,channel_type,status,credit_limit,credit_hold_status,outlet_brands(brands(name)),territories(name),field_executives(users!field_executives_user_id_fkey(name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("field_executives")
      .select("id,phone,status,users!field_executives_user_id_fkey(name),territories(name,city)")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id,title,description,task_type,due_date,priority,status,outlets(name),brands(name),users(name)")
      .order("created_at", { ascending: false }),
    supabase.from("territories").select("id,name,city,state,region,status").order("created_at", { ascending: false }),
    supabase.from("skus").select("id,name,code,category,unit,mrp,image_url,status,brands(name)").order("name", { ascending: true }),
    supabase
      .from("payments")
      .select("id,bill_id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,receipt_number,collector_name,allocation_summary,write_off_status,dispute_status,settlement_status,settlement_reference,settlement_date,status,risk_level,outlets(name),brands(name),bills(bill_number)")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,expected_value,expected_delivery_date,status,outlets(name),brands(name),order_items(quantity,unit_price,total_value,skus(name,code,brands(name)))")
      .order("created_at", { ascending: false }),
    supabase
      .from("bills")
      .select("id,order_id,bill_number,bill_date,total_amount,payment_status,bill_image_path,outlets(name),brands(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("brand_branches")
      .select("id,office_name,region,city,state,contact_person,contact_phone,contact_email,procurement_role,lead_time_days,replenishment_mode,status,brands(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_movements")
      .select("id,movement_type,from_location,to_location,quantity,movement_value,expected_date,status,document_ref,brands(name),skus(name,code)")
      .order("created_at", { ascending: false }),
    supabase
      .from("purchase_orders")
      .select("id,po_number,expected_date,total_value,status,brands(name),brand_branches(office_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("goods_receipts")
      .select("id,receipt_number,received_date,warehouse,status,purchase_orders(po_number,brands(name),brand_branches(office_name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("supplier_payables")
      .select("id,invoice_number,invoice_date,amount_due,amount_paid,due_date,status,brands(name),brand_branches(office_name),purchase_orders(po_number)")
      .order("created_at", { ascending: false }),
    supabase
      .from("draft_business_records")
      .select("id,record_type,title,draft_json,confidence,status,created_at,message_classifications(primary_category,secondary_categories,language_detected,original_text,normalized_text,reason_for_review),message_ai_extractions(transcript_text,ocr_text),incoming_messages(text_body)")
      .neq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("integration_settings")
      .select("id,display_name,status,phone_number_id,whatsapp_business_account_id,business_portfolio_id,graph_api_version,webhook_verify_token,access_token,app_secret,last_test_status,last_error,updated_at")
      .eq("provider", "meta_whatsapp")
      .maybeSingle(),
    supabase
      .from("ai_provider_settings")
      .select("id,provider,model,status,base_url,api_key,extraction_mode,config_json,last_test_status,last_error,updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (brandsResult.error) throw new Error(brandsResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);
  if (outletsResult.error) throw new Error(outletsResult.error.message);
  if (salesmenResult.error) throw new Error(salesmenResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (territoriesResult.error) throw new Error(territoriesResult.error.message);
  if (skusResult.error) throw new Error(skusResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (billsResult.error) throw new Error(billsResult.error.message);
  if (procurementOfficesResult.error && !isMissingRelationError(procurementOfficesResult.error)) throw new Error(procurementOfficesResult.error.message);
  if (materialFlowsResult.error && !isMissingRelationError(materialFlowsResult.error)) throw new Error(materialFlowsResult.error.message);
  if (purchaseOrdersResult.error && !isMissingRelationError(purchaseOrdersResult.error)) throw new Error(purchaseOrdersResult.error.message);
  if (goodsReceiptsResult.error && !isMissingRelationError(goodsReceiptsResult.error)) throw new Error(goodsReceiptsResult.error.message);
  if (supplierPayablesResult.error && !isMissingRelationError(supplierPayablesResult.error)) throw new Error(supplierPayablesResult.error.message);
  if (verificationDraftsResult.error && !isMissingRelationError(verificationDraftsResult.error)) throw new Error(verificationDraftsResult.error.message);
  if (metaIntegrationResult.error) throw new Error(metaIntegrationResult.error.message);
  if (aiProviderResult.error) throw new Error(aiProviderResult.error.message);

  const brands: BrandOption[] = (brandsResult.data ?? []).map((brand) => ({
    id: brand.id,
    name: brand.name,
    category: brand.category ?? "Uncategorized",
    contact: brand.contact_person ?? "Internal ops",
    contactEmail: brand.contact_email ?? "",
    contactPhone: brand.contact_phone ?? "",
    status: displayBrandStatus(brand.status)
  }));

  const usersFromDatabase: AppUserRow[] = ((usersResult.data ?? []) as AppUserResult[]).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    phone: user.phone ?? "",
    role: user.role,
    roleLabel: roleLabel(user.role),
    territory: "Managed in Sales App & Team",
    status: displayUserStatus(user.status)
  }));
  const users = usersFromDatabase.length ? usersFromDatabase : seededDemoUsers();

  const outlets: OutletRow[] = ((outletsResult.data ?? []) as OutletResult[]).map((outlet) => {
    const linkedBrand = Array.isArray(outlet.outlet_brands) ? outlet.outlet_brands[0]?.brands : undefined;
    const brandName = Array.isArray(linkedBrand) ? linkedBrand[0]?.name : linkedBrand?.name;
    const territory = Array.isArray(outlet.territories) ? outlet.territories[0] : outlet.territories;
    const executive = Array.isArray(outlet.field_executives) ? outlet.field_executives[0] : outlet.field_executives;
    const executiveUser = Array.isArray(executive?.users) ? executive?.users[0] : executive?.users;

    return {
      id: outlet.id,
      name: outlet.name,
      city: outlet.city,
      channel: outlet.channel_type ?? "Unassigned",
      brand: brandName ?? "Unassigned",
      territory: territory?.name ?? "Unassigned",
      assignedSalesman: executiveUser?.name ?? "Unassigned",
      status: displayStatus(outlet.status),
      owner: outlet.owner_name ?? "",
      phone: outlet.phone ?? "",
      creditLimit: numberValue(outlet.credit_limit),
      creditHoldStatus: displayCreditHoldStatus(outlet.credit_hold_status)
    };
  });

  const salesmen: SalesmanRow[] = ((salesmenResult.data ?? []) as SalesmanResult[]).map((person) => {
    const user = Array.isArray(person.users) ? person.users[0] : person.users;
    const territory = Array.isArray(person.territories) ? person.territories[0] : person.territories;

    return {
      id: person.id,
      name: user?.name ?? "Unnamed executive",
      phone: person.phone,
      city: territory?.city ?? "Unassigned",
      territory: territory?.name ?? "Unassigned",
      status: displayBrandStatus(person.status)
    };
  });

  const records: CommandRecord[] = outlets.slice(0, 4).map((outlet, index) => ({
    id: `record-${outlet.id}`,
    outlet: outlet.name,
    city: outlet.city,
    partner: outlet.brand,
    fieldAgent: salesmen[index % Math.max(salesmen.length, 1)]?.name ?? "Sales Team",
    type: index === 1 ? "Stockout" : "Sale",
    units: index === 1 ? 0 : 12 + index * 6,
    value: index === 1 ? 0 : (12 + index * 6) * 150,
    status: index < 2 ? "pending" : "verified",
    confidence: index === 1 ? 0.63 : 0.9,
    evidence: index === 1 ? "Sales-app voice note transcription" : "Shelf photo + retailer WhatsApp text",
    message: index === 1 ? "Retailer reported stock issue and requested refill." : `Sales-app update captured for ${outlet.name}.`,
    createdAt: "10:12"
  }));

  const tasks: TaskRow[] = ((tasksResult.data ?? []) as TaskResult[]).map((task) => {
    const outlet = Array.isArray(task.outlets) ? task.outlets[0] : task.outlets;
    const brand = Array.isArray(task.brands) ? task.brands[0] : task.brands;
    const assignedUser = Array.isArray(task.users) ? task.users[0] : task.users;

    return {
      id: task.id,
      title: task.title,
      description: task.description ?? "Created from verified sales or retailer signal.",
      taskType: task.task_type,
      assignedTo: assignedUser?.name ?? "Unassigned",
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      dueDate: task.due_date ?? "No due date",
      priority: displayTaskPriority(task.priority),
      status: displayTaskStatus(task.status)
    };
  });

  const territories: TerritoryRow[] = ((territoriesResult.data ?? []) as TerritoryResult[]).map((territory) => ({
    id: territory.id,
    name: territory.name,
    city: territory.city,
    state: territory.state,
    region: territory.region ?? "Unassigned",
    status: displayBrandStatus(territory.status)
  }));

  const skus: SkuRow[] = ((skusResult.data ?? []) as SkuResult[]).map((sku) => {
    const brand = Array.isArray(sku.brands) ? sku.brands[0] : sku.brands;

    return {
      id: sku.id,
      name: sku.name,
      code: sku.code ?? "",
      brand: brand?.name ?? "Unassigned",
      category: sku.category ?? "Uncategorized",
      unit: sku.unit ?? "Unit",
      mrp: numberValue(sku.mrp),
      imageUrl: sku.image_url ?? "",
      status: displayBrandStatus(sku.status)
    };
  });

  const payments: PaymentRow[] = ((paymentsResult.data ?? []) as PaymentResult[]).map((payment) => {
    const outlet = Array.isArray(payment.outlets) ? payment.outlets[0] : payment.outlets;
    const brand = Array.isArray(payment.brands) ? payment.brands[0] : payment.brands;
    const bill = Array.isArray(payment.bills) ? payment.bills[0] : payment.bills;

    return {
      id: payment.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      billId: payment.bill_id ?? "",
      billNumber: bill?.bill_number ?? "Unallocated",
      amountDue: numberValue(payment.amount_due),
      amountCollected: numberValue(payment.amount_collected),
      dueDate: payment.due_date ?? "No due date",
      promisedPaymentDate: payment.promised_payment_date ?? "No promise",
      paymentMode: payment.payment_mode ?? "Unassigned",
      status: displayPaymentStatus(payment.status),
      riskLevel: displayRiskLevel(payment.risk_level),
      receiptNumber: payment.receipt_number ?? "Draft receipt",
      collectorName: payment.collector_name ?? "Unassigned",
      allocationSummary: payment.allocation_summary ?? "",
      writeOffStatus: displayWriteOffStatus(payment.write_off_status),
      disputeStatus: displayDisputeStatus(payment.dispute_status),
      settlementStatus: displaySettlementStatus(payment.settlement_status),
      settlementReference: payment.settlement_reference ?? "",
      settlementDate: payment.settlement_date ?? "No settlement date"
    };
  });

  const orders: OrderRow[] = ((ordersResult.data ?? []) as OrderResult[]).map((order) => {
    const outlet = Array.isArray(order.outlets) ? order.outlets[0] : order.outlets;
    const brand = Array.isArray(order.brands) ? order.brands[0] : order.brands;
    const item = order.order_items?.[0];
    const sku = Array.isArray(item?.skus) ? item?.skus[0] : item?.skus;
    const skuBrand = Array.isArray(sku?.brands) ? sku?.brands[0] : sku?.brands;

    return {
      id: order.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? skuBrand?.name ?? "Unassigned",
      sku: sku?.name ?? "Unassigned SKU",
      skuCode: sku?.code ?? "",
      quantity: numberValue(item?.quantity),
      unitPrice: numberValue(item?.unit_price),
      expectedValue: numberValue(order.expected_value),
      expectedDeliveryDate: order.expected_delivery_date ?? "No delivery date",
      status: displayOrderStatus(order.status)
    };
  });

  const bills: BillRow[] = ((billsResult.data ?? []) as BillResult[]).map((bill) => {
    const outlet = Array.isArray(bill.outlets) ? bill.outlets[0] : bill.outlets;
    const brand = Array.isArray(bill.brands) ? bill.brands[0] : bill.brands;

    return {
      id: bill.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      orderId: bill.order_id ?? "",
      billNumber: bill.bill_number ?? "Unnumbered",
      billDate: bill.bill_date ?? "No bill date",
      totalAmount: numberValue(bill.total_amount),
      paymentStatus: displayPaymentStatus(bill.payment_status),
      billImagePath: bill.bill_image_path ?? ""
    };
  });

  const persistedProcurementOffices: ProcurementOffice[] = ((procurementOfficesResult.data ?? []) as ProcurementOfficeResult[]).map((office) => {
    const brand = Array.isArray(office.brands) ? office.brands[0] : office.brands;
    return {
      id: office.id,
      brand: brand?.name ?? "Unassigned",
      officeName: office.office_name,
      region: office.region ?? "Unassigned",
      city: office.city ?? "Unassigned",
      state: office.state ?? "Unassigned",
      contact: office.contact_person ?? "Unassigned",
      phone: office.contact_phone ?? "",
      email: office.contact_email ?? "",
      procurementRole: office.procurement_role ?? "Distributor procurement",
      leadTimeDays: numberValue(office.lead_time_days),
      replenishmentMode: office.replenishment_mode ?? "Purchase order",
      status: displayProcurementOfficeStatus(office.status)
    };
  });
  const procurementOffices = persistedProcurementOffices.length ? persistedProcurementOffices : brands.flatMap(procurementOfficesForBrand);

  const persistedMaterialFlows: MaterialFlowRow[] = ((materialFlowsResult.data ?? []) as MaterialFlowResult[]).map((flow) => {
    const brand = Array.isArray(flow.brands) ? flow.brands[0] : flow.brands;
    const sku = Array.isArray(flow.skus) ? flow.skus[0] : flow.skus;
    return {
      id: flow.id,
      brand: brand?.name ?? "Unassigned",
      sku: sku?.name ?? "Unassigned SKU",
      skuCode: sku?.code ?? "",
      movementType: displayMaterialMovementType(flow.movement_type),
      fromLocation: flow.from_location ?? "",
      toLocation: flow.to_location ?? "",
      quantity: numberValue(flow.quantity),
      value: numberValue(flow.movement_value),
      expectedDate: flow.expected_date ?? "No expected date",
      status: flow.status ?? "Open",
      documentRef: flow.document_ref ?? ""
    };
  });
  const materialFlows = persistedMaterialFlows.length ? persistedMaterialFlows : buildMaterialFlows(procurementOffices, skus, orders, bills);
  const inventoryPositions = buildInventoryPositions(skus, materialFlows);

  const purchaseOrders: PurchaseOrderRow[] = ((purchaseOrdersResult.data ?? []) as PurchaseOrderResult[]).map((purchaseOrder) => {
    const brand = Array.isArray(purchaseOrder.brands) ? purchaseOrder.brands[0] : purchaseOrder.brands;
    const branch = Array.isArray(purchaseOrder.brand_branches) ? purchaseOrder.brand_branches[0] : purchaseOrder.brand_branches;
    return {
      id: purchaseOrder.id,
      brand: brand?.name ?? "Unassigned",
      officeName: branch?.office_name ?? "Unassigned source office",
      poNumber: purchaseOrder.po_number ?? "Draft PO",
      expectedDate: purchaseOrder.expected_date ?? "No expected date",
      totalValue: numberValue(purchaseOrder.total_value),
      status: displayPurchaseOrderStatus(purchaseOrder.status)
    };
  });

  const goodsReceipts: GoodsReceiptRow[] = ((goodsReceiptsResult.data ?? []) as GoodsReceiptResult[]).map((receipt) => {
    const purchaseOrder = Array.isArray(receipt.purchase_orders) ? receipt.purchase_orders[0] : receipt.purchase_orders;
    const brand = Array.isArray(purchaseOrder?.brands) ? purchaseOrder?.brands[0] : purchaseOrder?.brands;
    const branch = Array.isArray(purchaseOrder?.brand_branches) ? purchaseOrder?.brand_branches[0] : purchaseOrder?.brand_branches;
    return {
      id: receipt.id,
      brand: brand?.name ?? "Unassigned",
      officeName: branch?.office_name ?? "Unassigned source office",
      poNumber: purchaseOrder?.po_number ?? "Draft PO",
      receiptNumber: receipt.receipt_number ?? "Draft GRN",
      receivedDate: receipt.received_date ?? "No receipt date",
      warehouse: receipt.warehouse ?? "Distributor warehouse",
      status: displayGoodsReceiptStatus(receipt.status)
    };
  });

  const supplierPayables: SupplierPayableRow[] = ((supplierPayablesResult.data ?? []) as SupplierPayableResult[]).map((payable) => {
    const brand = Array.isArray(payable.brands) ? payable.brands[0] : payable.brands;
    const branch = Array.isArray(payable.brand_branches) ? payable.brand_branches[0] : payable.brand_branches;
    const purchaseOrder = Array.isArray(payable.purchase_orders) ? payable.purchase_orders[0] : payable.purchase_orders;
    return {
      id: payable.id,
      brand: brand?.name ?? "Unassigned",
      officeName: branch?.office_name ?? "Unassigned source office",
      poNumber: purchaseOrder?.po_number ?? "Draft PO",
      invoiceNumber: payable.invoice_number ?? "Draft invoice",
      invoiceDate: payable.invoice_date ?? "No invoice date",
      amountDue: numberValue(payable.amount_due),
      amountPaid: numberValue(payable.amount_paid),
      dueDate: payable.due_date ?? "No due date",
      status: displaySupplierPayableStatus(payable.status)
    };
  });

  const verificationDrafts: VerificationDraftRecord[] = ((verificationDraftsResult.data ?? []) as VerificationDraftResult[]).map((draft) => {
    const classification = Array.isArray(draft.message_classifications) ? draft.message_classifications[0] : draft.message_classifications;
    const extraction = Array.isArray(draft.message_ai_extractions) ? draft.message_ai_extractions[0] : draft.message_ai_extractions;
    const message = Array.isArray(draft.incoming_messages) ? draft.incoming_messages[0] : draft.incoming_messages;
    const draftJson = draft.draft_json ?? {};
    const amount = numberValue(
      typeof draftJson.amount === "number" || typeof draftJson.amount === "string"
        ? draftJson.amount
        : typeof draftJson.amount_pending === "number" || typeof draftJson.amount_pending === "string"
          ? draftJson.amount_pending
          : 0
    );

    return {
      id: draft.id,
      recordType: draft.record_type,
      title: draft.title,
      status: draft.status === "rejected" ? "Rejected" : draft.status === "approved" ? "Approved" : "Needs review",
      confidence: numberValue(draft.confidence),
      primaryCategory: classification?.primary_category ?? "unclear",
      secondaryCategories: classification?.secondary_categories ?? [],
      languageDetected: classification?.language_detected ?? (typeof draftJson.language_detected === "string" ? draftJson.language_detected : "unknown"),
      normalizedText: classification?.normalized_text ?? (typeof draftJson.normalized_text === "string" ? draftJson.normalized_text : ""),
      reasonForReview: classification?.reason_for_review ?? "Needs admin confirmation",
      rawText: classification?.original_text ?? message?.text_body ?? "",
      transcriptText: extraction?.transcript_text ?? "",
      ocrText: extraction?.ocr_text ?? "",
      draftJson,
      outletName: typeof draftJson.outlet_name === "string" ? draftJson.outlet_name : "Unassigned",
      brandName: typeof draftJson.brand_name === "string" ? draftJson.brand_name : "Unassigned",
      amount,
      quantity: typeof draftJson.quantity === "string" ? draftJson.quantity : "",
      sku: typeof draftJson.sku === "string" ? draftJson.sku : "",
      createdAt: draft.created_at
    };
  });

  const metaRow = metaIntegrationResult.data as IntegrationSettingsResult | null;
  const metaIntegration: MetaIntegrationSettings = metaRow
    ? {
        id: metaRow.id,
        displayName: metaRow.display_name ?? "Meta WhatsApp Cloud API",
        status: displayConnectionStatus(metaRow.status),
        phoneNumberId: metaRow.phone_number_id ?? "",
        whatsappBusinessAccountId: metaRow.whatsapp_business_account_id ?? "",
        businessPortfolioId: metaRow.business_portfolio_id ?? "",
        graphApiVersion: metaRow.graph_api_version ?? "v25.0",
        webhookUrl: "/api/webhooks/whatsapp",
        hasAccessToken: Boolean(metaRow.access_token),
        hasAppSecret: Boolean(metaRow.app_secret),
        hasVerifyToken: Boolean(metaRow.webhook_verify_token),
        lastTestStatus: metaRow.last_test_status ?? "Not tested",
        lastError: metaRow.last_error ?? "",
        updatedAt: metaRow.updated_at ?? "--"
      }
    : defaultMetaIntegration();

  const aiRow = aiProviderResult.data as AIProviderSettingsResult | null;
  const openAIConfig = openAIConfigFromJson(aiRow?.config_json);
  const aiProvider: AIProviderSettings = aiRow
    ? {
        id: aiRow.id,
        provider: aiRow.provider === "sarvam" || aiRow.provider === "openai" || aiRow.provider === "ollama_gemma" || aiRow.provider === "manual" ? aiRow.provider : "gemini",
        model: aiRow.model ?? (aiRow.provider === "sarvam" ? "saaras:v3" : aiRow.provider === "openai" ? "gpt-5.4-mini" : "gemini-2.5-flash"),
        status: displayConnectionStatus(aiRow.status),
        baseUrl: aiRow.base_url ?? "",
        hasApiKey: Boolean(aiRow.api_key),
        extractionMode: aiRow.extraction_mode === "draft_only" ? "draft_only" : "structured_json",
        lastTestStatus: aiRow.last_test_status ?? "Not tested",
        lastError: aiRow.last_error ?? "",
        updatedAt: aiRow.updated_at ?? "--"
      }
    : defaultAIProvider();
  const openAIDefaults = defaultOpenAIIntegration();
  const openAIIntegration: OpenAIIntegrationSettings = {
    status: displayOpenAIStatus(openAIConfig.status),
    model: typeof openAIConfig.model === "string" && openAIConfig.model ? openAIConfig.model : openAIDefaults.model,
    transcriptionModel:
      typeof openAIConfig.transcriptionModel === "string" && openAIConfig.transcriptionModel
        ? openAIConfig.transcriptionModel
        : openAIDefaults.transcriptionModel,
    baseUrl: typeof openAIConfig.baseUrl === "string" && openAIConfig.baseUrl ? openAIConfig.baseUrl : openAIDefaults.baseUrl,
    hasApiKey: Boolean(openAIConfig.apiKey || process.env.OPENAI_API_KEY),
    lastTestStatus:
      typeof openAIConfig.lastTestStatus === "string" && openAIConfig.lastTestStatus
        ? openAIConfig.lastTestStatus
        : openAIDefaults.lastTestStatus,
    lastError: typeof openAIConfig.lastError === "string" ? openAIConfig.lastError : "",
    updatedAt: typeof openAIConfig.updatedAt === "string" && openAIConfig.updatedAt ? openAIConfig.updatedAt : openAIDefaults.updatedAt
  };

  return { records, users, brands, procurementOffices, materialFlows, inventoryPositions, purchaseOrders, goodsReceipts, supplierPayables, outlets, salesmen, skus, tasks, territories, payments, orders, bills, verificationDrafts, metaIntegration, aiProvider, openAIIntegration };
}
