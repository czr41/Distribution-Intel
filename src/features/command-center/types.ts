export type CommandRecord = {
  id: string;
  outlet: string;
  city: string;
  partner: string;
  fieldAgent: string;
  type: "Sale" | "Stockout" | "Merchandising" | "Order" | "Visit";
  units: number;
  value: number;
  status: "pending" | "verified" | "needs clarification";
  confidence: number;
  evidence: string;
  message: string;
  createdAt: string;
};

export type BrandOption = {
  id: string;
  name: string;
  category: string;
  contact: string;
  contactEmail: string;
  contactPhone: string;
  status: "Active" | "Inactive";
};

export type ProcurementOffice = {
  id: string;
  brand: string;
  officeName: string;
  region: string;
  city: string;
  state: string;
  contact: string;
  phone: string;
  email: string;
  procurementRole: string;
  leadTimeDays: number;
  replenishmentMode: string;
  status: "Primary" | "Alternate" | "Inactive";
};

export type MaterialFlowRow = {
  id: string;
  brand: string;
  sku: string;
  skuCode: string;
  movementType: "Inbound procurement" | "Outbound sale" | "Billed dispatch" | "Return / hold";
  fromLocation: string;
  toLocation: string;
  quantity: number;
  value: number;
  expectedDate: string;
  status: string;
  documentRef: string;
};

export type InventoryPositionRow = {
  id: string;
  brand: string;
  sku: string;
  skuCode: string;
  onHand: number;
  reserved: number;
  available: number;
  inbound: number;
  damaged: number;
  reorderLevel: number;
  warehouse: string;
  status: "Healthy" | "Low stock" | "Reorder due";
};

export type PurchaseOrderRow = {
  id: string;
  brand: string;
  officeName: string;
  poNumber: string;
  expectedDate: string;
  totalValue: number;
  status: "Draft" | "Sent" | "Confirmed" | "Partially received" | "Received" | "Cancelled";
};

export type GoodsReceiptRow = {
  id: string;
  brand: string;
  officeName: string;
  poNumber: string;
  receiptNumber: string;
  receivedDate: string;
  warehouse: string;
  status: "Draft" | "Received" | "Quality hold" | "Posted" | "Cancelled";
};

export type SupplierPayableRow = {
  id: string;
  brand: string;
  officeName: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: "Pending" | "Partially paid" | "Paid" | "Overdue" | "Disputed" | "Written off";
};

export type OutletRow = {
  id: string;
  name: string;
  city: string;
  channel: string;
  brand: string;
  territory: string;
  assignedSalesman: string;
  status: "Active" | "Prospect" | "Inactive";
  owner: string;
  phone: string;
};

export type SalesmanRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  territory: string;
  status: "Active" | "Inactive";
};

export type AppUserRole =
  | "super_admin"
  | "operations_manager"
  | "admin_operator"
  | "field_executive"
  | "brand_partner_viewer"
  | "brand_partner_manager"
  | "finance_collections"
  | "integration_user";

export type AppUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AppUserRole;
  roleLabel: string;
  territory: string;
  status: "Active" | "Inactive";
};

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  taskType: string;
  assignedTo: string;
  outlet: string;
  brand: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In progress" | "Waiting for response" | "Completed" | "Cancelled" | "Overdue";
};

export type TerritoryRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string;
  status: "Active" | "Inactive";
};

export type SkuRow = {
  id: string;
  name: string;
  code: string;
  brand: string;
  category: string;
  unit: string;
  mrp: number;
  imageUrl: string;
  status: "Active" | "Inactive";
};

export type PaymentRow = {
  id: string;
  outlet: string;
  brand: string;
  amountDue: number;
  amountCollected: number;
  dueDate: string;
  promisedPaymentDate: string;
  paymentMode: string;
  status: "Due" | "Partially paid" | "Paid" | "Overdue" | "Disputed" | "Written off";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
};

export type OrderRow = {
  id: string;
  outlet: string;
  brand: string;
  sku: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  expectedValue: number;
  expectedDeliveryDate: string;
  status: "Intent captured" | "Confirmed" | "Billed" | "Delivered" | "Cancelled" | "On hold";
};

export type BillRow = {
  id: string;
  outlet: string;
  brand: string;
  billNumber: string;
  billDate: string;
  totalAmount: number;
  paymentStatus: "Due" | "Partially paid" | "Paid" | "Overdue" | "Disputed" | "Written off";
};

export type VerificationDraftRecord = {
  id: string;
  recordType: string;
  title: string;
  status: "Needs review" | "Approved" | "Rejected";
  confidence: number;
  primaryCategory: string;
  secondaryCategories: string[];
  languageDetected: string;
  normalizedText: string;
  reasonForReview: string;
  rawText: string;
  transcriptText: string;
  ocrText: string;
  draftJson: Record<string, unknown>;
  outletName: string;
  brandName: string;
  amount: number;
  quantity: string;
  sku: string;
  createdAt: string;
};

export type MetaIntegrationSettings = {
  id?: string;
  displayName: string;
  status: "Connected" | "Draft" | "Disabled";
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  businessPortfolioId: string;
  graphApiVersion: string;
  webhookUrl: string;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  hasVerifyToken: boolean;
  lastTestStatus: string;
  lastError: string;
  updatedAt: string;
};

export type AIProviderSettings = {
  id?: string;
  provider: "gemini" | "sarvam" | "openai" | "ollama_gemma" | "manual";
  model: string;
  status: "Connected" | "Draft" | "Disabled";
  baseUrl: string;
  hasApiKey: boolean;
  extractionMode: "structured_json" | "draft_only";
  lastTestStatus: string;
  lastError: string;
  updatedAt: string;
};

export type OpenAIIntegrationSettings = {
  status: "Connected" | "Draft" | "Disabled";
  model: string;
  transcriptionModel: string;
  baseUrl: string;
  hasApiKey: boolean;
  lastTestStatus: string;
  lastError: string;
  updatedAt: string;
};

export type CommandCenterData = {
  records: CommandRecord[];
  users: AppUserRow[];
  brands: BrandOption[];
  procurementOffices: ProcurementOffice[];
  materialFlows: MaterialFlowRow[];
  inventoryPositions: InventoryPositionRow[];
  purchaseOrders: PurchaseOrderRow[];
  goodsReceipts: GoodsReceiptRow[];
  supplierPayables: SupplierPayableRow[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  skus: SkuRow[];
  tasks: TaskRow[];
  territories: TerritoryRow[];
  payments: PaymentRow[];
  orders: OrderRow[];
  bills: BillRow[];
  verificationDrafts: VerificationDraftRecord[];
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
  openAIIntegration: OpenAIIntegrationSettings;
  setupError?: string;
};
