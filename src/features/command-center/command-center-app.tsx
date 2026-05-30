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
  MetaIntegrationSettings,
  OpenAIIntegrationSettings,
  OrderRow,
  OutletRow,
  PaymentRow,
  SalesmanRow,
  TaskRow,
  TerritoryRow,
  VerificationDraftRecord
} from "./types";

type View = "command" | "inbox" | "verification" | "media" | "outlets" | "tasks" | "payments" | "orders" | "bills" | "territories" | "reports" | "partners" | "ops" | "users" | "integrations";
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
type ModalType = "outlet" | "brand" | "salesman" | "user" | "task" | "territory" | "payment" | "order" | "bill" | null;
type BulkImportType = Exclude<ModalType, null>;
type IntegrationNotice = { type: "success" | "error"; message: string };
type SalesWorkflow = "visit" | "order" | "payment" | "evidence";
type EditableMasterData =
  | { type: "outlet"; record: OutletRow }
  | { type: "brand"; record: BrandOption }
  | { type: "salesman"; record: SalesmanRow }
  | { type: "user"; record: AppUserRow }
  | { type: "task"; record: TaskRow }
  | { type: "territory"; record: TerritoryRow }
  | { type: "payment"; record: PaymentRow }
  | { type: "order"; record: OrderRow }
  | { type: "bill"; record: BillRow };
type CommandCenterActions = {
  createBrand: (formData: FormData) => Promise<BrandOption>;
  createOutlet: (formData: FormData) => Promise<OutletRow>;
  createSalesman: (formData: FormData) => Promise<SalesmanRow>;
  createUser: (formData: FormData) => Promise<AppUserRow>;
  createTask: (formData: FormData) => Promise<TaskRow>;
  createTerritory: (formData: FormData) => Promise<TerritoryRow>;
  createPayment: (formData: FormData) => Promise<PaymentRow>;
  createOrder: (formData: FormData) => Promise<OrderRow>;
  createBill: (formData: FormData) => Promise<BillRow>;
  updateBrand: (formData: FormData) => Promise<BrandOption>;
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
};

