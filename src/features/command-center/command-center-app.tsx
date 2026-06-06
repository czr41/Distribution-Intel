"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
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

type View = "command" | "inbox" | "verification" | "assigned-queue" | "corrections" | "media" | "outlets" | "products" | "procurement" | "tasks" | "payments" | "orders" | "bills" | "territories" | "finance" | "reports" | "approval-inbox" | "team-performance" | "sla" | "territory-comparison" | "fulfilment" | "exceptions" | "partners" | "ops" | "users" | "search" | "audit" | "permissions" | "approvals" | "quality" | "errors" | "exports" | "crm-sync" | "integrations" | "system";
type MediaLabResult = {
  fileName: string;
  fileType: string;
  mediaKind: string;
  provider: string;
  providerMode: string;
  documentLanguage?: string;
  model: string;
  fallbackProvider: string;
  transcriptText: string;
  ocrText: string;
  imageClassification: string;
  extractedText: string;
  persistedMessageId?: string;
  classification?: {
    primaryCategory: string;
    secondaryCategories: string[];
    confidence: number;
    languageDetected?: string;
    normalizedText?: string;
    reasonForReview: string;
    draftRecords: Array<{ recordType: string; title: string }>;
  } | null;
  structured: {
    category: string;
    language?: string;
    summary: string;
    entities: Record<string, unknown>;
    suggestedActions: string[];
    needsHumanReview: boolean;
  };
  warning?: string;
};
type ModalType = "outlet" | "brand" | "procurementOffice" | "materialFlow" | "purchaseOrder" | "goodsReceipt" | "supplierPayable" | "sku" | "salesman" | "user" | "task" | "territory" | "payment" | "order" | "bill" | null;
type BulkImportType = Exclude<ModalType, null>;
type IntegrationNotice = { type: "success" | "error"; message: string };
type SalesWorkflow = "visit" | "order" | "bill" | "delivery" | "payment" | "evidence";
type ArchiveRequest = { type: Exclude<ModalType, null>; id: string; label: string; impact: string };
type ChangeRequest = { id: string; recordType: string; recordLabel: string; action: "Create" | "Edit" | "Archive"; maker: string; checker: string; status: "Pending checker" | "Approved" | "Rejected"; summary: string; createdAt: string };
type ImportReview = { id: string; importType: BulkImportType; maker: string; status: "Pending review" | "Applied" | "Rejected" | "Rolled back"; rows: Record<string, string>[]; createdAt: string };
type SalesCartLine = { skuId: string; name: string; code: string; brand: string; quantity: number; unitPrice: number };
type EditableMasterData =
  | { type: "outlet"; record: OutletRow }
  | { type: "brand"; record: BrandOption }
  | { type: "procurementOffice"; record: ProcurementOffice }
  | { type: "materialFlow"; record: MaterialFlowRow }
  | { type: "purchaseOrder"; record: PurchaseOrderRow }
  | { type: "goodsReceipt"; record: GoodsReceiptRow }
  | { type: "supplierPayable"; record: SupplierPayableRow }
  | { type: "sku"; record: SkuRow }
  | { type: "salesman"; record: SalesmanRow }
  | { type: "user"; record: AppUserRow }
  | { type: "task"; record: TaskRow }
  | { type: "territory"; record: TerritoryRow }
  | { type: "payment"; record: PaymentRow }
  | { type: "order"; record: OrderRow }
  | { type: "bill"; record: BillRow };
type CommandCenterActions = {
  createBrand: (formData: FormData) => Promise<BrandOption>;
  createProcurementOffice: (formData: FormData) => Promise<ProcurementOffice>;
  createMaterialFlow: (formData: FormData) => Promise<MaterialFlowRow>;
  createPurchaseOrder: (formData: FormData) => Promise<PurchaseOrderRow>;
  createGoodsReceipt: (formData: FormData) => Promise<{ receipt: GoodsReceiptRow; movement?: MaterialFlowRow }>;
  createSupplierPayable: (formData: FormData) => Promise<SupplierPayableRow>;
  createSku: (formData: FormData) => Promise<SkuRow>;
  createOutlet: (formData: FormData) => Promise<OutletRow>;
  createSalesman: (formData: FormData) => Promise<SalesmanRow>;
  createUser: (formData: FormData) => Promise<AppUserRow>;
  createTask: (formData: FormData) => Promise<TaskRow>;
  createTerritory: (formData: FormData) => Promise<TerritoryRow>;
  createPayment: (formData: FormData) => Promise<PaymentRow>;
  createOrder: (formData: FormData) => Promise<OrderRow>;
  createBill: (formData: FormData) => Promise<BillRow>;
  updateBrand: (formData: FormData) => Promise<BrandOption>;
  updateProcurementOffice: (formData: FormData) => Promise<ProcurementOffice>;
  updateMaterialFlow: (formData: FormData) => Promise<MaterialFlowRow>;
  updatePurchaseOrder: (formData: FormData) => Promise<PurchaseOrderRow>;
  updateGoodsReceipt: (formData: FormData) => Promise<GoodsReceiptRow>;
  updateSupplierPayable: (formData: FormData) => Promise<SupplierPayableRow>;
  updateSku: (formData: FormData) => Promise<SkuRow>;
  updateOutlet: (formData: FormData) => Promise<OutletRow>;
  updateSalesman: (formData: FormData) => Promise<SalesmanRow>;
  updateUser: (formData: FormData) => Promise<AppUserRow>;
  updateTask: (formData: FormData) => Promise<TaskRow>;
  updateTerritory: (formData: FormData) => Promise<TerritoryRow>;
  updatePayment: (formData: FormData) => Promise<PaymentRow>;
  updateOrder: (formData: FormData) => Promise<OrderRow>;
  updateBill: (formData: FormData) => Promise<BillRow>;
  saveMetaIntegration: (formData: FormData) => Promise<void>;
  saveAIProvider: (formData: FormData) => Promise<void>;
  saveOpenAIIntegration: (formData: FormData) => Promise<void>;
  updateVerificationDraft: (formData: FormData) => Promise<VerificationDraftRecord>;
  approveVerificationDraft: (formData: FormData) => Promise<VerificationDraftRecord>;
  rejectVerificationDraft: (formData: FormData) => Promise<VerificationDraftRecord>;
  archiveRecord: (formData: FormData) => Promise<{ type: string; id: string }>;
};