const openAIModelOptions = ["gpt-5.5", "gpt-5.5-pro", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4.1-mini", "gpt-4.1-nano"];
const openAITranscriptionModelOptions = ["gpt-4o-mini-transcribe", "gpt-4o-transcribe"];

function withSelectedOption(options: string[], selected: string) {
  return selected && !options.includes(selected) ? [selected, ...options] : options;
}

const viewTitles: Record<View, string> = {
  command: "ERP / CRM Command Center",
  inbox: "Retailer WhatsApp",
  verification: "Verification Queue",
  media: "Media Extraction Lab",
  outlets: "Outlet Master",
  tasks: "Tasks",
  payments: "Payments",
  orders: "Orders",
  bills: "Bills",
  territories: "Territories",
  reports: "Reports",
  partners: "Brand Partner Dashboard",
  ops: "Sales App & Team",
  users: "User Management",
  integrations: "Integrations"
};

const bulkTemplates: Record<BulkImportType, { title: string; filename: string; columns: string[]; sample: string[] }> = {
  outlet: {
    title: "Outlet Bulk Import",
    filename: "shipd2r-outlet-import-template.csv",
    columns: ["name", "owner", "phone", "city", "channel", "brand", "status"],
    sample: ["Sri Lakshmi Stores", "Ramesh Kumar", "9876543210", "Tumkur", "Kirana store", "NourishCo", "Active"]
  },
  brand: {
    title: "Client Bulk Import",
    filename: "shipd2r-client-import-template.csv",
    columns: ["name", "category", "contact", "status"],
    sample: ["NourishCo", "Packaged foods", "Ananya Rao", "Active"]
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
    columns: ["title", "description", "taskType", "outlet", "brand", "dueDate", "priority", "status"],
    sample: ["Payment follow-up", "Confirm pending payment collection", "Payment follow-up", "Sri Lakshmi Stores", "NourishCo", "2026-05-22", "High", "Open"]
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
    columns: ["outlet", "brand", "amountDue", "amountCollected", "dueDate", "promisedPaymentDate", "paymentMode", "status", "riskLevel"],
    sample: ["Sri Lakshmi Stores", "NourishCo", "12400", "0", "2026-05-28", "2026-05-30", "UPI", "Due", "High"]
  },
  order: {
    title: "Order Bulk Import",
    filename: "shipd2r-order-import-template.csv",
    columns: ["outlet", "brand", "expectedValue", "expectedDeliveryDate", "status"],
    sample: ["Sri Lakshmi Stores", "NourishCo", "8420", "2026-05-29", "Confirmed"]
  },
  bill: {
    title: "Bill Bulk Import",
    filename: "shipd2r-bill-import-template.csv",
    columns: ["outlet", "brand", "billNumber", "billDate", "totalAmount", "paymentStatus"],
    sample: ["Sri Lakshmi Stores", "NourishCo", "INV-1001", "2026-05-24", "8420", "Due"]
  }
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function confidenceLabel(record: CommandRecord) {
  return record.confidence >= 0.85 ? "High confidence" : "Needs review";
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
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
  if (user.role === "operations_manager") return "manager";
  if (user.role === "super_admin" || user.role === "admin_operator") return "admin";
  return "partner";
}

function canSeeView(user: AppUserRow, view: View) {
  const accessKind = userAccessKind(user);
  if (accessKind === "admin") return true;
  if (accessKind === "manager") return !["users", "integrations", "verification"].includes(view);
  if (accessKind === "partner") return ["partners", "reports"].includes(view);
  return ["ops", "outlets", "tasks", "orders", "payments", "media"].includes(view);
}

function loginCodeFor(user: AppUserRow) {
  const digits = user.phone.replace(/\D/g, "");
  return digits.slice(-4) || "0000";
}

export function CommandCenterApp({ initialData, actions }: { initialData: CommandCenterData; actions: CommandCenterActions }) {
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [activeView, setActiveView] = useState<View>("command");
  const [selectedId, setSelectedId] = useState(initialData.records[0]?.id ?? "");
  const [records, setRecords] = useState<CommandRecord[]>(initialData.records);
  const [users, setUsers] = useState<AppUserRow[]>(initialData.users);
  const [brands, setBrands] = useState<BrandOption[]>(initialData.brands);
  const [outlets, setOutlets] = useState<OutletRow[]>(initialData.outlets);
  const [salesmen, setSalesmen] = useState<SalesmanRow[]>(initialData.salesmen);
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
    const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
    const accessCode = String(form.get("accessCode") ?? "").trim();
    const roleMatches: Record<string, AppUserRow["role"][]> = {
      Admin: ["super_admin", "admin_operator"],
      Manager: ["operations_manager"],
      "Sales Executive": ["field_executive"],
      "Brand Partner": ["brand_partner_viewer", "brand_partner_manager"]
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
      const identifiers = [user.email, user.phone, user.name].map((value) => value.toLowerCase());
      return roleMatches[role]?.includes(user.role) && identifiers.some((value) => value === identifier) && loginCodeFor(user) === accessCode;
    });

    if (matched) {
      setLoginError("");
      setCurrentUser(matched);
      const firstView = userAccessKind(matched) === "sales" ? "ops" : "command";
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
    form.set("status", "Intent captured");
    const saved = await actions.createOrder(form);
    setOrders((current) => [saved, ...current]);
    return saved;
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
        tasks={tasks}
        outlets={outlets}
        orders={orders}
        payments={payments}
        onCreateVisit={createSalesVisit}
        onCreateOrder={createSalesOrder}
        onCreatePayment={createSalesPayment}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  const accessKind = userAccessKind(currentUser);
  const isAdminUser = accessKind === "admin";
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
    setEditingItem(null);
    setModalType(type);
  }

  function openEdit(item: EditableMasterData) {
    setEditingItem(item);
    setModalType(item.type);
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
      await importRows(bulkImportType, normalizedRows);
      setBulkImportMessage(`Imported ${normalizedRows.length} ${normalizedRows.length === 1 ? "row" : "rows"}.`);
      setBulkImportType(null);
    } catch (error) {
      setBulkImportMessage(error instanceof Error ? error.message : "Import failed. Check the CSV values and try again.");
    }
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
    media: isAdminUser
      ? [
          { label: "Configure AI", action: () => setActiveView("integrations") },
          { label: "Open Inbox", action: () => setActiveView("inbox") }
        ]
      : [{ label: "Open Inbox", action: () => setActiveView("inbox") }],
    outlets: [
      { label: "Add Outlet", action: () => openCreate("outlet") },
      { label: "Bulk Import", action: () => openBulkImport("outlet") }
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
    reports: [{ label: "Generate Report", action: () => setActiveView("reports") }],
    partners: [
      { label: "Add Client", action: () => openCreate("brand") },
      { label: "Bulk Import", action: () => openBulkImport("brand") }
    ],
    ops: [
      { label: "Add Sales Rep", action: () => openCreate("salesman") },
      { label: "Bulk Import", action: () => openBulkImport("salesman") }
    ],
    users: [
      { label: "Add User", action: () => openCreate("user") },
      { label: "Bulk Import", action: () => openBulkImport("user") }
    ],
    integrations: [{ label: "Copy Webhook Path", action: () => navigator.clipboard?.writeText(metaIntegration.webhookUrl) }]
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
              <span>{view === "ops" ? "Sales App" : view === "inbox" ? "Retailer WhatsApp" : view === "users" ? "Users" : view[0].toUpperCase() + view.slice(1)}</span>
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
            <p className="eyebrow">Shipd2r central ERP / CRM</p>
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
              tasks={tasks}
              payments={payments}
              orders={orders}
              bills={bills}
              records={records}
              pendingAdminReview={pendingDraftCount || pendingCount}
            />
          ) : (
          <>
            <section className="metrics-grid">
              <Metric label="Pending verification" value={pendingDraftCount || pendingCount} detail="Human-in-the-loop queue" />
              <Metric label="Verified outlets" value={verifiedCount} detail="Partner-visible records" />
              <Metric label="Sales app coverage" value={`${Math.round((verifiedCount / recordCount) * 100)}%`} detail="Beat plan touched today" />
              <Metric label="Extraction accuracy" value={`${Math.round((highConfidenceCount / recordCount) * 100)}%`} detail="AI suggestions accepted" />
            </section>
            <section className="split-layout">
              <QueuePanel records={records} selectedId={selectedId} onSelect={setSelectedId} />
              <RecordDetail record={selectedRecord} onVerify={verifyRecord} onSendBack={sendBack} />
            </section>
          </>
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

        {activeView === "media" && <MediaLabView aiProvider={aiProvider} />}
        {activeView === "outlets" && <OutletsView outlets={outlets} onAdd={() => openCreate("outlet")} onEdit={(outlet) => openEdit({ type: "outlet", record: outlet })} onBulkImport={() => openBulkImport("outlet")} />}
        {activeView === "partners" && (
          <PartnersView brands={brands} records={visiblePartnerRecords} partnerFilter={partnerFilter} onFilter={setPartnerFilter} onAdd={() => openCreate("brand")} onEdit={(brand) => openEdit({ type: "brand", record: brand })} onBulkImport={() => openBulkImport("brand")} />
        )}
        {activeView === "ops" && <OpsView salesmen={salesmen} onAdd={() => openCreate("salesman")} onEdit={(person) => openEdit({ type: "salesman", record: person })} onBulkImport={() => openBulkImport("salesman")} />}
        {activeView === "users" && <UsersView users={users} onAdd={() => openCreate("user")} onEdit={(user) => openEdit({ type: "user", record: user })} onBulkImport={() => openBulkImport("user")} />}
        {activeView === "tasks" && <TasksView tasks={tasks} onAdd={() => openCreate("task")} onEdit={(task) => openEdit({ type: "task", record: task })} onBulkImport={() => openBulkImport("task")} />}
        {activeView === "territories" && <TerritoriesView territories={territories} onAdd={() => openCreate("territory")} onEdit={(territory) => openEdit({ type: "territory", record: territory })} onBulkImport={() => openBulkImport("territory")} />}
        {activeView === "payments" && <PaymentsView payments={payments} onAdd={() => openCreate("payment")} onEdit={(payment) => openEdit({ type: "payment", record: payment })} onBulkImport={() => openBulkImport("payment")} />}
        {activeView === "orders" && <OrdersView orders={orders} onAdd={() => openCreate("order")} onEdit={(order) => openEdit({ type: "order", record: order })} onBulkImport={() => openBulkImport("order")} />}
        {activeView === "bills" && <BillsView bills={bills} onAdd={() => openCreate("bill")} onEdit={(bill) => openEdit({ type: "bill", record: bill })} onBulkImport={() => openBulkImport("bill")} />}
        {activeView === "reports" && <ReportsView />}
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
          outlets={outlets}
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
    </div>
  );
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

function ManagerDashboard({
  brands,
  outlets,
  salesmen,
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
        <Metric label="Outlet universe" value={activeOutlets} detail={`${prospectOutlets} prospects in CRM`} />
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
                <p>{order.brand} - {money(order.expectedValue)}</p>
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
  const hasAdminUser = Boolean(demoAdmin);

  return (
    <main className="login-shell">
      <section className="login-card">
        <img src="/brand/shipd2r-logo.png" alt="shipd2r" />
        <p className="eyebrow">ERP / CRM access</p>
        <h1>Choose your workspace</h1>
        <p>Admins manage everything. Managers supervise teams and territories. Sales executives enter the sales app.</p>
        <form className="master-form" onSubmit={onLogin}>
          <Select name="role" label="Login as" options={["Admin", "Manager", "Sales Executive", "Brand Partner"]} defaultValue="Admin" />
          <Input name="identifier" label="Email, phone, or name" placeholder="admin@shipd2r.local" />
          <Input name="accessCode" label="Access code" placeholder="Last 4 digits of phone" type="password" />
          {error && <p className="form-error">{error}</p>}
          <button className="approve" type="submit">Login</button>
        </form>
        <div className="login-hints">
          <strong>MVP access rule</strong>
          <span>Use the user email/phone/name and the last 4 digits of that user's phone as the access code.</span>
          {demoAdmin && <span>Admin example: {demoAdmin.email || demoAdmin.phone} / {loginCodeFor(demoAdmin)}</span>}
          {demoManager && <span>Manager example: {demoManager.email || demoManager.phone} / {loginCodeFor(demoManager)}</span>}
          {demoSales && <span>Sales example: {demoSales.email || demoSales.phone} / {loginCodeFor(demoSales)}</span>}
          {!hasAdminUser && <span>Bootstrap admin: any email / 0000</span>}
        </div>
      </section>
    </main>
  );
}

function SalesRepPortal({
  user,
  brands,
  tasks,
  outlets,
  orders,
  payments,
  onCreateVisit,
  onCreateOrder,
  onCreatePayment,
  onLogout
}: {
  user: AppUserRow;
  brands: BrandOption[];
  tasks: TaskRow[];
  outlets: OutletRow[];
  orders: OrderRow[];
  payments: PaymentRow[];
  onCreateVisit: (formData: FormData) => Promise<TaskRow>;
  onCreateOrder: (formData: FormData) => Promise<OrderRow>;
  onCreatePayment: (formData: FormData) => Promise<PaymentRow>;
  onLogout: () => void;
}) {
  const [activeWorkflow, setActiveWorkflow] = useState<SalesWorkflow>("visit");
  const [notice, setNotice] = useState<IntegrationNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<MediaLabResult | null>(null);
  const outletOptions = outlets.length ? outlets.map((outlet) => outlet.name) : ["Unassigned"];
  const brandOptions = brands.length ? brands.map((brand) => brand.name) : ["Unassigned"];

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
    setNotice(null);
    setIsSubmitting(true);
    try {
      await onCreateOrder(new FormData(formElement));
      formElement.reset();
      setNotice({ type: "success", message: "Order intent captured." });
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
        <Metric label="Payment risk" value={payments.filter((payment) => ["High", "Critical"].includes(payment.riskLevel)).length} detail="High-priority collections" />
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
            <button className="primary-button" onClick={() => setActiveWorkflow("payment")}>Collect Payment</button>
            <button className="primary-button" onClick={() => setActiveWorkflow("evidence")}>Upload Evidence</button>
          </div>
          {notice && <p className={`inline-notice ${notice.type}`} role="status">{notice.message}</p>}
          <div className="sales-workflow-panel">
            {activeWorkflow === "visit" && (
              <form className="master-form" onSubmit={submitVisit}>
                <div className="form-grid">
                  <Select name="outlet" label="Outlet" options={outletOptions} />
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
                  <Select name="outlet" label="Outlet" options={outletOptions} />
                  <Select name="brand" label="Client / brand" options={brandOptions} />
                  <Input name="expectedValue" label="Expected value" type="number" placeholder="8500" />
                  <Input name="expectedDeliveryDate" label="Expected delivery" type="date" required={false} />
                </div>
                <div className="action-row">
                  <button className="approve" disabled={isSubmitting} type="submit">Capture Order</button>
                </div>
              </form>
            )}

            {activeWorkflow === "payment" && (
              <form className="master-form" onSubmit={submitPayment}>
                <div className="form-grid">
                  <Select name="outlet" label="Outlet" options={outletOptions} />
                  <Select name="brand" label="Client / brand" options={brandOptions} />
                  <Input name="amountDue" label="Amount due" type="number" placeholder="12400" />
                  <Input name="amountCollected" label="Amount collected" type="number" placeholder="5000" required={false} />
                  <Input name="dueDate" label="Due date" type="date" required={false} />
                  <Input name="promisedPaymentDate" label="Promised date" type="date" required={false} />
                  <Input name="paymentMode" label="Payment mode" placeholder="UPI / Cash / Bank transfer" required={false} />
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
        <article className="panel">
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

function OutletsView({ outlets, onAdd, onEdit, onBulkImport }: { outlets: OutletRow[]; onAdd: () => void; onEdit: (outlet: OutletRow) => void; onBulkImport: () => void }) {
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
        <div className="data-table">
          <div className="table-row header">
            <span>Outlet</span>
            <span>City</span>
            <span>Channel</span>
            <span>Brand</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {outlets.map((outlet) => (
            <div className="table-row" key={outlet.id}>
              <strong>{outlet.name}</strong>
              <span>{outlet.city}</span>
              <span>{outlet.channel}</span>
              <span>{outlet.brand}</span>
              <span className={`tag ${outlet.status === "Prospect" ? "warn" : ""}`}>{outlet.status}</span>
              <button className="link-button" onClick={() => onEdit(outlet)}>
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersView({
  brands,
  records,
  partnerFilter,
  onFilter,
  onAdd,
  onEdit,
  onBulkImport
}: {
  brands: BrandOption[];
  records: CommandRecord[];
  partnerFilter: string;
  onFilter: (value: string) => void;
  onAdd: () => void;
  onEdit: (brand: BrandOption) => void;
  onBulkImport: () => void;
}) {
  return (
    <>
      <section className="partner-header">
        <div>
          <p className="eyebrow">Verified data only</p>
          <h2>Brand Partner Dashboard</h2>
        </div>
        <div className="panel-actions">
          <select value={partnerFilter} onChange={(event) => onFilter(event.target.value)}>
            <option value="all">All partners</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" onClick={onBulkImport}>
            Bulk Import
          </button>
          <button className="primary-button" onClick={onAdd}>
            Add Client
          </button>
        </div>
      </section>
      <section className="partner-grid">
        {brands
          .filter((brand) => partnerFilter === "all" || partnerFilter === brand.name)
          .map((brand) => {
            const brandRecords = records.filter((record) => record.partner === brand.name);
            const units = brandRecords.reduce((sum, record) => sum + record.units, 0);
            const value = brandRecords.reduce((sum, record) => sum + record.value, 0);
            return (
              <article className="partner-card" key={brand.id}>
                <div className="queue-top">
                  <h2>{brand.name}</h2>
                  <button className="link-button" onClick={() => onEdit(brand)}>
                    Edit
                  </button>
                </div>
                <p>{brand.category} client managed by {brand.contact}</p>
                <div className="field-grid">
                  <Field label="Verified outlets" value={brandRecords.length} />
                  <Field label="Sales" value={money(value)} />
                  <Field label="Units" value={units} />
                  <Field label="Status" value={brand.status} />
                </div>
              </article>
            );
          })}
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
  return (
    <CrudPanel title="Users & Login Access" description="Admins create and manage admin, manager, sales executive, and brand partner logins." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add User">
      {users.map((user) => (
        <article className="task-row" key={user.id}>
          <div className="queue-top">
            <strong>{user.name}</strong>
            <div className="inline-actions">
              <span className="tag blue">{user.roleLabel}</span>
              <button className="link-button" onClick={() => onEdit(user)}>Edit</button>
            </div>
          </div>
          <p>{user.email || "No email"} - {user.phone || "No phone"}</p>
          <div className="record-meta">
            <span>{user.territory}</span>
            <span className="tag">{user.status}</span>
          </div>
        </article>
      ))}
    </CrudPanel>
  );
}

function TasksView({ tasks, onAdd, onEdit, onBulkImport }: { tasks: TaskRow[]; onAdd: () => void; onEdit: (task: TaskRow) => void; onBulkImport: () => void }) {
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
        <div className="task-list">
          {tasks.map((task) => (
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
                <span>{task.outlet}</span>
                <span>{task.brand}</span>
                <span>{task.dueDate}</span>
                <span className="tag blue">{task.status}</span>
              </div>
            </article>
          ))}
        </div>
      </article>
      <article className="panel">
        <h2>Payment Risks</h2>
        <div className="task-list">
          {["Raj Stores - overdue", "Fresh Basket - disputed"].map((payment) => (
            <article className="task-row" key={payment}>
              <strong>{payment}</strong>
              <p>Requires admin follow-up.</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function TerritoriesView({ territories, onAdd, onEdit, onBulkImport }: { territories: TerritoryRow[]; onAdd: () => void; onEdit: (territory: TerritoryRow) => void; onBulkImport: () => void }) {
  return (
    <CrudPanel title="Territory Master" description="Cities, beats, and market expansion zones." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Territory">
      {territories.map((territory) => (
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
    </CrudPanel>
  );
}

function PaymentsView({ payments, onAdd, onEdit, onBulkImport }: { payments: PaymentRow[]; onAdd: () => void; onEdit: (payment: PaymentRow) => void; onBulkImport: () => void }) {
  return (
    <CrudPanel title="Payment Tracker" description="Dues, collections, promises, and risk levels." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Payment">
      {payments.map((payment) => (
        <article className="task-row" key={payment.id}>
          <div className="queue-top">
            <strong>{payment.outlet}</strong>
            <div className="inline-actions">
              <span className={`tag ${payment.riskLevel === "High" || payment.riskLevel === "Critical" ? "warn" : "blue"}`}>{payment.riskLevel}</span>
              <button className="link-button" onClick={() => onEdit(payment)}>Edit</button>
            </div>
          </div>
          <p>{payment.brand} · {money(payment.amountCollected)} collected of {money(payment.amountDue)}</p>
          <div className="record-meta">
            <span>Due {payment.dueDate}</span>
            <span>Promise {payment.promisedPaymentDate}</span>
            <span>{payment.paymentMode}</span>
            <span className="tag blue">{payment.status}</span>
          </div>
        </article>
      ))}
    </CrudPanel>
  );
}

function OrdersView({ orders, onAdd, onEdit, onBulkImport }: { orders: OrderRow[]; onAdd: () => void; onEdit: (order: OrderRow) => void; onBulkImport: () => void }) {
  return (
    <CrudPanel title="Orders" description="Order intents, confirmations, delivery expectations, and billing progression." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Order">
      {orders.map((order) => (
        <article className="task-row" key={order.id}>
          <div className="queue-top">
            <strong>{order.outlet}</strong>
            <button className="link-button" onClick={() => onEdit(order)}>Edit</button>
          </div>
          <p>{order.brand} · {money(order.expectedValue)}</p>
          <div className="record-meta">
            <span>Delivery {order.expectedDeliveryDate}</span>
            <span className="tag blue">{order.status}</span>
          </div>
        </article>
      ))}
    </CrudPanel>
  );
}

function BillsView({ bills, onAdd, onEdit, onBulkImport }: { bills: BillRow[]; onAdd: () => void; onEdit: (bill: BillRow) => void; onBulkImport: () => void }) {
  return (
    <CrudPanel title="Bills" description="Invoice records captured from sales-app updates, retailer WhatsApp, photos, or admin entry." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Bill">
      {bills.map((bill) => (
        <article className="task-row" key={bill.id}>
          <div className="queue-top">
            <strong>{bill.billNumber}</strong>
            <button className="link-button" onClick={() => onEdit(bill)}>Edit</button>
          </div>
          <p>{bill.outlet} · {bill.brand}</p>
          <div className="record-meta">
            <span>{bill.billDate}</span>
            <span>{money(bill.totalAmount)}</span>
            <span className="tag blue">{bill.paymentStatus}</span>
          </div>
        </article>
      ))}
    </CrudPanel>
  );
}

function CrudPanel({
  title,
  description,
  addLabel,
  onAdd,
  onBulkImport,
  children
}: {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  onBulkImport: () => void;
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
        <div className="task-list">{children}</div>
      </div>
    </section>
  );
}

function ReportsView() {
  return (
    <section className="ops-grid">
      <article className="panel">
        <h2>Weekly Brand Report</h2>
        <ol className="clean-list">
          <li>Executive summary</li>
          <li>Market coverage and outlet expansion</li>
          <li>Sales, orders, SKU movement, and payment status</li>
          <li>Retailer feedback, issues, and competitor intelligence</li>
          <li>Recommended next actions</li>
        </ol>
      </article>
      <article className="panel">
        <h2>Approval Workflow</h2>
        <div className="module-list">
          <article className="module-card"><h3>Draft generated</h3><p>Weekly city expansion report.</p></article>
          <article className="module-card"><h3>Manager review</h3><p>Requires approval before brand sharing.</p></article>
          <article className="module-card"><h3>Exports</h3><p>PDF, CSV, and Excel-ready verified datasets.</p></article>
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

function MasterDataModal({
  type,
  brands,
  outlets,
  initialValues,
  onClose,
  onSubmit
}: {
  type: Exclude<ModalType, null>;
  brands: BrandOption[];
  outlets: OutletRow[];
  initialValues?: OutletRow | BrandOption | SalesmanRow | AppUserRow | TaskRow | TerritoryRow | PaymentRow | OrderRow | BillRow;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(initialValues);
  const noun =
    type === "brand"
      ? "Brand Client"
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
  const outletOptions = outlets.length ? outlets.map((outlet) => outlet.name) : ["Unassigned"];
  const outletValues = type === "outlet" ? (initialValues as OutletRow | undefined) : undefined;
  const brandValues = type === "brand" ? (initialValues as BrandOption | undefined) : undefined;
  const salesmanValues = type === "salesman" ? (initialValues as SalesmanRow | undefined) : undefined;
  const userValues = type === "user" ? (initialValues as AppUserRow | undefined) : undefined;
  const taskValues = type === "task" ? (initialValues as TaskRow | undefined) : undefined;
  const territoryValues = type === "territory" ? (initialValues as TerritoryRow | undefined) : undefined;
  const paymentValues = type === "payment" ? (initialValues as PaymentRow | undefined) : undefined;
  const orderValues = type === "order" ? (initialValues as OrderRow | undefined) : undefined;
  const billValues = type === "bill" ? (initialValues as BillRow | undefined) : undefined;

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
                <Select name="status" label="Status" options={["Active", "Prospect", "Inactive"]} defaultValue={outletValues?.status} />
              </>
            )}
            {type === "brand" && (
              <>
                <Input name="name" label="Brand / client name" defaultValue={brandValues?.name} />
                <Input name="category" label="Category" defaultValue={brandValues?.category} />
                <Input name="contact" label="Contact person" defaultValue={brandValues?.contact} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={brandValues?.status} />
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
                <Select name="role" label="Login role" options={["Admin", "Manager", "Admin Operator", "Sales Executive", "Brand Viewer", "Brand Manager"]} defaultValue={userValues?.roleLabel} />
                <Input name="territory" label="Territory / team" required={false} defaultValue={userValues?.territory === "Managed in Sales App & Team" ? "" : userValues?.territory} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={userValues?.status} />
              </>
            )}
            {type === "task" && (
              <>
                <Input name="title" label="Task title" defaultValue={taskValues?.title} />
                <Select name="taskType" label="Task type" options={["Payment follow-up", "Order confirmation", "Delivery follow-up", "Complaint resolution", "Stock refill", "Display material request", "New outlet onboarding", "Manager escalation"]} defaultValue={taskValues?.taskType} />
                <Input name="description" label="Description" defaultValue={taskValues?.description} />
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
                <Input name="amountDue" label="Amount due" type="number" defaultValue={paymentValues?.amountDue ? String(paymentValues.amountDue) : undefined} />
                <Input name="amountCollected" label="Amount collected" type="number" defaultValue={paymentValues ? String(paymentValues.amountCollected) : undefined} required={false} />
                <Input name="dueDate" label="Due date" type="date" defaultValue={paymentValues?.dueDate === "No due date" ? "" : paymentValues?.dueDate} required={false} />
                <Input name="promisedPaymentDate" label="Promised date" type="date" defaultValue={paymentValues?.promisedPaymentDate === "No promise" ? "" : paymentValues?.promisedPaymentDate} required={false} />
                <Input name="paymentMode" label="Payment mode" defaultValue={paymentValues?.paymentMode === "Unassigned" ? "" : paymentValues?.paymentMode} required={false} />
                <Select name="status" label="Status" options={["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue={paymentValues?.status} />
                <Select name="riskLevel" label="Risk level" options={["Low", "Medium", "High", "Critical"]} defaultValue={paymentValues?.riskLevel} />
              </>
            )}
            {type === "order" && (
              <>
                <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={orderValues?.outlet} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={orderValues?.brand} />
                <Input name="expectedValue" label="Expected value" type="number" defaultValue={orderValues?.expectedValue ? String(orderValues.expectedValue) : undefined} />
                <Input name="expectedDeliveryDate" label="Expected delivery date" type="date" defaultValue={orderValues?.expectedDeliveryDate === "No delivery date" ? "" : orderValues?.expectedDeliveryDate} required={false} />
                <Select name="status" label="Status" options={["Intent captured", "Confirmed", "Billed", "Delivered", "Cancelled", "On hold"]} defaultValue={orderValues?.status} />
              </>
            )}
            {type === "bill" && (
              <>
                <Select name="outlet" label="Outlet" options={outletOptions} defaultValue={billValues?.outlet} />
                <Select name="brand" label="Brand client" options={brandOptions} defaultValue={billValues?.brand} />
                <Input name="billNumber" label="Bill number" defaultValue={billValues?.billNumber === "Unnumbered" ? "" : billValues?.billNumber} required={false} />
                <Input name="billDate" label="Bill date" type="date" defaultValue={billValues?.billDate === "No bill date" ? "" : billValues?.billDate} required={false} />
                <Input name="totalAmount" label="Total amount" type="number" defaultValue={billValues?.totalAmount ? String(billValues.totalAmount) : undefined} />
                <Select name="paymentStatus" label="Payment status" options={["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]} defaultValue={billValues?.paymentStatus} />
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