const openAIModelOptions = ["gpt-5.5", "gpt-5.5-pro", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4.1-mini", "gpt-4.1-nano"];
const openAITranscriptionModelOptions = ["gpt-4o-mini-transcribe", "gpt-4o-transcribe"];

function withSelectedOption(options: string[], selected: string) {
  return selected && !options.includes(selected) ? [selected, ...options] : options;
}

const viewTitles: Record<View, string> = {
  command: "Operating Command Center",
  inbox: "Retailer Message Intake",
  verification: "Review Queue",
  "assigned-queue": "Assigned Verification",
  corrections: "Correction Queue",
  media: "Evidence Extraction Studio",
  outlets: "Outlet Master",
  products: "Product Catalog",
  procurement: "Procurement and Material Flow",
  tasks: "Task Control",
  payments: "Payment Control",
  orders: "Order Pipeline",
  bills: "Bill Register",
  territories: "Territory Master",
  finance: "Collections Control",
  reports: "Executive Reports",
  "approval-inbox": "Approval Inbox",
  "team-performance": "Team Performance",
  sla: "SLA and Escalations",
  "territory-comparison": "Territory Comparison",
  fulfilment: "Order Fulfilment",
  exceptions: "Exception Dashboard",
  partners: "Client Partner View",
  ops: "Field Sales Workspace",
  users: "Access Management",
  search: "Global Search",
  audit: "Audit Trail",
  permissions: "Permission Matrix",
  approvals: "Change Approvals",
  quality: "Data Quality",
  errors: "Action Error Log",
  exports: "Backup and Export",
  "crm-sync": "CRM and ERP Sync",
  integrations: "Platform Integrations",
  system: "System Health"
};

const bulkTemplates: Record<BulkImportType, { title: string; filename: string; columns: string[]; sample: string[] }> = {
  outlet: {
    title: "Outlet Bulk Import",
    filename: "shipd2r-outlet-import-template.csv",
    columns: ["name", "owner", "phone", "city", "channel", "brand", "territory", "assignedSalesman", "status"],
    sample: ["Sri Lakshmi Stores", "Ramesh Kumar", "9876543210", "Tumkur", "Kirana store", "NourishCo", "Tumkur Central", "Rahul Sharma", "Active"]
  },
  brand: {
    title: "Client Bulk Import",
    filename: "shipd2r-client-import-template.csv",
    columns: ["name", "category", "contact", "contactEmail", "contactPhone", "status"],
    sample: ["Nestle", "FMCG foods and beverages", "Regional procurement desk", "south.procurement@nestle.example", "08040002200", "Active"]
  },
  procurementOffice: {
    title: "Client Branch / Source Office Bulk Import",
    filename: "shipd2r-client-branch-import-template.csv",
    columns: ["brand", "officeName", "region", "city", "state", "contact", "phone", "email", "procurementRole", "leadTimeDays", "replenishmentMode", "status"],
    sample: ["Nestle", "Nestle South Regional HQ", "South India", "Bengaluru", "Karnataka", "Regional procurement desk", "08040002200", "south.procurement@nestle.example", "Primary procurement and stock allocation", "3", "Regional PO, GRN, invoice-backed dispatch", "Primary"]
  },
  materialFlow: {
    title: "Material Movement Bulk Import",
    filename: "shipd2r-material-flow-import-template.csv",
    columns: ["brand", "sku", "movementType", "fromLocation", "toLocation", "quantity", "value", "expectedDate", "status", "documentRef"],
    sample: ["Nestle", "Maggi 2-Minute Masala Noodles 70g (NES-MAGGI-70)", "Inbound procurement", "Nestle South Regional HQ", "Distributor warehouse", "240", "2808", "2026-06-07", "PO confirmed", "PO-NES-1001"]
  },
  purchaseOrder: {
    title: "Purchase Order Bulk Import",
    filename: "shipd2r-purchase-order-import-template.csv",
    columns: ["brand", "officeName", "poNumber", "expectedDate", "totalValue", "status"],
    sample: ["Nestle", "Nestle South Regional HQ", "PO-NES-1001", "2026-06-07", "12480", "Confirmed"]
  },
  goodsReceipt: {
    title: "Goods Receipt Bulk Import",
    filename: "shipd2r-goods-receipt-import-template.csv",
    columns: ["brand", "officeName", "poNumber", "receiptNumber", "receivedDate", "warehouse", "sku", "quantity", "value", "status"],
    sample: ["Nestle", "Nestle South Regional HQ", "PO-NES-1001", "GRN-NES-1001", "2026-06-08", "Distributor warehouse", "Maggi 2-Minute Masala Noodles 70g (NES-MAGGI-70)", "240", "3600", "Received"]
  },
  supplierPayable: {
    title: "Supplier Payable Bulk Import",
    filename: "shipd2r-supplier-payable-import-template.csv",
    columns: ["brand", "officeName", "poNumber", "invoiceNumber", "invoiceDate", "amountDue", "amountPaid", "dueDate", "status"],
    sample: ["Nestle", "Nestle South Regional HQ", "PO-NES-1001", "SUP-NES-1001", "2026-06-08", "12480", "0", "2026-06-22", "Pending"]
  },
  sku: {
    title: "Product / SKU Bulk Import",
    filename: "shipd2r-product-sku-import-template.csv",
    columns: ["name", "code", "brand", "category", "unit", "mrp", "imageUrl", "status"],
    sample: ["Maggi 2-Minute Masala Noodles 70g", "NES-MAGGI-70", "Nestle", "Instant noodles", "70g pack", "15", "https://www.nicepng.com/png/detail/311-3113866_maggi-2-minute-noodles-masala-70g.png", "Active"]
  },
  salesman: {
    title: "Sales Rep Bulk Import",
    filename: "shipd2r-sales-rep-import-template.csv",
    columns: ["name", "phone", "city", "territory", "status"],
    sample: ["Rahul Sharma", "9876543201", "Pune", "Pune West", "Active"]
  },
  user: {
    title: "User Bulk Import",
    filename: "shipd2r-user-import-template.csv",
    columns: ["name", "email", "phone", "role", "territory", "status"],
    sample: ["Ramesh Patil", "ramesh@shipd2r.local", "9876543201", "Sales Executive", "Pune West", "Active"]
  },
  task: {
    title: "Task Bulk Import",
    filename: "shipd2r-task-import-template.csv",
    columns: ["title", "description", "taskType", "assignedTo", "outlet", "brand", "dueDate", "priority", "status"],
    sample: ["Payment follow-up", "Confirm pending payment collection", "Payment follow-up", "Rahul Sharma", "Sri Lakshmi Stores", "NourishCo", "2026-05-22", "High", "Open"]
  },
  territory: {
    title: "Territory Bulk Import",
    filename: "shipd2r-territory-import-template.csv",
    columns: ["name", "city", "state", "region", "status"],
    sample: ["Pune West", "Pune", "Maharashtra", "West", "Active"]
  },
  payment: {
    title: "Payment Bulk Import",
    filename: "shipd2r-payment-import-template.csv",
    columns: ["outlet", "brand", "billNumber", "amountDue", "amountCollected", "dueDate", "promisedPaymentDate", "paymentMode", "receiptNumber", "collectorName", "allocationSummary", "status", "riskLevel", "writeOffStatus", "disputeStatus", "settlementStatus", "settlementReference", "settlementDate"],
    sample: ["Sri Lakshmi Stores", "NourishCo", "INV-1001", "12400", "5000", "2026-05-28", "2026-05-30", "UPI", "", "Rahul Sharma", "INV-1001:5000, INV-1002:0", "Partially paid", "High", "Not requested", "Not disputed", "Matched", "UPI-UTR-12345", "2026-05-29"]
  },
  order: {
    title: "Order Bulk Import",
    filename: "shipd2r-order-import-template.csv",
    columns: ["outlet", "sku", "quantity", "unitPrice", "expectedValue", "expectedDeliveryDate", "status"],
    sample: ["Sri Lakshmi Stores", "Maggi 2-Minute Masala Noodles 70g (NES-MAGGI-70)", "24", "15", "360", "2026-05-29", "Confirmed"]
  },
  bill: {
    title: "Bill Bulk Import",
    filename: "shipd2r-bill-import-template.csv",
    columns: ["outlet", "brand", "linkedOrderId", "billNumber", "billDate", "totalAmount", "paymentStatus", "billImagePath"],
    sample: ["Sri Lakshmi Stores", "NourishCo", "", "INV-1001", "2026-05-24", "8420", "Due", ""]
  }
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function matchesSearch(values: Array<string | number | undefined>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}

function uniqueOptions(values: string[]) {
  return ["all", ...Array.from(new Set(values.filter(Boolean)))];
}

function skuOption(sku: SkuRow) {
  return sku.code ? `${sku.name} (${sku.code})` : sku.name;
}

function orderSkuOption(order?: OrderRow) {
  if (!order?.sku || order.sku === "Unassigned SKU") return undefined;
  return order.skuCode ? `${order.sku} (${order.skuCode})` : order.sku;
}

function brandLogo(brand: BrandOption) {
  if (brand.name.toLowerCase().includes("nestle")) return "/brand/nestle-logo.svg";
  return null;
}

function productImageFallback(sku: SkuRow) {
  return `${sku.name.slice(0, 1)}${sku.brand.slice(0, 1)}`.toUpperCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function inventoryFromFlows(skus: SkuRow[], flows: MaterialFlowRow[]): InventoryPositionRow[] {
  return skus.map((sku) => {
    const skuFlows = flows.filter((flow) => flow.skuCode === sku.code || flow.sku === sku.name);
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

function confidenceLabel(record: CommandRecord) {
  return record.confidence >= 0.85 ? "High confidence" : "Needs review";
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename: string, columns: string[], rows: Array<Array<string | number>>) {
  const csv = [columns, ...rows.map((row) => row.map((value) => csvEscape(String(value ?? ""))))].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function userAccessKind(user: AppUserRow) {
  if (user.role === "field_executive") return "sales";
  if (user.role === "finance_collections") return "finance";
  if (user.role === "integration_user") return "integration";
  if (user.role === "operations_manager") return "manager";
  if (user.role === "admin_operator") return "operator";
  if (user.role === "super_admin") return "admin";
  return "partner";
}

function canSeeView(user: AppUserRow, view: View) {
  const accessKind = userAccessKind(user);
  if (accessKind === "admin") return true;
  if (accessKind === "operator") return ["command", "inbox", "verification", "assigned-queue", "corrections", "media", "outlets", "products", "procurement", "tasks", "orders", "bills", "territories", "reports", "approval-inbox", "team-performance", "sla", "territory-comparison", "fulfilment", "exceptions", "search", "audit", "approvals", "quality", "errors", "exports", "system"].includes(view);
  if (accessKind === "manager") return !["users", "permissions", "integrations"].includes(view);
  if (accessKind === "finance") return ["finance", "payments", "tasks", "reports", "approval-inbox", "sla", "exceptions", "assigned-queue", "corrections", "search", "audit", "approvals", "quality", "errors", "exports"].includes(view);
  if (accessKind === "integration") return ["crm-sync", "integrations", "reports", "search", "audit", "errors", "exports", "system"].includes(view);
  if (accessKind === "partner") return ["partners", "reports"].includes(view);
  return ["ops", "outlets", "tasks", "orders", "payments", "media"].includes(view);
}

function canPerformAction(user: AppUserRow, action: "create" | "edit" | "archive" | "approve" | "import", type?: Exclude<ModalType, null>) {
  const accessKind = userAccessKind(user);
  if (accessKind === "admin") return true;
  if (action === "approve") return accessKind === "manager" || accessKind === "operator" || accessKind === "finance";
  if (action === "import") return accessKind === "operator" || accessKind === "manager" || accessKind === "finance";
  if (type === "user" || type === "brand" || type === "procurementOffice") return accessKind === "operator" || accessKind === "manager";
  if (type === "payment" || type === "bill") return accessKind === "finance" || accessKind === "operator" || accessKind === "manager";
  if (type === "sku" || type === "outlet" || type === "order" || type === "task") return accessKind !== "partner" && accessKind !== "integration";
  return accessKind === "operator" || accessKind === "manager";
}

function needsMakerChecker(user: AppUserRow, action: "Create" | "Edit" | "Archive", type: Exclude<ModalType, null>) {
  if (userAccessKind(user) === "admin") return false;
  return action === "Archive" || ["user", "brand", "procurementOffice", "payment", "bill", "sku", "outlet"].includes(type);
}

function loginCodeFor(user: AppUserRow) {
  const digits = user.phone.replace(/\D/g, "");
  return digits.slice(-4) || "0000";
}

function normalizeLoginText(value: string) {
  return value.trim().toLowerCase();
}

function loginIdentifierMatches(user: AppUserRow, identifier: string) {
  const normalizedIdentifier = normalizeLoginText(identifier);
  const identifierDigits = identifier.replace(/\D/g, "");
  const normalizedPhone = user.phone.replace(/\D/g, "");
  const identifiers = [user.email, user.phone, user.name].map(normalizeLoginText);
  return (
    identifiers.some((value) => value === normalizedIdentifier) ||
    (Boolean(identifierDigits) && Boolean(normalizedPhone) && (identifierDigits === normalizedPhone || normalizedPhone.endsWith(identifierDigits)))
  );
}

function accessCodeMatches(user: AppUserRow, accessCode: string) {
  const expected = loginCodeFor(user);
  const normalizedAccessCode = accessCode.replace(/\D/g, "");
  return Boolean(normalizedAccessCode) && (accessCode === expected || normalizedAccessCode === expected || String(Number(normalizedAccessCode)) === String(Number(expected)));
}

export function CommandCenterApp({ initialData, actions }: { initialData: CommandCenterData; actions: CommandCenterActions }) {
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [activeView, setActiveView] = useState<View>("command");
  const [selectedId, setSelectedId] = useState(initialData.records[0]?.id ?? "");
  const [records, setRecords] = useState<CommandRecord[]>(initialData.records);
  const [users, setUsers] = useState<AppUserRow[]>(initialData.users);
  const [brands, setBrands] = useState<BrandOption[]>(initialData.brands);
  const [procurementOffices, setProcurementOffices] = useState<ProcurementOffice[]>(initialData.procurementOffices);
  const [materialFlows, setMaterialFlows] = useState<MaterialFlowRow[]>(initialData.materialFlows);
  const [inventoryPositions, setInventoryPositions] = useState<InventoryPositionRow[]>(initialData.inventoryPositions);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>(initialData.purchaseOrders);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptRow[]>(initialData.goodsReceipts);
  const [supplierPayables, setSupplierPayables] = useState<SupplierPayableRow[]>(initialData.supplierPayables);
  const [outlets, setOutlets] = useState<OutletRow[]>(initialData.outlets);
  const [salesmen, setSalesmen] = useState<SalesmanRow[]>(initialData.salesmen);
  const [skus, setSkus] = useState<SkuRow[]>(initialData.skus);
  const [territories, setTerritories] = useState<TerritoryRow[]>(initialData.territories);
  const [payments, setPayments] = useState<PaymentRow[]>(initialData.payments);
  const [orders, setOrders] = useState<OrderRow[]>(initialData.orders);
  const [bills, setBills] = useState<BillRow[]>(initialData.bills);
  const [verificationDrafts, setVerificationDrafts] = useState<VerificationDraftRecord[]>(initialData.verificationDrafts);
  const [selectedDraftId, setSelectedDraftId] = useState(initialData.verificationDrafts[0]?.id ?? "");
  const [verificationNotice, setVerificationNotice] = useState<IntegrationNotice | null>(null);
  const [metaIntegration, setMetaIntegration] = useState<MetaIntegrationSettings>(initialData.metaIntegration);
  const [aiProvider, setAIProvider] = useState<AIProviderSettings>(initialData.aiProvider);
  const [openAIIntegration, setOpenAIIntegration] = useState<OpenAIIntegrationSettings>(initialData.openAIIntegration);
  const [integrationNotice, setIntegrationNotice] = useState<IntegrationNotice | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>(initialData.tasks);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<EditableMasterData | null>(null);
  const [bulkImportType, setBulkImportType] = useState<BulkImportType | null>(null);
  const [bulkImportMessage, setBulkImportMessage] = useState("");
  const [archiveRequest, setArchiveRequest] = useState<ArchiveRequest | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [importReviews, setImportReviews] = useState<ImportReview[]>([]);
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [loginError, setLoginError] = useState("");
  const visibleViews = (Object.keys(viewTitles) as View[]).filter((view) => currentUser ? canSeeView(currentUser, view) : false);
  const visiblePartnerRecords = useMemo(
    () => records.filter((record) => record.status === "verified" && (partnerFilter === "all" || record.partner === partnerFilter)),
    [partnerFilter, records]
  );

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = String(form.get("role") ?? "");
    const identifier = String(form.get("identifier") ?? "").trim();
    const accessCode = String(form.get("accessCode") ?? "").trim();
    const roleMatches: Record<string, AppUserRow["role"][]> = {
      Admin: ["super_admin", "admin_operator"],
      Manager: ["operations_manager"],
      "Sales Executive": ["field_executive"],
      "Brand Partner": ["brand_partner_viewer", "brand_partner_manager"],
      Finance: ["finance_collections"],
      Integration: ["integration_user"]
    };

    const hasAdminUser = users.some((user) => user.role === "super_admin" || user.role === "admin_operator");

    if (!hasAdminUser && role === "Admin" && accessCode === "0000") {
      setLoginError("");
      setCurrentUser({
        id: "bootstrap-admin",
        name: "Bootstrap Admin",
        email: identifier || "admin@shipd2r.local",
        phone: "0000",
        role: "super_admin",
        roleLabel: "Admin",
        territory: "All territories",
        status: "Active"
      });
      setActiveView("users");
      return;
    }

    const matched = users.find((user) => {
      return roleMatches[role]?.includes(user.role) && loginIdentifierMatches(user, identifier) && accessCodeMatches(user, accessCode);
    });

    if (matched) {
      setLoginError("");
      setCurrentUser(matched);
      const kind = userAccessKind(matched);
      const firstView = kind === "sales" ? "ops" : kind === "finance" ? "finance" : kind === "integration" ? "crm-sync" : "command";
      setActiveView(canSeeView(matched, firstView) ? firstView : "partners");
    } else {
      setLoginError("Login failed. Check role, identifier, and access code.");
    }
  }

  if (!currentUser) {
    return <LoginScreen users={users} error={loginError} onLogin={login} />;
  }

  async function createSalesVisit(form: FormData) {
    const outlet = String(form.get("outlet") ?? "").trim();
    const brand = String(form.get("brand") ?? "").trim();
    const outcome = String(form.get("outcome") ?? "").trim();
    form.set("title", `Visit logged - ${outlet || "Outlet"}`);
    form.set("description", outcome || "Sales executive logged a field visit from the sales app.");
    form.set("taskType", "Routine visit");
    form.set("priority", "Medium");
    form.set("status", "Completed");
    form.set("outlet", outlet);
    form.set("brand", brand);
    const saved = await actions.createTask(form);
    setTasks((current) => [saved, ...current]);
    return saved;
  }

  async function createSalesOrder(form: FormData) {
    const requestedStatus = String(form.get("status") ?? "Intent captured");
    form.set("status", requestedStatus === "On hold" ? "On hold" : "Intent captured");
    const saved = await actions.createOrder(form);
    setOrders((current) => [saved, ...current]);
    return saved;
  }

  async function createSalesBill(form: FormData) {
    const saved = await actions.createBill(form);
    setBills((current) => [saved, ...current]);
    const linkedOrderId = String(form.get("linkedOrderId") ?? "").trim();
    const linkedOrder = orders.find((order) => order.id === linkedOrderId);
    if (linkedOrder) {
      const updateForm = orderUpdateForm(linkedOrder, "Billed");
      const updated = await actions.updateOrder(updateForm);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    }
    return saved;
  }

  async function updateSalesOrder(form: FormData) {
    const updated = await actions.updateOrder(form);
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    return updated;
  }

  async function createSalesPayment(form: FormData) {
    const amountCollected = Number(String(form.get("amountCollected") ?? "0"));
    const amountDue = Number(String(form.get("amountDue") ?? "0"));
    form.set("status", amountCollected > 0 && amountCollected >= amountDue ? "Paid" : amountCollected > 0 ? "Partially paid" : "Due");
    form.set("riskLevel", amountDue - amountCollected > 10000 ? "High" : "Medium");
    const saved = await actions.createPayment(form);
    setPayments((current) => [saved, ...current]);
    return saved;
  }

  if (userAccessKind(currentUser) === "sales") {
    return (
      <SalesRepPortal
        user={currentUser}
        brands={brands}
        skus={skus}
        tasks={tasks}
        outlets={outlets}
        orders={orders}
        bills={bills}
        payments={payments}
        onCreateVisit={createSalesVisit}
        onCreateOrder={createSalesOrder}
        onCreateBill={createSalesBill}
        onCreatePayment={createSalesPayment}
        onUpdateOrder={updateSalesOrder}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  const accessKind = userAccessKind(currentUser);
  const isAdminUser = accessKind === "admin" || accessKind === "operator";
  const canManageSystem = accessKind === "admin";
  const canConfigureIntegrations = canSeeView(currentUser, "integrations");
  const canManagePartners = accessKind === "admin" || accessKind === "operator" || accessKind === "manager";
  const selectedRecord =
    records.find((record) => record.id === selectedId) ??
    records[0] ?? {
      id: "empty",
      outlet: "No records yet",
      city: "Unassigned",
      partner: "Unassigned",
      fieldAgent: "Sales Team",
      type: "Visit",
      units: 0,
      value: 0,
      status: "pending",
      confidence: 0,
      evidence: "No evidence",
      message: "Add outlets, sales-app activity, or retailer WhatsApp messages to populate the queue.",
      createdAt: "--"
    };
  const pendingCount = records.filter((record) => record.status === "pending").length;
  const pendingDraftCount = verificationDrafts.filter((draft) => draft.status === "Needs review").length;
  const verifiedCount = records.filter((record) => record.status === "verified").length;
  const highConfidenceCount = records.filter((record) => record.confidence >= 0.85).length;
  const recordCount = Math.max(records.length, 1);

  const selectedDraft = verificationDrafts.find((draft) => draft.id === selectedDraftId) ?? verificationDrafts[0];

  function openCreate(type: Exclude<ModalType, null>) {
    if (currentUser && !canPerformAction(currentUser, "create", type)) {
      setChangeRequests((current) => [{
        id: `chg-${Date.now()}`,
        recordType: type,
        recordLabel: "Create request blocked by action permission",
        action: "Create",
        maker: currentUser.name,
        checker: "Manager / Admin",
        status: "Pending checker",
        summary: `${currentUser.roleLabel} requested create access for ${type}.`,
        createdAt: new Date().toLocaleString("en-IN")
      }, ...current]);
      setActiveView("approvals");
      return;
    }
    setEditingItem(null);
    setModalType(type);
  }

  function openEdit(item: EditableMasterData) {
    if (currentUser && !canPerformAction(currentUser, "edit", item.type)) {
      setChangeRequests((current) => [{
        id: `chg-${Date.now()}`,
        recordType: item.type,
        recordLabel: recordLabelForChange(item),
        action: "Edit",
        maker: currentUser.name,
        checker: "Manager / Admin",
        status: "Pending checker",
        summary: `${currentUser.roleLabel} requested edit access.`,
        createdAt: new Date().toLocaleString("en-IN")
      }, ...current]);
      setActiveView("approvals");
      return;
    }
    setEditingItem(item);
    setModalType(item.type);
  }

  function requestArchive(type: Exclude<ModalType, null>, id: string, label: string, impact: string) {
    if (!isUuid(id)) return;
    if (currentUser && (!canPerformAction(currentUser, "archive", type) || needsMakerChecker(currentUser, "Archive", type))) {
      setChangeRequests((current) => [{
        id: `chg-${Date.now()}`,
        recordType: type,
        recordLabel: label,
        action: "Archive",
        maker: currentUser.name,
        checker: "Manager / Admin",
        status: "Pending checker",
        summary: impact,
        createdAt: new Date().toLocaleString("en-IN")
      }, ...current]);
      setActiveView("approvals");
      return;
    }
    setArchiveRequest({ type, id, label, impact });
  }

  async function archiveMasterRecord(type: Exclude<ModalType, null>, id: string, reason?: string) {
    if (!isUuid(id)) return;
    const form = new FormData();
    form.set("type", type);
    form.set("id", id);
    form.set("reason", reason ?? "");
    await actions.archiveRecord(form);

    if (type === "brand") setBrands((current) => current.map((brand) => (brand.id === id ? { ...brand, status: "Inactive" } : brand)));
    if (type === "procurementOffice") setProcurementOffices((current) => current.map((office) => (office.id === id ? { ...office, status: "Inactive" } : office)));
    if (type === "materialFlow") setMaterialFlows((current) => current.map((flow) => (flow.id === id ? { ...flow, status: "Archived" } : flow)));
    if (type === "purchaseOrder") setPurchaseOrders((current) => current.map((purchaseOrder) => (purchaseOrder.id === id ? { ...purchaseOrder, status: "Cancelled" } : purchaseOrder)));
    if (type === "goodsReceipt") setGoodsReceipts((current) => current.map((receipt) => (receipt.id === id ? { ...receipt, status: "Cancelled" } : receipt)));
    if (type === "supplierPayable") setSupplierPayables((current) => current.map((payable) => (payable.id === id ? { ...payable, status: "Written off" } : payable)));
    if (type === "sku") setSkus((current) => current.map((sku) => (sku.id === id ? { ...sku, status: "Inactive" } : sku)));
    if (type === "outlet") setOutlets((current) => current.map((outlet) => (outlet.id === id ? { ...outlet, status: "Inactive" } : outlet)));
    if (type === "salesman") setSalesmen((current) => current.map((person) => (person.id === id ? { ...person, status: "Inactive" } : person)));
    if (type === "user") setUsers((current) => current.map((user) => (user.id === id ? { ...user, status: "Inactive" } : user)));
    if (type === "task") setTasks((current) => current.map((task) => (task.id === id ? { ...task, status: "Cancelled" } : task)));
    if (type === "territory") setTerritories((current) => current.map((territory) => (territory.id === id ? { ...territory, status: "Inactive" } : territory)));
    if (type === "payment") setPayments((current) => current.map((payment) => (payment.id === id ? { ...payment, status: "Written off" } : payment)));
    if (type === "order") setOrders((current) => current.map((order) => (order.id === id ? { ...order, status: "Cancelled" } : order)));
    if (type === "bill") setBills((current) => current.map((bill) => (bill.id === id ? { ...bill, paymentStatus: "Written off" } : bill)));
    setArchiveRequest(null);
  }

  function verifyRecord(recordId: string) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, status: "verified", confidence: Math.max(record.confidence, 0.88) } : record
      )
    );
  }

  function sendBack(recordId: string) {
    setRecords((current) =>
      current.map((record) => (record.id === recordId ? { ...record, status: "needs clarification" } : record))
    );
  }

  function updateDraftState(saved: VerificationDraftRecord) {
    setVerificationDrafts((current) => {
      const next = current.map((draft) => (draft.id === saved.id ? saved : draft));
      return next.filter((draft) => draft.status === "Needs review");
    });
    setSelectedDraftId((currentId) => {
      if (saved.status === "Needs review") return saved.id;
      const nextDraft = verificationDrafts.find((draft) => draft.id !== currentId && draft.status === "Needs review");
      return nextDraft?.id ?? "";
    });
  }

  async function handleVerificationDraft(event: FormEvent<HTMLFormElement>, decision: "save" | "approve" | "reject") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setVerificationNotice(null);

    try {
      const saved =
        decision === "approve"
          ? await actions.approveVerificationDraft(form)
          : decision === "reject"
            ? await actions.rejectVerificationDraft(form)
            : await actions.updateVerificationDraft(form);
      updateDraftState(saved);
      setVerificationNotice({
        type: "success",
        message:
          decision === "approve"
            ? "Draft approved and written to the relevant module."
            : decision === "reject"
              ? "Draft rejected and removed from the active verification queue."
              : "Draft updates saved for review."
      });
    } catch (error) {
      setVerificationNotice({ type: "error", message: error instanceof Error ? error.message : "Verification action failed." });
    }
  }

  function addFieldMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageText.trim()) return;

    const unitsMatch = messageText.match(/(\d+)\s*(units|pcs|cases)?/i);
    const outletMatch = messageText.match(/outlet:\s*([^,.]+)/i);
    const partner = brands.find((brand) => messageText.toLowerCase().includes(brand.name.toLowerCase()))?.name ?? brands[0]?.name ?? "Unassigned";
    const units = unitsMatch ? Number(unitsMatch[1]) : 0;
    const record: CommandRecord = {
      id: `rec-${Date.now()}`,
      outlet: outletMatch?.[1]?.trim() ?? "Unmatched Outlet",
      city: messageText.toLowerCase().includes("mumbai") ? "Mumbai" : messageText.toLowerCase().includes("pune") ? "Pune" : "Unconfirmed",
      partner,
      fieldAgent: "Sales App",
      type: units > 0 ? "Sale" : "Visit",
      units,
      value: units * 150,
      status: "pending",
      confidence: outletMatch && unitsMatch ? 0.86 : 0.58,
      evidence: messageText.toLowerCase().includes("photo") ? "Retailer WhatsApp + media mention" : "Retailer WhatsApp text",
      message: messageText,
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };

    setRecords((current) => [record, ...current]);
    setSelectedId(record.id);
    setMessageText("");
  }

  async function addMasterData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const isEditing = Boolean(editingItem && editingItem.type === modalType);
    if (currentUser && modalType && needsMakerChecker(currentUser, isEditing ? "Edit" : "Create", modalType)) {
      setChangeRequests((current) => [{
        id: `chg-${Date.now()}`,
        recordType: modalType,
        recordLabel: editingItem ? recordLabelForChange(editingItem) : String(form.get("name") ?? form.get("billNumber") ?? form.get("receiptNumber") ?? modalType),
        action: isEditing ? "Edit" : "Create",
        maker: currentUser.name,
        checker: "Manager / Admin",
        status: "Pending checker",
        summary: `${isEditing ? "Edit" : "Create"} submitted through maker-checker. Fields: ${Array.from(form.keys()).join(", ")}`,
        createdAt: new Date().toLocaleString("en-IN")
      }, ...current]);
      setEditingItem(null);
      setModalType(null);
      setActiveView("approvals");
      return;
    }

    if (modalType === "outlet") {
      const saved = isEditing ? await actions.updateOutlet(form) : await actions.createOutlet(form);
      setOutlets((current) => (isEditing ? current.map((outlet) => (outlet.id === saved.id ? saved : outlet)) : [saved, ...current]));
      setActiveView("outlets");
    }

    if (modalType === "brand") {
      const saved = isEditing ? await actions.updateBrand(form) : await actions.createBrand(form);
      setBrands((current) => (isEditing ? current.map((brand) => (brand.id === saved.id ? saved : brand)) : [saved, ...current]));
      setActiveView("partners");
    }

    if (modalType === "procurementOffice") {
      const saved = isEditing ? await actions.updateProcurementOffice(form) : await actions.createProcurementOffice(form);
      setProcurementOffices((current) => (isEditing ? current.map((office) => (office.id === saved.id ? saved : office)) : [saved, ...current]));
      setActiveView("procurement");
    }

    if (modalType === "materialFlow") {
      const saved = isEditing ? await actions.updateMaterialFlow(form) : await actions.createMaterialFlow(form);
      setMaterialFlows((current) => {
        const next = isEditing ? current.map((flow) => (flow.id === saved.id ? saved : flow)) : [saved, ...current];
        setInventoryPositions(inventoryFromFlows(skus, next));
        return next;
      });
      setActiveView("procurement");
    }

    if (modalType === "purchaseOrder") {
      const saved = isEditing ? await actions.updatePurchaseOrder(form) : await actions.createPurchaseOrder(form);
      setPurchaseOrders((current) => (isEditing ? current.map((purchaseOrder) => (purchaseOrder.id === saved.id ? saved : purchaseOrder)) : [saved, ...current]));
      setActiveView("procurement");
    }

    if (modalType === "goodsReceipt") {
      if (isEditing) {
        const saved = await actions.updateGoodsReceipt(form);
        setGoodsReceipts((current) => current.map((receipt) => (receipt.id === saved.id ? saved : receipt)));
      } else {
        const saved = await actions.createGoodsReceipt(form);
        setGoodsReceipts((current) => [saved.receipt, ...current]);
        if (saved.movement) {
          setMaterialFlows((current) => {
            const next = [saved.movement as MaterialFlowRow, ...current];
            setInventoryPositions(inventoryFromFlows(skus, next));
            return next;
          });
        }
      }
      setActiveView("procurement");
    }

    if (modalType === "supplierPayable") {
      const saved = isEditing ? await actions.updateSupplierPayable(form) : await actions.createSupplierPayable(form);
      setSupplierPayables((current) => (isEditing ? current.map((payable) => (payable.id === saved.id ? saved : payable)) : [saved, ...current]));
      setActiveView("procurement");
    }

    if (modalType === "sku") {
      const saved = isEditing ? await actions.updateSku(form) : await actions.createSku(form);
      setSkus((current) => (isEditing ? current.map((sku) => (sku.id === saved.id ? saved : sku)) : [saved, ...current]));
      setActiveView("products");
    }

    if (modalType === "salesman") {
      const saved = isEditing ? await actions.updateSalesman(form) : await actions.createSalesman(form);
      setSalesmen((current) => (isEditing ? current.map((person) => (person.id === saved.id ? saved : person)) : [saved, ...current]));
      setActiveView("ops");
    }

    if (modalType === "user") {
      const saved = isEditing ? await actions.updateUser(form) : await actions.createUser(form);
      setUsers((current) => (isEditing ? current.map((user) => (user.id === saved.id ? saved : user)) : [saved, ...current]));
      setActiveView("users");
    }

    if (modalType === "task") {
      const saved = isEditing ? await actions.updateTask(form) : await actions.createTask(form);
      setTasks((current) => (isEditing ? current.map((task) => (task.id === saved.id ? saved : task)) : [saved, ...current]));
      setActiveView("tasks");
    }

    if (modalType === "territory") {
      const saved = isEditing ? await actions.updateTerritory(form) : await actions.createTerritory(form);
      setTerritories((current) => (isEditing ? current.map((territory) => (territory.id === saved.id ? saved : territory)) : [saved, ...current]));
      setActiveView("territories");
    }

    if (modalType === "payment") {
      const saved = isEditing ? await actions.updatePayment(form) : await actions.createPayment(form);
      setPayments((current) => (isEditing ? current.map((payment) => (payment.id === saved.id ? saved : payment)) : [saved, ...current]));
      setActiveView("payments");
    }

    if (modalType === "order") {
      const saved = isEditing ? await actions.updateOrder(form) : await actions.createOrder(form);
      setOrders((current) => (isEditing ? current.map((order) => (order.id === saved.id ? saved : order)) : [saved, ...current]));
      setActiveView("orders");
    }

    if (modalType === "bill") {
      const saved = isEditing ? await actions.updateBill(form) : await actions.createBill(form);
      setBills((current) => (isEditing ? current.map((bill) => (bill.id === saved.id ? saved : bill)) : [saved, ...current]));
      setActiveView("bills");
    }

    setEditingItem(null);
    setModalType(null);
  }

  async function saveMetaIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();

    setIntegrationNotice(null);

    try {
      await actions.saveMetaIntegration(form);
      setMetaIntegration((current) => ({
        ...current,
        displayName: value("displayName"),
        status: value("status") as MetaIntegrationSettings["status"],
        phoneNumberId: value("phoneNumberId"),
        whatsappBusinessAccountId: value("whatsappBusinessAccountId"),
        businessPortfolioId: value("businessPortfolioId"),
        graphApiVersion: value("graphApiVersion"),
        hasAccessToken: Boolean(value("accessToken")) || current.hasAccessToken,
        hasAppSecret: Boolean(value("appSecret")) || current.hasAppSecret,
        hasVerifyToken: Boolean(value("webhookVerifyToken")) || current.hasVerifyToken,
        lastTestStatus: "Configuration saved",
        lastError: "",
        updatedAt: new Date().toLocaleString("en-IN")
      }));
      setIntegrationNotice({ type: "success", message: "Meta WhatsApp settings saved successfully." });
    } catch (error) {
      setIntegrationNotice({ type: "error", message: error instanceof Error ? error.message : "Meta WhatsApp settings could not be saved." });
    }
  }

  async function saveAIProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();

    setIntegrationNotice(null);

    try {
      await actions.saveAIProvider(form);
      setAIProvider((current) => ({
        ...current,
        provider: value("provider") as AIProviderSettings["provider"],
        model: value("model"),
        status: value("status") as AIProviderSettings["status"],
        baseUrl: value("baseUrl"),
        hasApiKey: Boolean(value("apiKey")) || current.hasApiKey,
        extractionMode: value("extractionMode") as AIProviderSettings["extractionMode"],
        lastTestStatus: "Configuration saved",
        lastError: "",
        updatedAt: new Date().toLocaleString("en-IN")
      }));
      setIntegrationNotice({ type: "success", message: "AI provider settings saved successfully." });
    } catch (error) {
      setIntegrationNotice({ type: "error", message: error instanceof Error ? error.message : "AI provider settings could not be saved." });
    }
  }

  async function saveOpenAIIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();

    setIntegrationNotice(null);

    try {
      await actions.saveOpenAIIntegration(form);
      setOpenAIIntegration((current) => {
        const hasApiKey = Boolean(value("apiKey")) || current.hasApiKey;
        const submittedStatus = value("status") as OpenAIIntegrationSettings["status"];
        const savedStatus = submittedStatus === "Draft" && hasApiKey ? "Connected" : submittedStatus;

        return {
          ...current,
          model: value("model"),
          transcriptionModel: value("transcriptionModel"),
          baseUrl: value("baseUrl") || "https://api.openai.com/v1",
          status: savedStatus,
          hasApiKey,
          lastTestStatus: hasApiKey ? "Configuration saved. API key is stored." : "Configuration saved without API key",
          lastError: "",
          updatedAt: new Date().toLocaleString("en-IN")
        };
      });
      setIntegrationNotice({ type: "success", message: "OpenAI fallback saved. The API key is stored and ready for fallback extraction." });
    } catch (error) {
      setIntegrationNotice({ type: "error", message: error instanceof Error ? error.message : "OpenAI fallback settings could not be saved." });
    }
  }

  function downloadTemplate(type: BulkImportType) {
    const template = bulkTemplates[type];
    const csv = [template.columns, template.sample].map((row) => row.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = template.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importRows(type: BulkImportType, rows: Record<string, string>[]) {
    if (type === "outlet") {
      const savedRows: OutletRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.outlet.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createOutlet(form));
      }
      setOutlets((current) => [...savedRows, ...current]);
      setActiveView("outlets");
    }

    if (type === "brand") {
      const savedRows: BrandOption[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.brand.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createBrand(form));
      }
      setBrands((current) => [...savedRows, ...current]);
      setActiveView("partners");
    }

    if (type === "procurementOffice") {
      const savedRows: ProcurementOffice[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.procurementOffice.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Primary" : row[column] ?? ""));
        savedRows.push(await actions.createProcurementOffice(form));
      }
      setProcurementOffices((current) => [...savedRows, ...current]);
      setActiveView("procurement");
    }

    if (type === "materialFlow") {
      const savedRows: MaterialFlowRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.materialFlow.columns.forEach((column) => form.set(column, row[column] ?? ""));
        savedRows.push(await actions.createMaterialFlow(form));
      }
      setMaterialFlows((current) => {
        const next = [...savedRows, ...current];
        setInventoryPositions(inventoryFromFlows(skus, next));
        return next;
      });
      setActiveView("procurement");
    }

    if (type === "purchaseOrder") {
      const savedRows: PurchaseOrderRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.purchaseOrder.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Draft" : row[column] ?? ""));
        savedRows.push(await actions.createPurchaseOrder(form));
      }
      setPurchaseOrders((current) => [...savedRows, ...current]);
      setActiveView("procurement");
    }

    if (type === "goodsReceipt") {
      const savedRows: GoodsReceiptRow[] = [];
      const savedMovements: MaterialFlowRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.goodsReceipt.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Received" : row[column] ?? ""));
        const saved = await actions.createGoodsReceipt(form);
        savedRows.push(saved.receipt);
        if (saved.movement) savedMovements.push(saved.movement);
      }
      setGoodsReceipts((current) => [...savedRows, ...current]);
      if (savedMovements.length) {
        setMaterialFlows((current) => {
          const next = [...savedMovements, ...current];
          setInventoryPositions(inventoryFromFlows(skus, next));
          return next;
        });
      }
      setActiveView("procurement");
    }

    if (type === "supplierPayable") {
      const savedRows: SupplierPayableRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.supplierPayable.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Pending" : row[column] ?? ""));
        savedRows.push(await actions.createSupplierPayable(form));
      }
      setSupplierPayables((current) => [...savedRows, ...current]);
      setActiveView("procurement");
    }

    if (type === "sku") {
      const savedRows: SkuRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.sku.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createSku(form));
      }
      setSkus((current) => [...savedRows, ...current]);
      setActiveView("products");
    }

    if (type === "salesman") {
      const savedRows: SalesmanRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.salesman.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createSalesman(form));
      }
      setSalesmen((current) => [...savedRows, ...current]);
      setActiveView("ops");
    }

    if (type === "user") {
      const savedRows: AppUserRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.user.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createUser(form));
      }
      setUsers((current) => [...savedRows, ...current]);
      setActiveView("users");
    }

    if (type === "task") {
      const savedRows: TaskRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.task.columns.forEach((column) => {
          if (column === "priority") form.set(column, row[column] || "Medium");
          else if (column === "status") form.set(column, row[column] || "Open");
          else form.set(column, row[column] ?? "");
        });
        savedRows.push(await actions.createTask(form));
      }
      setTasks((current) => [...savedRows, ...current]);
      setActiveView("tasks");
    }

    if (type === "territory") {
      const savedRows: TerritoryRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.territory.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        savedRows.push(await actions.createTerritory(form));
      }
      setTerritories((current) => [...savedRows, ...current]);
      setActiveView("territories");
    }

    if (type === "payment") {
      const savedRows: PaymentRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.payment.columns.forEach((column) => {
          if (column === "status") form.set(column, row[column] || "Due");
          else if (column === "riskLevel") form.set(column, row[column] || "Medium");
          else if (column === "writeOffStatus") form.set(column, row[column] || "Not requested");
          else if (column === "disputeStatus") form.set(column, row[column] || "Not disputed");
          else if (column === "settlementStatus") form.set(column, row[column] || "Unreconciled");
          else form.set(column, row[column] ?? "");
        });
        savedRows.push(await actions.createPayment(form));
      }
      setPayments((current) => [...savedRows, ...current]);
      setActiveView("payments");
    }

    if (type === "order") {
      const savedRows: OrderRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.order.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Intent captured" : row[column] ?? ""));
        savedRows.push(await actions.createOrder(form));
      }
      setOrders((current) => [...savedRows, ...current]);
      setActiveView("orders");
    }

    if (type === "bill") {
      const savedRows: BillRow[] = [];
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.bill.columns.forEach((column) => form.set(column, column === "paymentStatus" ? row[column] || "Due" : row[column] ?? ""));
        savedRows.push(await actions.createBill(form));
      }
      setBills((current) => [...savedRows, ...current]);
      setActiveView("bills");
    }
  }

  async function handleBulkImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bulkImportType) return;

    const file = (new FormData(event.currentTarget).get("file") as File | null) ?? null;
    if (!file || file.size === 0) {
      setBulkImportMessage("Choose a completed CSV file first.");
      return;
    }

    const rows = parseCsv(await file.text());
    const template = bulkTemplates[bulkImportType];
    const [headers, ...bodyRows] = rows;

    if (!headers?.length) {
      setBulkImportMessage("The CSV is empty.");
      return;
    }

    const normalizedHeaders = headers.map(normalizeHeader);
    const missingColumns = template.columns.filter((column) => !normalizedHeaders.includes(normalizeHeader(column)));

    if (missingColumns.length) {
      setBulkImportMessage(`Missing columns: ${missingColumns.join(", ")}.`);
      return;
    }

    const normalizedRows = bodyRows
      .map((row) =>
        template.columns.reduce<Record<string, string>>((record, column) => {
          const index = normalizedHeaders.indexOf(normalizeHeader(column));
          record[column] = row[index]?.trim() ?? "";
          return record;
        }, {})
      )
      .filter((row) => Object.values(row).some(Boolean));

    if (!normalizedRows.length) {
      setBulkImportMessage("No data rows found below the header.");
      return;
    }

    try {
      setImportReviews((current) => [{
        id: `imp-${Date.now()}`,
        importType: bulkImportType,
        maker: currentUser?.name ?? "Unknown user",
        status: "Pending review",
        rows: normalizedRows,
        createdAt: new Date().toLocaleString("en-IN")
      }, ...current]);
      setBulkImportMessage(`Queued ${normalizedRows.length} ${normalizedRows.length === 1 ? "row" : "rows"} for import review.`);
      setBulkImportType(null);
      setActiveView("approvals");
    } catch (error) {
      setBulkImportMessage(error instanceof Error ? error.message : "Import failed. Check the CSV values and try again.");
    }
  }

  async function applyImportReview(reviewId: string) {
    const review = importReviews.find((item) => item.id === reviewId);
    if (!review) return;
    await importRows(review.importType, review.rows);
    setImportReviews((current) => current.map((item) => (item.id === reviewId ? { ...item, status: "Applied" } : item)));
  }

  function updateChangeRequest(requestId: string, status: ChangeRequest["status"]) {
    setChangeRequests((current) => current.map((request) => (request.id === requestId ? { ...request, status } : request)));
  }

  function updateImportReview(reviewId: string, status: ImportReview["status"]) {
    setImportReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, status } : review)));
  }

  function openBulkImport(type: BulkImportType) {
    setBulkImportMessage("");
    setBulkImportType(type);
  }

  const pendingRecord = records.find((record) => record.status === "pending");
  const commandActions = isAdminUser
    ? [
        { label: "Add Outlet", action: () => openCreate("outlet") },
        { label: "Bulk Import", action: () => openBulkImport("outlet") },
        { label: "Verify Next", action: () => pendingRecord && verifyRecord(pendingRecord.id), disabled: !pendingRecord }
      ]
    : [
        { label: "Add Order", action: () => openCreate("order") },
        { label: "Create Task", action: () => openCreate("task") },
        { label: "Add Payment", action: () => openCreate("payment") }
      ];
  const headerActions: Record<View, { label: string; action: () => void; disabled?: boolean }[]> = {
    command: commandActions,
    inbox: isAdminUser
      ? [
          { label: "Log Retailer WhatsApp", action: () => setActiveView("inbox") },
          { label: "Verify Next", action: () => pendingRecord && verifyRecord(pendingRecord.id), disabled: !pendingRecord }
        ]
      : [{ label: "Log Retailer WhatsApp", action: () => setActiveView("inbox") }],
    verification: [
      { label: "Approve Current", action: () => verifyRecord(selectedRecord.id), disabled: selectedRecord.id === "empty" },
      { label: "Ask Clarification", action: () => sendBack(selectedRecord.id), disabled: selectedRecord.id === "empty" }
    ],
    "assigned-queue": [{ label: "Open Review", action: () => setActiveView("verification") }],
    corrections: [{ label: "Open Search", action: () => setActiveView("search") }],
    media: canManageSystem
      ? [
          { label: "Configure AI", action: () => setActiveView("integrations") },
          { label: "Open Inbox", action: () => setActiveView("inbox") }
        ]
      : [{ label: "Open Inbox", action: () => setActiveView("inbox") }],
    outlets: [
      { label: "Add Outlet", action: () => openCreate("outlet") },
      { label: "Bulk Import", action: () => openBulkImport("outlet") }
    ],
    products: [
      { label: "Add Product", action: () => openCreate("sku") },
      { label: "Bulk Import", action: () => openBulkImport("sku") }
    ],
    procurement: [
      { label: "Add Client", action: () => openCreate("brand") },
      { label: "Add Branch", action: () => openCreate("procurementOffice") },
      { label: "Add Movement", action: () => openCreate("materialFlow") }
    ],
    tasks: [
      { label: "Create Task", action: () => openCreate("task") },
      { label: "Bulk Import", action: () => openBulkImport("task") }
    ],
    payments: [
      { label: "Add Payment", action: () => openCreate("payment") },
      { label: "Bulk Import", action: () => openBulkImport("payment") }
    ],
    orders: [
      { label: "Add Order", action: () => openCreate("order") },
      { label: "Bulk Import", action: () => openBulkImport("order") }
    ],
    bills: [
      { label: "Add Bill", action: () => openCreate("bill") },
      { label: "Bulk Import", action: () => openBulkImport("bill") }
    ],
    territories: [
      { label: "Add Territory", action: () => openCreate("territory") },
      { label: "Bulk Import", action: () => openBulkImport("territory") }
    ],
    finance: [
      { label: "Add Payment", action: () => openCreate("payment") },
      { label: "Create Follow-Up", action: () => openCreate("task") },
      { label: "Bulk Import", action: () => openBulkImport("payment") }
    ],
    reports: [{ label: "Open Templates", action: () => setActiveView("reports") }],
    "approval-inbox": [{ label: "Open Approvals", action: () => setActiveView("approvals") }],
    "team-performance": [{ label: "Open Territories", action: () => setActiveView("territory-comparison") }],
    sla: [{ label: "Open Exceptions", action: () => setActiveView("exceptions") }],
    "territory-comparison": [{ label: "Open Team View", action: () => setActiveView("team-performance") }],
    fulfilment: [{ label: "Open Orders", action: () => setActiveView("orders") }],
    exceptions: [{ label: "Open SLA", action: () => setActiveView("sla") }],
    partners: canManagePartners
      ? [
          { label: "Add Client", action: () => openCreate("brand") },
          { label: "Add Product", action: () => openCreate("sku") },
          { label: "Bulk Import", action: () => openBulkImport("brand") }
        ]
      : [{ label: "Open Reports", action: () => setActiveView("reports") }],
    ops: [
      { label: "Add Sales Rep", action: () => openCreate("salesman") },
      { label: "Bulk Import", action: () => openBulkImport("salesman") }
    ],
    users: [
      { label: "Add User", action: () => openCreate("user") },
      { label: "Bulk Import", action: () => openBulkImport("user") }
    ],
    search: [{ label: "Open Audit", action: () => setActiveView("audit") }],
    audit: [{ label: "Review Approvals", action: () => setActiveView("approvals") }],
    permissions: [{ label: "Add User", action: () => openCreate("user") }],
    approvals: [{ label: "Open Audit", action: () => setActiveView("audit") }],
    quality: [{ label: "Global Search", action: () => setActiveView("search") }],
    errors: [{ label: "System Health", action: () => setActiveView("system") }],
    exports: [{ label: "Data Quality", action: () => setActiveView("quality") }],
    "crm-sync": canConfigureIntegrations
      ? [
          { label: "Configure Providers", action: () => setActiveView("integrations") },
          { label: "Reports", action: () => setActiveView("reports") }
        ]
      : [{ label: "Reports", action: () => setActiveView("reports") }],
    integrations: [{ label: "Copy Webhook Path", action: () => navigator.clipboard?.writeText(metaIntegration.webhookUrl) }],
    system: canConfigureIntegrations
      ? [{ label: "Open Integrations", action: () => setActiveView("integrations") }]
      : [{ label: "Open Reports", action: () => setActiveView("reports") }]
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <img src="/brand/shipd2r-logo.png" alt="shipd2r" />
          <span>Distribution ERP / CRM</span>
        </div>
        <nav className="nav-tabs" aria-label="Views">
          {visibleViews.map((view) => (
            <button key={view} className={`nav-tab ${activeView === view ? "active" : ""}`} onClick={() => setActiveView(view)}>
              <span>{view === "ops" ? "Sales App" : view === "inbox" ? "Retailer WhatsApp" : view === "users" ? "Users" : view === "products" ? "Products / SKUs" : view === "procurement" ? "Procurement" : view === "crm-sync" ? "CRM Sync" : view === "system" ? "System Health" : view[0].toUpperCase() + view.slice(1)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        {initialData.setupError && (
          <section className="setup-banner">
            <strong>Supabase setup needs attention</strong>
            <span>{initialData.setupError}</span>
          </section>
        )}

        <header className="topbar">
          <div>
            <p className="eyebrow">ShipD2R operating platform</p>
            <h1>{viewTitles[activeView]}</h1>
            <p className="session-line">{currentUser.name} - {currentUser.roleLabel}</p>
          </div>
          <div className="topbar-actions">
            {headerActions[activeView].map((headerAction) => (
              <button key={headerAction.label} className="primary-button" onClick={headerAction.action} disabled={headerAction.disabled}>
                {headerAction.label}
              </button>
            ))}
            <button className="secondary-button" onClick={() => setCurrentUser(null)}>Logout</button>
          </div>
        </header>

        {activeView === "command" && (
          accessKind === "manager" ? (
            <ManagerDashboard
              brands={brands}
              outlets={outlets}
              salesmen={salesmen}
              skus={skus}
              tasks={tasks}
              payments={payments}
              orders={orders}
              bills={bills}
              records={records}
              pendingAdminReview={pendingDraftCount || pendingCount}
            />
          ) : (
            <AdminDistributionDashboard
              brands={brands}
              outlets={outlets}
              salesmen={salesmen}
              skus={skus}
              tasks={tasks}
              payments={payments}
              orders={orders}
              bills={bills}
              records={records}
              pendingReview={pendingDraftCount || pendingCount}
              highConfidenceCount={highConfidenceCount}
              onAddOutlet={() => openCreate("outlet")}
              onAddProduct={() => openCreate("sku")}
              onCreateTask={() => openCreate("task")}
              onAddPayment={() => openCreate("payment")}
              onOpenVerification={() => setActiveView("verification")}
              onOpenReports={() => setActiveView("reports")}
            />
          )
        )}

        {activeView === "inbox" && (
          <section className="inbox-grid">
            <QueuePanel records={records} selectedId={selectedId} onSelect={setSelectedId} />
            <div className="phone-frame">
              <div className="phone-header">Retailer WhatsApp</div>
              <div className="chat-feed">
                {records.slice(0, 4).map((record) => (
                  <div className="message" key={record.id}>
                    {record.message}
                  </div>
                ))}
              </div>
              <form className="chat-composer" onSubmit={addFieldMessage}>
                <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Outlet: Raj Stores, need 24 units, payment pending, send scheme details" />
                <button type="submit">Send</button>
              </form>
            </div>
            <AIDraft record={selectedRecord} />
          </section>
        )}

        {activeView === "verification" && (
          <VerificationWorkbench
            drafts={verificationDrafts}
            selectedDraft={selectedDraft}
            selectedDraftId={selectedDraftId}
            notice={verificationNotice}
            onSelect={setSelectedDraftId}
            onSubmit={handleVerificationDraft}
          />
        )}
        {activeView === "assigned-queue" && <AssignedVerificationQueueView currentUser={currentUser} drafts={verificationDrafts} records={records} onSelectDraft={setSelectedDraftId} onOpenVerification={() => setActiveView("verification")} />}
        {activeView === "corrections" && <PendingCorrectionsView records={records} verificationDrafts={verificationDrafts} payments={payments} bills={bills} orders={orders} outlets={outlets} />}

        {activeView === "media" && <MediaLabView aiProvider={aiProvider} />}
        {activeView === "outlets" && <OutletsView outlets={outlets} onAdd={() => openCreate("outlet")} onEdit={(outlet) => openEdit({ type: "outlet", record: outlet })} onArchive={(outlet) => requestArchive("outlet", outlet.id, outlet.name, "The outlet will be marked inactive while visit, order, and payment history stays available.")} onBulkImport={() => openBulkImport("outlet")} />}
        {activeView === "products" && <ProductsView skus={skus} onAdd={() => openCreate("sku")} onEdit={(sku) => openEdit({ type: "sku", record: sku })} onArchive={(sku) => requestArchive("sku", sku.id, sku.name, "The product will be marked inactive and removed from active order capture lists.")} onBulkImport={() => openBulkImport("sku")} />}
        {activeView === "procurement" && (
          <ProcurementFlowView
            brands={brands}
            procurementOffices={procurementOffices}
            materialFlows={materialFlows}
            inventoryPositions={inventoryPositions}
            purchaseOrders={purchaseOrders}
            goodsReceipts={goodsReceipts}
            supplierPayables={supplierPayables}
            skus={skus}
            orders={orders}
            bills={bills}
            onAddOffice={() => openCreate("procurementOffice")}
            onEditOffice={(office) => openEdit({ type: "procurementOffice", record: office })}
            onAddMovement={() => openCreate("materialFlow")}
            onEditMovement={(flow) => openEdit({ type: "materialFlow", record: flow })}
            onAddPurchaseOrder={() => openCreate("purchaseOrder")}
            onEditPurchaseOrder={(purchaseOrder) => openEdit({ type: "purchaseOrder", record: purchaseOrder })}
            onAddGoodsReceipt={() => openCreate("goodsReceipt")}
            onEditGoodsReceipt={(receipt) => openEdit({ type: "goodsReceipt", record: receipt })}
            onAddSupplierPayable={() => openCreate("supplierPayable")}
            onEditSupplierPayable={(payable) => openEdit({ type: "supplierPayable", record: payable })}
            onArchive={(type, id, label, impact) => requestArchive(type, id, label, impact)}
            onBulkImportOffice={() => openBulkImport("procurementOffice")}
            onBulkImportMovement={() => openBulkImport("materialFlow")}
          />
        )}
        {activeView === "partners" && (
          <PartnersView brands={brands} procurementOffices={procurementOffices} skus={skus} outlets={outlets} records={visiblePartnerRecords} materialFlows={materialFlows} tasks={tasks} payments={payments} orders={orders} bills={bills} partnerFilter={partnerFilter} onFilter={setPartnerFilter} canManage={canManagePartners} currentUser={currentUser} onAdd={() => openCreate("brand")} onAddSku={() => openCreate("sku")} onEdit={(brand) => openEdit({ type: "brand", record: brand })} onArchive={(brand) => requestArchive("brand", brand.id, brand.name, "The client will be marked inactive while historical sales and procurement records remain available.")} onBulkImport={() => openBulkImport("brand")} />
        )}
        {activeView === "ops" && <OpsView salesmen={salesmen} onAdd={() => openCreate("salesman")} onEdit={(person) => openEdit({ type: "salesman", record: person })} onBulkImport={() => openBulkImport("salesman")} />}
        {activeView === "users" && <UsersView users={users} onAdd={() => openCreate("user")} onEdit={(user) => openEdit({ type: "user", record: user })} onBulkImport={() => openBulkImport("user")} />}
        {activeView === "tasks" && <TasksView tasks={tasks} payments={payments} onAdd={() => openCreate("task")} onEdit={(task) => openEdit({ type: "task", record: task })} onBulkImport={() => openBulkImport("task")} />}
        {activeView === "territories" && <TerritoriesView territories={territories} onAdd={() => openCreate("territory")} onEdit={(territory) => openEdit({ type: "territory", record: territory })} onBulkImport={() => openBulkImport("territory")} />}
        {activeView === "finance" && <FinanceView payments={payments} tasks={tasks} outlets={outlets} salesmen={salesmen} onAddPayment={() => openCreate("payment")} onCreateTask={() => openCreate("task")} onBulkImport={() => openBulkImport("payment")} />}
        {activeView === "payments" && <PaymentsView payments={payments} onAdd={() => openCreate("payment")} onEdit={(payment) => openEdit({ type: "payment", record: payment })} onArchive={(payment) => requestArchive("payment", payment.id, `${payment.outlet} - ${payment.brand}`, "The payment record will be marked settled or inactive according to the current status while collection history remains visible.")} onBulkImport={() => openBulkImport("payment")} />}
        {activeView === "orders" && <OrdersView orders={orders} onAdd={() => openCreate("order")} onEdit={(order) => openEdit({ type: "order", record: order })} onArchive={(order) => requestArchive("order", order.id, `${order.outlet} - ${order.sku}`, "The order will be cancelled, but the audit trail and related records remain visible.")} onBulkImport={() => openBulkImport("order")} />}
        {activeView === "bills" && <BillsView bills={bills} onAdd={() => openCreate("bill")} onEdit={(bill) => openEdit({ type: "bill", record: bill })} onArchive={(bill) => requestArchive("bill", bill.id, bill.billNumber, "The bill will be written off or closed without removing invoice history from the account view.")} onBulkImport={() => openBulkImport("bill")} />}
        {activeView === "reports" && <ReportsView brands={brands} skus={skus} outlets={outlets} records={records} materialFlows={materialFlows} payments={payments} orders={orders} bills={bills} tasks={tasks} />}
        {activeView === "approval-inbox" && <ApprovalInboxView payments={payments} orders={orders} bills={bills} purchaseOrders={purchaseOrders} goodsReceipts={goodsReceipts} supplierPayables={supplierPayables} importReviews={importReviews} changeRequests={changeRequests} />}
        {activeView === "team-performance" && <TeamPerformanceView salesmen={salesmen} outlets={outlets} orders={orders} payments={payments} tasks={tasks} />}
        {activeView === "sla" && <SlaEscalationView payments={payments} orders={orders} tasks={tasks} verificationDrafts={verificationDrafts} goodsReceipts={goodsReceipts} />}
        {activeView === "territory-comparison" && <TerritoryComparisonView territories={territories} outlets={outlets} orders={orders} payments={payments} tasks={tasks} salesmen={salesmen} />}
        {activeView === "fulfilment" && <OrderFulfilmentView orders={orders} bills={bills} materialFlows={materialFlows} inventoryPositions={inventoryPositions} />}
        {activeView === "exceptions" && <ExceptionDashboardView payments={payments} orders={orders} inventoryPositions={inventoryPositions} goodsReceipts={goodsReceipts} purchaseOrders={purchaseOrders} verificationDrafts={verificationDrafts} />}
        {activeView === "search" && <GlobalSearchView brands={brands} outlets={outlets} skus={skus} orders={orders} bills={bills} payments={payments} tasks={tasks} />}
        {activeView === "audit" && <AuditTrailView brands={brands} outlets={outlets} skus={skus} orders={orders} bills={bills} payments={payments} tasks={tasks} verificationDrafts={verificationDrafts} />}
        {activeView === "permissions" && <PermissionMatrixView users={users} />}
        {activeView === "approvals" && <ChangeApprovalsView payments={payments} orders={orders} bills={bills} tasks={tasks} changeRequests={changeRequests} importReviews={importReviews} canApprove={currentUser ? canPerformAction(currentUser, "approve") : false} onChangeStatus={updateChangeRequest} onImportStatus={updateImportReview} onApplyImport={applyImportReview} />}
        {activeView === "quality" && <DataQualityView brands={brands} outlets={outlets} skus={skus} orders={orders} bills={bills} payments={payments} users={users} />}
        {activeView === "errors" && <ErrorLogsView setupError={initialData.setupError} metaIntegration={metaIntegration} aiProvider={aiProvider} openAIIntegration={openAIIntegration} verificationDrafts={verificationDrafts} />}
        {activeView === "exports" && <BackupExportView brands={brands} outlets={outlets} skus={skus} orders={orders} bills={bills} payments={payments} users={users} tasks={tasks} />}
        {activeView === "crm-sync" && <CRMSyncView brands={brands} outlets={outlets} skus={skus} payments={payments} orders={orders} metaIntegration={metaIntegration} aiProvider={aiProvider} />}
        {activeView === "system" && (
          <SystemHealthView
            setupError={initialData.setupError}
            metaIntegration={metaIntegration}
            aiProvider={aiProvider}
            openAIIntegration={openAIIntegration}
            counts={{
              brands: brands.length,
              branches: procurementOffices.length,
              skus: skus.length,
              orders: orders.length,
              payments: payments.length,
              verificationDrafts: verificationDrafts.length
            }}
          />
        )}
        {activeView === "integrations" && (
          <IntegrationsView
            metaIntegration={metaIntegration}
            aiProvider={aiProvider}
            openAIIntegration={openAIIntegration}
            notice={integrationNotice}
            onSaveMeta={saveMetaIntegration}
            onSaveAI={saveAIProvider}
            onSaveOpenAI={saveOpenAIIntegration}
          />
        )}
      </main>

      {modalType && (
        <MasterDataModal
          type={modalType}
          brands={brands}
          skus={skus}
          procurementOffices={procurementOffices}
          purchaseOrders={purchaseOrders}
          outlets={outlets}
          territories={territories}
          salesmen={salesmen}
          users={users}
          initialValues={editingItem?.type === modalType ? editingItem.record : undefined}
          onClose={() => {
            setEditingItem(null);
            setModalType(null);
          }}
          onSubmit={addMasterData}
        />
      )}
      {bulkImportType && (
        <BulkImportModal
          type={bulkImportType}
          message={bulkImportMessage}
          onClose={() => {
            setBulkImportType(null);
            setBulkImportMessage("");
          }}
          onDownload={() => downloadTemplate(bulkImportType)}
          onSubmit={handleBulkImport}
        />
      )}
      {archiveRequest && (
        <ArchiveConfirmModal
          request={archiveRequest}
          onCancel={() => setArchiveRequest(null)}
          onConfirm={(reason) => archiveMasterRecord(archiveRequest.type, archiveRequest.id, reason)}
        />
      )}
    </div>
  );
}

function orderUpdateForm(order: OrderRow, status: OrderRow["status"]) {
  const form = new FormData();
  form.set("id", order.id);
  form.set("outlet", order.outlet);
  form.set("sku", order.skuCode ? `${order.sku} (${order.skuCode})` : order.sku);
  form.set("quantity", String(order.quantity || 1));
  form.set("unitPrice", String(order.unitPrice || 0));
  form.set("expectedValue", String(order.expectedValue || 0));
  form.set("expectedDeliveryDate", order.expectedDeliveryDate === "No delivery date" ? "" : order.expectedDeliveryDate);
  form.set("status", status);
  return form;
}

function recordLabelForChange(item: EditableMasterData) {
  if (item.type === "brand") return item.record.name;
  if (item.type === "outlet") return item.record.name;
  if (item.type === "sku") return item.record.name;
  if (item.type === "payment") return `${item.record.receiptNumber} / ${item.record.outlet}`;
  if (item.type === "order") return `${item.record.outlet} / ${item.record.sku}`;
  if (item.type === "bill") return item.record.billNumber;
  if (item.type === "task") return item.record.title;
  if (item.type === "user") return item.record.name;
  if (item.type === "salesman") return item.record.name;
  if (item.type === "territory") return item.record.name;
  if (item.type === "procurementOffice") return item.record.officeName;
  if (item.type === "materialFlow") return `${item.record.movementType} / ${item.record.sku}`;
  if (item.type === "purchaseOrder") return item.record.poNumber;
  if (item.type === "goodsReceipt") return item.record.receiptNumber;
  return item.record.invoiceNumber;
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AdminDistributionDashboard({
  brands,
  outlets,
  salesmen,
  skus,
  tasks,
  payments,
  orders,
  bills,
  records,
  pendingReview,
  highConfidenceCount,
  onAddOutlet,
  onAddProduct,
  onCreateTask,
  onAddPayment,
  onOpenVerification,
  onOpenReports
}: {
  brands: BrandOption[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  skus: SkuRow[];
  tasks: TaskRow[];
  payments: PaymentRow[];
  orders: OrderRow[];
  bills: BillRow[];
  records: CommandRecord[];
  pendingReview: number;
  highConfidenceCount: number;
  onAddOutlet: () => void;
  onAddProduct: () => void;
  onCreateTask: () => void;
  onAddPayment: () => void;
  onOpenVerification: () => void;
  onOpenReports: () => void;
}) {
  const activeOutlets = outlets.filter((outlet) => outlet.status === "Active").length;
  const prospectOutlets = outlets.filter((outlet) => outlet.status === "Prospect").length;
  const activeReps = salesmen.filter((person) => person.status === "Active").length;
  const billedValue = bills.reduce((total, bill) => total + bill.totalAmount, 0);
  const openOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const openOrderValue = openOrders.reduce((total, order) => total + order.expectedValue, 0);
  const collectedValue = payments.reduce((total, payment) => total + payment.amountCollected, 0);
  const outstandingValue = payments.reduce((total, payment) => total + Math.max(payment.amountDue - payment.amountCollected, 0), 0);
  const highRiskPayments = payments.filter((payment) => ["High", "Critical"].includes(payment.riskLevel) || ["Overdue", "Disputed"].includes(payment.status));
  const openTasks = tasks.filter((task) => !["Completed", "Cancelled"].includes(task.status));
  const urgentTasks = openTasks.filter((task) => ["High", "Critical"].includes(task.priority) || task.status === "Overdue");
  const recordCount = Math.max(records.length, 1);
  const extractionAccuracy = Math.round((highConfidenceCount / recordCount) * 100);
  const collectionCoverage = payments.length ? Math.round((collectedValue / Math.max(collectedValue + outstandingValue, 1)) * 100) : 0;
  const orderToBillRatio = orders.length ? Math.round((bills.length / Math.max(orders.length, 1)) * 100) : 0;

  const brandMovement = brands.map((brand) => {
    const brandBills = bills.filter((bill) => bill.brand === brand.name).reduce((total, bill) => total + bill.totalAmount, 0);
    const brandOrders = orders.filter((order) => order.brand === brand.name).reduce((total, order) => total + order.expectedValue, 0);
    const outletCount = outlets.filter((outlet) => outlet.brand === brand.name).length;
    const skuCount = skus.filter((sku) => sku.brand === brand.name).length;
    return { name: brand.name, value: brandBills + brandOrders, outletCount, skuCount };
  }).sort((a, b) => b.value - a.value);

  const territoryCoverage = outlets.reduce<Record<string, { outlets: number; reps: Set<string>; prospects: number }>>((coverage, outlet) => {
    const territory = outlet.territory || outlet.city || "Unassigned";
    const current = coverage[territory] ?? { outlets: 0, reps: new Set<string>(), prospects: 0 };
    current.outlets += 1;
    if (outlet.assignedSalesman && outlet.assignedSalesman !== "Unassigned") current.reps.add(outlet.assignedSalesman);
    if (outlet.status === "Prospect") current.prospects += 1;
    coverage[territory] = current;
    return coverage;
  }, {});

  const recentSignals = [
    ...orders.slice(0, 2).map((order) => ({ title: order.outlet, detail: `${order.sku} order pipeline - ${money(order.expectedValue)}`, tag: order.status })),
    ...payments.slice(0, 2).map((payment) => ({ title: payment.outlet, detail: `${payment.brand} outstanding - ${money(Math.max(payment.amountDue - payment.amountCollected, 0))}`, tag: payment.riskLevel })),
    ...tasks.slice(0, 2).map((task) => ({ title: task.title, detail: `${task.assignedTo} - ${task.outlet}`, tag: task.priority }))
  ].slice(0, 5);

  return (
    <section className="distribution-dashboard">
      <section className="command-hero panel">
        <div>
          <p className="eyebrow">Distribution control room</p>
          <h2>Execution visibility in one place</h2>
          <p>Monitor field coverage, client movement, order value, collections, tasks, and data quality from a single operating view.</p>
        </div>
        <div className="command-hero-grid">
          <Field label="Active clients" value={String(brands.filter((brand) => brand.status === "Active").length)} />
          <Field label="Products / SKUs" value={String(skus.length)} />
          <Field label="Active reps" value={String(activeReps)} />
          <Field label="Cities / territories" value={String(new Set(outlets.map((outlet) => outlet.territory || outlet.city)).size)} />
        </div>
      </section>

      <section className="metrics-grid">
        <Metric label="Billed value" value={money(billedValue)} detail={`${bills.length} verified bills`} />
        <Metric label="Open pipeline" value={money(openOrderValue)} detail={`${openOrders.length} active orders`} />
        <Metric label="Outstanding" value={money(outstandingValue)} detail={`${collectionCoverage}% collection coverage`} />
        <Metric label="Outlet universe" value={activeOutlets} detail={`${prospectOutlets} prospects in CRM`} />
      </section>

      <section className="signal-strip">
        <article>
          <span>Order to bill</span>
          <strong>{orderToBillRatio}%</strong>
          <ProgressBar value={orderToBillRatio} />
        </article>
        <article>
          <span>Collection coverage</span>
          <strong>{collectionCoverage}%</strong>
          <ProgressBar value={collectionCoverage} />
        </article>
        <article>
          <span>Extraction confidence</span>
          <strong>{extractionAccuracy}%</strong>
          <ProgressBar value={extractionAccuracy} />
        </article>
        <article>
          <span>Admin review queue</span>
          <strong>{pendingReview}</strong>
          <button className="link-button" onClick={onOpenVerification}>Open queue</button>
        </article>
      </section>

      <section className="admin-command-grid">
        <article className="panel command-actions-panel">
          <div className="panel-heading">
            <div>
              <h2>Control Actions</h2>
              <p>Focused controls for master data, field execution, reviews, and reporting.</p>
            </div>
          </div>
          <div className="admin-action-grid">
            <button className="primary-button" onClick={onAddOutlet}>Add Outlet</button>
            <button className="primary-button" onClick={onAddProduct}>Add Product / SKU</button>
            <button className="secondary-button" onClick={onCreateTask}>Create Task</button>
            <button className="secondary-button" onClick={onAddPayment}>Add Payment</button>
            <button className="secondary-button" onClick={onOpenVerification}>Verification Queue</button>
            <button className="secondary-button" onClick={onOpenReports}>Reports</button>
          </div>
        </article>

        <article className="panel">
          <h2>Payment Risk</h2>
          <div className="task-list compact-list">
            {highRiskPayments.slice(0, 5).map((payment) => (
              <article className="task-row compact-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.outlet}</strong>
                  <span className="tag warn">{payment.riskLevel}</span>
                </div>
                <p>{payment.brand} - {money(Math.max(payment.amountDue - payment.amountCollected, 0))} outstanding</p>
              </article>
            ))}
            {!highRiskPayments.length && <p className="empty-state">No high-risk payments yet.</p>}
          </div>
        </article>

        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <h2>Client and SKU Movement</h2>
              <p>Client-wise value, outlet reach, and product readiness.</p>
            </div>
          </div>
          <div className="brand-movement-grid">
            {brandMovement.slice(0, 6).map((brand) => (
              <article className="movement-row" key={brand.name}>
                <div>
                  <strong>{brand.name}</strong>
                  <span>{brand.outletCount} outlets - {brand.skuCount} SKUs</span>
                </div>
                <b>{money(brand.value)}</b>
              </article>
            ))}
            {!brandMovement.length && <p className="empty-state">Add clients and products to start tracking movement.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Territory Coverage</h2>
          <div className="task-list compact-list">
            {Object.entries(territoryCoverage).slice(0, 6).map(([territory, coverage]) => (
              <article className="task-row compact-row" key={territory}>
                <div className="queue-top">
                  <strong>{territory}</strong>
                  <span className="tag blue">{coverage.outlets} outlets</span>
                </div>
                <p>{coverage.reps.size} reps assigned - {coverage.prospects} prospects</p>
              </article>
            ))}
            {!Object.keys(territoryCoverage).length && <p className="empty-state">No territory coverage yet.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Team Follow-Ups</h2>
          <div className="task-list compact-list">
            {urgentTasks.slice(0, 5).map((task) => (
              <article className="task-row compact-row" key={task.id}>
                <div className="queue-top">
                  <strong>{task.title}</strong>
                  <span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span>
                </div>
                <p>{task.assignedTo} - {task.outlet}</p>
              </article>
            ))}
            {!urgentTasks.length && <p className="empty-state">No urgent follow-ups right now.</p>}
          </div>
        </article>

        <article className="panel wide-panel">
          <h2>Recent Operating Signals</h2>
          <div className="signal-list">
            {recentSignals.map((signal, index) => (
              <article className="signal-row" key={`${signal.title}-${index}`}>
                <div>
                  <strong>{signal.title}</strong>
                  <span>{signal.detail}</span>
                </div>
                <span className="tag blue">{signal.tag}</span>
              </article>
            ))}
            {!recentSignals.length && <p className="empty-state">No orders, payments, or tasks have been captured yet.</p>}
          </div>
        </article>
      </section>

    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress-bar" aria-label={`${safeValue}%`}>
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function ManagerDashboard({
  brands,
  outlets,
  salesmen,
  skus,
  tasks,
  payments,
  orders,
  bills,
  records,
  pendingAdminReview
}: {
  brands: BrandOption[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  skus: SkuRow[];
  tasks: TaskRow[];
  payments: PaymentRow[];
  orders: OrderRow[];
  bills: BillRow[];
  records: CommandRecord[];
  pendingAdminReview: number;
}) {
  const activeOutlets = outlets.filter((outlet) => outlet.status === "Active").length;
  const prospectOutlets = outlets.filter((outlet) => outlet.status === "Prospect").length;
  const openOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const openOrderValue = openOrders.reduce((total, order) => total + order.expectedValue, 0);
  const billedValue = bills.reduce((total, bill) => total + bill.totalAmount, 0);
  const collectedValue = payments.reduce((total, payment) => total + payment.amountCollected, 0);
  const outstandingValue = payments.reduce((total, payment) => total + Math.max(payment.amountDue - payment.amountCollected, 0), 0);
  const highRiskPayments = payments.filter((payment) => ["High", "Critical"].includes(payment.riskLevel) || ["Overdue", "Disputed"].includes(payment.status));
  const openTasks = tasks.filter((task) => !["Completed", "Cancelled"].includes(task.status));
  const urgentTasks = openTasks.filter((task) => ["High", "Critical"].includes(task.priority) || task.status === "Overdue");
  const productiveRecords = records.filter((record) => record.type === "Sale" || record.value > 0);
  const productiveRatio = records.length ? Math.round((productiveRecords.length / records.length) * 100) : 0;
  const brandMovement = brands.map((brand) => {
    const brandBills = bills.filter((bill) => bill.brand === brand.name).reduce((total, bill) => total + bill.totalAmount, 0);
    const brandOrders = orders.filter((order) => order.brand === brand.name).reduce((total, order) => total + order.expectedValue, 0);
    const outletCount = outlets.filter((outlet) => outlet.brand === brand.name).length;
    return { name: brand.name, value: brandBills + brandOrders, outletCount };
  });
  const cityCoverage = outlets.reduce<Record<string, number>>((cities, outlet) => {
    cities[outlet.city] = (cities[outlet.city] ?? 0) + 1;
    return cities;
  }, {});

  return (
    <section className="manager-dashboard">
      <section className="metrics-grid">
        <Metric label="Billed value" value={money(billedValue)} detail={`${bills.length} bills captured`} />
        <Metric label="Outstanding" value={money(outstandingValue)} detail={`${money(collectedValue)} collected`} />
        <Metric label="Open order pipeline" value={money(openOrderValue)} detail={`${openOrders.length} active order intents`} />
        <Metric label="Outlet universe" value={activeOutlets} detail={`${prospectOutlets} prospects, ${skus.length} SKUs`} />
      </section>

      <section className="manager-grid">
        <article className="panel manager-focus">
          <div className="panel-heading">
            <div>
              <h2>Distribution Health</h2>
              <p>Manager view of coverage, productivity, pipeline, and collections.</p>
            </div>
            <span className="tag blue">{productiveRatio}% productive</span>
          </div>
          <div className="manager-stat-grid">
            <Field label="Active sales reps" value={String(salesmen.filter((person) => person.status === "Active").length)} />
            <Field label="Open tasks" value={String(openTasks.length)} />
            <Field label="Urgent follow-ups" value={String(urgentTasks.length)} />
            <Field label="Admin review queue" value={String(pendingAdminReview)} />
          </div>
          <p className="manager-note">Verification is reserved for admin users. Managers can track pending review volume without approving or rejecting records.</p>
        </article>

        <article className="panel">
          <h2>Payment Risk</h2>
          <div className="task-list">
            {highRiskPayments.slice(0, 5).map((payment) => (
              <article className="task-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.outlet}</strong>
                  <span className="tag warn">{payment.riskLevel}</span>
                </div>
                <p>{payment.brand} - {money(Math.max(payment.amountDue - payment.amountCollected, 0))} outstanding</p>
                <div className="record-meta">
                  <span>{payment.status}</span>
                  <span>Due {payment.dueDate || "not set"}</span>
                </div>
              </article>
            ))}
            {!highRiskPayments.length && <p className="empty-state">No high-risk payments right now.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Order Pipeline</h2>
          <div className="task-list">
            {openOrders.slice(0, 5).map((order) => (
              <article className="task-row" key={order.id}>
                <div className="queue-top">
                  <strong>{order.outlet}</strong>
                  <span className="tag blue">{order.status}</span>
                </div>
                <p>{order.sku} - {order.brand} - {money(order.expectedValue)}</p>
                <div className="record-meta">
                  <span>Expected {order.expectedDeliveryDate || "not set"}</span>
                </div>
              </article>
            ))}
            {!openOrders.length && <p className="empty-state">No active order pipeline yet.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Client Movement</h2>
          <div className="task-list">
            {brandMovement.slice(0, 5).map((brand) => (
              <article className="task-row" key={brand.name}>
                <div className="queue-top">
                  <strong>{brand.name}</strong>
                  <span className="tag">{brand.outletCount} outlets</span>
                </div>
                <p>{money(brand.value)} in bills and open orders</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Territory Coverage</h2>
          <div className="task-list">
            {Object.entries(cityCoverage).slice(0, 6).map(([city, count]) => (
              <article className="task-row compact-row" key={city}>
                <div className="queue-top">
                  <strong>{city}</strong>
                  <span className="tag blue">{count} outlets</span>
                </div>
              </article>
            ))}
            {!Object.keys(cityCoverage).length && <p className="empty-state">No outlets added yet.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Team Follow-Ups</h2>
          <div className="task-list">
            {urgentTasks.slice(0, 5).map((task) => (
              <article className="task-row" key={task.id}>
                <div className="queue-top">
                  <strong>{task.title}</strong>
                  <span className="tag warn">{task.priority}</span>
                </div>
                <p>{task.outlet} - {task.description}</p>
                <div className="record-meta">
                  <span>{task.status}</span>
                  <span>Due {task.dueDate || "not set"}</span>
                </div>
              </article>
            ))}
            {!urgentTasks.length && <p className="empty-state">No urgent follow-ups right now.</p>}
          </div>
        </article>
      </section>

    </section>
  );
}

function LoginScreen({ users, error, onLogin }: { users: AppUserRow[]; error: string; onLogin: (event: FormEvent<HTMLFormElement>) => void }) {
  const demoAdmin = users.find((user) => user.role === "super_admin" || user.role === "admin_operator");
  const demoManager = users.find((user) => user.role === "operations_manager");
  const demoSales = users.find((user) => user.role === "field_executive");
  const demoFinance = users.find((user) => user.role === "finance_collections");
  const demoIntegration = users.find((user) => user.role === "integration_user");
  const hasAdminUser = Boolean(demoAdmin);

  return (
    <main className="login-shell">
      <section className="login-card">
        <img src="/brand/shipd2r-logo.png" alt="shipd2r" />
        <p className="eyebrow">ERP / CRM access</p>
        <h1>Choose your workspace</h1>
        <p>Admins manage everything. Managers supervise teams and territories. Sales executives enter the sales app.</p>
        <form className="master-form" onSubmit={onLogin}>
          <Select name="role" label="Login as" options={["Admin", "Manager", "Sales Executive", "Brand Partner", "Finance", "Integration"]} defaultValue="Admin" />
          <Input name="identifier" label="Email, phone, or name" placeholder="admin@shipd2r.local" />
          <Input name="accessCode" label="Access code" placeholder="Last 4 digits of phone" type="password" />
          {error && <p className="form-error">{error}</p>}
          <button className="approve" type="submit">Login</button>
        </form>
        <div className="login-hints">
          <strong>Demo access rule</strong>
          <span>Use the user email/phone/name and the last 4 digits of that user's phone as the access code.</span>
          {demoAdmin && <span>Admin example: {demoAdmin.email || demoAdmin.phone} / {loginCodeFor(demoAdmin)}</span>}
          {demoManager && <span>Manager example: {demoManager.email || demoManager.phone} / {loginCodeFor(demoManager)}</span>}
          {demoSales && <span>Sales example: {demoSales.email || demoSales.phone} / {loginCodeFor(demoSales)}</span>}
          {demoFinance && <span>Finance example: {demoFinance.email || demoFinance.phone} / {loginCodeFor(demoFinance)}</span>}
          {demoIntegration && <span>Integration example: {demoIntegration.email || demoIntegration.phone} / {loginCodeFor(demoIntegration)}</span>}
          {!hasAdminUser && <span>Bootstrap admin: any email / 0000</span>}
        </div>
      </section>
    </main>
  );
}

function SalesRepPortal({
  user,
  brands,
  skus,
  tasks,
  outlets,
  orders,
  bills,
  payments,
  onCreateVisit,
  onCreateOrder,
  onCreateBill,
  onCreatePayment,
  onUpdateOrder,
  onLogout
}: {
  user: AppUserRow;
  brands: BrandOption[];
  skus: SkuRow[];
  tasks: TaskRow[];
  outlets: OutletRow[];
  orders: OrderRow[];
  bills: BillRow[];
  payments: PaymentRow[];
  onCreateVisit: (formData: FormData) => Promise<TaskRow>;
  onCreateOrder: (formData: FormData) => Promise<OrderRow>;
  onCreateBill: (formData: FormData) => Promise<BillRow>;
  onCreatePayment: (formData: FormData) => Promise<PaymentRow>;
  onUpdateOrder: (formData: FormData) => Promise<OrderRow>;
  onLogout: () => void;
}) {
  const [activeWorkflow, setActiveWorkflow] = useState<SalesWorkflow>("visit");
  const [notice, setNotice] = useState<IntegrationNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<MediaLabResult | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderSkuId, setSelectedOrderSkuId] = useState(skus[0]?.id ?? "");
  const [orderQuantity, setOrderQuantity] = useState("12");
  const [orderCart, setOrderCart] = useState<SalesCartLine[]>([]);
  const [selectedBillOrderId, setSelectedBillOrderId] = useState("");
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState("");
  const [selectedOutletName, setSelectedOutletName] = useState(outlets[0]?.name ?? "");
  const outletOptions = outlets.length ? outlets.map((outlet) => outlet.name) : ["Unassigned"];
  const brandOptions = brands.length ? brands.map((brand) => brand.name) : ["Unassigned"];
  const billOptions = bills.length ? ["Unallocated", ...bills.map((bill) => bill.billNumber)] : ["Unallocated"];
  const recentOpenOrders = orders.filter((order) => !["Billed", "Delivered", "Cancelled"].includes(order.status)).slice(0, 6);
  const deliveryOrders = orders.filter((order) => ["Confirmed", "Billed"].includes(order.status)).slice(0, 8);
  const draftOrders = orders.filter((order) => order.status === "On hold").slice(0, 5);
  const selectedOutlet = outlets.find((outlet) => outlet.name === selectedOutletName) ?? outlets[0];
  const outletOrders = selectedOutlet ? orders.filter((order) => order.outlet === selectedOutlet.name).slice(0, 6) : [];
  const outletBills = selectedOutlet ? bills.filter((bill) => bill.outlet === selectedOutlet.name).slice(0, 6) : [];
  const outletPayments = selectedOutlet ? payments.filter((payment) => payment.outlet === selectedOutlet.name).slice(0, 6) : [];
  const outletDisputes = [...outletBills.filter((bill) => bill.paymentStatus === "Disputed"), ...outletPayments.filter((payment) => payment.status === "Disputed")];
  const routeOutlets = outlets
    .filter((outlet) => outlet.assignedSalesman === user.name || outlet.territory === user.territory || outlet.territory === "Unassigned")
    .slice(0, 6);
  const selectedOrderSku = skus.find((sku) => sku.id === selectedOrderSkuId) ?? skus[0];
  const selectedDeliveryOrder = orders.find((order) => order.id === selectedDeliveryOrderId) ?? deliveryOrders[0];
  const filteredOrderSkus = skus.filter((sku) => {
    const haystack = `${sku.name} ${sku.code} ${sku.brand} ${sku.category}`.toLowerCase();
    return haystack.includes(orderSearch.trim().toLowerCase());
  });
  const visibleOrderSkus = orderSearch.trim() ? filteredOrderSkus : skus;
  const orderCartTotal = orderCart.reduce((total, line) => total + line.quantity * line.unitPrice, 0);

  function addSelectedSkuToCart() {
    if (!selectedOrderSku) return;
    const quantity = Math.max(Number(orderQuantity) || 0, 1);
    setOrderCart((current) => {
      const existing = current.find((line) => line.skuId === selectedOrderSku.id);
      if (existing) {
        return current.map((line) => (line.skuId === selectedOrderSku.id ? { ...line, quantity: line.quantity + quantity } : line));
      }
      return [
        ...current,
        {
          skuId: selectedOrderSku.id,
          name: selectedOrderSku.name,
          code: selectedOrderSku.code,
          brand: selectedOrderSku.brand,
          quantity,
          unitPrice: selectedOrderSku.mrp
        }
      ];
    });
  }

  async function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setIsSubmitting(true);
    try {
      await onCreateVisit(new FormData(formElement));
      formElement.reset();
      setNotice({ type: "success", message: "Visit logged successfully." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Visit could not be logged." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const isDraft = submitter?.value === "draft";
    setNotice(null);
    const selectedSku = selectedOrderSku ? skuOption(selectedOrderSku) : "";
    if (!selectedSku) {
      setNotice({ type: "error", message: "Select a product before capturing the order." });
      return;
    }
    setIsSubmitting(true);
    try {
      const cartLines = orderCart.length
        ? orderCart
        : [{
            skuId: selectedOrderSku?.id ?? "selected",
            name: selectedOrderSku?.name ?? selectedSku,
            code: selectedOrderSku?.code ?? "",
            brand: selectedOrderSku?.brand ?? "",
            quantity: Math.max(Number(orderQuantity) || 0, 1),
            unitPrice: selectedOrderSku?.mrp ?? 0
          }];
      for (const line of cartLines) {
        const lineForm = new FormData(formElement);
        lineForm.set("sku", line.code ? `${line.name} (${line.code})` : line.name);
        lineForm.set("quantity", String(line.quantity));
        lineForm.set("unitPrice", String(line.unitPrice));
        lineForm.set("expectedValue", String(line.quantity * line.unitPrice));
        lineForm.set("status", isDraft ? "On hold" : "Intent captured");
        await onCreateOrder(lineForm);
      }
      formElement.reset();
      setSelectedOrderSkuId(skus[0]?.id ?? "");
      setOrderQuantity("12");
      setOrderCart([]);
      setOrderSearch("");
      setNotice({ type: "success", message: isDraft ? "Draft order saved for later." : `${cartLines.length} order ${cartLines.length === 1 ? "line" : "lines"} captured.` });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Order could not be captured." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setIsSubmitting(true);
    try {
      await onCreatePayment(new FormData(formElement));
      formElement.reset();
      setNotice({ type: "success", message: "Payment update saved." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Payment could not be saved." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setIsSubmitting(true);
    try {
      const form = new FormData(formElement);
      const invoiceFile = form.get("invoiceImageFile") as File | null;
      if (invoiceFile && invoiceFile.size > 0) {
        const evidenceForm = new FormData();
        evidenceForm.set("file", invoiceFile);
        evidenceForm.set("note", `Invoice image for ${String(form.get("outlet") ?? "outlet")} / ${String(form.get("billNumber") ?? "unnumbered bill")}`);
        evidenceForm.set("providerMode", "auto");
        evidenceForm.set("sarvamLanguage", "auto");
        const response = await fetch("/api/ai/extract-media", { method: "POST", body: evidenceForm });
        const body = await response.json();
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Invoice image upload failed.");
        const result = body as MediaLabResult;
        form.set("billImagePath", result.persistedMessageId ? `incoming-message:${result.persistedMessageId}` : `uploaded:${result.fileName}`);
      }
      await onCreateBill(form);
      formElement.reset();
      setSelectedBillOrderId("");
      setNotice({ type: "success", message: "Invoice captured, linked to the order, and billing status updated." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Invoice could not be captured." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDeliveryOrder) {
      setNotice({ type: "error", message: "Choose an order before confirming delivery." });
      return;
    }
    setNotice(null);
    setIsSubmitting(true);
    try {
      const form = orderUpdateForm(selectedDeliveryOrder, "Delivered");
      await onUpdateOrder(form);
      setNotice({ type: "success", message: `Delivery confirmed for ${selectedDeliveryOrder.outlet}.` });
      setSelectedDeliveryOrderId("");
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Delivery could not be confirmed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setEvidenceResult(null);
    setIsSubmitting(true);
    try {
      const form = new FormData(formElement);
      form.set("providerMode", "auto");
      form.set("sarvamLanguage", "auto");
      const response = await fetch("/api/ai/extract-media", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Evidence extraction failed.");
      const result = body as MediaLabResult;
      setEvidenceResult(result);
      setNotice({
        type: "success",
        message: result.persistedMessageId
          ? "Evidence uploaded and sent to admin verification."
          : "Evidence extracted. Admin can review the resulting text."
      });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Evidence could not be uploaded." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="sales-app-shell">
      <header className="sales-app-topbar">
        <div>
          <p className="eyebrow">Shipd2r sales app</p>
          <h1>Welcome, {user.name}</h1>
          <span>{user.territory || "Assigned territory"} - {user.phone}</span>
        </div>
        <button className="secondary-button" onClick={onLogout}>Logout</button>
      </header>
      <section className="metrics-grid">
        <Metric label="Assigned tasks" value={tasks.length} detail="Follow-ups and escalations" />
        <Metric label="Outlets" value={outlets.length} detail="Visible retailer universe" />
        <Metric label="Open orders" value={orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length} detail="To confirm or follow up" />
        <Metric label="Bills captured" value={bills.length} detail="Invoices in register" />
      </section>
      <section className="ops-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Today's Sales Workflow</h2>
              <p>Fast actions for visit logging, order capture, payment follow-up, and evidence upload.</p>
            </div>
          </div>
          <div className="sales-action-grid">
            <button className="primary-button" onClick={() => setActiveWorkflow("visit")}>Start Visit</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("order")}>Create Order</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("bill")}>Create Bill</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("delivery")}>Confirm Delivery</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("payment")}>Collect Payment</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("evidence")}>Upload Evidence</button>
          </div>
          {notice && <p className={`inline-notice ${notice.type}`} role="status">{notice.message}</p>}
          <div className="sales-workflow-panel">
            {activeWorkflow === "visit" && (
              <form className="master-form" onSubmit={submitVisit}>
                <div className="form-grid">
                  <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={selectedOutletName} />
                  <Select name="brand" label="Client / brand" options={brandOptions} />
                  <Input name="dueDate" label="Follow-up date" type="date" required={false} />
                  <div className="form-field wide">
                    <label htmlFor="outcome">Visit notes</label>
                    <textarea id="outcome" name="outcome" placeholder="Owner feedback, stock issue, order expected, payment reminder, competitor note" required />
                  </div>
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Save Visit</button>
                </div>
              </form>
            )}

            {activeWorkflow === "order" && (
              <form className="master-form" onSubmit={submitOrder}>
                <div className="form-grid">
                  <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={selectedOutletName} />
                  <input type="hidden" name="sku" value={selectedOrderSku ? skuOption(selectedOrderSku) : ""} />
                  <div className="form-field wide">
                    <label htmlFor="sales-product-search">Find product</label>
                    <input
                      id="sales-product-search"
                      type="search"
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      placeholder="Search by product, SKU, brand, or category"
                    />
                  </div>
                  <div className="sales-product-picker wide" aria-label="Choose product">
                    {visibleOrderSkus.slice(0, 8).map((sku) => (
                      <button
                        type="button"
                        className={`sales-product-option ${selectedOrderSku?.id === sku.id ? "active" : ""}`}
                        key={sku.id}
                        onClick={() => setSelectedOrderSkuId(sku.id)}
                      >
                        <span className="sales-product-image">
                          {sku.imageUrl ? (
                            <img src={sku.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = "/brand/nestle-logo.svg"; }} />
                          ) : (
                            <b>{productImageFallback(sku)}</b>
                          )}
                        </span>
                        <span className="sales-product-copy">
                          <strong>{sku.name}</strong>
                          <small>{sku.brand} - {sku.unit}</small>
                          <span>{sku.code || "No SKU code"}</span>
                        </span>
                        <em>{money(sku.mrp)}</em>
                      </button>
                    ))}
                    {Boolean(skus.length && !visibleOrderSkus.length) && (
                      <p className="empty-state">No product matches that search. Try the product name, SKU, brand, or category.</p>
                    )}
                    {!skus.length && <p className="empty-state">No products are available for order capture.</p>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="sales-order-quantity">Quantity</label>
                    <input id="sales-order-quantity" name="quantity" type="number" value={orderQuantity} min="1" onChange={(event) => setOrderQuantity(event.target.value)} placeholder="24" required />
                  </div>
                  <Input name="unitPrice" label="Unit price" type="number" placeholder="Auto from MRP" required={false} />
                  <Input name="expectedValue" label="Order value" type="number" placeholder="Auto from quantity" required={false} />
                  <Input name="expectedDeliveryDate" label="Expected delivery" type="date" required={false} />
                  <div className="quantity-chip-row wide" aria-label="Quick quantities">
                    {[6, 12, 24, 48].map((quantity) => (
                      <button type="button" className="link-button" key={quantity} onClick={() => setOrderQuantity(String(quantity))}>
                        {quantity} units
                      </button>
                    ))}
                    <button type="button" className="secondary-button" onClick={addSelectedSkuToCart} disabled={!selectedOrderSku}>
                      Add to Cart
                    </button>
                  </div>
                  {selectedOrderSku && (
                    <div className="selected-order-summary wide">
                      <span>Selected</span>
                      <strong>{selectedOrderSku.name}</strong>
                      <small>{selectedOrderSku.code || "No SKU code"} - {selectedOrderSku.brand} - {money(selectedOrderSku.mrp)}</small>
                    </div>
                  )}
                  <div className="sales-cart-list wide">
                    <div className="queue-top">
                      <strong>Order cart</strong>
                      <span className="tag blue">{orderCart.length} lines</span>
                    </div>
                    {orderCart.map((line) => (
                      <article className="sales-cart-line" key={line.skuId}>
                        <div>
                          <strong>{line.name}</strong>
                          <span>{line.code || "No SKU code"} - {line.brand}</span>
                        </div>
                        <b>{line.quantity} x {money(line.unitPrice)}</b>
                        <button className="link-button" type="button" onClick={() => setOrderCart((current) => current.filter((item) => item.skuId !== line.skuId))}>Remove</button>
                      </article>
                    ))}
                    {!orderCart.length && <span className="cart-empty-note">Capture the selected product directly, or add multiple SKUs to the cart first.</span>}
                  </div>
                  {draftOrders.length > 0 && (
                    <div className="sales-billing-context wide">
                      <div className="queue-top">
                        <strong>Saved drafts</strong>
                        <span className="tag warn">{draftOrders.length} drafts</span>
                      </div>
                      {draftOrders.map((order) => (
                        <article className="sales-cart-line" key={order.id}>
                          <div>
                            <strong>{order.outlet}</strong>
                            <span>{order.sku} - {money(order.expectedValue)}</span>
                          </div>
                          <span className="tag">Saved</span>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                {selectedOrderSku && (
                  <div className="sales-order-dock">
                    <div>
                      <span>{orderCart.length ? "Cart order" : "Current order"}</span>
                      <strong>{orderCart.length ? `${orderCart.length} SKU lines` : `${orderQuantity || 0} x ${selectedOrderSku.name}`}</strong>
                      <small>{money(orderCart.length ? orderCartTotal : (Number(orderQuantity) || 0) * selectedOrderSku.mrp)} estimated value</small>
                    </div>
                    <button className="approve" disabled={isSubmitting} type="submit">Capture</button>
                    <button className="secondary-button" disabled={isSubmitting} type="submit" name="salesOrderIntent" value="draft">Save Draft</button>
                  </div>
                )}
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Capture Order</button>
                  <button className="secondary-button" disabled={isSubmitting} type="submit" name="salesOrderIntent" value="draft">Save for Later</button>
                </div>
              </form>
            )}

            {activeWorkflow === "bill" && (
              <form className="master-form" onSubmit={submitBill}>
                <div className="form-grid">
                  <input type="hidden" name="linkedOrderId" value={selectedBillOrderId} />
                  <input type="hidden" name="billImagePath" value="" />
                  <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={selectedOutletName} />
                  <Select name="brand" label="Client / brand" options={brandOptions} />
                  <Input name="billNumber" label="Invoice / bill number" placeholder="INV-2026-001" required={false} />
                  <Input name="billDate" label="Bill date" type="date" required={false} />
                  <Input name="totalAmount" label="Invoice amount" type="number" placeholder="12400" />
                  <Select name="paymentStatus" label="Payment status" options={["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue="Due" />
                  <div className="form-field wide">
                    <label htmlFor="invoiceImageFile">Invoice image</label>
                    <input id="invoiceImageFile" name="invoiceImageFile" type="file" accept="image/*,application/pdf" />
                  </div>
                  <div className="sales-billing-context wide">
                    <div className="queue-top">
                      <strong>Open order context</strong>
                      <span className="tag blue">{recentOpenOrders.length} open</span>
                    </div>
                    {recentOpenOrders.map((order) => (
                      <article className="sales-cart-line" key={order.id}>
                        <div>
                          <strong>{order.outlet}</strong>
                          <span>{order.sku} - {order.brand}</span>
                        </div>
                        <b>{money(order.expectedValue)}</b>
                        <button
                          className="link-button"
                          type="button"
                          onClick={(event) => {
                            const form = event.currentTarget.form;
                            const outletInput = form?.elements.namedItem("outlet") as HTMLSelectElement | null;
                            const brandInput = form?.elements.namedItem("brand") as HTMLSelectElement | null;
                            const amountInput = form?.elements.namedItem("totalAmount") as HTMLInputElement | null;
                            if (outletInput) outletInput.value = order.outlet;
                            if (brandInput) brandInput.value = order.brand;
                            if (amountInput) amountInput.value = String(order.expectedValue);
                            setSelectedBillOrderId(order.id);
                          }}
                        >
                          Link
                        </button>
                      </article>
                    ))}
                    {!recentOpenOrders.length && <span className="cart-empty-note">No open orders yet. You can still capture a direct invoice for the outlet.</span>}
                  </div>
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Capture Bill</button>
                </div>
              </form>
            )}

            {activeWorkflow === "delivery" && (
              <form className="master-form" onSubmit={submitDelivery}>
                <div className="form-grid">
                  <div className="form-field wide">
                    <label htmlFor="deliveryOrder">Order ready for delivery</label>
                    <select id="deliveryOrder" value={selectedDeliveryOrder?.id ?? ""} onChange={(event) => setSelectedDeliveryOrderId(event.target.value)} required>
                      {deliveryOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.outlet} - {order.sku} - {money(order.expectedValue)} - {order.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedDeliveryOrder && (
                    <div className="selected-order-summary wide">
                      <span>Delivery confirmation</span>
                      <strong>{selectedDeliveryOrder.outlet}</strong>
                      <small>{selectedDeliveryOrder.sku} - {selectedDeliveryOrder.quantity} units - bill status {selectedDeliveryOrder.status}</small>
                    </div>
                  )}
                  {!deliveryOrders.length && <p className="empty-state wide">No confirmed or billed orders are waiting for delivery.</p>}
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting || !deliveryOrders.length} type="submit">Mark Delivered</button>
                </div>
              </form>
            )}

            {activeWorkflow === "payment" && (
              <form className="master-form" onSubmit={submitPayment}>
                <div className="form-grid">
                  <input type="hidden" name="collectorName" value={user.name} />
                  <input type="hidden" name="writeOffStatus" value="Not requested" />
                  <input type="hidden" name="disputeStatus" value="Not disputed" />
                  <input type="hidden" name="settlementStatus" value="Unreconciled" />
                  <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={selectedOutletName} />
                  <Select name="brand" label="Client / brand" options={brandOptions} />
                  <Select name="billNumber" label="Linked invoice" options={billOptions} defaultValue="Unallocated" />
                  <Input name="amountDue" label="Amount due" type="number" placeholder="12400" />
                  <Input name="amountCollected" label="Amount collected" type="number" placeholder="5000" required={false} />
                  <Input name="dueDate" label="Due date" type="date" required={false} />
                  <Input name="promisedPaymentDate" label="Promised date" type="date" required={false} />
                  <Input name="paymentMode" label="Payment mode" placeholder="UPI / Cash / Bank transfer" required={false} />
                  <Input name="settlementReference" label="Settlement reference" placeholder="UPI UTR / bank ref / cash batch" required={false} />
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Save Payment</button>
                </div>
              </form>
            )}

            {activeWorkflow === "evidence" && (
              <form className="master-form" onSubmit={submitEvidence}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="sales-evidence-file">Photo, bill, voice note, or PDF</label>
                    <input id="sales-evidence-file" name="file" type="file" accept="image/*,audio/*,application/pdf" required />
                  </div>
                  <Input name="note" label="Context note" placeholder="Outlet, brand, payment/order context" required={false} />
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Upload Evidence</button>
                </div>
                {evidenceResult && (
                  <div className="sales-evidence-result">
                    <strong>{evidenceResult.classification?.primaryCategory ?? evidenceResult.structured.category}</strong>
                    <p>{evidenceResult.extractedText || evidenceResult.ocrText || evidenceResult.transcriptText || "No text extracted."}</p>
                    {evidenceResult.persistedMessageId && <span className="tag blue">Sent to admin review</span>}
                  </div>
                )}
              </form>
            )}
          </div>
        </article>
        <article className="panel sales-side-panel">
          <h2>Today&apos;s Beat Plan</h2>
          <div className="task-list">
            {(routeOutlets.length ? routeOutlets : outlets.slice(0, 6)).map((outlet, index) => (
              <article className="task-row" key={outlet.id}>
                <div className="queue-top">
                  <strong>{index + 1}. {outlet.name}</strong>
                  <span className="tag blue">{outlet.channel}</span>
                </div>
                <p>{outlet.city} - {outlet.territory}</p>
                <div className="action-row compact">
                  <button className="link-button" type="button" onClick={() => { setSelectedOutletName(outlet.name); setActiveWorkflow("visit"); }}>Visit</button>
                  <button className="link-button" type="button" onClick={() => { setSelectedOutletName(outlet.name); setActiveWorkflow("order"); }}>Order</button>
                </div>
              </article>
            ))}
          </div>
          <div className="outlet-account-panel">
            <div className="panel-heading">
              <div>
                <h2>Outlet Account</h2>
                <p>Orders, bills, payments, and disputes for the selected retailer.</p>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="salesOutletAccount">Outlet</label>
              <select id="salesOutletAccount" value={selectedOutlet?.name ?? ""} onChange={(event) => setSelectedOutletName(event.target.value)}>
                {outlets.map((outlet) => <option key={outlet.id} value={outlet.name}>{outlet.name}</option>)}
              </select>
            </div>
            {selectedOutlet && (
              <div className="account-snapshot">
                <Field label="Owner" value={selectedOutlet.owner || "Unassigned"} />
                <Field label="Phone" value={selectedOutlet.phone || "No phone"} />
                <Field label="Past orders" value={outletOrders.length} />
                <Field label="Bills" value={outletBills.length} />
                <Field label="Payments" value={outletPayments.length} />
                <Field label="Disputes" value={outletDisputes.length} />
              </div>
            )}
            <div className="mini-ledger">
              {[...outletOrders.map((order) => ({ id: `order-${order.id}`, title: order.sku, meta: `Order - ${money(order.expectedValue)} - ${order.status}` })), ...outletBills.map((bill) => ({ id: `bill-${bill.id}`, title: bill.billNumber, meta: `Bill - ${money(bill.totalAmount)} - ${bill.paymentStatus}` })), ...outletPayments.map((payment) => ({ id: `payment-${payment.id}`, title: payment.paymentMode, meta: `Payment - ${money(payment.amountCollected)} of ${money(payment.amountDue)} - ${payment.status}` }))].slice(0, 8).map((item) => (
                <div className="ledger-row" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
              ))}
              {!outletOrders.length && !outletBills.length && !outletPayments.length && <span className="cart-empty-note">No account history for this outlet yet.</span>}
            </div>
          </div>
          <h2>My Tasks</h2>
          <div className="task-list">
            {tasks.slice(0, 5).map((task) => (
              <article className="task-row" key={task.id}>
                <div className="queue-top">
                  <strong>{task.title}</strong>
                  <span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span>
                </div>
                <p>{task.description}</p>
                <div className="record-meta">
                  <span>{task.outlet}</span>
                  <span>{task.dueDate}</span>
                  <span className="tag">{task.status}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function QueuePanel({ records, selectedId, onSelect }: { records: CommandRecord[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Verification Queue</h2>
          <p>AI extracts retailer and sales-app signals. Ops confirms what becomes official.</p>
        </div>
      </div>
      <div className="queue-list">
        {records.map((record) => (
          <button key={record.id} className={`queue-item ${selectedId === record.id ? "active" : ""}`} onClick={() => onSelect(record.id)}>
            <div className="queue-top">
              <strong>{record.outlet}</strong>
              <span className={`tag ${record.confidence < 0.85 ? "warn" : ""}`}>{confidenceLabel(record)}</span>
            </div>
            <p>{record.message}</p>
            <div className="record-meta">
              <span>{record.partner}</span>
              <span>{record.city}</span>
              <span className="tag blue">{record.status}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecordDetail({ record, onVerify, onSendBack }: { record: CommandRecord; onVerify: (id: string) => void; onSendBack: (id: string) => void }) {
  return (
    <div className="panel detail-panel">
      <h2>Record Detail</h2>
      <div className="record-detail">
        <div>
          <div className="tag-row">
            <span className="tag blue">{record.type}</span>
            <span className={`tag ${record.confidence < 0.85 ? "warn" : ""}`}>{confidenceLabel(record)}</span>
            <span className="tag">{record.status}</span>
          </div>
          <h2>{record.outlet}</h2>
          <p>{record.message}</p>
        </div>
        <div className="field-grid">
          <Field label="Partner" value={record.partner} />
          <Field label="Sales rep / source" value={record.fieldAgent} />
          <Field label="Units" value={record.units} />
          <Field label="Value" value={money(record.value)} />
          <Field label="City" value={record.city} />
          <Field label="Confidence" value={`${Math.round(record.confidence * 100)}%`} />
        </div>
        <div className="evidence-box">{record.evidence}</div>
        <div className="action-row">
          <button className="approve" onClick={() => onVerify(record.id)}>
            Approve
          </button>
          <button className="reject" onClick={() => onSendBack(record.id)}>
            Send Back
          </button>
        </div>
      </div>
    </div>
  );
}

function assignedOwnerForDraft(draft: VerificationDraftRecord) {
  if (draft.recordType === "payment" || draft.recordType === "bill") return "Finance";
  if (draft.recordType === "order" || draft.recordType === "visit" || draft.recordType === "task") return "Operator";
  if (draft.recordType === "outlet") return "Manager";
  return "Admin";
}

function AssignedVerificationQueueView({ currentUser, drafts, records, onSelectDraft, onOpenVerification }: { currentUser: AppUserRow | null; drafts: VerificationDraftRecord[]; records: CommandRecord[]; onSelectDraft: (id: string) => void; onOpenVerification: () => void }) {
  const roleLabel = currentUser?.roleLabel ?? "Admin";
  const ownedDrafts = drafts.filter((draft) => assignedOwnerForDraft(draft) === roleLabel || userAccessKind(currentUser ?? { id: "", name: "", email: "", phone: "", role: "super_admin", roleLabel: "Admin", territory: "", status: "Active" }) === "admin");
  const pendingRecords = records.filter((record) => record.status === "pending" || record.status === "needs clarification");

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Assigned drafts" value={ownedDrafts.length} detail={`${roleLabel} ownership`} />
        <Metric label="Pending signals" value={pendingRecords.length} detail="Retailer and sales-app records" />
        <Metric label="Low confidence" value={drafts.filter((draft) => draft.confidence < 0.75).length} detail="Needs careful review" />
        <Metric label="Queue mode" value="Assigned" detail="Role-routed worklist" />
      </section>
      <section className="admin-command-grid">
        <article className="panel">
          <h2>My Verification Queue</h2>
          <div className="task-list">
            {ownedDrafts.map((draft) => (
              <article className="task-row" key={draft.id}>
                <div className="queue-top"><strong>{draft.title}</strong><span className="tag blue">{assignedOwnerForDraft(draft)}</span></div>
                <p>{draft.reasonForReview}</p>
                <div className="record-meta"><span>{draft.recordType}</span><span>{Math.round(draft.confidence * 100)}%</span><button className="link-button" type="button" onClick={() => { onSelectDraft(draft.id); onOpenVerification(); }}>Review</button></div>
              </article>
            ))}
            {!ownedDrafts.length && <p className="empty-state">No drafts assigned to this role right now.</p>}
          </div>
        </article>
        <article className="panel">
          <h2>Signal Queue</h2>
          <div className="task-list">
            {pendingRecords.slice(0, 8).map((record) => (
              <article className="task-row" key={record.id}>
                <div className="queue-top"><strong>{record.outlet}</strong><span className="tag warn">{record.status}</span></div>
                <p>{record.message}</p>
                <div className="record-meta"><span>{record.partner}</span><span>{Math.round(record.confidence * 100)}%</span></div>
              </article>
            ))}
            {!pendingRecords.length && <p className="empty-state">No pending retailer or field signals.</p>}
          </div>
        </article>
      </section>
    </section>
  );
}

function PendingCorrectionsView({ records, verificationDrafts, payments, bills, orders, outlets }: { records: CommandRecord[]; verificationDrafts: VerificationDraftRecord[]; payments: PaymentRow[]; bills: BillRow[]; orders: OrderRow[]; outlets: OutletRow[] }) {
  const corrections = [
    ...records.filter((record) => record.status === "needs clarification").map((record) => ({ title: record.outlet, type: "Signal correction", detail: record.message, owner: record.fieldAgent })),
    ...verificationDrafts.filter((draft) => draft.status === "Needs review" && draft.confidence < 0.75).map((draft) => ({ title: draft.title, type: "AI correction", detail: draft.reasonForReview, owner: assignedOwnerForDraft(draft) })),
    ...payments.filter((payment) => !payment.billId).map((payment) => ({ title: payment.receiptNumber, type: "Payment correction", detail: "Payment is not linked to a bill.", owner: payment.collectorName })),
    ...bills.filter((bill) => !bill.orderId).map((bill) => ({ title: bill.billNumber, type: "Bill correction", detail: "Bill is not linked to an order.", owner: "Finance" })),
    ...orders.filter((order) => order.expectedDeliveryDate === "No delivery date").map((order) => ({ title: order.outlet, type: "Order correction", detail: `${order.sku} needs delivery date.`, owner: "Ops" })),
    ...outlets.filter((outlet) => outlet.assignedSalesman === "Unassigned" || !outlet.phone).map((outlet) => ({ title: outlet.name, type: "Outlet correction", detail: !outlet.phone ? "Missing phone." : "Missing assigned sales rep.", owner: "Manager" }))
  ];

  return (
    <CrudPanel title="Pending Corrections" description="Clear worklist for records that need data correction, clarification, or missing relationship fixes." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="New Correction" resultCount={corrections.length} totalCount={corrections.length}>
      {corrections.map((correction, index) => (
        <article className="task-row" key={`${correction.type}-${index}`}>
          <div className="queue-top"><strong>{correction.title}</strong><span className="tag warn">{correction.type}</span></div>
          <p>{correction.detail}</p>
          <div className="record-meta"><span>Owner {correction.owner}</span><button className="link-button" type="button">Mark Fixed</button><button className="link-button" type="button">Assign</button></div>
        </article>
      ))}
      {!corrections.length && <p className="empty-state">No pending corrections in the current data load.</p>}
    </CrudPanel>
  );
}

function VerificationWorkbench({
  drafts,
  selectedDraft,
  selectedDraftId,
  notice,
  onSelect,
  onSubmit
}: {
  drafts: VerificationDraftRecord[];
  selectedDraft?: VerificationDraftRecord;
  selectedDraftId: string;
  notice: IntegrationNotice | null;
  onSelect: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, decision: "save" | "approve" | "reject") => void;
}) {
  function submitDraft(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const decision = submitter?.value === "approve" || submitter?.value === "reject" ? submitter.value : "save";
    onSubmit(event, decision);
  }

  return (
    <section className="verification-workbench">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Classification Queue</h2>
            <p>Each extracted message can create multiple editable draft records.</p>
          </div>
          <span className="tag blue">{drafts.length} drafts</span>
        </div>
        <div className="queue-list">
          {drafts.length === 0 ? (
            <div className="empty-state">
              <strong>No pending drafts</strong>
              <span>Upload sales-app evidence or receive retailer WhatsApp messages to create classification drafts.</span>
            </div>
          ) : (
            drafts.map((draft) => (
              <button key={draft.id} className={`queue-item ${selectedDraftId === draft.id ? "active" : ""}`} onClick={() => onSelect(draft.id)}>
                <div className="queue-top">
                  <strong>{draft.title}</strong>
                  <span className={`tag ${draft.confidence < 0.85 ? "warn" : "blue"}`}>{Math.round(draft.confidence * 100)}%</span>
                </div>
                <p>{draft.reasonForReview}</p>
                <div className="record-meta">
              <span>{draft.recordType}</span>
              <span>{draft.primaryCategory}</span>
              <span>{draft.languageDetected}</span>
              <span className="tag">{draft.status}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <h2>Admin Verification</h2>
            <p>Edit the AI draft before it updates visits, payments, orders, tasks, outlets, or competitor intel.</p>
          </div>
        </div>
        {notice && <p className={notice.type === "success" ? "form-success" : "form-error"}>{notice.message}</p>}
        {!selectedDraft ? (
          <div className="empty-state">
            <strong>No draft selected</strong>
            <span>Choose a classification draft from the queue.</span>
          </div>
        ) : (
          <form className="verification-form" onSubmit={submitDraft}>
            <input type="hidden" name="id" value={selectedDraft.id} />
            <div className="tag-row">
              <span className="tag blue">{selectedDraft.primaryCategory}</span>
              <span className="tag">{selectedDraft.languageDetected}</span>
              {selectedDraft.secondaryCategories.map((category) => <span className="tag" key={category}>{category}</span>)}
              <span className={`tag ${selectedDraft.confidence < 0.85 ? "warn" : "blue"}`}>{Math.round(selectedDraft.confidence * 100)}%</span>
            </div>
            <div className="form-grid two">
              <Input name="title" label="Draft title" defaultValue={selectedDraft.title} />
              <Select name="recordType" label="Record to create" options={["visit", "order", "bill", "payment", "outlet", "feedback", "competitor_insight", "stock_update", "delivery_issue", "task"]} defaultValue={selectedDraft.recordType} />
              <Input name="outletName" label="Outlet" defaultValue={selectedDraft.outletName} required={false} />
              <Input name="brandName" label="Brand" defaultValue={selectedDraft.brandName} required={false} />
              <Input name="amount" label="Amount / value" defaultValue={selectedDraft.amount ? String(selectedDraft.amount) : ""} required={false} />
              <Input name="quantity" label="Quantity" defaultValue={selectedDraft.quantity} required={false} />
              <Input name="sku" label="SKU" defaultValue={selectedDraft.sku} required={false} />
              <Input name="dueDate" label="Due / follow-up date" type="date" required={false} />
            </div>
            <div className="form-field">
              <label htmlFor={`notes-${selectedDraft.id}`}>Admin notes / corrected summary</label>
              <textarea id={`notes-${selectedDraft.id}`} name="notes" rows={4} defaultValue={String(selectedDraft.draftJson.notes ?? selectedDraft.draftJson.source_text ?? "")} />
            </div>
            <div className="form-field">
              <label htmlFor={`review-${selectedDraft.id}`}>Review notes</label>
              <textarea id={`review-${selectedDraft.id}`} name="reviewNotes" rows={3} placeholder="Why did you approve, reject, or change this draft?" />
            </div>
            <div className="evidence-split">
              <ResultBlock title="Raw source text" value={selectedDraft.rawText || "No raw text."} />
              <ResultBlock title="English normalized text" value={selectedDraft.normalizedText || "No normalized text."} />
              <ResultBlock title="Transcript / OCR" value={[selectedDraft.transcriptText, selectedDraft.ocrText].filter(Boolean).join("\n\n") || "No machine text."} />
              <ResultBlock title="Entities JSON" value={JSON.stringify(selectedDraft.draftJson, null, 2)} />
            </div>
            <div className="action-row">
              <button className="secondary-button" type="submit" name="decision" value="save">Save Edits</button>
              <button className="approve" type="submit" name="decision" value="approve">Approve & Create Record</button>
              <button className="reject" type="submit" name="decision" value="reject">Reject Draft</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="empty-state refined-empty">
      <strong>{title}</strong>
      <span>{detail}</span>
      {actionLabel && onAction && <button className="secondary-button" type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function AIDraft({ record }: { record: CommandRecord }) {
  return (
    <div className="panel">
      <h2>AI Draft</h2>
      <div className="extractor-card">
        <Field label="Provider" value="ExtractionProvider.extract(message)" />
        <Field label="Detected outlet" value={record.outlet} />
        <Field label="Detected event" value={record.type} />
        <Field label="Confidence" value={`${Math.round(record.confidence * 100)}%`} />
      </div>
    </div>
  );
}

function MediaLabView({ aiProvider }: { aiProvider: AIProviderSettings }) {
  const [result, setResult] = useState<MediaLabResult | null>(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  async function extractMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    const note = String(form.get("note") ?? "").trim();

    if ((!file || file.size === 0) && !note) {
      setError("Upload a file or paste a retailer/sales-app message first.");
      return;
    }

    setError("");
    setResult(null);
    setIsExtracting(true);

    try {
      const response = await fetch("/api/ai/extract-media", {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        const body = await response.text();
        let message = body || `Extraction failed with status ${response.status}.`;

        try {
          const parsed = JSON.parse(body) as { error?: string };
          message = parsed.error || message;
        } catch {
          // Keep the raw response body when the server does not return JSON.
        }

        throw new Error(message);
      }

      setResult((await response.json()) as MediaLabResult);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Extraction failed. Check provider settings and try again.");
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <section className="media-lab-grid">
      <article className="panel media-upload-panel">
        <div className="panel-heading">
          <div>
            <h2>Upload Source Evidence</h2>
            <p>Test retailer WhatsApp media, sales-app visit proof, bill images, PDFs, shelf photos, payment screenshots, or text updates before verification.</p>
          </div>
          <span className={`tag ${aiProvider.status === "Connected" ? "blue" : "warn"}`}>{aiProvider.provider}</span>
        </div>
        <form className="master-form" onSubmit={extractMedia}>
          <div className="media-dropzone">
            <strong>Media file</strong>
            <span>Images, audio, PDF documents, or short videos</span>
            <input name="file" type="file" accept="image/*,audio/*,application/pdf,video/*" />
          </div>
          <div className="form-field">
            <label htmlFor="media-note">Optional source message</label>
            <textarea id="media-note" name="note" rows={6} placeholder="Example: Retailer Raj Stores needs 24 units, payment pending 12400, assign Ramesh from the sales app to follow up tomorrow." />
          </div>
          <div className="form-grid two">
            <Select name="providerMode" label="Extraction provider" options={["Auto", "Sarvam", "OpenAI"]} defaultValue="Auto" />
            <Select
              name="sarvamLanguage"
              label="Input language"
              options={["Auto detect", "Hindi", "Gujarati", "English", "Kannada", "Marathi", "Tamil", "Telugu", "Bengali", "Malayalam", "Punjabi", "Urdu"]}
              defaultValue="Auto detect"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="action-row">
            <button className="approve" type="submit" disabled={isExtracting}>{isExtracting ? "Extracting..." : "Extract Text"}</button>
          </div>
        </form>
      </article>

      <article className="panel media-result-panel">
        <div className="panel-heading">
          <div>
            <h2>Extraction Result</h2>
            <p>Use this to evaluate provider quality before creating verified records from the output.</p>
          </div>
          {result && <span className="tag blue">{result.mediaKind}</span>}
        </div>
        {!result ? (
          <div className="empty-state">
            <strong>No extraction yet</strong>
            <span>Upload evidence on the left to see transcript, OCR, classification, and the structured draft.</span>
          </div>
        ) : (
          <div className="media-result-stack">
            <div className="integration-summary">
              <Field label="File" value={result.fileName} />
              <Field label="Type" value={result.fileType} />
              <Field label="Selected mode" value={result.providerMode || "auto"} />
              <Field label="Input language" value={result.documentLanguage || "Auto detect"} />
              <Field label="Provider" value={result.provider} />
              <Field label="Fallback" value={result.fallbackProvider || "Not used"} />
              <Field label="Model" value={result.model} />
            </div>
            {result.warning && <p className="form-error">{result.warning}</p>}
            {result.persistedMessageId && <p className="form-success">Classification drafts were saved to the admin verification queue. Refresh the page to load the newest queue items.</p>}
            {result.classification && (
              <ResultBlock
                title="Classification"
                value={JSON.stringify({
                  primaryCategory: result.classification.primaryCategory,
                  secondaryCategories: result.classification.secondaryCategories,
                  confidence: result.classification.confidence,
                  languageDetected: result.classification.languageDetected,
                  normalizedText: result.classification.normalizedText,
                  reasonForReview: result.classification.reasonForReview,
                  draftRecords: result.classification.draftRecords
                }, null, 2)}
              />
            )}
            <ResultBlock title="Extracted text" value={result.extractedText || "No text extracted yet."} />
            <ResultBlock title="Voice transcript" value={result.transcriptText || "No voice transcript."} />
            <ResultBlock title="OCR text" value={result.ocrText || "No OCR text."} />
            <ResultBlock title="Image / media classification" value={result.imageClassification || "No classification."} />
            <ResultBlock title="Structured draft" value={JSON.stringify(result.structured, null, 2)} />
          </div>
        )}
      </article>
    </section>
  );
}

function ResultBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="result-block">
      <h3>{title}</h3>
      <pre>{value}</pre>
    </div>
  );
}

function OutletsView({ outlets, onAdd, onEdit, onArchive, onBulkImport }: { outlets: OutletRow[]; onAdd: () => void; onEdit: (outlet: OutletRow) => void; onArchive: (outlet: OutletRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleOutlets = outlets.filter((outlet) =>
    (status === "all" || outlet.status === status) &&
    matchesSearch([outlet.name, outlet.city, outlet.channel, outlet.brand, outlet.territory, outlet.assignedSalesman, outlet.owner, outlet.phone], search)
  );

  return (
    <section className="table-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Outlet Master</h2>
            <p>Verified retailer database with visit, payment, and intelligence context.</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImport}>
              Bulk Import
            </button>
            <button className="primary-button" onClick={onAdd}>
              Add Outlet
            </button>
          </div>
        </div>
        <div className="list-toolbar">
          <label className="toolbar-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search outlet, city, brand, territory, rep" type="search" />
          </label>
          <label className="toolbar-filter">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {uniqueOptions(outlets.map((outlet) => outlet.status)).map((option) => (
                <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
              ))}
            </select>
          </label>
          <span className="toolbar-count">{visibleOutlets.length} of {outlets.length}</span>
        </div>
        <div className="data-table">
          <div className="table-row outlet-row header">
            <span>Outlet</span>
            <span>City</span>
            <span>Channel</span>
            <span>Brand</span>
            <span>Territory</span>
            <span>Sales rep</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {visibleOutlets.map((outlet) => (
            <div className="table-row outlet-row" key={outlet.id}>
              <strong>{outlet.name}</strong>
              <span>{outlet.city}</span>
              <span>{outlet.channel}</span>
              <span>{outlet.brand}</span>
              <span>{outlet.territory}</span>
              <span>{outlet.assignedSalesman}</span>
              <span className={`tag ${outlet.status === "Prospect" ? "warn" : ""}`}>{outlet.status}</span>
              <div className="inline-actions">
                <button className="link-button" onClick={() => onEdit(outlet)}>
                  Edit
                </button>
                {isUuid(outlet.id) && <button className="link-button" onClick={() => onArchive(outlet)}>Archive</button>}
              </div>
            </div>
          ))}
          {!visibleOutlets.length && <p className="empty-state">No outlets match the current filters.</p>}
        </div>
      </div>
    </section>
  );
}

function ProductsView({ skus, onAdd, onEdit, onArchive, onBulkImport }: { skus: SkuRow[]; onAdd: () => void; onEdit: (sku: SkuRow) => void; onArchive: (sku: SkuRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleSkus = skus.filter((sku) =>
    (status === "all" || sku.status === status) &&
    matchesSearch([sku.name, sku.code, sku.brand, sku.category, sku.unit, sku.mrp], search)
  );

  return (
    <CrudPanel
      title="Product Catalog"
      description="A compact SKU catalog for order capture, price checks, pack details, and client movement."
      onAdd={onAdd}
      onBulkImport={onBulkImport}
      addLabel="Add Product"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search product, SKU code, brand, category"
      statusValue={status}
      statusOptions={uniqueOptions(skus.map((sku) => sku.status))}
      onStatusChange={setStatus}
      resultCount={visibleSkus.length}
      totalCount={skus.length}
    >
      <div className="product-market-grid">
        {visibleSkus.map((sku) => (
          <article className="product-card" key={sku.id}>
            <div className="product-media">
              {sku.imageUrl ? (
                <img src={sku.imageUrl} alt={sku.name} loading="lazy" onError={(event) => { event.currentTarget.src = "/brand/nestle-logo.svg"; }} />
              ) : (
                <span>{productImageFallback(sku)}</span>
              )}
            </div>
            <div className="product-card-body">
              <div className="queue-top">
                <span className="tag blue">{sku.brand}</span>
                <div className="product-card-actions">
                  <button className="link-button" onClick={() => onEdit(sku)}>Picture</button>
                  <button className="link-button" onClick={() => onEdit(sku)}>Edit</button>
                  {isUuid(sku.id) && <button className="link-button" onClick={() => onArchive(sku)}>Archive</button>}
                </div>
              </div>
              <h3>{sku.name}</h3>
              <p>{sku.category}</p>
              <div className="product-price-row">
                <strong>{money(sku.mrp)}</strong>
                <span>{sku.unit}</span>
              </div>
              <div className="record-meta">
                <span>{sku.code || "No SKU code"}</span>
                <span className="tag">{sku.status}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleSkus.length && <p className="empty-state">{skus.length ? "No products match the current filters." : "No products or SKUs added yet."}</p>}
    </CrudPanel>
  );
}

function ProcurementFlowView({
  brands,
  procurementOffices,
  materialFlows,
  inventoryPositions,
  purchaseOrders,
  goodsReceipts,
  supplierPayables,
  skus,
  orders,
  bills,
  onAddOffice,
  onEditOffice,
  onAddMovement,
  onEditMovement,
  onAddPurchaseOrder,
  onEditPurchaseOrder,
  onAddGoodsReceipt,
  onEditGoodsReceipt,
  onAddSupplierPayable,
  onEditSupplierPayable,
  onArchive,
  onBulkImportOffice,
  onBulkImportMovement
}: {
  brands: BrandOption[];
  procurementOffices: ProcurementOffice[];
  materialFlows: MaterialFlowRow[];
  inventoryPositions: InventoryPositionRow[];
  purchaseOrders: PurchaseOrderRow[];
  goodsReceipts: GoodsReceiptRow[];
  supplierPayables: SupplierPayableRow[];
  skus: SkuRow[];
  orders: OrderRow[];
  bills: BillRow[];
  onAddOffice: () => void;
  onEditOffice: (office: ProcurementOffice) => void;
  onAddMovement: () => void;
  onEditMovement: (flow: MaterialFlowRow) => void;
  onAddPurchaseOrder: () => void;
  onEditPurchaseOrder: (purchaseOrder: PurchaseOrderRow) => void;
  onAddGoodsReceipt: () => void;
  onEditGoodsReceipt: (receipt: GoodsReceiptRow) => void;
  onAddSupplierPayable: () => void;
  onEditSupplierPayable: (payable: SupplierPayableRow) => void;
  onArchive: (type: Exclude<ModalType, null>, id: string, label: string, impact: string) => void;
  onBulkImportOffice: () => void;
  onBulkImportMovement: () => void;
}) {
  const inboundFlows = materialFlows.filter((flow) => flow.movementType === "Inbound procurement");
  const outboundFlows = materialFlows.filter((flow) => flow.movementType !== "Inbound procurement");
  const totalInboundValue = inboundFlows.reduce((sum, flow) => sum + flow.value, 0);
  const totalOutboundValue = outboundFlows.reduce((sum, flow) => sum + flow.value, 0);
  const pendingPurchaseOrders = purchaseOrders.filter((purchaseOrder) => !["Received", "Cancelled"].includes(purchaseOrder.status));
  const pendingReceipts = goodsReceipts.filter((receipt) => !["Posted", "Cancelled"].includes(receipt.status));
  const openSupplierPayables = supplierPayables.filter((payable) => !["Paid", "Written off"].includes(payable.status));

  return (
    <section className="procurement-layout">
      <article className="panel procurement-hero-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Material movement model</p>
            <h2>Procurement to Distributor to Outlet</h2>
            <p>Track where each brand is procured from, how stock reaches the distributor, and how it moves out through orders and billed dispatches.</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImportOffice}>Import Branches</button>
            <button className="secondary-button" onClick={onBulkImportMovement}>Import Movement</button>
            <button className="secondary-button" onClick={onAddPurchaseOrder}>Add PO</button>
            <button className="secondary-button" onClick={onAddGoodsReceipt}>Add GRN</button>
            <button className="secondary-button" onClick={onAddSupplierPayable}>Add Payable</button>
            <button className="primary-button" onClick={onAddOffice}>Add Branch</button>
            <button className="primary-button" onClick={onAddMovement}>Add Movement</button>
          </div>
        </div>
        <div className="procurement-flow-map">
          <div>
            <span>Brand source</span>
            <strong>Regional HQ / supply office</strong>
            <small>{procurementOffices.length} procurement points</small>
          </div>
          <i />
          <div>
            <span>Distributor</span>
            <strong>Warehouse + billing desk</strong>
            <small>{skus.length} SKU records</small>
          </div>
          <i />
          <div>
            <span>Market</span>
            <strong>Retail outlets</strong>
            <small>{orders.length} orders, {bills.length} bills</small>
          </div>
        </div>
      </article>

      <section className="metrics-grid">
        <Metric label="Procurement offices" value={procurementOffices.length} detail="Regional HQs and alternate sources" />
        <Metric label="Inbound value" value={money(totalInboundValue)} detail="Planned distributor replenishment" />
        <Metric label="Outbound value" value={money(totalOutboundValue)} detail="Orders and billed dispatches" />
        <Metric label="Reorder alerts" value={inventoryPositions.filter((item) => item.status === "Reorder due").length} detail="SKUs below reorder threshold" />
      </section>

      <section className="procurement-status-strip">
        <div>
          <span>Open POs</span>
          <strong>{pendingPurchaseOrders.length}</strong>
          <small>Awaiting confirmation or receipt</small>
        </div>
        <div>
          <span>GRNs in progress</span>
          <strong>{pendingReceipts.length}</strong>
          <small>Draft, received, or quality hold</small>
        </div>
        <div>
          <span>Supplier payables</span>
          <strong>{openSupplierPayables.length}</strong>
          <small>Pending, partial, overdue, or disputed</small>
        </div>
        <div>
          <span>Material movements</span>
          <strong>{materialFlows.length}</strong>
          <small>Inbound and outbound register</small>
        </div>
      </section>

      <section className="procurement-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Brand Procurement Offices</h2>
              <p>Capture the offices the distributor buys from. Large clients can have regional HQs, supply desks, and head-office approval points.</p>
            </div>
          </div>
          <div className="procurement-office-list">
            {procurementOffices.map((office) => (
              <article className="procurement-office-card" key={office.id}>
                <div className="queue-top">
                  <div>
                    <strong>{office.officeName}</strong>
                    <p>{office.brand} - {office.region}</p>
                  </div>
                  <div className="record-meta">
                    <span className={`tag ${office.status === "Primary" ? "green" : ""}`}>{office.status}</span>
                    {isUuid(office.id) && <button className="link-button" onClick={() => onEditOffice(office)}>Edit</button>}
                    {isUuid(office.id) && <button className="link-button" onClick={() => onArchive("procurementOffice", office.id, office.officeName, "The source office will be marked inactive and hidden from active procurement choices.")}>Archive</button>}
                  </div>
                </div>
                <div className="field-grid">
                  <Field label="Location" value={`${office.city}, ${office.state}`} />
                  <Field label="Lead time" value={`${office.leadTimeDays} days`} />
                  <Field label="Mode" value={office.replenishmentMode} />
                  <Field label="Contact" value={office.contact} />
                </div>
                <div className="branch-contact-row">
                  <span>{office.phone || "No phone"}</span>
                  <span>{office.email || "No email"}</span>
                </div>
                <p>{office.procurementRole}</p>
              </article>
            ))}
            {!procurementOffices.length && <p className="empty-state">Add client branches or regional procurement offices to start sourcing from brands.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Material Flow Register</h2>
              <p>Inbound procurement, outbound order movement, and billed dispatches in one operational register.</p>
            </div>
          </div>
          <div className="material-flow-list">
            {materialFlows.map((flow) => (
              <article className="material-flow-row" key={flow.id}>
                <div>
                  <span className="tag blue">{flow.movementType}</span>
                  <strong>{flow.sku}</strong>
                  <small>{flow.brand}{flow.skuCode ? ` - ${flow.skuCode}` : ""}</small>
                </div>
                <div className="flow-route">
                  <span>{flow.fromLocation}</span>
                  <b>to</b>
                  <span>{flow.toLocation}</span>
                </div>
                <div className="flow-value">
                  <strong>{money(flow.value)}</strong>
                  <small>{flow.quantity} units - {flow.status}</small>
                  {isUuid(flow.id) && <button className="link-button" onClick={() => onEditMovement(flow)}>Edit</button>}
                  {isUuid(flow.id) && <button className="link-button" onClick={() => onArchive("materialFlow", flow.id, flow.documentRef || flow.sku, "The movement will be marked archived. Inventory calculations may still need review if this movement affected stock.")}>Archive</button>}
                </div>
              </article>
            ))}
            {!materialFlows.length && <p className="empty-state">Add inbound procurement, outbound sale, billed dispatch, or return movements.</p>}
          </div>
        </article>
      </section>

      <section className="procurement-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory Position</h2>
              <p>Stock calculated from inbound, outbound, billed dispatch, and hold movements.</p>
            </div>
          </div>
          <div className="inventory-list">
            {inventoryPositions.map((item) => (
              <article className="inventory-row" key={item.id}>
                <div>
                  <strong>{item.sku}</strong>
                  <small>{item.brand}{item.skuCode ? ` - ${item.skuCode}` : ""}</small>
                </div>
                <div className="inventory-metrics">
                  <Field label="Available" value={item.available} />
                  <Field label="Reserved" value={item.reserved} />
                  <Field label="Inbound" value={item.inbound} />
                  <Field label="Damaged / hold" value={item.damaged} />
                </div>
                <span className={`tag ${item.status === "Healthy" ? "green" : "warn"}`}>{item.status}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Purchase Order Summary</h2>
              <p>Supplier-side procurement commitments linked to brand branches and source offices.</p>
            </div>
            <button className="secondary-button" onClick={onAddPurchaseOrder}>Create PO</button>
          </div>
          <div className="material-flow-list">
            {purchaseOrders.map((purchaseOrder) => (
              <article className="material-flow-row" key={purchaseOrder.id}>
                <div>
                  <span className="tag blue">{purchaseOrder.status}</span>
                  <strong>{purchaseOrder.poNumber}</strong>
                  <small>{purchaseOrder.brand} - {purchaseOrder.officeName}</small>
                </div>
                <div className="flow-route">
                  <span>{purchaseOrder.officeName}</span>
                  <b>to</b>
                  <span>Distributor warehouse</span>
                </div>
                <div className="flow-value">
                  <strong>{money(purchaseOrder.totalValue)}</strong>
                  <small>{purchaseOrder.expectedDate}</small>
                  {isUuid(purchaseOrder.id) && <button className="link-button" onClick={() => onEditPurchaseOrder(purchaseOrder)}>Edit</button>}
                  {isUuid(purchaseOrder.id) && <button className="link-button" onClick={() => onArchive("purchaseOrder", purchaseOrder.id, purchaseOrder.poNumber, "The purchase order will be cancelled while linked receipts and payables remain visible.")}>Archive</button>}
                </div>
              </article>
            ))}
            {!purchaseOrders.length && <p className="empty-state">Purchase order rows will appear after the procurement schema is seeded or imported.</p>}
          </div>
        </article>
      </section>

      <section className="procurement-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Goods Receipts</h2>
              <p>GRNs confirm stock entering the distributor warehouse and can post inbound movement against SKUs.</p>
            </div>
            <button className="secondary-button" onClick={onAddGoodsReceipt}>Create GRN</button>
          </div>
          <div className="material-flow-list">
            {goodsReceipts.map((receipt) => (
              <article className="material-flow-row" key={receipt.id}>
                <div>
                  <span className="tag green">{receipt.status}</span>
                  <strong>{receipt.receiptNumber}</strong>
                  <small>{receipt.brand} - {receipt.poNumber}</small>
                </div>
                <div className="flow-route">
                  <span>{receipt.officeName}</span>
                  <b>to</b>
                  <span>{receipt.warehouse}</span>
                </div>
                <div className="flow-value">
                  <strong>{receipt.receivedDate}</strong>
                  {isUuid(receipt.id) && <button className="link-button" onClick={() => onEditGoodsReceipt(receipt)}>Edit</button>}
                  {isUuid(receipt.id) && <button className="link-button" onClick={() => onArchive("goodsReceipt", receipt.id, receipt.receiptNumber, "The goods receipt will be cancelled. Review linked inbound movements if stock was already posted.")}>Archive</button>}
                </div>
              </article>
            ))}
            {!goodsReceipts.length && <p className="empty-state">Create a goods receipt when stock arrives from a brand source office.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Supplier Payables</h2>
              <p>Track brand invoices, due dates, partial payments, disputes, and write-offs.</p>
            </div>
            <button className="secondary-button" onClick={onAddSupplierPayable}>Add Payable</button>
          </div>
          <div className="material-flow-list">
            {supplierPayables.map((payable) => (
              <article className="material-flow-row" key={payable.id}>
                <div>
                  <span className={`tag ${payable.status === "Overdue" || payable.status === "Disputed" ? "warn" : "blue"}`}>{payable.status}</span>
                  <strong>{payable.invoiceNumber}</strong>
                  <small>{payable.brand} - {payable.poNumber}</small>
                </div>
                <div className="flow-route">
                  <span>{payable.officeName}</span>
                  <b>due</b>
                  <span>{payable.dueDate}</span>
                </div>
                <div className="flow-value">
                  <strong>{money(Math.max(payable.amountDue - payable.amountPaid, 0))}</strong>
                  <small>{money(payable.amountPaid)} paid of {money(payable.amountDue)}</small>
                  {isUuid(payable.id) && <button className="link-button" onClick={() => onEditSupplierPayable(payable)}>Edit</button>}
                  {isUuid(payable.id) && <button className="link-button" onClick={() => onArchive("supplierPayable", payable.id, payable.invoiceNumber, "The supplier payable will be written off and remain in finance history.")}>Archive</button>}
                </div>
              </article>
            ))}
            {!supplierPayables.length && <p className="empty-state">Supplier invoice and payment obligations will appear here.</p>}
          </div>
        </article>
      </section>
    </section>
  );
}

function PartnersView({
  brands,
  procurementOffices,
  skus,
  outlets,
  records,
  materialFlows,
  tasks,
  payments,
  orders,
  bills,
  partnerFilter,
  onFilter,
  canManage,
  currentUser,
  onAdd,
  onAddSku,
  onEdit,
  onArchive,
  onBulkImport
}: {
  brands: BrandOption[];
  procurementOffices: ProcurementOffice[];
  skus: SkuRow[];
  outlets: OutletRow[];
  records: CommandRecord[];
  materialFlows: MaterialFlowRow[];
  tasks: TaskRow[];
  payments: PaymentRow[];
  orders: OrderRow[];
  bills: BillRow[];
  partnerFilter: string;
  onFilter: (value: string) => void;
  canManage: boolean;
  currentUser: AppUserRow;
  onAdd: () => void;
  onAddSku: () => void;
  onEdit: (brand: BrandOption) => void;
  onArchive: (brand: BrandOption) => void;
  onBulkImport: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [partnerQuestions, setPartnerQuestions] = useState<Array<{ id: string; brand: string; question: string; status: string; createdAt: string }>>([
    { id: "pq-1", brand: "Nestle", question: "Please confirm the next South Regional HQ dispatch date for Maggi top-up stock.", status: "Open", createdAt: "2026-06-06" }
  ]);
  const partnerDefaultBrand = brands.find((brand) => brand.name.toLowerCase().includes("nestle")) ?? brands[0];
  const effectivePartnerFilter = canManage ? partnerFilter : partnerFilter === "all" ? partnerDefaultBrand?.name ?? "all" : partnerFilter;
  const partnerBrands = brands.filter((brand) => canManage || brand.name === effectivePartnerFilter);
  const selectedBrandNames = (effectivePartnerFilter === "all" ? partnerBrands : partnerBrands.filter((brand) => brand.name === effectivePartnerFilter)).map((brand) => brand.name);
  const activeScope = effectivePartnerFilter === "all" ? "All approved client scopes" : effectivePartnerFilter;
  const scopedRecords = records.filter((record) => selectedBrandNames.includes(record.partner));
  const scopedSkus = skus.filter((sku) => selectedBrandNames.includes(sku.brand));
  const scopedOutlets = outlets.filter((outlet) => selectedBrandNames.includes(outlet.brand));
  const scopedFlows = materialFlows.filter((flow) => selectedBrandNames.includes(flow.brand));
  const scopedTasks = tasks.filter((task) => selectedBrandNames.includes(task.brand));
  const scopedPayments = payments.filter((payment) => selectedBrandNames.includes(payment.brand));
  const scopedOrders = orders.filter((order) => selectedBrandNames.includes(order.brand));
  const scopedBills = bills.filter((bill) => selectedBrandNames.includes(bill.brand));
  const issueTasks = scopedTasks.filter((task) => /complaint|issue|dispute|stockout|short|damage/i.test(`${task.title} ${task.description} ${task.taskType}`) || ["High", "Critical"].includes(task.priority));
  const issueRecords = scopedRecords.filter((record) => record.type === "Stockout" || record.status === "needs clarification");
  const reportCards = [
    { title: "Weekly Brand Review", metric: money(scopedRecords.reduce((sum, record) => sum + record.value, 0)), detail: `${scopedRecords.length} verified signals across ${scopedOutlets.length} outlets`, rows: scopedRecords.map((record) => [record.partner, record.outlet, record.city, record.type, record.units, record.value, record.createdAt]) },
    { title: "SKU Movement", metric: `${scopedFlows.reduce((sum, flow) => sum + flow.quantity, 0)} units`, detail: `${scopedFlows.length} inbound, outbound, dispatch, and hold events`, rows: scopedFlows.map((flow) => [flow.brand, flow.skuCode, flow.sku, flow.movementType, flow.fromLocation, flow.toLocation, flow.quantity, flow.status, flow.documentRef]) },
    { title: "Collections Snapshot", metric: money(scopedPayments.reduce((sum, payment) => sum + pendingPaymentAmount(payment), 0)), detail: `${scopedBills.length} bills and ${scopedPayments.length} payment records`, rows: scopedPayments.map((payment) => [payment.brand, payment.outlet, payment.billNumber, payment.amountDue, payment.amountCollected, payment.status, payment.disputeStatus, payment.settlementStatus]) },
    { title: "Issue Summary", metric: `${issueTasks.length + issueRecords.length} open signals`, detail: "Complaints, disputes, stockouts, high priority tasks", rows: [...issueTasks.map((task) => [task.brand, task.outlet, task.title, task.priority, task.status, task.dueDate]), ...issueRecords.map((record) => [record.partner, record.outlet, record.type, record.status, record.createdAt, record.message])] }
  ];
  const timeline = reportCards.map((card, index) => ({ ...card, sharedAt: ["2026-06-06", "2026-06-05", "2026-06-04", "2026-06-03"][index], audience: activeScope }));

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = commentText.trim();
    if (!question) return;
    setPartnerQuestions((current) => [{ id: `pq-${Date.now()}`, brand: activeScope, question, status: "Open", createdAt: new Date().toISOString().slice(0, 10) }, ...current]);
    setCommentText("");
  }

  return (
    <>
      <section className="partner-header">
        <div>
          <p className="eyebrow">Verified data only</p>
          <h2>Brand Partner Dashboard</h2>
          {!canManage && <p className="partner-access-note">Signed in as {currentUser.name}. Showing partner-safe verified data and export-ready reporting only.</p>}
        </div>
        <div className="panel-actions">
          <select value={effectivePartnerFilter} onChange={(event) => onFilter(event.target.value)} disabled={!canManage}>
            {canManage && <option value="all">All partners</option>}
            {(canManage ? brands : partnerBrands).map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
          {canManage ? (
            <>
              <button className="secondary-button" onClick={onBulkImport}>
                Bulk Import
              </button>
              <button className="secondary-button" onClick={onAddSku}>
                Add Product
              </button>
              <button className="primary-button" onClick={onAdd}>
                Add Client
              </button>
            </>
          ) : (
            <span className="tag blue">Read-only partner access</span>
          )}
        </div>
      </section>
      <section className="partner-scope-panel">
        <div>
          <p className="eyebrow">Approved partner scope</p>
          <h3>{activeScope}</h3>
          <p>Only approved reports and verified records are visible here. Drafts, rejected corrections, internal notes, and unverified retailer messages remain hidden from partner access.</p>
        </div>
        <div className="scope-metrics">
          <Field label="Approved reports" value={reportCards.length} />
          <Field label="Verified outlets" value={scopedOutlets.length} />
          <Field label="SKUs in scope" value={scopedSkus.length} />
          <Field label="Shared timeline" value={`${timeline.length} items`} />
        </div>
      </section>
      <section className="partner-report-grid">
        {reportCards.map((report) => (
          <article className="module-card partner-report-card" key={report.title}>
            <div className="queue-top">
              <div>
                <h3>{report.title}</h3>
                <p>{report.detail}</p>
              </div>
              <span className="tag green">Approved</span>
            </div>
            <strong className="report-metric">{report.metric}</strong>
            <div className="record-meta">
              <span>{activeScope}</span>
              <span>Partner-safe export</span>
              <button className="link-button" type="button" onClick={() => downloadCsvFile(`${report.title.toLowerCase().replace(/\s+/g, "-")}.csv`, ["brand", "entity", "detail", "type", "quantity", "value", "status", "reference"], report.rows)}>
                Download
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="partner-grid">
        {brands
          .filter((brand) => selectedBrandNames.includes(brand.name))
          .map((brand) => {
            const brandRecords = records.filter((record) => record.partner === brand.name);
            const brandSkus = skus.filter((sku) => sku.brand === brand.name);
            const units = brandRecords.reduce((sum, record) => sum + record.units, 0);
            const value = brandRecords.reduce((sum, record) => sum + record.value, 0);
            const logo = brandLogo(brand);
            const brandOffices = procurementOffices.filter((office) => office.brand === brand.name);
            return (
              <article className="partner-card" key={brand.id}>
                <div className="queue-top">
                  <div className="brand-lockup">
                    {logo ? <img src={logo} alt={`${brand.name} logo`} /> : <span>{brand.name.slice(0, 1)}</span>}
                    <h2>{brand.name}</h2>
                  </div>
                  {canManage && (
                    <div className="inline-actions">
                      <button className="link-button" onClick={() => onEdit(brand)}>Edit</button>
                      {isUuid(brand.id) && <button className="link-button" onClick={() => onArchive(brand)}>Archive</button>}
                    </div>
                  )}
                </div>
                <p>{brand.category} client managed by {brand.contact}</p>
                <div className="procurement-office-strip">
                  {(brandOffices.length ? brandOffices : [{
                    id: `${brand.id}-capture`,
                    officeName: "Procurement office not captured",
                    city: "Add client details",
                    region: "Pending",
                    status: "Inactive" as const
                  }]).slice(0, 3).map((office) => (
                    <span key={office.id}>
                      <strong>{office.officeName}</strong>
                      {office.city} - {office.region}
                    </span>
                  ))}
                </div>
                <div className="field-grid">
                  <Field label="Verified outlets" value={brandRecords.length} />
                  <Field label="Sales" value={money(value)} />
                  <Field label="Units" value={units} />
                  <Field label="Products / SKUs" value={brandSkus.length} />
                  <Field label="Source offices" value={brandOffices.length || 1} />
                  <Field label="Status" value={brand.status} />
                </div>
              </article>
            );
          })}
      </section>
      <section className="admin-command-grid partner-ops-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Comments to Distributor</h2>
              <p>Partner questions are tracked as open distributor follow-ups, separate from internal edit access.</p>
            </div>
          </div>
          <form className="partner-question-form" onSubmit={submitQuestion}>
            <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Ask about dispatches, outlet issues, SKU movement, or shared report data" />
            <button className="primary-button" type="submit">Send Question</button>
          </form>
          <div className="task-list">
            {partnerQuestions.filter((question) => question.brand === activeScope || question.brand === "Nestle" || activeScope === "All approved client scopes").map((question) => (
              <article className="task-row" key={question.id}>
                <div className="queue-top"><strong>{question.brand}</strong><span className="tag warn">{question.status}</span></div>
                <p>{question.question}</p>
                <div className="record-meta"><span>{question.createdAt}</span><span>Distributor response pending</span></div>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Shared Report Timeline</h2>
          <div className="signal-list">
            {timeline.map((item) => (
              <article className="signal-row" key={`${item.title}-${item.sharedAt}`}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.audience} - shared {item.sharedAt}</span>
                </div>
                <button className="link-button" type="button" onClick={() => downloadCsvFile(`${item.title.toLowerCase().replace(/\s+/g, "-")}-${item.sharedAt}.csv`, ["brand", "entity", "detail", "type", "quantity", "value", "status", "reference"], item.rows)}>
                  Download
                </button>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>SKU Movement by Branch / Territory</h2>
          <div className="data-table partner-movement-table">
            {scopedFlows.slice(0, 8).map((flow) => (
              <div className="table-row partner-movement-row" key={flow.id}>
                <strong>{flow.sku}</strong>
                <span>{flow.skuCode}</span>
                <span>{flow.fromLocation}</span>
                <span>{flow.toLocation}</span>
                <span>{flow.quantity} units</span>
                <span className="tag blue">{flow.status}</span>
              </div>
            ))}
            {!scopedFlows.length && <p className="empty-state">No approved SKU movement records in this partner scope yet.</p>}
          </div>
        </article>
        <article className="panel">
          <h2>Issue / Complaint Summary</h2>
          <div className="task-list">
            {issueTasks.slice(0, 5).map((task) => (
              <article className="task-row" key={task.id}>
                <div className="queue-top"><strong>{task.title}</strong><span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span></div>
                <p>{task.description}</p>
                <div className="record-meta"><span>{task.outlet}</span><span>{task.status}</span><span>{task.dueDate}</span></div>
              </article>
            ))}
            {issueRecords.slice(0, 4).map((record) => (
              <article className="task-row" key={record.id}>
                <div className="queue-top"><strong>{record.outlet}</strong><span className="tag warn">{record.type}</span></div>
                <p>{record.message}</p>
                <div className="record-meta"><span>{record.city}</span><span>{record.createdAt}</span><span>{confidenceLabel(record)}</span></div>
              </article>
            ))}
            {!issueTasks.length && !issueRecords.length && <p className="empty-state">No approved issue, complaint, dispute, or stockout signals in scope.</p>}
          </div>
        </article>
      </section>
    </>
  );
}

function OpsView({ salesmen, onAdd, onEdit, onBulkImport }: { salesmen: SalesmanRow[]; onAdd: () => void; onEdit: (person: SalesmanRow) => void; onBulkImport: () => void }) {
  return (
    <section className="ops-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Sales App Users</h2>
            <p>Sales reps mapped to territories. They use the app for visits, orders, payments, tasks, and market notes.</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImport}>
              Bulk Import
            </button>
            <button className="primary-button" onClick={onAdd}>
              Add Sales Rep
            </button>
          </div>
        </div>
        <div className="data-table">
          {salesmen.map((person) => (
            <div className="table-row salesman" key={person.id}>
              <strong>{person.name}</strong>
              <span>{person.phone}</span>
              <span>{person.territory}, {person.city}</span>
              <span className="tag">{person.status}</span>
              <button className="link-button" onClick={() => onEdit(person)}>
                Edit
              </button>
            </div>
          ))}
        </div>
      </article>
      <article className="panel">
        <h2>Operating Model</h2>
        <ul className="clean-list">
          <li><strong>Central ERP / CRM:</strong> source of truth for clients, outlets, visits, orders, bills, payments, tasks, and reports.</li>
          <li><strong>Sales App:</strong> rep-facing workflow for beat visits, order capture, payment follow-up, outlet onboarding, and evidence upload.</li>
          <li><strong>Retailer WhatsApp:</strong> retailer-facing channel for orders, payment screenshots, complaints, stock requests, and scheme questions.</li>
          <li><strong>Admin Verification:</strong> AI extraction and human review before records become official or partner-visible.</li>
          <li><strong>Brand Partners:</strong> verified dashboards, exports, and approved reports only.</li>
        </ul>
      </article>
    </section>
  );
}

function UsersView({ users, onAdd, onEdit, onBulkImport }: { users: AppUserRow[]; onAdd: () => void; onEdit: (user: AppUserRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const visibleUsers = users.filter((user) =>
    (status === "all" || user.status === status) &&
    (role === "all" || user.roleLabel === role) &&
    matchesSearch([user.name, user.email, user.phone, user.roleLabel, user.territory], search)
  );
  const activeUsers = users.filter((user) => user.status === "Active").length;
  const fieldUsers = users.filter((user) => user.role === "field_executive").length;

  return (
    <section className="distribution-dashboard">
      <section className="access-summary-grid">
        <Metric label="Active users" value={activeUsers} detail={`${users.length} total login records`} />
        <Metric label="Field team" value={fieldUsers} detail="Sales app users" />
        <Metric label="Brand access" value={users.filter((user) => user.role.includes("brand_partner")).length} detail="Partner-facing accounts" />
        <Metric label="Inactive" value={users.length - activeUsers} detail="Archived or paused access" />
      </section>
      <CrudPanel title="Users & Login Access" description="Operational account directory for admin, manager, field, finance, integration, and partner access." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add User" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search name, email, phone, role, territory" statusValue={status} statusOptions={uniqueOptions(users.map((user) => user.status))} onStatusChange={setStatus} resultCount={visibleUsers.length} totalCount={users.length}>
        <div className="segmented-filter" aria-label="Role filter">
          {uniqueOptions(users.map((user) => user.roleLabel)).map((option) => (
            <button key={option} className={role === option ? "active" : ""} type="button" onClick={() => setRole(option)}>
              {option === "all" ? "All roles" : option}
            </button>
          ))}
        </div>
        {visibleUsers.map((user) => (
          <article className="access-row" key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email || "No email"} - {user.phone || "No phone"}</p>
            </div>
            <div className="access-scope">
              <span className="tag blue">{user.roleLabel}</span>
              <span>{user.territory}</span>
            </div>
            <div className="inline-actions">
              <span className={`tag ${user.status === "Active" ? "green" : "warn"}`}>{user.status}</span>
              <button className="link-button" onClick={() => onEdit(user)}>Edit</button>
            </div>
          </article>
        ))}
        {!visibleUsers.length && <EmptyState title="No users match the current filters." detail="Clear the role, status, or search filter to review the full access directory." />}
      </CrudPanel>
    </section>
  );
}

function TasksView({ tasks, payments, onAdd, onEdit, onBulkImport }: { tasks: TaskRow[]; payments: PaymentRow[]; onAdd: () => void; onEdit: (task: TaskRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleTasks = tasks.filter((task) =>
    (status === "all" || task.status === status) &&
    matchesSearch([task.title, task.description, task.taskType, task.assignedTo, task.outlet, task.brand, task.priority, task.dueDate], search)
  );
  const paymentRisks = payments.filter((payment) => ["High", "Critical"].includes(payment.riskLevel) || ["Overdue", "Disputed"].includes(payment.status));

  return (
    <section className="ops-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Tasks & Follow-Ups</h2>
            <p>Manual and AI-created follow-ups for payments, orders, complaints, and sales action.</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImport}>
              Bulk Import
            </button>
            <button className="primary-button" onClick={onAdd}>
              Create Task
            </button>
          </div>
        </div>
        <div className="list-toolbar">
          <label className="toolbar-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search task, outlet, brand, owner" type="search" />
          </label>
          <label className="toolbar-filter">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {uniqueOptions(tasks.map((task) => task.status)).map((option) => (
                <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
              ))}
            </select>
          </label>
          <span className="toolbar-count">{visibleTasks.length} of {tasks.length}</span>
        </div>
        <div className="task-list">
          {visibleTasks.map((task) => (
            <article className="task-row" key={task.id}>
              <div className="queue-top">
                <strong>{task.title}</strong>
                <div className="inline-actions">
                  <span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span>
                  <button className="link-button" onClick={() => onEdit(task)}>
                    Edit
                  </button>
                </div>
              </div>
              <p>{task.description}</p>
              <div className="record-meta">
                <span>{task.assignedTo}</span>
                <span>{task.outlet}</span>
                <span>{task.brand}</span>
                <span>{task.dueDate}</span>
                <span className="tag blue">{task.status}</span>
              </div>
            </article>
          ))}
          {!visibleTasks.length && <p className="empty-state">No tasks match the current filters.</p>}
        </div>
      </article>
      <article className="panel">
        <h2>Payment Risk Queue</h2>
        <div className="task-list">
          {paymentRisks.slice(0, 6).map((payment) => (
            <article className="task-row" key={payment.id}>
              <div className="queue-top">
                <strong>{payment.outlet}</strong>
                <span className="tag warn">{payment.riskLevel}</span>
              </div>
              <p>{payment.brand} - {money(Math.max(payment.amountDue - payment.amountCollected, 0))} pending</p>
              <div className="record-meta">
                <span>{payment.status}</span>
                <span>Due {payment.dueDate}</span>
              </div>
            </article>
          ))}
          {!paymentRisks.length && <p className="empty-state">No high-risk payment records.</p>}
        </div>
      </article>
    </section>
  );
}

function TerritoriesView({ territories, onAdd, onEdit, onBulkImport }: { territories: TerritoryRow[]; onAdd: () => void; onEdit: (territory: TerritoryRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleTerritories = territories.filter((territory) =>
    (status === "all" || territory.status === status) &&
    matchesSearch([territory.name, territory.city, territory.state, territory.region], search)
  );

  return (
    <CrudPanel title="Territory Master" description="Cities, beats, and market expansion zones." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Territory" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search territory, city, state, region" statusValue={status} statusOptions={uniqueOptions(territories.map((territory) => territory.status))} onStatusChange={setStatus} resultCount={visibleTerritories.length} totalCount={territories.length}>
      {visibleTerritories.map((territory) => (
        <article className="task-row" key={territory.id}>
          <div className="queue-top">
            <strong>{territory.name}</strong>
            <button className="link-button" onClick={() => onEdit(territory)}>Edit</button>
          </div>
          <div className="record-meta">
            <span>{territory.city}</span>
            <span>{territory.state}</span>
            <span>{territory.region}</span>
            <span className="tag blue">{territory.status}</span>
          </div>
        </article>
      ))}
      {!visibleTerritories.length && <p className="empty-state">No territories match the current filters.</p>}
    </CrudPanel>
  );
}

function PaymentsView({ payments, onAdd, onEdit, onArchive, onBulkImport }: { payments: PaymentRow[]; onAdd: () => void; onEdit: (payment: PaymentRow) => void; onArchive: (payment: PaymentRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visiblePayments = payments.filter((payment) =>
    (status === "all" || payment.status === status) &&
    matchesSearch([payment.outlet, payment.brand, payment.billNumber, payment.receiptNumber, payment.collectorName, payment.amountDue, payment.amountCollected, payment.dueDate, payment.promisedPaymentDate, payment.paymentMode, payment.riskLevel, payment.settlementReference], search)
  );

  return (
    <CrudPanel title="Payment Tracker" description="Invoice-linked collections with receipts, allocation, collector ownership, approvals, disputes, and settlement reconciliation." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Payment" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search outlet, invoice, receipt, collector, settlement ref" statusValue={status} statusOptions={uniqueOptions(payments.map((payment) => payment.status))} onStatusChange={setStatus} resultCount={visiblePayments.length} totalCount={payments.length}>
      {visiblePayments.map((payment) => (
        <article className="task-row" key={payment.id}>
          <div className="queue-top">
            <strong>{payment.receiptNumber}</strong>
            <div className="inline-actions">
              <span className={`tag ${payment.riskLevel === "High" || payment.riskLevel === "Critical" ? "warn" : "blue"}`}>{payment.riskLevel}</span>
              <button className="link-button" onClick={() => onEdit(payment)}>Edit</button>
              {isUuid(payment.id) && <button className="link-button" onClick={() => onArchive(payment)}>Archive</button>}
            </div>
          </div>
          <p>{payment.outlet} - {payment.brand} - invoice {payment.billNumber}</p>
          <div className="record-meta">
            <span>{money(payment.amountCollected)} of {money(payment.amountDue)}</span>
            <span>Due {payment.dueDate}</span>
            <span>Collector {payment.collectorName}</span>
            <span>{payment.paymentMode}</span>
            <span>Settlement {payment.settlementStatus}</span>
            <span>Dispute {payment.disputeStatus}</span>
            <span>Write-off {payment.writeOffStatus}</span>
            <span className="tag blue">{payment.status}</span>
          </div>
          {payment.allocationSummary && <p className="muted-detail">Allocation: {payment.allocationSummary}</p>}
        </article>
      ))}
      {!visiblePayments.length && <p className="empty-state">No payments match the current filters.</p>}
    </CrudPanel>
  );
}

function OrdersView({ orders, onAdd, onEdit, onArchive, onBulkImport }: { orders: OrderRow[]; onAdd: () => void; onEdit: (order: OrderRow) => void; onArchive: (order: OrderRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleOrders = orders.filter((order) =>
    (status === "all" || order.status === status) &&
    matchesSearch([order.outlet, order.brand, order.sku, order.skuCode, order.quantity, order.expectedValue, order.expectedDeliveryDate], search)
  );

  return (
    <CrudPanel title="Orders" description="Outlet order intents captured by product/SKU, with brand derived from the SKU master." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Order" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search outlet, SKU, brand, delivery date" statusValue={status} statusOptions={uniqueOptions(orders.map((order) => order.status))} onStatusChange={setStatus} resultCount={visibleOrders.length} totalCount={orders.length}>
      {visibleOrders.map((order) => (
        <article className="task-row" key={order.id}>
          <div className="queue-top">
            <strong>{order.outlet}</strong>
            <div className="inline-actions">
              <button className="link-button" onClick={() => onEdit(order)}>Edit</button>
              {isUuid(order.id) && <button className="link-button" onClick={() => onArchive(order)}>Archive</button>}
            </div>
          </div>
          <p>{order.sku}{order.skuCode ? ` (${order.skuCode})` : ""} - {order.brand}</p>
          <div className="record-meta">
            <span>{order.quantity || 0} units</span>
            <span>{money(order.expectedValue)}</span>
            <span>Delivery {order.expectedDeliveryDate}</span>
            <span className="tag blue">{order.status}</span>
          </div>
        </article>
      ))}
      {!visibleOrders.length && <p className="empty-state">No orders match the current filters.</p>}
    </CrudPanel>
  );
}

function BillsView({ bills, onAdd, onEdit, onArchive, onBulkImport }: { bills: BillRow[]; onAdd: () => void; onEdit: (bill: BillRow) => void; onArchive: (bill: BillRow) => void; onBulkImport: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleBills = bills.filter((bill) =>
    (status === "all" || bill.paymentStatus === status) &&
    matchesSearch([bill.billNumber, bill.outlet, bill.brand, bill.billDate, bill.totalAmount], search)
  );

  return (
    <CrudPanel title="Bills" description="Invoice records captured from sales-app updates, retailer WhatsApp, photos, or admin entry." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Bill" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search bill, outlet, brand, date" statusValue={status} statusOptions={uniqueOptions(bills.map((bill) => bill.paymentStatus))} onStatusChange={setStatus} resultCount={visibleBills.length} totalCount={bills.length}>
      {visibleBills.map((bill) => (
        <article className="task-row" key={bill.id}>
          <div className="queue-top">
            <strong>{bill.billNumber}</strong>
            <div className="inline-actions">
              <button className="link-button" onClick={() => onEdit(bill)}>Edit</button>
              {isUuid(bill.id) && <button className="link-button" onClick={() => onArchive(bill)}>Archive</button>}
            </div>
          </div>
          <p>{bill.outlet} - {bill.brand}</p>
          <div className="record-meta">
            <span>{bill.billDate}</span>
            <span>{money(bill.totalAmount)}</span>
            {bill.orderId && <span>Order linked</span>}
            {bill.billImagePath && <span>Image attached</span>}
            <span className="tag blue">{bill.paymentStatus}</span>
          </div>
        </article>
      ))}
      {!visibleBills.length && <p className="empty-state">No bills match the current filters.</p>}
    </CrudPanel>
  );
}

function FinanceView({
  payments,
  tasks,
  outlets,
  salesmen,
  onAddPayment,
  onCreateTask,
  onBulkImport
}: {
  payments: PaymentRow[];
  tasks: TaskRow[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  onAddPayment: () => void;
  onCreateTask: () => void;
  onBulkImport: () => void;
}) {
  const totalDue = payments.reduce((total, payment) => total + payment.amountDue, 0);
  const totalCollected = payments.reduce((total, payment) => total + payment.amountCollected, 0);
  const outstanding = payments.reduce((total, payment) => total + Math.max(payment.amountDue - payment.amountCollected, 0), 0);
  const overdue = payments.filter((payment) => payment.status === "Overdue" || payment.riskLevel === "High" || payment.riskLevel === "Critical");
  const promises = payments.filter((payment) => payment.promisedPaymentDate && payment.promisedPaymentDate !== "No promise");
  const disputed = payments.filter((payment) => payment.status === "Disputed" || payment.disputeStatus !== "Not disputed");
  const writeOffQueue = payments.filter((payment) => payment.writeOffStatus === "Requested");
  const unreconciled = payments.filter((payment) => payment.amountCollected > 0 && payment.settlementStatus !== "Settled" && payment.settlementStatus !== "Matched");
  const creditHoldOutlets = outlets.filter((outlet) => outlet.creditHoldStatus !== "Clear");
  const paymentTasks = tasks.filter((task) => task.taskType.toLowerCase().includes("payment") || task.title.toLowerCase().includes("payment"));
  const outletByName = new Map(outlets.map((outlet) => [outlet.name, outlet]));
  const today = new Date();
  const pendingAmount = (payment: PaymentRow) => Math.max(payment.amountDue - payment.amountCollected, 0);
  const daysPastDue = (dateText: string) => {
    const due = new Date(dateText);
    if (Number.isNaN(due.getTime())) return 0;
    return Math.max(Math.floor((today.getTime() - due.getTime()) / 86400000), 0);
  };
  const agingBuckets = [
    { label: "0-7 days", payments: payments.filter((payment) => pendingAmount(payment) > 0 && daysPastDue(payment.dueDate) <= 7) },
    { label: "8-15 days", payments: payments.filter((payment) => pendingAmount(payment) > 0 && daysPastDue(payment.dueDate) >= 8 && daysPastDue(payment.dueDate) <= 15) },
    { label: "16-30 days", payments: payments.filter((payment) => pendingAmount(payment) > 0 && daysPastDue(payment.dueDate) >= 16 && daysPastDue(payment.dueDate) <= 30) },
    { label: "30+ days", payments: payments.filter((payment) => pendingAmount(payment) > 0 && daysPastDue(payment.dueDate) > 30) }
  ];

  const collectionByRep = salesmen.map((person) => {
    const repOutlets = outlets.filter((outlet) => outlet.assignedSalesman === person.name).map((outlet) => outlet.name);
    const repPayments = payments.filter((payment) => repOutlets.includes(payment.outlet));
    const collected = repPayments.reduce((total, payment) => total + payment.amountCollected, 0);
    const pending = repPayments.reduce((total, payment) => total + Math.max(payment.amountDue - payment.amountCollected, 0), 0);
    return { name: person.name, collected, pending };
  }).filter((person) => person.collected || person.pending);

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Total receivables" value={money(totalDue)} detail={`${payments.length} payment records`} />
        <Metric label="Collected" value={money(totalCollected)} detail="Updated in CRM" />
        <Metric label="Outstanding" value={money(outstanding)} detail={`${overdue.length} high-risk accounts`} />
        <Metric label="Unreconciled" value={unreconciled.length} detail="Bank, UPI, or cash settlement checks" />
      </section>

      <section className="finance-aging-grid">
        {agingBuckets.map((bucket) => (
          <article className="finance-aging-card" key={bucket.label}>
            <span>{bucket.label}</span>
            <strong>{money(bucket.payments.reduce((sum, payment) => sum + pendingAmount(payment), 0))}</strong>
            <small>{bucket.payments.length} accounts</small>
          </article>
        ))}
      </section>

      <section className="admin-command-grid">
        <article className="panel command-actions-panel">
          <div className="panel-heading">
            <div>
              <h2>Collections Actions</h2>
              <p>Record collections, create follow-ups, and import receivable updates.</p>
            </div>
          </div>
          <div className="admin-action-grid">
            <button className="primary-button" onClick={onAddPayment}>Add Payment</button>
            <button className="secondary-button" onClick={onCreateTask}>Create Follow-Up</button>
            <button className="secondary-button" onClick={onBulkImport}>Bulk Import Payments</button>
          </div>
        </article>

        <article className="panel">
          <h2>High-Risk Accounts</h2>
          <div className="task-list compact-list">
            {overdue.slice(0, 6).map((payment) => (
              <article className="task-row compact-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.outlet}</strong>
                  <span className="tag warn">{payment.riskLevel}</span>
                </div>
                <p>{payment.brand} - {money(Math.max(payment.amountDue - payment.amountCollected, 0))} pending</p>
                <div className="record-meta">
                  <span>{outletByName.get(payment.outlet)?.city ?? "No city"}</span>
                  <span>{payment.status}</span>
                </div>
              </article>
            ))}
            {!overdue.length && <p className="empty-state">No overdue or high-risk accounts.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Collection By Sales Rep</h2>
          <div className="signal-list">
            {collectionByRep.slice(0, 6).map((person) => (
              <article className="signal-row" key={person.name}>
                <div>
                  <strong>{person.name}</strong>
                  <span>{money(person.collected)} collected</span>
                </div>
                <span className="tag warn">{money(person.pending)} pending</span>
              </article>
            ))}
            {!collectionByRep.length && <p className="empty-state">Assign outlets to sales reps to see collection ownership.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Control Queue</h2>
          <div className="finance-control-grid">
            <Field label="Write-off approvals" value={writeOffQueue.length} />
            <Field label="Active disputes" value={disputed.length} />
            <Field label="Credit holds" value={creditHoldOutlets.length} />
            <Field label="Promises" value={promises.length} />
          </div>
        </article>

        <article className="panel">
          <h2>Dispute Resolution</h2>
          <div className="task-list compact-list">
            {disputed.slice(0, 6).map((payment) => (
              <article className="task-row compact-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.outlet}</strong>
                  <span className="tag warn">Disputed</span>
                </div>
                <p>{payment.brand} - {money(pendingAmount(payment))} pending reconciliation</p>
                <div className="record-meta">
                  <span>Due {payment.dueDate}</span>
                  <span>{payment.disputeStatus}</span>
                  <span>{payment.paymentMode}</span>
                </div>
              </article>
            ))}
            {!disputed.length && <p className="empty-state">No disputed payments requiring resolution.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Settlement Reconciliation</h2>
          <div className="task-list compact-list">
            {unreconciled.slice(0, 6).map((payment) => (
              <article className="task-row compact-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.receiptNumber}</strong>
                  <span className="tag warn">{payment.settlementStatus}</span>
                </div>
                <p>{payment.paymentMode} - {money(payment.amountCollected)} - {payment.settlementReference || "No settlement reference"}</p>
                <div className="record-meta">
                  <span>{payment.outlet}</span>
                  <span>{payment.settlementDate}</span>
                </div>
              </article>
            ))}
            {!unreconciled.length && <p className="empty-state">No unreconciled collections.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Credit Holds</h2>
          <div className="task-list compact-list">
            {creditHoldOutlets.slice(0, 6).map((outlet) => (
              <article className="task-row compact-row" key={outlet.id}>
                <div className="queue-top">
                  <strong>{outlet.name}</strong>
                  <span className="tag warn">{outlet.creditHoldStatus}</span>
                </div>
                <p>{outlet.city} - limit {money(outlet.creditLimit)}</p>
                <div className="record-meta">
                  <span>{outlet.assignedSalesman}</span>
                  <span>{outlet.phone || "No phone"}</span>
                </div>
              </article>
            ))}
            {!creditHoldOutlets.length && <p className="empty-state">No outlets are on credit hold.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Promise Calendar</h2>
          <div className="task-list compact-list">
            {promises.slice(0, 6).map((payment) => (
              <article className="task-row compact-row" key={payment.id}>
                <div className="queue-top">
                  <strong>{payment.outlet}</strong>
                  <span className="tag blue">{payment.promisedPaymentDate}</span>
                </div>
                <p>{payment.brand} - {money(pendingAmount(payment))} expected</p>
              </article>
            ))}
            {!promises.length && <p className="empty-state">No promised payment dates captured yet.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Payment Follow-Ups</h2>
          <div className="task-list compact-list">
            {paymentTasks.slice(0, 6).map((task) => (
              <article className="task-row compact-row" key={task.id}>
                <div className="queue-top">
                  <strong>{task.title}</strong>
                  <span className="tag blue">{task.status}</span>
                </div>
                <p>{task.assignedTo} - due {task.dueDate}</p>
              </article>
            ))}
            {!paymentTasks.length && <p className="empty-state">No finance follow-up tasks yet.</p>}
          </div>
        </article>
      </section>
    </section>
  );
}

function CrudPanel({
  title,
  description,
  addLabel,
  onAdd,
  onBulkImport,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  statusValue,
  statusOptions,
  onStatusChange,
  resultCount,
  totalCount,
  children
}: {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  onBulkImport: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  statusOptions?: string[];
  onStatusChange?: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
  children: ReactNode;
}) {
  return (
    <section className="table-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImport}>Bulk Import</button>
            <button className="primary-button" onClick={onAdd}>{addLabel}</button>
          </div>
        </div>
        {(onSearchChange || onStatusChange) && (
          <div className="list-toolbar">
            {onSearchChange && (
              <label className="toolbar-search">
                <span>Search</span>
                <input value={searchValue ?? ""} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder ?? "Search records"} type="search" />
              </label>
            )}
            {onStatusChange && statusOptions?.length ? (
              <label className="toolbar-filter">
                <span>Status</span>
                <select value={statusValue ?? "all"} onChange={(event) => onStatusChange(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {typeof resultCount === "number" && typeof totalCount === "number" && (
              <span className="toolbar-count">{resultCount} of {totalCount}</span>
            )}
          </div>
        )}
        <div className="task-list">{children}</div>
      </div>
    </section>
  );
}

function ReportsView({ brands, skus, outlets, records, materialFlows, payments, orders, bills, tasks }: { brands: BrandOption[]; skus: SkuRow[]; outlets: OutletRow[]; records: CommandRecord[]; materialFlows: MaterialFlowRow[]; payments: PaymentRow[]; orders: OrderRow[]; bills: BillRow[]; tasks: TaskRow[] }) {
  const [brandScope, setBrandScope] = useState("all");
  const scopedBrandNames = brandScope === "all" ? brands.map((brand) => brand.name) : [brandScope];
  const verifiedRecords = records.filter((record) => record.status === "verified" && scopedBrandNames.includes(record.partner));
  const scopedSkus = skus.filter((sku) => scopedBrandNames.includes(sku.brand));
  const scopedOutlets = outlets.filter((outlet) => scopedBrandNames.includes(outlet.brand));
  const scopedFlows = materialFlows.filter((flow) => scopedBrandNames.includes(flow.brand));
  const scopedPayments = payments.filter((payment) => scopedBrandNames.includes(payment.brand));
  const scopedOrders = orders.filter((order) => scopedBrandNames.includes(order.brand));
  const scopedBills = bills.filter((bill) => scopedBrandNames.includes(bill.brand));
  const scopedTasks = tasks.filter((task) => scopedBrandNames.includes(task.brand));
  const issues = scopedTasks.filter((task) => /complaint|issue|dispute|stockout|short|damage/i.test(`${task.title} ${task.description} ${task.taskType}`) || ["High", "Critical"].includes(task.priority));
  const reportTemplates = [
    { title: "Weekly Brand Review", detail: "Coverage, SKU movement, orders, collections, and market intelligence.", cadence: "Weekly", owner: "Manager", rows: verifiedRecords.map((record) => [record.partner, record.outlet, record.city, record.type, record.units, record.value, record.createdAt]) },
    { title: "Retailer Payment Risk", detail: "Ageing, promises, disputes, high-risk outlets, and collector ownership.", cadence: "Daily", owner: "Finance", rows: scopedPayments.map((payment) => [payment.brand, payment.outlet, payment.billNumber, payment.amountDue, payment.amountCollected, payment.status, payment.riskLevel]) },
    { title: "Procurement Flow", detail: "POs, GRNs, inbound movement, branch lead times, and supplier payables.", cadence: "Weekly", owner: "Operations", rows: scopedFlows.map((flow) => [flow.brand, flow.skuCode, flow.sku, flow.movementType, flow.fromLocation, flow.toLocation, flow.quantity, flow.status]) },
    { title: "Field Productivity", detail: "Visits, follow-ups, order conversion, evidence uploads, and pending tasks.", cadence: "Daily", owner: "Admin", rows: scopedTasks.map((task) => [task.brand, task.outlet, task.assignedTo, task.taskType, task.priority, task.status, task.dueDate]) }
  ];
  const drilldowns = [
    { label: "Client performance", value: "Brand, territory, SKU", status: "Ready for export" },
    { label: "Outlet universe", value: "Active, prospect, inactive", status: "Filtered dataset" },
    { label: "Order to bill", value: "Intent, confirmed, billed", status: "Pipeline view" },
    { label: "Receivables", value: "Due, overdue, disputed", status: "Finance view" }
  ];

  return (
    <section className="distribution-dashboard">
      <article className="panel report-cockpit">
        <div>
          <p className="eyebrow">Reporting workspace</p>
          <h2>Management reporting cockpit</h2>
          <p>Prepare executive-ready views from verified operational records. Reports remain export-first, with the screen structured for filters, review, and partner sharing.</p>
        </div>
        <div className="report-control-bar">
          <label>
            <span>Period</span>
            <select defaultValue="last-7">
              <option value="last-7">Last 7 days</option>
              <option value="last-30">Last 30 days</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label>
            <span>Client</span>
            <select value={brandScope} onChange={(event) => setBrandScope(event.target.value)}>
              <option value="all">All clients</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Output</span>
            <select defaultValue="pdf">
              <option value="pdf">PDF summary</option>
              <option value="csv">CSV dataset</option>
              <option value="xlsx">Excel workbook</option>
            </select>
          </label>
          <button className="primary-button" type="button" onClick={() => downloadCsvFile("shipd2r-approved-report-pack.csv", ["brand", "entity", "detail", "type", "quantity", "value", "status", "reference"], reportTemplates.flatMap((template) => template.rows))}>Prepare Export</button>
        </div>
      </article>

      <section className="metrics-grid">
        <Metric label="Templates" value={reportTemplates.length} detail="Configured report views" />
        <Metric label="Approved only" value={verifiedRecords.length} detail="Verified records in scope" />
        <Metric label="Exports" value="Per card" detail="CSV download on every report" />
        <Metric label="Client scope" value={brandScope === "all" ? brands.length : 1} detail="Brand-specific reporting" />
      </section>

      <section className="admin-command-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Report Templates</h2>
              <p>Reusable operating views for clients, finance, procurement, and field teams.</p>
            </div>
          </div>
          <div className="report-template-grid">
            {reportTemplates.map((template) => (
              <article className="module-card report-template-card" key={template.title}>
                <div className="queue-top">
                  <h3>{template.title}</h3>
                  <span className="tag blue">{template.cadence}</span>
                </div>
                <p>{template.detail}</p>
                <div className="record-meta">
                  <span>Owner: {template.owner}</span>
                  <span className="tag green">Approved visibility</span>
                  <button className="link-button" type="button" onClick={() => downloadCsvFile(`${template.title.toLowerCase().replace(/\s+/g, "-")}.csv`, ["brand", "entity", "detail", "type", "quantity", "value", "status"], template.rows)}>Download</button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Drill-Down Views</h2>
          <div className="signal-list">
            {drilldowns.map((item) => (
              <article className="signal-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
                <span className="tag">{item.status}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Shared Reports Timeline</h2>
          <div className="signal-list">
            {reportTemplates.map((template, index) => (
              <article className="signal-row" key={`${template.title}-shared`}>
                <div>
                  <strong>{template.title}</strong>
                  <span>{brandScope === "all" ? "All clients" : brandScope} - approved and shared on 2026-06-0{6 - index}</span>
                </div>
                <button className="link-button" type="button" onClick={() => downloadCsvFile(`${template.title.toLowerCase().replace(/\s+/g, "-")}-shared.csv`, ["brand", "entity", "detail", "type", "quantity", "value", "status"], template.rows)}>Download</button>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>SKU Movement Details</h2>
          <div className="data-table partner-movement-table">
            {scopedFlows.slice(0, 8).map((flow) => (
              <div className="table-row partner-movement-row" key={flow.id}>
                <strong>{flow.sku}</strong>
                <span>{flow.skuCode}</span>
                <span>{flow.fromLocation}</span>
                <span>{flow.toLocation}</span>
                <span>{flow.quantity} units</span>
                <span className="tag blue">{flow.status}</span>
              </div>
            ))}
            {!scopedFlows.length && <p className="empty-state">No SKU movement records match this report scope.</p>}
          </div>
        </article>

        <article className="panel">
          <h2>Issue / Complaint Summary</h2>
          <div className="task-list">
            {issues.slice(0, 6).map((task) => (
              <article className="task-row" key={task.id}>
                <div className="queue-top"><strong>{task.title}</strong><span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span></div>
                <p>{task.description}</p>
                <div className="record-meta"><span>{task.brand}</span><span>{task.outlet}</span><span>{task.status}</span></div>
              </article>
            ))}
            {!issues.length && <p className="empty-state">No complaint, dispute, stockout, or high-priority issue in this scope.</p>}
          </div>
        </article>

        <article className="panel wide-panel">
          <h2>Approval Workflow</h2>
          <div className="module-list">
            <article className="module-card"><h3>Draft</h3><p>Choose template, period, client, territory, and export format.</p></article>
            <article className="module-card"><h3>Review</h3><p>Manager validates record quality, payment risk, and partner-safe notes.</p></article>
            <article className="module-card"><h3>Share</h3><p>Export approved PDF, CSV, or Excel-ready datasets for the intended audience.</p></article>
          </div>
          <EmptyState title="Approved reports are partner-shareable." detail={`${scopedSkus.length} SKUs, ${scopedOutlets.length} outlets, ${scopedOrders.length} orders, and ${scopedBills.length} bills are available in the current scope.`} />
        </article>
      </section>
    </section>
  );
}

function daysPast(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(Math.floor((Date.now() - date.getTime()) / 86400000), 0);
}

function pendingPaymentAmount(payment: PaymentRow) {
  return Math.max(payment.amountDue - payment.amountCollected, 0);
}

function ApprovalInboxView({ payments, orders, bills, purchaseOrders, goodsReceipts, supplierPayables, importReviews, changeRequests }: { payments: PaymentRow[]; orders: OrderRow[]; bills: BillRow[]; purchaseOrders: PurchaseOrderRow[]; goodsReceipts: GoodsReceiptRow[]; supplierPayables: SupplierPayableRow[]; importReviews: ImportReview[]; changeRequests: ChangeRequest[] }) {
  const largeOrders = orders.filter((order) => order.expectedValue >= 50000 || order.quantity >= 500);
  const writeOffs = payments.filter((payment) => payment.writeOffStatus === "Requested" || payment.status === "Written off");
  const procurementExceptions = [
    ...purchaseOrders.filter((po) => po.status === "Draft" || po.status === "Cancelled").map((po) => ({ title: po.poNumber, detail: `${po.brand} - ${po.officeName}`, status: po.status })),
    ...goodsReceipts.filter((receipt) => receipt.status === "Quality hold" || receipt.status === "Draft").map((receipt) => ({ title: receipt.receiptNumber, detail: `${receipt.brand} - ${receipt.poNumber}`, status: receipt.status })),
    ...supplierPayables.filter((payable) => payable.status === "Overdue" || payable.status === "Disputed").map((payable) => ({ title: payable.invoiceNumber, detail: `${payable.brand} - ${money(payable.amountDue - payable.amountPaid)}`, status: payable.status }))
  ];
  const reportApprovals = [
    { title: "Weekly Brand Review", detail: "Manager approval before partner sharing", status: "Draft" },
    { title: "Retailer Payment Risk", detail: `${writeOffs.length} write-off or risk items included`, status: "Review required" }
  ];
  const inbox = [
    ...changeRequests.filter((request) => request.status === "Pending checker").map((request) => ({ type: "Maker-checker", title: request.recordLabel, detail: request.summary, status: request.status })),
    ...importReviews.filter((review) => review.status === "Pending review").map((review) => ({ type: "Import review", title: `${review.importType} import`, detail: `${review.rows.length} rows from ${review.maker}`, status: review.status })),
    ...reportApprovals.map((report) => ({ type: "Report approval", ...report })),
    ...writeOffs.map((payment) => ({ type: "Write-off", title: payment.receiptNumber, detail: `${payment.outlet} - ${money(pendingPaymentAmount(payment))}`, status: payment.writeOffStatus })),
    ...largeOrders.map((order) => ({ type: "Large order", title: order.outlet, detail: `${order.sku} - ${money(order.expectedValue)} - ${order.quantity} units`, status: order.status })),
    ...procurementExceptions.map((item) => ({ type: "Procurement exception", ...item }))
  ];

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Approval inbox" value={inbox.length} detail="Reports, write-offs, imports, orders, procurement" />
        <Metric label="Large orders" value={largeOrders.length} detail="Value or quantity threshold" />
        <Metric label="Write-offs" value={writeOffs.length} detail="Pending or recorded" />
        <Metric label="Procurement exceptions" value={procurementExceptions.length} detail="PO, GRN, payable issues" />
      </section>
      <CrudPanel title="Approval Inbox" description="Unified approval worklist for reports, write-offs, large orders, procurement exceptions, import reviews, and maker-checker edits." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="New Approval" resultCount={inbox.length} totalCount={inbox.length}>
        {inbox.map((item, index) => (
          <article className="task-row" key={`${item.type}-${index}`}>
            <div className="queue-top"><strong>{item.title}</strong><span className="tag warn">{item.type}</span></div>
            <p>{item.detail}</p>
            <div className="record-meta"><span>{item.status}</span><button className="link-button" type="button">Review</button><button className="link-button" type="button">Approve</button></div>
          </article>
        ))}
        {!inbox.length && <p className="empty-state">No approval items are pending.</p>}
      </CrudPanel>
    </section>
  );
}

function TeamPerformanceView({ salesmen, outlets, orders, payments, tasks }: { salesmen: SalesmanRow[]; outlets: OutletRow[]; orders: OrderRow[]; payments: PaymentRow[]; tasks: TaskRow[] }) {
  const rows = salesmen.map((rep) => {
    const repOutlets = outlets.filter((outlet) => outlet.assignedSalesman === rep.name);
    const outletNames = new Set(repOutlets.map((outlet) => outlet.name));
    const repOrders = orders.filter((order) => outletNames.has(order.outlet));
    const repPayments = payments.filter((payment) => outletNames.has(payment.outlet));
    const repTasks = tasks.filter((task) => task.assignedTo === rep.name);
    const collected = repPayments.reduce((sum, payment) => sum + payment.amountCollected, 0);
    const outstanding = repPayments.reduce((sum, payment) => sum + pendingPaymentAmount(payment), 0);
    return { rep, outlets: repOutlets.length, orders: repOrders.length, orderValue: repOrders.reduce((sum, order) => sum + order.expectedValue, 0), collected, outstanding, tasksOpen: repTasks.filter((task) => task.status !== "Completed").length };
  });

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Sales reps" value={salesmen.length} detail="Active field team records" />
        <Metric label="Assigned outlets" value={rows.reduce((sum, row) => sum + row.outlets, 0)} detail="Mapped to reps" />
        <Metric label="Order value" value={money(rows.reduce((sum, row) => sum + row.orderValue, 0))} detail="Captured by assigned outlets" />
        <Metric label="Collections" value={money(rows.reduce((sum, row) => sum + row.collected, 0))} detail="Rep-owned outlets" />
      </section>
      <article className="panel">
        <h2>Team Performance By Sales Rep</h2>
        <div className="task-list">
          {rows.map((row) => (
            <article className="task-row" key={row.rep.id}>
              <div className="queue-top"><strong>{row.rep.name}</strong><span className="tag blue">{row.rep.territory}</span></div>
              <p>{row.outlets} outlets - {row.orders} orders - {money(row.orderValue)} order value</p>
              <div className="record-meta"><span>{money(row.collected)} collected</span><span>{money(row.outstanding)} outstanding</span><span>{row.tasksOpen} open tasks</span></div>
            </article>
          ))}
          {!rows.length && <p className="empty-state">No sales reps are available for performance comparison.</p>}
        </div>
      </article>
    </section>
  );
}

function SlaEscalationView({ payments, orders, tasks, verificationDrafts, goodsReceipts }: { payments: PaymentRow[]; orders: OrderRow[]; tasks: TaskRow[]; verificationDrafts: VerificationDraftRecord[]; goodsReceipts: GoodsReceiptRow[] }) {
  const escalations = [
    ...payments.filter((payment) => payment.status === "Overdue" || daysPast(payment.dueDate) > 7).map((payment) => ({ type: "Payment SLA", title: payment.outlet, detail: `${money(pendingPaymentAmount(payment))} pending - due ${payment.dueDate}`, age: daysPast(payment.dueDate) })),
    ...orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status) && daysPast(order.expectedDeliveryDate) > 0).map((order) => ({ type: "Delivery SLA", title: order.outlet, detail: `${order.sku} - ${order.status} - delivery ${order.expectedDeliveryDate}`, age: daysPast(order.expectedDeliveryDate) })),
    ...tasks.filter((task) => task.status === "Overdue" || daysPast(task.dueDate) > 0).map((task) => ({ type: "Task SLA", title: task.title, detail: `${task.assignedTo} - due ${task.dueDate}`, age: daysPast(task.dueDate) })),
    ...verificationDrafts.filter((draft) => draft.status === "Needs review").map((draft) => ({ type: "Verification SLA", title: draft.title, detail: `${draft.recordType} waiting for review`, age: daysPast(draft.createdAt) })),
    ...goodsReceipts.filter((receipt) => receipt.status === "Draft" || receipt.status === "Quality hold").map((receipt) => ({ type: "GRN SLA", title: receipt.receiptNumber, detail: `${receipt.poNumber} - ${receipt.status}`, age: daysPast(receipt.receivedDate) }))
  ].sort((a, b) => b.age - a.age);

  return (
    <CrudPanel title="SLA and Escalations" description="Escalation queue for overdue collections, delayed deliveries, stale tasks, verification backlog, and GRN exceptions." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="New Escalation" resultCount={escalations.length} totalCount={escalations.length}>
      {escalations.map((item, index) => (
        <article className="task-row" key={`${item.type}-${index}`}>
          <div className="queue-top"><strong>{item.title}</strong><span className={`tag ${item.age > 7 ? "warn" : "blue"}`}>{item.type}</span></div>
          <p>{item.detail}</p>
          <div className="record-meta"><span>{item.age} days</span><button className="link-button" type="button">Escalate</button><button className="link-button" type="button">Assign</button></div>
        </article>
      ))}
      {!escalations.length && <p className="empty-state">No SLA breaches are visible in the current data.</p>}
    </CrudPanel>
  );
}

function TerritoryComparisonView({ territories, outlets, orders, payments, tasks, salesmen }: { territories: TerritoryRow[]; outlets: OutletRow[]; orders: OrderRow[]; payments: PaymentRow[]; tasks: TaskRow[]; salesmen: SalesmanRow[] }) {
  const territoryNames = territories.length ? territories.map((territory) => territory.name) : Array.from(new Set(outlets.map((outlet) => outlet.territory)));
  const rows = territoryNames.map((name) => {
    const territoryOutlets = outlets.filter((outlet) => outlet.territory === name);
    const outletNames = new Set(territoryOutlets.map((outlet) => outlet.name));
    const territoryOrders = orders.filter((order) => outletNames.has(order.outlet));
    const territoryPayments = payments.filter((payment) => outletNames.has(payment.outlet));
    return {
      name,
      outlets: territoryOutlets.length,
      reps: salesmen.filter((rep) => rep.territory === name).length,
      orderValue: territoryOrders.reduce((sum, order) => sum + order.expectedValue, 0),
      outstanding: territoryPayments.reduce((sum, payment) => sum + pendingPaymentAmount(payment), 0),
      overdue: territoryPayments.filter((payment) => payment.status === "Overdue").length,
      tasks: tasks.filter((task) => outletNames.has(task.outlet) && task.status !== "Completed").length
    };
  });

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Territories" value={rows.length} detail="Comparison units" />
        <Metric label="Outlets" value={rows.reduce((sum, row) => sum + row.outlets, 0)} detail="Mapped retailers" />
        <Metric label="Order value" value={money(rows.reduce((sum, row) => sum + row.orderValue, 0))} detail="By territory" />
        <Metric label="Outstanding" value={money(rows.reduce((sum, row) => sum + row.outstanding, 0))} detail="Receivables exposure" />
      </section>
      <article className="panel">
        <h2>Territory Comparison</h2>
        <div className="task-list">
          {rows.map((row) => (
            <article className="task-row" key={row.name}>
              <div className="queue-top"><strong>{row.name}</strong><span className="tag blue">{row.reps} reps</span></div>
              <p>{row.outlets} outlets - {money(row.orderValue)} order value - {money(row.outstanding)} outstanding</p>
              <div className="record-meta"><span>{row.overdue} overdue</span><span>{row.tasks} open tasks</span></div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function OrderFulfilmentView({ orders, bills, materialFlows, inventoryPositions }: { orders: OrderRow[]; bills: BillRow[]; materialFlows: MaterialFlowRow[]; inventoryPositions: InventoryPositionRow[] }) {
  const pendingOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const delayedOrders = pendingOrders.filter((order) => daysPast(order.expectedDeliveryDate) > 0);
  const billedOrderIds = new Set(bills.map((bill) => bill.orderId).filter(Boolean));
  const dispatchFlows = materialFlows.filter((flow) => flow.movementType === "Outbound sale" || flow.movementType === "Billed dispatch");
  const lowStock = inventoryPositions.filter((item) => item.status !== "Healthy");

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Pending fulfilment" value={pendingOrders.length} detail="Not delivered or cancelled" />
        <Metric label="Delayed" value={delayedOrders.length} detail="Past expected date" />
        <Metric label="Billed links" value={billedOrderIds.size} detail="Bills tied to orders" />
        <Metric label="Low stock SKUs" value={lowStock.length} detail="Fulfilment risk" />
      </section>
      <section className="admin-command-grid">
        <article className="panel">
          <h2>Order Fulfilment Monitor</h2>
          <div className="task-list">
            {pendingOrders.slice(0, 10).map((order) => (
              <article className="task-row" key={order.id}>
                <div className="queue-top"><strong>{order.outlet}</strong><span className={`tag ${daysPast(order.expectedDeliveryDate) > 0 ? "warn" : "blue"}`}>{order.status}</span></div>
                <p>{order.sku} - {money(order.expectedValue)} - delivery {order.expectedDeliveryDate}</p>
                <div className="record-meta"><span>{billedOrderIds.has(order.id) ? "Bill linked" : "No bill link"}</span><span>{daysPast(order.expectedDeliveryDate)} days past</span></div>
              </article>
            ))}
            {!pendingOrders.length && <p className="empty-state">No pending fulfilment orders.</p>}
          </div>
        </article>
        <article className="panel">
          <h2>Dispatch and Stock Risk</h2>
          <div className="task-list">
            {dispatchFlows.slice(0, 5).map((flow) => <article className="task-row" key={flow.id}><strong>{flow.sku}</strong><p>{flow.fromLocation} to {flow.toLocation} - {flow.quantity} units</p></article>)}
            {lowStock.slice(0, 5).map((item) => <article className="task-row" key={item.id}><strong>{item.sku}</strong><p>{item.warehouse} - {item.available} available - {item.status}</p></article>)}
          </div>
        </article>
      </section>
    </section>
  );
}

function ExceptionDashboardView({ payments, orders, inventoryPositions, goodsReceipts, purchaseOrders, verificationDrafts }: { payments: PaymentRow[]; orders: OrderRow[]; inventoryPositions: InventoryPositionRow[]; goodsReceipts: GoodsReceiptRow[]; purchaseOrders: PurchaseOrderRow[]; verificationDrafts: VerificationDraftRecord[] }) {
  const overduePayments = payments.filter((payment) => payment.status === "Overdue" || pendingPaymentAmount(payment) > 0 && daysPast(payment.dueDate) > 0);
  const delayedDeliveries = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status) && daysPast(order.expectedDeliveryDate) > 0);
  const lowStock = inventoryPositions.filter((item) => item.status !== "Healthy");
  const pendingGrns = goodsReceipts.filter((receipt) => receipt.status === "Draft" || receipt.status === "Quality hold" || receipt.status === "Received");
  const procurementDelays = purchaseOrders.filter((po) => !["Received", "Cancelled"].includes(po.status) && daysPast(po.expectedDate) > 0);
  const verificationBacklog = verificationDrafts.filter((draft) => draft.status === "Needs review");
  const exceptions = [
    ...overduePayments.map((payment) => ({ type: "Overdue payment", title: payment.outlet, detail: `${money(pendingPaymentAmount(payment))} pending - ${payment.billNumber}`, severity: "High" })),
    ...delayedDeliveries.map((order) => ({ type: "Delayed delivery", title: order.outlet, detail: `${order.sku} - expected ${order.expectedDeliveryDate}`, severity: "High" })),
    ...lowStock.map((item) => ({ type: "Low stock", title: item.sku, detail: `${item.available} available in ${item.warehouse}`, severity: item.status === "Reorder due" ? "High" : "Medium" })),
    ...pendingGrns.map((receipt) => ({ type: "Pending GRN", title: receipt.receiptNumber, detail: `${receipt.poNumber} - ${receipt.status}`, severity: "Medium" })),
    ...procurementDelays.map((po) => ({ type: "Procurement delay", title: po.poNumber, detail: `${po.brand} - expected ${po.expectedDate}`, severity: "Medium" })),
    ...verificationBacklog.map((draft) => ({ type: "Verification backlog", title: draft.title, detail: `${draft.recordType} - ${Math.round(draft.confidence * 100)}% confidence`, severity: draft.confidence < 0.7 ? "High" : "Medium" }))
  ];

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Exceptions" value={exceptions.length} detail="Combined operating risk" />
        <Metric label="Overdue payments" value={overduePayments.length} detail="Receivables risk" />
        <Metric label="Delayed deliveries" value={delayedDeliveries.length} detail="Order fulfilment risk" />
        <Metric label="Low stock" value={lowStock.length} detail="Inventory risk" />
      </section>
      <CrudPanel title="Exception Dashboard" description="Combined exception queue across overdue payments, delayed deliveries, low stock, pending GRNs, procurement delays, and verification backlog." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="New Exception" resultCount={exceptions.length} totalCount={exceptions.length}>
        {exceptions.map((item, index) => (
          <article className="task-row" key={`${item.type}-${index}`}>
            <div className="queue-top"><strong>{item.title}</strong><span className={`tag ${item.severity === "High" ? "warn" : "blue"}`}>{item.type}</span></div>
            <p>{item.detail}</p>
            <div className="record-meta"><span>{item.severity}</span><button className="link-button" type="button">Assign Owner</button><button className="link-button" type="button">Escalate</button></div>
          </article>
        ))}
        {!exceptions.length && <p className="empty-state">No cross-module exceptions are visible in the current data.</p>}
      </CrudPanel>
    </section>
  );
}

type SearchRecord = { id: string; type: string; title: string; detail: string; status: string };

function GlobalSearchView({ brands, outlets, skus, orders, bills, payments, tasks }: { brands: BrandOption[]; outlets: OutletRow[]; skus: SkuRow[]; orders: OrderRow[]; bills: BillRow[]; payments: PaymentRow[]; tasks: TaskRow[] }) {
  const [query, setQuery] = useState("");
  const records: SearchRecord[] = [
    ...outlets.map((outlet) => ({ id: outlet.id, type: "Outlet", title: outlet.name, detail: `${outlet.city} - ${outlet.brand} - ${outlet.assignedSalesman}`, status: `${outlet.status} / credit ${outlet.creditHoldStatus}` })),
    ...brands.map((brand) => ({ id: brand.id, type: "Brand", title: brand.name, detail: `${brand.category} - ${brand.contact}`, status: brand.status })),
    ...skus.map((sku) => ({ id: sku.id, type: "SKU", title: sku.name, detail: `${sku.code} - ${sku.brand} - ${sku.unit}`, status: sku.status })),
    ...orders.map((order) => ({ id: order.id, type: "Order", title: order.outlet, detail: `${order.sku} - ${order.brand} - ${money(order.expectedValue)}`, status: order.status })),
    ...bills.map((bill) => ({ id: bill.id, type: "Bill", title: bill.billNumber, detail: `${bill.outlet} - ${bill.brand} - ${money(bill.totalAmount)}`, status: bill.paymentStatus })),
    ...payments.map((payment) => ({ id: payment.id, type: "Payment", title: payment.receiptNumber, detail: `${payment.outlet} - ${payment.billNumber} - ${money(payment.amountCollected)}`, status: `${payment.status} / ${payment.settlementStatus}` })),
    ...tasks.map((task) => ({ id: task.id, type: "Task", title: task.title, detail: `${task.outlet} - ${task.assignedTo} - ${task.dueDate}`, status: task.status }))
  ];
  const visibleRecords = records.filter((record) => matchesSearch([record.type, record.title, record.detail, record.status], query)).slice(0, 80);

  return (
    <section className="table-layout">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Global Search</h2>
            <p>Find outlets, clients, SKUs, orders, bills, payments, and tasks from one workspace.</p>
          </div>
          <span className="tag blue">{visibleRecords.length} results</span>
        </div>
        <div className="list-toolbar">
          <label className="toolbar-search">
            <span>Search across platform</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Outlet, brand, SKU, invoice, receipt, collector, status" type="search" />
          </label>
        </div>
        <div className="task-list">
          {visibleRecords.map((record) => (
            <article className="task-row" key={`${record.type}-${record.id}`}>
              <div className="queue-top">
                <strong>{record.title}</strong>
                <span className="tag blue">{record.type}</span>
              </div>
              <p>{record.detail}</p>
              <div className="record-meta"><span>{record.status}</span><span>{record.id}</span></div>
            </article>
          ))}
          {!visibleRecords.length && <p className="empty-state">No records match the current search.</p>}
        </div>
      </article>
    </section>
  );
}

function AuditTrailView({ brands, outlets, skus, orders, bills, payments, tasks, verificationDrafts }: { brands: BrandOption[]; outlets: OutletRow[]; skus: SkuRow[]; orders: OrderRow[]; bills: BillRow[]; payments: PaymentRow[]; tasks: TaskRow[]; verificationDrafts: VerificationDraftRecord[] }) {
  const auditEvents = [
    ...orders.slice(0, 10).map((order) => ({ title: "Order status", actor: "Sales / Ops", object: `${order.outlet} - ${order.sku}`, detail: `${order.status} - ${money(order.expectedValue)}`, risk: order.status === "Cancelled" ? "High" : "Normal" })),
    ...bills.slice(0, 10).map((bill) => ({ title: "Bill register", actor: "Sales / Finance", object: bill.billNumber, detail: `${bill.paymentStatus} - linked order ${bill.orderId ? "yes" : "no"}`, risk: bill.paymentStatus === "Written off" ? "High" : "Normal" })),
    ...payments.slice(0, 10).map((payment) => ({ title: "Payment update", actor: payment.collectorName, object: payment.receiptNumber, detail: `${payment.status} - ${payment.disputeStatus} - ${payment.writeOffStatus}`, risk: payment.writeOffStatus !== "Not requested" || payment.disputeStatus !== "Not disputed" ? "High" : "Normal" })),
    ...verificationDrafts.slice(0, 8).map((draft) => ({ title: "AI verification", actor: "Admin review", object: draft.title, detail: `${draft.recordType} - ${draft.status} - ${Math.round(draft.confidence * 100)}%`, risk: draft.status === "Needs review" ? "Medium" : "Normal" }))
  ];

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Master records" value={brands.length + outlets.length + skus.length} detail="Clients, outlets, and products" />
        <Metric label="Transactions" value={orders.length + bills.length + payments.length} detail="Orders, bills, and payments" />
        <Metric label="Review events" value={verificationDrafts.length} detail="AI/admin verification items" />
        <Metric label="Task events" value={tasks.length} detail="Follow-up actions" />
      </section>
      <article className="panel">
        <div className="panel-heading"><div><h2>Central Audit Trail</h2><p>Chronological operating events generated from current orders, bills, payments, approvals, and review queues.</p></div></div>
        <div className="task-list">
          {auditEvents.map((event, index) => (
            <article className="task-row" key={`${event.title}-${index}`}>
              <div className="queue-top">
                <strong>{event.title}</strong>
                <span className={`tag ${event.risk === "High" ? "warn" : "blue"}`}>{event.risk}</span>
              </div>
              <p>{event.object}</p>
              <div className="record-meta"><span>{event.actor}</span><span>{event.detail}</span></div>
            </article>
          ))}
          {!auditEvents.length && <p className="empty-state">No audit events yet.</p>}
        </div>
      </article>
    </section>
  );
}

function PermissionMatrixView({ users }: { users: AppUserRow[] }) {
  const roles = ["Admin", "Operator", "Manager", "Finance", "Sales", "Integration", "Partner"];
  const modules: Array<{ name: View; label: string }> = [
    { name: "outlets", label: "Outlets" }, { name: "products", label: "Products" }, { name: "orders", label: "Orders" }, { name: "bills", label: "Bills" },
    { name: "payments", label: "Payments" }, { name: "procurement", label: "Procurement" }, { name: "users", label: "Users" }, { name: "integrations", label: "Integrations" },
    { name: "approval-inbox", label: "Approval Inbox" }, { name: "team-performance", label: "Team Perf" }, { name: "sla", label: "SLA" }, { name: "territory-comparison", label: "Territory Compare" }, { name: "fulfilment", label: "Fulfilment" }, { name: "exceptions", label: "Exceptions" },
    { name: "assigned-queue", label: "Assigned Queue" }, { name: "corrections", label: "Corrections" }, { name: "audit", label: "Audit" }, { name: "approvals", label: "Approvals" }, { name: "exports", label: "Exports" }
  ];
  const demoUserForRole = (role: string): AppUserRow => ({
    id: role,
    name: role,
    email: "",
    phone: "",
    role: role === "Admin" ? "super_admin" : role === "Operator" ? "admin_operator" : role === "Manager" ? "operations_manager" : role === "Finance" ? "finance_collections" : role === "Sales" ? "field_executive" : role === "Integration" ? "integration_user" : "brand_partner_viewer",
    roleLabel: role,
    territory: "",
    status: "Active"
  });

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Users" value={users.length} detail="Accounts in directory" />
        <Metric label="Roles" value={roles.length} detail="Permission profiles" />
        <Metric label="Sensitive modules" value="Users / Integrations" detail="Admin-controlled" />
        <Metric label="Review cadence" value="Monthly" detail="Access governance" />
      </section>
      <article className="panel">
        <div className="panel-heading"><div><h2>Permission Matrix</h2><p>Role-level module access for admin review before moving to true RBAC.</p></div></div>
        <div className="permission-grid">
          <span className="permission-cell header">Module</span>
          {roles.map((role) => <span className="permission-cell header" key={role}>{role}</span>)}
          {modules.map((module) => [
            <span className="permission-cell" key={`${module.name}-label`}>{module.label}</span>,
            ...roles.map((role) => <span className="permission-cell" key={`${module.name}-${role}`}>{canSeeView(demoUserForRole(role), module.name) ? "Allow" : "Block"}</span>)
          ])}
        </div>
      </article>
    </section>
  );
}

function ChangeApprovalsView({ payments, orders, bills, tasks, changeRequests, importReviews, canApprove, onChangeStatus, onImportStatus, onApplyImport }: { payments: PaymentRow[]; orders: OrderRow[]; bills: BillRow[]; tasks: TaskRow[]; changeRequests: ChangeRequest[]; importReviews: ImportReview[]; canApprove: boolean; onChangeStatus: (requestId: string, status: ChangeRequest["status"]) => void; onImportStatus: (reviewId: string, status: ImportReview["status"]) => void; onApplyImport: (reviewId: string) => void }) {
  const approvals = [
    ...changeRequests.map((request) => ({ id: request.id, title: `${request.action} approval`, object: request.recordLabel, detail: `${request.recordType} - maker ${request.maker} - checker ${request.checker}`, status: request.status, kind: "change" as const })),
    ...importReviews.map((review) => ({ id: review.id, title: "Import review", object: `${review.importType} import`, detail: `${review.rows.length} rows - maker ${review.maker} - ${review.createdAt}`, status: review.status, kind: "import" as const })),
    ...payments.filter((payment) => payment.writeOffStatus === "Requested").map((payment) => ({ title: "Write-off approval", object: payment.receiptNumber, detail: `${payment.outlet} - ${money(payment.amountDue - payment.amountCollected)} pending`, status: payment.writeOffStatus })),
    ...payments.filter((payment) => payment.disputeStatus === "Opened" || payment.disputeStatus === "Under review").map((payment) => ({ title: "Dispute review", object: payment.billNumber, detail: `${payment.outlet} - ${payment.disputeStatus}`, status: payment.disputeStatus })),
    ...orders.filter((order) => order.status === "Cancelled" || order.status === "On hold").map((order) => ({ title: "Order change", object: order.outlet, detail: `${order.sku} - ${order.status}`, status: order.status })),
    ...bills.filter((bill) => bill.paymentStatus === "Written off" || bill.paymentStatus === "Disputed").map((bill) => ({ title: "Bill change", object: bill.billNumber, detail: `${bill.outlet} - ${bill.paymentStatus}`, status: bill.paymentStatus })),
    ...tasks.filter((task) => task.priority === "Critical").map((task) => ({ title: "Critical task", object: task.title, detail: `${task.assignedTo} - ${task.dueDate}`, status: task.status }))
  ];

  return (
    <CrudPanel title="Change Approvals" description="Maker-checker queue for sensitive edits, import review, write-offs, disputes, cancellations, credit holds, and critical operational changes." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="New Request" resultCount={approvals.length} totalCount={approvals.length}>
      {approvals.map((item, index) => (
        <article className="task-row" key={`${item.title}-${index}`}>
          <div className="queue-top"><strong>{item.title}</strong><span className="tag warn">{item.status}</span></div>
          <p>{item.object}</p>
          <div className="record-meta">
            <span>{item.detail}</span>
            {"kind" in item && item.kind === "change" && <button className="link-button" type="button" disabled={!canApprove} onClick={() => onChangeStatus(item.id, "Approved")}>Approve</button>}
            {"kind" in item && item.kind === "change" && <button className="link-button" type="button" disabled={!canApprove} onClick={() => onChangeStatus(item.id, "Rejected")}>Reject</button>}
            {"kind" in item && item.kind === "import" && item.status === "Pending review" && <button className="link-button" type="button" disabled={!canApprove} onClick={() => onApplyImport(item.id)}>Apply Import</button>}
            {"kind" in item && item.kind === "import" && <button className="link-button" type="button" disabled={!canApprove} onClick={() => onImportStatus(item.id, item.status === "Applied" ? "Rolled back" : "Rejected")}>{item.status === "Applied" ? "Rollback" : "Reject"}</button>}
            {!("kind" in item) && <button className="link-button" type="button">Review</button>}
          </div>
        </article>
      ))}
      {!approvals.length && <p className="empty-state">No sensitive changes are waiting for approval.</p>}
    </CrudPanel>
  );
}

function DataQualityView({ brands, outlets, skus, orders, bills, payments, users }: { brands: BrandOption[]; outlets: OutletRow[]; skus: SkuRow[]; orders: OrderRow[]; bills: BillRow[]; payments: PaymentRow[]; users: AppUserRow[] }) {
  const checks = [
    { title: "Outlets missing phone", count: outlets.filter((outlet) => !outlet.phone).length, detail: "Required for WhatsApp and sales follow-up" },
    { title: "Outlets without assigned rep", count: outlets.filter((outlet) => outlet.assignedSalesman === "Unassigned").length, detail: "Affects beat plan and collections ownership" },
    { title: "SKUs missing images", count: skus.filter((sku) => !sku.imageUrl).length, detail: "Marketplace-style catalog visibility" },
    { title: "Bills not linked to orders", count: bills.filter((bill) => !bill.orderId).length, detail: "Order-to-cash traceability" },
    { title: "Payments not linked to bills", count: payments.filter((payment) => !payment.billId).length, detail: "Invoice allocation and receipt control" },
    { title: "Users without email", count: users.filter((user) => !user.email).length, detail: "Login and audit identity quality" },
    { title: "Orders without delivery date", count: orders.filter((order) => order.expectedDeliveryDate === "No delivery date").length, detail: "Delivery planning quality" },
    { title: "Brands missing contact", count: brands.filter((brand) => !brand.contactEmail && !brand.contactPhone).length, detail: "Procurement escalation readiness" }
  ];
  const issueCount = checks.reduce((sum, check) => sum + check.count, 0);

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Issues" value={issueCount} detail="Current data quality exceptions" />
        <Metric label="Checks" value={checks.length} detail="Automated validations" />
        <Metric label="Critical" value={checks.filter((check) => check.count > 0).length} detail="Areas needing cleanup" />
        <Metric label="Records scanned" value={brands.length + outlets.length + skus.length + orders.length + bills.length + payments.length + users.length} detail="Loaded platform records" />
      </section>
      <article className="panel">
        <h2>Data Quality Dashboard</h2>
        <div className="health-grid">
          {checks.map((check) => (
            <article className="health-card" key={check.title}>
              <div className="queue-top"><strong>{check.title}</strong><span className={`tag ${check.count ? "warn" : "green"}`}>{check.count}</span></div>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function ErrorLogsView({ setupError, metaIntegration, aiProvider, openAIIntegration, verificationDrafts }: { setupError?: string; metaIntegration: MetaIntegrationSettings; aiProvider: AIProviderSettings; openAIIntegration: OpenAIIntegrationSettings; verificationDrafts: VerificationDraftRecord[] }) {
  const logs = [
    ...(setupError ? [{ title: "Supabase setup", detail: setupError, severity: "High" }] : []),
    ...(metaIntegration.lastError ? [{ title: "Meta WhatsApp", detail: metaIntegration.lastError, severity: "High" }] : []),
    ...(aiProvider.lastError ? [{ title: "AI provider", detail: aiProvider.lastError, severity: "Medium" }] : []),
    ...(openAIIntegration.lastError ? [{ title: "OpenAI fallback", detail: openAIIntegration.lastError, severity: "Medium" }] : []),
    ...verificationDrafts.filter((draft) => draft.confidence < 0.7).map((draft) => ({ title: "Low-confidence extraction", detail: `${draft.title} - ${draft.reasonForReview}`, severity: "Medium" }))
  ];

  return (
    <CrudPanel title="Failed Action and Error Log" description="Operational error queue for schema issues, integration failures, AI extraction warnings, and low-confidence actions." onAdd={() => undefined} onBulkImport={() => undefined} addLabel="Log Error" resultCount={logs.length} totalCount={logs.length}>
      {logs.map((log, index) => (
        <article className="task-row" key={`${log.title}-${index}`}>
          <div className="queue-top"><strong>{log.title}</strong><span className={`tag ${log.severity === "High" ? "warn" : "blue"}`}>{log.severity}</span></div>
          <p>{log.detail}</p>
          <div className="record-meta"><span>Retry owner: Operations</span><button className="link-button" type="button">Mark Reviewed</button></div>
        </article>
      ))}
      {!logs.length && <p className="empty-state">No failed actions or provider errors are visible in the current data load.</p>}
    </CrudPanel>
  );
}

function BackupExportView({ brands, outlets, skus, orders, bills, payments, users, tasks }: { brands: BrandOption[]; outlets: OutletRow[]; skus: SkuRow[]; orders: OrderRow[]; bills: BillRow[]; payments: PaymentRow[]; users: AppUserRow[]; tasks: TaskRow[] }) {
  const exports = [
    { label: "Brands", rows: brands, columns: ["id", "name", "category", "status"] },
    { label: "Outlets", rows: outlets, columns: ["id", "name", "city", "brand", "assignedSalesman", "creditHoldStatus"] },
    { label: "Products", rows: skus, columns: ["id", "name", "code", "brand", "mrp", "status"] },
    { label: "Orders", rows: orders, columns: ["id", "outlet", "sku", "brand", "expectedValue", "status"] },
    { label: "Bills", rows: bills, columns: ["id", "billNumber", "outlet", "brand", "totalAmount", "paymentStatus"] },
    { label: "Payments", rows: payments, columns: ["id", "receiptNumber", "billNumber", "outlet", "amountCollected", "settlementStatus"] },
    { label: "Users", rows: users, columns: ["id", "name", "email", "roleLabel", "status"] },
    { label: "Tasks", rows: tasks, columns: ["id", "title", "assignedTo", "outlet", "status"] }
  ];

  function exportRows(label: string, rows: Array<Record<string, unknown>>, columns: string[]) {
    const csv = [columns, ...rows.map((row) => columns.map((column) => csvEscape(String(row[column] ?? ""))) )].map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `shipd2r-${label.toLowerCase()}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Datasets" value={exports.length} detail="Available local exports" />
        <Metric label="Records" value={exports.reduce((sum, item) => sum + item.rows.length, 0)} detail="Rows in current app state" />
        <Metric label="Format" value="CSV" detail="Browser-generated backup" />
        <Metric label="Production push" value="Off" detail="Local only until approved" />
      </section>
      <article className="panel">
        <div className="panel-heading"><div><h2>Backup and Export Control</h2><p>Export operational snapshots for backup, audit review, or migration handoff.</p></div></div>
        <div className="module-list">
          {exports.map((item) => (
            <article className="module-card" key={item.label}>
              <div className="queue-top"><h3>{item.label}</h3><span className="tag blue">{item.rows.length} rows</span></div>
              <p>{item.columns.join(", ")}</p>
              <button className="secondary-button" type="button" onClick={() => exportRows(item.label, item.rows as Array<Record<string, unknown>>, item.columns)}>Export CSV</button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function CRMSyncView({
  brands,
  outlets,
  skus,
  payments,
  orders,
  metaIntegration,
  aiProvider
}: {
  brands: BrandOption[];
  outlets: OutletRow[];
  skus: SkuRow[];
  payments: PaymentRow[];
  orders: OrderRow[];
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
}) {
  const syncEvents = [
    { object: "Outlet master", records: outlets.length, mode: "CSV export / webhook-ready", status: "Native CRM" },
    { object: "SKU master", records: skus.length, mode: "Brand catalogue sync", status: "Mapped by brand" },
    { object: "Order intents", records: orders.length, mode: "Webhook push later", status: "Verification gated" },
    { object: "Payment status", records: payments.length, mode: "Finance export", status: "Review required" }
  ];
  const availableIntegrations = ["Zoho CRM", "Salesforce", "HubSpot", "Odoo", "SAP Business One", "Microsoft Dynamics", "LeadSquared", "Custom API"];

  return (
    <section className="distribution-dashboard">
      <section className="command-hero panel">
        <div>
          <p className="eyebrow">Enterprise integration layer</p>
          <h2>CRM-ready distribution intelligence</h2>
          <p>Start with CSV, PDF, and Google Sheets-style exports, then move verified records into brand CRM/ERP systems through mapped webhooks and API connectors.</p>
        </div>
        <div className="command-hero-grid">
          <Field label="Brand accounts" value={String(brands.length)} />
          <Field label="Meta WhatsApp" value={metaIntegration.status} />
          <Field label="AI provider" value={aiProvider.status} />
          <Field label="Sync objects" value={String(syncEvents.length)} />
        </div>
      </section>

      <section className="admin-command-grid">
        <article className="panel">
          <h2>Sync Objects</h2>
          <div className="signal-list">
            {syncEvents.map((event) => (
              <article className="signal-row" key={event.object}>
                <div>
                  <strong>{event.object}</strong>
                  <span>{event.mode}</span>
                </div>
                <span className="tag blue">{event.records} records</span>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Connector Readiness</h2>
          <div className="template-columns">
            {availableIntegrations.map((integration) => (
              <span className="tag" key={integration}>{integration}</span>
            ))}
          </div>
          <p className="manager-note">Current support is export-first, with mapped connectors planned for two-way sync, duplicate handling, retries, and provider error visibility.</p>
        </article>

        <article className="panel wide-panel">
          <h2>Integration Controls</h2>
          <div className="module-list">
            <article className="module-card"><h3>Field Mapping</h3><p>Map ShipD2R outlets, SKUs, orders, payments, and complaints to each brand CRM schema.</p></article>
            <article className="module-card"><h3>Approval Before Sync</h3><p>Push verified data only, with manager approval for sensitive records.</p></article>
            <article className="module-card"><h3>Error Logs</h3><p>Track failed pushes, duplicate conflicts, retry attempts, and provider responses.</p></article>
          </div>
        </article>
      </section>
    </section>
  );
}

function SystemHealthView({
  setupError,
  metaIntegration,
  aiProvider,
  openAIIntegration,
  counts
}: {
  setupError?: string;
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
  openAIIntegration: OpenAIIntegrationSettings;
  counts: { brands: number; branches: number; skus: number; orders: number; payments: number; verificationDrafts: number };
}) {
  const checks = [
    {
      name: "Supabase data load",
      status: setupError ? "Needs attention" : "Healthy",
      detail: setupError || "Core operating data loaded successfully."
    },
    {
      name: "Procurement schema",
      status: counts.branches ? "Healthy" : "Fallback mode",
      detail: counts.branches ? `${counts.branches} brand branches available.` : "Branch table may be pending migration; procurement fallback data is active."
    },
    {
      name: "Meta WhatsApp",
      status: metaIntegration.status,
      detail: metaIntegration.lastError || `${metaIntegration.displayName} - ${metaIntegration.updatedAt}`
    },
    {
      name: "AI extraction",
      status: aiProvider.status,
      detail: aiProvider.lastError || `${aiProvider.provider} / ${aiProvider.model} - ${aiProvider.extractionMode}`
    },
    {
      name: "OpenAI fallback",
      status: openAIIntegration.status,
      detail: openAIIntegration.lastError || `${openAIIntegration.model} and ${openAIIntegration.transcriptionModel}`
    },
    {
      name: "Verification queue",
      status: counts.verificationDrafts ? "Review required" : "Clear",
      detail: `${counts.verificationDrafts} drafts waiting in the current queue.`
    }
  ];

  return (
    <section className="distribution-dashboard">
      <section className="metrics-grid">
        <Metric label="Brands" value={counts.brands} detail="Client accounts loaded" />
        <Metric label="Branches" value={counts.branches} detail="Source offices loaded" />
        <Metric label="Products" value={counts.skus} detail="SKU records loaded" />
        <Metric label="Transactions" value={counts.orders + counts.payments} detail="Orders and payments loaded" />
      </section>
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>System Checks</h2>
            <p>Operational health for schema, integrations, AI providers, and queues.</p>
          </div>
        </div>
        <div className="health-grid">
          {checks.map((check) => (
            <article className="health-card" key={check.name}>
              <div className="queue-top">
                <strong>{check.name}</strong>
                <span className={`tag ${["Healthy", "Connected", "Clear"].includes(check.status) ? "green" : check.status === "Needs attention" || check.status === "Review required" ? "warn" : "blue"}`}>{check.status}</span>
              </div>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
      </article>
      <article className="panel">
        <h2>Recommended Operations</h2>
        <div className="module-list">
          <article className="module-card"><h3>Schema migration</h3><p>Apply the procurement/material-flow migration when Supabase access is available so branch records persist.</p></article>
          <article className="module-card"><h3>Integration test</h3><p>Send a WhatsApp test payload and verify AI extraction creates review drafts.</p></article>
          <article className="module-card"><h3>Access review</h3><p>Review role assignments after adding new users or partner accounts.</p></article>
        </div>
      </article>
    </section>
  );
}

function IntegrationsView({
  metaIntegration,
  aiProvider,
  openAIIntegration,
  notice,
  onSaveMeta,
  onSaveAI,
  onSaveOpenAI
}: {
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
  openAIIntegration: OpenAIIntegrationSettings;
  notice: IntegrationNotice | null;
  onSaveMeta: (event: FormEvent<HTMLFormElement>) => void;
  onSaveAI: (event: FormEvent<HTMLFormElement>) => void;
  onSaveOpenAI: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="integrations-grid">
      {notice ? <div className={`inline-notice ${notice.type}`} role="status">{notice.message}</div> : null}
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Meta WhatsApp Cloud API</h2>
            <p>Connect the official Meta account that receives retailer WhatsApp messages and sends confirmations or reminders.</p>
          </div>
          <span className={`tag ${metaIntegration.status === "Connected" ? "blue" : "warn"}`}>{metaIntegration.status}</span>
        </div>
        <div className="integration-summary">
          <Field label="Webhook URL" value={metaIntegration.webhookUrl} />
          <Field label="Token saved" value={metaIntegration.hasAccessToken ? "Yes" : "No"} />
          <Field label="App secret saved" value={metaIntegration.hasAppSecret ? "Yes" : "No"} />
          <Field label="Verify token saved" value={metaIntegration.hasVerifyToken ? "Yes" : "No"} />
        </div>
        <form className="master-form" onSubmit={onSaveMeta}>
          <div className="form-grid">
            <Input name="displayName" label="Display name" defaultValue={metaIntegration.displayName} />
            <Input name="graphApiVersion" label="Graph API version" defaultValue={metaIntegration.graphApiVersion} />
            <Input name="phoneNumberId" label="Phone number ID" defaultValue={metaIntegration.phoneNumberId} />
            <Input name="whatsappBusinessAccountId" label="WhatsApp Business Account ID" defaultValue={metaIntegration.whatsappBusinessAccountId} />
            <Input name="businessPortfolioId" label="Business portfolio ID" defaultValue={metaIntegration.businessPortfolioId} required={false} />
            <Select name="status" label="Status" options={["Draft", "Connected", "Disabled"]} defaultValue={metaIntegration.status} />
            <Input name="webhookVerifyToken" label="Webhook verify token" type="password" placeholder={metaIntegration.hasVerifyToken ? "Saved. Enter only to replace." : ""} required={!metaIntegration.hasVerifyToken} />
            <Input name="accessToken" label="System user access token" type="password" placeholder={metaIntegration.hasAccessToken ? "Saved. Enter only to replace." : ""} required={!metaIntegration.hasAccessToken} />
            <Input name="appSecret" label="Meta app secret" type="password" placeholder={metaIntegration.hasAppSecret ? "Saved. Enter only to replace." : ""} required={!metaIntegration.hasAppSecret} />
          </div>
          <div className="action-row">
            <button className="approve" type="submit">Save Meta Connection</button>
          </div>
        </form>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>AI Extraction Provider</h2>
            <p>Model adapter for text, bill images, voice notes, translations, and structured draft records.</p>
          </div>
          <span className={`tag ${aiProvider.status === "Connected" ? "blue" : "warn"}`}>{aiProvider.status}</span>
        </div>
        <div className="integration-summary">
          <Field label="Provider" value={aiProvider.provider} />
          <Field label="Model" value={aiProvider.model} />
          <Field label="API key saved" value={aiProvider.hasApiKey ? "Yes" : "No"} />
          <Field label="Mode" value={aiProvider.extractionMode} />
        </div>
        <form className="master-form" onSubmit={onSaveAI}>
          <div className="form-grid">
            <Select name="provider" label="Provider" options={["sarvam", "openai", "gemini", "ollama_gemma", "manual"]} defaultValue={aiProvider.provider} />
            <Input name="model" label="Model" defaultValue={aiProvider.model} />
            <Input name="baseUrl" label="Base URL" defaultValue={aiProvider.baseUrl} placeholder="Optional. Sarvam defaults to https://api.sarvam.ai" required={false} />
            <Input name="apiKey" label="API key" type="password" placeholder={aiProvider.hasApiKey ? "Saved. Enter only to replace." : "Sarvam, OpenAI, Gemini, or external provider key"} required={!aiProvider.hasApiKey && aiProvider.provider !== "manual"} />
            <Select name="extractionMode" label="Extraction mode" options={["structured_json", "draft_only"]} defaultValue={aiProvider.extractionMode} />
            <Select name="status" label="Status" options={["Draft", "Connected", "Disabled"]} defaultValue={aiProvider.status} />
          </div>
          <div className="module-list">
            <article className="module-card"><h3>Text</h3><p>Classifies intent and extracts outlet, payment, order, issue, and follow-up fields.</p></article>
            <article className="module-card"><h3>Images</h3><p>Bill OCR and photo classification are routed through the provider adapter.</p></article>
            <article className="module-card"><h3>Voice</h3><p>Audio can be transcribed, translated, and converted into verification drafts.</p></article>
          </div>
          <div className="action-row">
            <button className="approve" type="submit">Save AI Provider</button>
          </div>
        </form>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>OpenAI Fallback</h2>
            <p>Use OpenAI when Sarvam does not cover OCR, image understanding, structured extraction, or audio fallback.</p>
          </div>
          <span className={`tag ${openAIIntegration.status === "Connected" ? "blue" : "warn"}`}>{openAIIntegration.status}</span>
        </div>
        <div className="integration-summary">
          <Field label="Text / vision model" value={openAIIntegration.model} />
          <Field label="Audio model" value={openAIIntegration.transcriptionModel} />
          <Field label="API key saved" value={openAIIntegration.hasApiKey ? "Yes" : "No"} />
          <Field label="Last status" value={openAIIntegration.lastTestStatus} />
        </div>
        <form className="master-form" onSubmit={onSaveOpenAI}>
          <div className="form-grid">
            <Select name="model" label="Text, OCR, and vision model" options={withSelectedOption(openAIModelOptions, openAIIntegration.model)} defaultValue={openAIIntegration.model} />
            <Select name="transcriptionModel" label="Audio transcription model" options={withSelectedOption(openAITranscriptionModelOptions, openAIIntegration.transcriptionModel)} defaultValue={openAIIntegration.transcriptionModel} />
            <Input name="baseUrl" label="Base URL" defaultValue={openAIIntegration.baseUrl} placeholder="https://api.openai.com/v1" required={false} />
            <Select name="status" label="Status" options={["Draft", "Connected", "Disabled"]} defaultValue={openAIIntegration.status} />
            <Input name="apiKey" label="OpenAI API key" type="password" placeholder={openAIIntegration.hasApiKey ? "Saved. Enter only to replace." : "Paste OpenAI API key"} required={!openAIIntegration.hasApiKey} />
          </div>
          <div className="module-list">
            <article className="module-card"><h3>Fallback path</h3><p>Sarvam remains first for Indian-language voice; OpenAI fills gaps for images, OCR, and structured drafts.</p></article>
            <article className="module-card"><h3>Model control</h3><p>Change the text and transcription models independently as cost, speed, or accuracy needs change.</p></article>
          </div>
          <div className="action-row">
            <button className="approve" type="submit">Save OpenAI Fallback</button>
          </div>
        </form>
      </article>
    </section>
  );
}

function BulkImportModal({
  type,
  message,
  onClose,
  onDownload,
  onSubmit
}: {
  type: BulkImportType;
  message: string;
  onClose: () => void;
  onDownload: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const template = bulkTemplates[type];

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Bulk import</p>
            <h2 id="bulk-import-title">{template.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">x</button>
        </div>
        <div className="import-guidance">
          <p>Download the template, fill one row per record, keep the column names unchanged, then upload the completed CSV.</p>
          <div className="template-columns">
            {template.columns.map((column) => (
              <span className="tag" key={column}>{column}</span>
            ))}
          </div>
        </div>
        <form className="master-form" onSubmit={onSubmit}>
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={onDownload}>
              Download Template
            </button>
          </div>
          <div className="form-field">
            <label htmlFor="bulk-file">Completed CSV file</label>
            <input id="bulk-file" name="file" type="file" accept=".csv,text/csv" required />
          </div>
          {message && <p className="form-error">{message}</p>}
          <div className="action-row">
            <button className="approve" type="submit">Import Rows</button>
            <button className="reject" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ArchiveConfirmModal({
  request,
  onCancel,
  onConfirm
}: {
  request: ArchiveRequest;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="modal-backdrop">
      <section className="modal compact-modal" role="dialog" aria-modal="true" aria-labelledby="archive-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Archive confirmation</p>
            <h2 id="archive-title">Archive {request.label}</h2>
          </div>
          <button className="icon-button" onClick={onCancel} title="Close">x</button>
        </div>
        <div className="archive-summary">
          <strong>{request.impact}</strong>
          <span>This is a soft archive. Existing history remains available for audit and reporting.</span>
        </div>
        <div className="form-field">
          <label htmlFor="archive-reason">Reason</label>
          <textarea id="archive-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Wrong record, inactive client, duplicate, cancelled by source office..." />
        </div>
        <div className="action-row">
          <button className="reject" type="button" onClick={() => onConfirm(reason.trim())}>Archive Record</button>
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </section>
    </div>
  );
}

function MasterDataModal({
  type,
  brands,
  skus,
  procurementOffices,
  purchaseOrders,
  outlets,
  territories,
  salesmen,
  users,
  initialValues,
  onClose,
  onSubmit
}: {
  type: Exclude<ModalType, null>;
  brands: BrandOption[];
  skus: SkuRow[];
  procurementOffices: ProcurementOffice[];
  purchaseOrders: PurchaseOrderRow[];
  outlets: OutletRow[];
  territories: TerritoryRow[];
  salesmen: SalesmanRow[];
  users: AppUserRow[];
  initialValues?: OutletRow | BrandOption | ProcurementOffice | MaterialFlowRow | PurchaseOrderRow | GoodsReceiptRow | SupplierPayableRow | SkuRow | SalesmanRow | AppUserRow | TaskRow | TerritoryRow | PaymentRow | OrderRow | BillRow;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(initialValues);
  const noun =
    type === "brand"
      ? "Brand Client"
      : type === "procurementOffice"
        ? "Client Branch / Source Office"
      : type === "materialFlow"
        ? "Material Movement"
        : type === "purchaseOrder"
          ? "Purchase Order"
          : type === "goodsReceipt"
            ? "Goods Receipt"
            : type === "supplierPayable"
              ? "Supplier Payable"
      : type === "sku"
        ? "Product / SKU"
      : type === "salesman"
        ? "Sales Rep"
        : type === "user"
          ? "User"
        : type === "territory"
          ? "Territory"
          : type === "payment"
            ? "Payment"
            : type === "order"
              ? "Order"
              : type === "bill"
                ? "Bill"
                : type === "task"
                  ? "Task"
                  : "Outlet";
  const title = `${isEditing ? "Edit" : type === "task" ? "Create" : "Add"} ${noun}`;
  const brandOptions = brands.length ? brands.map((brand) => brand.name) : ["Unassigned"];
  const skuOptions = skus.length ? skus.map(skuOption) : ["Unassigned"];
  const officeOptions = procurementOffices.length ? procurementOffices.map((office) => office.officeName) : ["Unassigned source office"];
  const poOptions = purchaseOrders.length ? purchaseOrders.map((purchaseOrder) => purchaseOrder.poNumber) : ["Draft PO"];
  const outletOptions = outlets.length ? outlets.map((outlet) => outlet.name) : ["Unassigned"];
  const territoryOptions = ["Unassigned", ...territories.map((territory) => territory.name)];
  const salesmanOptions = ["Unassigned", ...salesmen.map((person) => person.name)];
  const assigneeOptions = ["Unassigned", ...users.filter((user) => user.role !== "brand_partner_viewer" && user.role !== "brand_partner_manager").map((user) => user.name)];
  const outletValues = type === "outlet" ? (initialValues as OutletRow | undefined) : undefined;
  const brandValues = type === "brand" ? (initialValues as BrandOption | undefined) : undefined;
  const procurementOfficeValues = type === "procurementOffice" ? (initialValues as ProcurementOffice | undefined) : undefined;
  const materialFlowValues = type === "materialFlow" ? (initialValues as MaterialFlowRow | undefined) : undefined;
  const purchaseOrderValues = type === "purchaseOrder" ? (initialValues as PurchaseOrderRow | undefined) : undefined;
  const goodsReceiptValues = type === "goodsReceipt" ? (initialValues as GoodsReceiptRow | undefined) : undefined;
  const supplierPayableValues = type === "supplierPayable" ? (initialValues as SupplierPayableRow | undefined) : undefined;
  const skuValues = type === "sku" ? (initialValues as SkuRow | undefined) : undefined;
  const salesmanValues = type === "salesman" ? (initialValues as SalesmanRow | undefined) : undefined;
  const userValues = type === "user" ? (initialValues as AppUserRow | undefined) : undefined;
  const taskValues = type === "task" ? (initialValues as TaskRow | undefined) : undefined;
  const territoryValues = type === "territory" ? (initialValues as TerritoryRow | undefined) : undefined;
  const paymentValues = type === "payment" ? (initialValues as PaymentRow | undefined) : undefined;
  const orderValues = type === "order" ? (initialValues as OrderRow | undefined) : undefined;
  const billValues = type === "bill" ? (initialValues as BillRow | undefined) : undefined;
  const initialOrderSku = orderValues ? skus.find((sku) => sku.name === orderValues.sku || sku.code === orderValues.skuCode) : undefined;
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [selectedAdminOrderSkuId, setSelectedAdminOrderSkuId] = useState(initialOrderSku?.id ?? skus[0]?.id ?? "");
  const selectedAdminOrderSku = skus.find((sku) => sku.id === selectedAdminOrderSkuId) ?? initialOrderSku ?? skus[0];
  const visibleAdminOrderSkus = skus
    .filter((sku) => {
      const query = adminOrderSearch.trim().toLowerCase();
      if (!query) return true;
      return `${sku.name} ${sku.code} ${sku.brand} ${sku.category}`.toLowerCase().includes(query);
    })
    .slice(0, 8);

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Master data</p>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">x</button>
        </div>
        {type === "procurementOffice" && (
          <div className="modal-insight-grid">
            <Field label="Client" value={procurementOfficeValues?.brand ?? "Select brand"} />
            <Field label="Branch role" value={procurementOfficeValues?.procurementRole ?? "Source / approval / supply"} />
            <Field label="Lead time" value={procurementOfficeValues ? `${procurementOfficeValues.leadTimeDays} days` : "Set expected days"} />
            <Field label="Replenishment" value={procurementOfficeValues?.replenishmentMode ?? "Direct / PO / warehouse"} />
          </div>
        )}
        {type === "brand" && (
          <div className="modal-insight-grid">
            <Field label="Client status" value={brandValues?.status ?? "Active"} />
            <Field label="Category" value={brandValues?.category ?? "Set category"} />
            <Field label="Procurement owner" value={brandValues?.contact ?? "Primary contact"} />
            <Field label="Branch setup" value="Add regional source offices after saving" />
          </div>
        )}
        <form className="master-form" onSubmit={onSubmit}>
          {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}
          <div className="form-grid">
            {type === "outlet" && (
              <>
                <Input name="name" label="Outlet name" defaultValue={outletValues?.name} />
                <Input name="owner" label="Owner / contact" defaultValue={outletValues?.owner} />
                <Input name="phone" label="Phone / WhatsApp" defaultValue={outletValues?.phone} />
                <Input name="city" label="City" defaultValue={outletValues?.city} />
                <Input name="channel" label="Channel type" defaultValue={outletValues?.channel} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={outletValues?.brand} />
                <Select name="territory" label="Territory / beat" options={territoryOptions} defaultValue={outletValues?.territory} />
                <Select name="assignedSalesman" label="Assigned sales rep" options={salesmanOptions} defaultValue={outletValues?.assignedSalesman} />
                <Input name="creditLimit" label="Credit limit" type="number" required={false} defaultValue={outletValues?.creditLimit ? String(outletValues.creditLimit) : undefined} />
                <Select name="creditHoldStatus" label="Credit hold" options={["Clear", "Watch", "Hold", "Blocked"]} defaultValue={outletValues?.creditHoldStatus} />
                <Select name="status" label="Status" options={["Active", "Prospect", "Inactive"]} defaultValue={outletValues?.status} />
              </>
            )}
            {type === "brand" && (
              <>
                <Input name="name" label="Brand / client name" defaultValue={brandValues?.name} />
                <Input name="category" label="Category" defaultValue={brandValues?.category} />
                <Input name="contact" label="Primary procurement office / contact" defaultValue={brandValues?.contact} />
                <Input name="contactEmail" label="Procurement email" type="email" required={false} defaultValue={brandValues?.contactEmail} />
                <Input name="contactPhone" label="Procurement phone" required={false} defaultValue={brandValues?.contactPhone} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={brandValues?.status} />
              </>
            )}
            {type === "procurementOffice" && (
              <>
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={procurementOfficeValues?.brand} />
                <Input name="officeName" label="Branch / source office" defaultValue={procurementOfficeValues?.officeName} />
                <Input name="region" label="Region" defaultValue={procurementOfficeValues?.region} />
                <Input name="city" label="City" defaultValue={procurementOfficeValues?.city} />
                <Input name="state" label="State" defaultValue={procurementOfficeValues?.state} />
                <Input name="contact" label="Procurement contact" defaultValue={procurementOfficeValues?.contact} />
                <Input name="phone" label="Phone" required={false} defaultValue={procurementOfficeValues?.phone} />
                <Input name="email" label="Email" type="email" required={false} defaultValue={procurementOfficeValues?.email} />
                <Input name="procurementRole" label="Role / responsibility" defaultValue={procurementOfficeValues?.procurementRole} />
                <Input name="leadTimeDays" label="Lead time days" type="number" required={false} defaultValue={procurementOfficeValues ? String(procurementOfficeValues.leadTimeDays) : undefined} />
                <Input name="replenishmentMode" label="Replenishment mode" defaultValue={procurementOfficeValues?.replenishmentMode} />
                <Select name="status" label="Status" options={["Primary", "Alternate", "Inactive"]} defaultValue={procurementOfficeValues?.status} />
              </>
            )}
            {type === "materialFlow" && (
              <>
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={materialFlowValues?.brand} />
                <Select name="sku" label="Product / SKU" options={skuOptions} defaultValue={materialFlowValues?.sku ? (materialFlowValues.skuCode ? `${materialFlowValues.sku} (${materialFlowValues.skuCode})` : materialFlowValues.sku) : undefined} />
                <Select name="movementType" label="Movement type" options={["Inbound procurement", "Outbound sale", "Billed dispatch", "Return / hold"]} defaultValue={materialFlowValues?.movementType} />
                <Input name="fromLocation" label="From" defaultValue={materialFlowValues?.fromLocation} />
                <Input name="toLocation" label="To" defaultValue={materialFlowValues?.toLocation} />
                <Input name="quantity" label="Quantity" type="number" defaultValue={materialFlowValues ? String(materialFlowValues.quantity) : undefined} />
                <Input name="value" label="Value" type="number" required={false} defaultValue={materialFlowValues ? String(materialFlowValues.value) : undefined} />
                <Input name="expectedDate" label="Expected / document date" type="date" required={false} defaultValue={materialFlowValues?.expectedDate === "No expected date" ? "" : materialFlowValues?.expectedDate} />
                <Input name="status" label="Movement status" defaultValue={materialFlowValues?.status} />
                <Input name="documentRef" label="Document reference" required={false} defaultValue={materialFlowValues?.documentRef} />
              </>
            )}
            {type === "purchaseOrder" && (
              <>
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={purchaseOrderValues?.brand} />
                <Select name="officeName" label="Source office / branch" options={officeOptions} defaultValue={purchaseOrderValues?.officeName} />
                <Input name="poNumber" label="PO number" defaultValue={purchaseOrderValues?.poNumber === "Draft PO" ? "" : purchaseOrderValues?.poNumber} />
                <Input name="expectedDate" label="Expected receipt date" type="date" required={false} defaultValue={purchaseOrderValues?.expectedDate === "No expected date" ? "" : purchaseOrderValues?.expectedDate} />
                <Input name="totalValue" label="Total value" type="number" required={false} defaultValue={purchaseOrderValues ? String(purchaseOrderValues.totalValue) : undefined} />
                <Select name="status" label="Status" options={["Draft", "Sent", "Confirmed", "Partially received", "Received", "Cancelled"]} defaultValue={purchaseOrderValues?.status} />
              </>
            )}
            {type === "goodsReceipt" && (
              <>
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={goodsReceiptValues?.brand} />
                <Select name="officeName" label="Source office / branch" options={officeOptions} defaultValue={goodsReceiptValues?.officeName} />
                <Select name="poNumber" label="Linked PO" options={poOptions} defaultValue={goodsReceiptValues?.poNumber} />
                <Input name="receiptNumber" label="GRN / receipt number" defaultValue={goodsReceiptValues?.receiptNumber === "Draft GRN" ? "" : goodsReceiptValues?.receiptNumber} />
                <Input name="receivedDate" label="Received date" type="date" required={false} defaultValue={goodsReceiptValues?.receivedDate === "No receipt date" ? "" : goodsReceiptValues?.receivedDate} />
                <Input name="warehouse" label="Warehouse" defaultValue={goodsReceiptValues?.warehouse ?? "Distributor warehouse"} />
                {!isEditing && <Select name="sku" label="Received product / SKU" options={skuOptions} />}
                {!isEditing && <Input name="quantity" label="Received quantity" type="number" required={false} />}
                {!isEditing && <Input name="value" label="Received value" type="number" required={false} />}
                <Select name="status" label="Status" options={["Draft", "Received", "Quality hold", "Posted", "Cancelled"]} defaultValue={goodsReceiptValues?.status ?? "Received"} />
              </>
            )}
            {type === "supplierPayable" && (
              <>
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={supplierPayableValues?.brand} />
                <Select name="officeName" label="Source office / branch" options={officeOptions} defaultValue={supplierPayableValues?.officeName} />
                <Select name="poNumber" label="Linked PO" options={poOptions} defaultValue={supplierPayableValues?.poNumber} />
                <Input name="invoiceNumber" label="Supplier invoice number" defaultValue={supplierPayableValues?.invoiceNumber === "Draft invoice" ? "" : supplierPayableValues?.invoiceNumber} />
                <Input name="invoiceDate" label="Invoice date" type="date" required={false} defaultValue={supplierPayableValues?.invoiceDate === "No invoice date" ? "" : supplierPayableValues?.invoiceDate} />
                <Input name="amountDue" label="Amount due" type="number" defaultValue={supplierPayableValues ? String(supplierPayableValues.amountDue) : undefined} />
                <Input name="amountPaid" label="Amount paid" type="number" required={false} defaultValue={supplierPayableValues ? String(supplierPayableValues.amountPaid) : undefined} />
                <Input name="dueDate" label="Due date" type="date" required={false} defaultValue={supplierPayableValues?.dueDate === "No due date" ? "" : supplierPayableValues?.dueDate} />
                <Select name="status" label="Status" options={["Pending", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue={supplierPayableValues?.status ?? "Pending"} />
              </>
            )}
            {type === "sku" && (
              <>
                <Input name="name" label="Product / SKU name" defaultValue={skuValues?.name} />
                <Input name="code" label="SKU code" required={false} defaultValue={skuValues?.code} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={skuValues?.brand} />
                <Input name="category" label="Category" required={false} defaultValue={skuValues?.category === "Uncategorized" ? "" : skuValues?.category} />
                <Input name="unit" label="Unit / pack size" required={false} defaultValue={skuValues?.unit === "Unit" ? "" : skuValues?.unit} />
                <Input name="mrp" label="MRP" type="number" required={false} defaultValue={skuValues?.mrp ? String(skuValues.mrp) : undefined} />
                <Input name="imageUrl" label="Product picture URL / update image" type="url" required={false} defaultValue={skuValues?.imageUrl} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={skuValues?.status} />
              </>
            )}
            {type === "salesman" && (
              <>
                <Input name="name" label="Sales rep name" defaultValue={salesmanValues?.name} />
                <Input name="phone" label="App login / phone" defaultValue={salesmanValues?.phone} />
                <Input name="city" label="City" defaultValue={salesmanValues?.city} />
                <Input name="territory" label="Territory" defaultValue={salesmanValues?.territory} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={salesmanValues?.status} />
              </>
            )}
            {type === "user" && (
              <>
                <Input name="name" label="Full name" defaultValue={userValues?.name} />
                <Input name="email" label="Login email" type="email" required={false} defaultValue={userValues?.email} />
                <Input name="phone" label="Phone / login code source" defaultValue={userValues?.phone} />
                <Select name="role" label="Login role" options={["Admin", "Manager", "Admin Operator", "Sales Executive", "Brand Viewer", "Brand Manager", "Finance", "Integration"]} defaultValue={userValues?.roleLabel} />
                <Input name="territory" label="Territory / team" required={false} defaultValue={userValues?.territory === "Managed in Sales App & Team" ? "" : userValues?.territory} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={userValues?.status} />
              </>
            )}
            {type === "task" && (
              <>
                <Input name="title" label="Task title" defaultValue={taskValues?.title} />
                <Select name="taskType" label="Task type" options={["Payment follow-up", "Order confirmation", "Delivery follow-up", "Complaint resolution", "Stock refill", "Display material request", "New outlet onboarding", "Manager escalation"]} defaultValue={taskValues?.taskType} />
                <Input name="description" label="Description" defaultValue={taskValues?.description} />
                <Select name="assignedTo" label="Assigned to" options={assigneeOptions} defaultValue={taskValues?.assignedTo} />
                <Input name="outlet" label="Outlet" defaultValue={taskValues?.outlet === "Unassigned" ? "" : taskValues?.outlet} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={taskValues?.brand} />
                <Input name="dueDate" label="Due date" type="date" required={false} defaultValue={taskValues?.dueDate === "No due date" ? "" : taskValues?.dueDate} />
                <Select name="priority" label="Priority" options={["Low", "Medium", "High", "Critical"]} defaultValue={taskValues?.priority} />
                <Select name="status" label="Status" options={["Open", "In progress", "Waiting for response", "Completed", "Cancelled", "Overdue"]} defaultValue={taskValues?.status} />
              </>
            )}
            {type === "territory" && (
              <>
                <Input name="name" label="Territory name" defaultValue={territoryValues?.name} />
                <Input name="city" label="City" defaultValue={territoryValues?.city} />
                <Input name="state" label="State" defaultValue={territoryValues?.state} />
                <Input name="region" label="Region" defaultValue={territoryValues?.region === "Unassigned" ? "" : territoryValues?.region} required={false} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={territoryValues?.status} />
              </>
            )}
            {type === "payment" && (
              <>
                <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={paymentValues?.outlet} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={paymentValues?.brand} />
                <Input name="billNumber" label="Linked bill / invoice" defaultValue={paymentValues?.billNumber === "Unallocated" ? "" : paymentValues?.billNumber} required={false} />
                <Input name="amountDue" label="Amount due" type="number" defaultValue={paymentValues?.amountDue ? String(paymentValues.amountDue) : undefined} />
                <Input name="amountCollected" label="Amount collected" type="number" defaultValue={paymentValues ? String(paymentValues.amountCollected) : undefined} required={false} />
                <Input name="dueDate" label="Due date" type="date" defaultValue={paymentValues?.dueDate === "No due date" ? "" : paymentValues?.dueDate} required={false} />
                <Input name="promisedPaymentDate" label="Promised date" type="date" defaultValue={paymentValues?.promisedPaymentDate === "No promise" ? "" : paymentValues?.promisedPaymentDate} required={false} />
                <Input name="paymentMode" label="Payment mode" defaultValue={paymentValues?.paymentMode === "Unassigned" ? "" : paymentValues?.paymentMode} required={false} />
                <Input name="receiptNumber" label="Receipt number" defaultValue={paymentValues?.receiptNumber === "Draft receipt" ? "" : paymentValues?.receiptNumber} required={false} />
                <Input name="collectorName" label="Collector assigned" defaultValue={paymentValues?.collectorName === "Unassigned" ? "" : paymentValues?.collectorName} required={false} />
                <div className="form-field wide">
                  <label htmlFor="allocationSummary">Invoice allocation</label>
                  <textarea id="allocationSummary" name="allocationSummary" rows={3} defaultValue={paymentValues?.allocationSummary} placeholder="Example: INV-1001:5000, INV-1002:3000" />
                </div>
                <Select name="status" label="Status" options={["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue={paymentValues?.status} />
                <Select name="riskLevel" label="Risk level" options={["Low", "Medium", "High", "Critical"]} defaultValue={paymentValues?.riskLevel} />
                <Select name="writeOffStatus" label="Write-off approval" options={["Not requested", "Requested", "Approved", "Rejected"]} defaultValue={paymentValues?.writeOffStatus} />
                <Select name="disputeStatus" label="Dispute lifecycle" options={["Not disputed", "Opened", "Under review", "Resolved", "Rejected"]} defaultValue={paymentValues?.disputeStatus} />
                <Select name="settlementStatus" label="Settlement status" options={["Unreconciled", "Matched", "Exception", "Settled"]} defaultValue={paymentValues?.settlementStatus} />
                <Input name="settlementReference" label="Bank / UPI / cash reference" defaultValue={paymentValues?.settlementReference} required={false} />
                <Input name="settlementDate" label="Settlement date" type="date" defaultValue={paymentValues?.settlementDate === "No settlement date" ? "" : paymentValues?.settlementDate} required={false} />
              </>
            )}
            {type === "order" && (
              <>
                <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={orderValues?.outlet} />
                <input type="hidden" name="sku" value={selectedAdminOrderSku ? skuOption(selectedAdminOrderSku) : orderSkuOption(orderValues) ?? ""} />
                <div className="form-field wide">
                  <label htmlFor="admin-order-product-search">Product / SKU</label>
                  <input id="admin-order-product-search" type="search" value={adminOrderSearch} onChange={(event) => setAdminOrderSearch(event.target.value)} placeholder="Search product, SKU, brand, or category" />
                  <div className="sales-product-picker wide">
                    {visibleAdminOrderSkus.map((sku) => (
                      <button
                        className={`sales-product-option ${selectedAdminOrderSku?.id === sku.id ? "active" : ""}`}
                        key={sku.id}
                        type="button"
                        onClick={() => setSelectedAdminOrderSkuId(sku.id)}
                      >
                        <span className="sales-product-thumb">
                          {sku.imageUrl ? <img src={sku.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : productImageFallback(sku)}
                        </span>
                        <span>
                          <strong>{sku.name}</strong>
                          <small>{sku.brand} - {sku.code || "No SKU code"}</small>
                        </span>
                        <b>{money(sku.mrp)}</b>
                      </button>
                    ))}
                  </div>
                </div>
                <Input name="quantity" label="Quantity" type="number" defaultValue={orderValues?.quantity ? String(orderValues.quantity) : undefined} />
                <Input name="unitPrice" label="Unit price" type="number" required={false} defaultValue={orderValues?.unitPrice ? String(orderValues.unitPrice) : undefined} />
                <Input name="expectedValue" label="Order value" type="number" required={false} defaultValue={orderValues?.expectedValue ? String(orderValues.expectedValue) : undefined} />
                <Input name="expectedDeliveryDate" label="Expected delivery date" type="date" defaultValue={orderValues?.expectedDeliveryDate === "No delivery date" ? "" : orderValues?.expectedDeliveryDate} required={false} />
                <Select name="status" label="Status" options={["Intent captured", "Confirmed", "Billed", "Delivered", "Cancelled", "On hold"]} defaultValue={orderValues?.status} />
              </>
            )}
            {type === "bill" && (
              <>
                <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={billValues?.outlet} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={billValues?.brand} />
                <Input name="linkedOrderId" label="Linked order ID" defaultValue={billValues?.orderId} required={false} />
                <Input name="billNumber" label="Bill number" defaultValue={billValues?.billNumber === "Unnumbered" ? "" : billValues?.billNumber} required={false} />
                <Input name="billDate" label="Bill date" type="date" defaultValue={billValues?.billDate === "No bill date" ? "" : billValues?.billDate} required={false} />
                <Input name="totalAmount" label="Total amount" type="number" defaultValue={billValues?.totalAmount ? String(billValues.totalAmount) : undefined} />
                <Select name="paymentStatus" label="Payment status" options={["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue={billValues?.paymentStatus} />
                <Input name="billImagePath" label="Invoice image reference" defaultValue={billValues?.billImagePath} required={false} />
              </>
            )}
          </div>
          <div className="action-row">
            <button className="approve" type="submit">{isEditing ? "Update" : "Save"}</button>
            <button className="reject" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Input({
  name,
  label,
  required = true,
  type = "text",
  defaultValue,
  placeholder
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} required defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
