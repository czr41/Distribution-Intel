"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type {
  AIProviderSettings,
  BillRow,
  BrandOption,
  CommandCenterData,
  CommandRecord,
  MetaIntegrationSettings,
  OrderRow,
  OutletRow,
  PaymentRow,
  SalesmanRow,
  TaskRow,
  TerritoryRow
} from "./types";

type View = "command" | "inbox" | "verification" | "media" | "outlets" | "tasks" | "payments" | "orders" | "bills" | "territories" | "reports" | "partners" | "ops" | "integrations";
type MediaLabResult = {
  fileName: string;
  fileType: string;
  mediaKind: string;
  provider: string;
  model: string;
  transcriptText: string;
  ocrText: string;
  imageClassification: string;
  extractedText: string;
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
type ModalType = "outlet" | "brand" | "salesman" | "task" | "territory" | "payment" | "order" | "bill" | null;
type BulkImportType = Exclude<ModalType, null>;
type EditableMasterData =
  | { type: "outlet"; record: OutletRow }
  | { type: "brand"; record: BrandOption }
  | { type: "salesman"; record: SalesmanRow }
  | { type: "task"; record: TaskRow }
  | { type: "territory"; record: TerritoryRow }
  | { type: "payment"; record: PaymentRow }
  | { type: "order"; record: OrderRow }
  | { type: "bill"; record: BillRow };
type CommandCenterActions = {
  createBrand: (formData: FormData) => Promise<BrandOption>;
  createOutlet: (formData: FormData) => Promise<OutletRow>;
  createSalesman: (formData: FormData) => Promise<SalesmanRow>;
  createTask: (formData: FormData) => Promise<TaskRow>;
  createTerritory: (formData: FormData) => Promise<TerritoryRow>;
  createPayment: (formData: FormData) => Promise<PaymentRow>;
  createOrder: (formData: FormData) => Promise<OrderRow>;
  createBill: (formData: FormData) => Promise<BillRow>;
  updateBrand: (formData: FormData) => Promise<BrandOption>;
  updateOutlet: (formData: FormData) => Promise<OutletRow>;
  updateSalesman: (formData: FormData) => Promise<SalesmanRow>;
  updateTask: (formData: FormData) => Promise<TaskRow>;
  updateTerritory: (formData: FormData) => Promise<TerritoryRow>;
  updatePayment: (formData: FormData) => Promise<PaymentRow>;
  updateOrder: (formData: FormData) => Promise<OrderRow>;
  updateBill: (formData: FormData) => Promise<BillRow>;
  saveMetaIntegration: (formData: FormData) => Promise<void>;
  saveAIProvider: (formData: FormData) => Promise<void>;
};

const viewTitles: Record<View, string> = {
  command: "Command Center",
  inbox: "WhatsApp Inbox",
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
  ops: "Operations Model",
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
    title: "Salesman Bulk Import",
    filename: "shipd2r-salesman-import-template.csv",
    columns: ["name", "phone", "city", "territory", "status"],
    sample: ["Rahul Sharma", "9876543201", "Pune", "Pune West", "Active"]
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

export function CommandCenterApp({ initialData, actions }: { initialData: CommandCenterData; actions: CommandCenterActions }) {
  const [activeView, setActiveView] = useState<View>("command");
  const [selectedId, setSelectedId] = useState(initialData.records[0]?.id ?? "");
  const [records, setRecords] = useState<CommandRecord[]>(initialData.records);
  const [brands, setBrands] = useState<BrandOption[]>(initialData.brands);
  const [outlets, setOutlets] = useState<OutletRow[]>(initialData.outlets);
  const [salesmen, setSalesmen] = useState<SalesmanRow[]>(initialData.salesmen);
  const [territories, setTerritories] = useState<TerritoryRow[]>(initialData.territories);
  const [payments, setPayments] = useState<PaymentRow[]>(initialData.payments);
  const [orders, setOrders] = useState<OrderRow[]>(initialData.orders);
  const [bills, setBills] = useState<BillRow[]>(initialData.bills);
  const [metaIntegration, setMetaIntegration] = useState<MetaIntegrationSettings>(initialData.metaIntegration);
  const [aiProvider, setAIProvider] = useState<AIProviderSettings>(initialData.aiProvider);
  const [tasks, setTasks] = useState<TaskRow[]>(initialData.tasks);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<EditableMasterData | null>(null);
  const [bulkImportType, setBulkImportType] = useState<BulkImportType | null>(null);
  const [bulkImportMessage, setBulkImportMessage] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [messageText, setMessageText] = useState("");

  const selectedRecord =
    records.find((record) => record.id === selectedId) ??
    records[0] ?? {
      id: "empty",
      outlet: "No records yet",
      city: "Unassigned",
      partner: "Unassigned",
      fieldAgent: "Field Team",
      type: "Visit",
      units: 0,
      value: 0,
      status: "pending",
      confidence: 0,
      evidence: "No evidence",
      message: "Add outlets and WhatsApp messages to populate the queue.",
      createdAt: "--"
    };
  const pendingCount = records.filter((record) => record.status === "pending").length;
  const verifiedCount = records.filter((record) => record.status === "verified").length;
  const highConfidenceCount = records.filter((record) => record.confidence >= 0.85).length;
  const recordCount = Math.max(records.length, 1);

  const visiblePartnerRecords = useMemo(
    () => records.filter((record) => record.status === "verified" && (partnerFilter === "all" || record.partner === partnerFilter)),
    [partnerFilter, records]
  );

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
      current.map((record) => (record.id === recordId ? { ...record, status: "needs field clarification" } : record))
    );
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
      fieldAgent: "Field Team",
      type: units > 0 ? "Sale" : "Visit",
      units,
      value: units * 150,
      status: "pending",
      confidence: outletMatch && unitsMatch ? 0.86 : 0.58,
      evidence: messageText.toLowerCase().includes("photo") ? "WhatsApp text + media mention" : "WhatsApp text",
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
  }

  async function saveAIProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();

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
  const headerActions: Record<View, { label: string; action: () => void; disabled?: boolean }[]> = {
    command: [
      { label: "Add Outlet", action: () => openCreate("outlet") },
      { label: "Bulk Import", action: () => openBulkImport("outlet") },
      { label: "Verify Next", action: () => pendingRecord && verifyRecord(pendingRecord.id), disabled: !pendingRecord }
    ],
    inbox: [
      { label: "Log Field Message", action: () => setActiveView("inbox") },
      { label: "Verify Next", action: () => pendingRecord && verifyRecord(pendingRecord.id), disabled: !pendingRecord }
    ],
    verification: [
      { label: "Approve Current", action: () => verifyRecord(selectedRecord.id), disabled: selectedRecord.id === "empty" },
      { label: "Ask Clarification", action: () => sendBack(selectedRecord.id), disabled: selectedRecord.id === "empty" }
    ],
    media: [
      { label: "Configure AI", action: () => setActiveView("integrations") },
      { label: "Open Inbox", action: () => setActiveView("inbox") }
    ],
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
      { label: "Add Salesman", action: () => openCreate("salesman") },
      { label: "Bulk Import", action: () => openBulkImport("salesman") }
    ],
    integrations: [{ label: "Copy Webhook Path", action: () => navigator.clipboard?.writeText(metaIntegration.webhookUrl) }]
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <img src="/brand/shipd2r-logo.png" alt="shipd2r" />
          <span>Direct-to-retailer command center</span>
        </div>
        <nav className="nav-tabs" aria-label="Views">
          {(Object.keys(viewTitles) as View[]).map((view) => (
            <button key={view} className={`nav-tab ${activeView === view ? "active" : ""}`} onClick={() => setActiveView(view)}>
              <span>{view === "ops" ? "Ops" : view[0].toUpperCase() + view.slice(1)}</span>
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
            <p className="eyebrow">Shipd2r distribution intelligence</p>
            <h1>{viewTitles[activeView]}</h1>
          </div>
          <div className="topbar-actions">
            {headerActions[activeView].map((headerAction) => (
              <button key={headerAction.label} className="primary-button" onClick={headerAction.action} disabled={headerAction.disabled}>
                {headerAction.label}
              </button>
            ))}
          </div>
        </header>

        {activeView === "command" && (
          <>
            <section className="metrics-grid">
              <Metric label="Pending verification" value={pendingCount} detail="Human-in-the-loop queue" />
              <Metric label="Verified outlets" value={verifiedCount} detail="Partner-visible records" />
              <Metric label="Field coverage" value={`${Math.round((verifiedCount / recordCount) * 100)}%`} detail="Beat plan touched today" />
              <Metric label="Extraction accuracy" value={`${Math.round((highConfidenceCount / recordCount) * 100)}%`} detail="AI suggestions accepted" />
            </section>
            <section className="split-layout">
              <QueuePanel records={records} selectedId={selectedId} onSelect={setSelectedId} />
              <RecordDetail record={selectedRecord} onVerify={verifyRecord} onSendBack={sendBack} />
            </section>
          </>
        )}

        {activeView === "inbox" && (
          <section className="inbox-grid">
            <QueuePanel records={records} selectedId={selectedId} onSelect={setSelectedId} />
            <div className="phone-frame">
              <div className="phone-header">Field WhatsApp</div>
              <div className="chat-feed">
                {records.slice(0, 4).map((record) => (
                  <div className="message" key={record.id}>
                    {record.message}
                  </div>
                ))}
              </div>
              <form className="chat-composer" onSubmit={addFieldMessage}>
                <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Outlet: Raj Stores, 24 units, paid cash, shelf photo ok" />
                <button type="submit">Send</button>
              </form>
            </div>
            <AIDraft record={selectedRecord} />
          </section>
        )}

        {activeView === "verification" && (
          <section className="verification-grid">
            <div className="panel">
              <h2>Raw Evidence</h2>
              <div className="evidence-card">
                <span className="tag blue">{selectedRecord.evidence}</span>
                <h2>{selectedRecord.outlet}</h2>
                <p>{selectedRecord.message}</p>
              </div>
              <div className="evidence-box">Media / OCR / Transcript Preview</div>
            </div>
            <RecordDetail record={selectedRecord} onVerify={verifyRecord} onSendBack={sendBack} />
          </section>
        )}

        {activeView === "media" && <MediaLabView aiProvider={aiProvider} />}
        {activeView === "outlets" && <OutletsView outlets={outlets} onAdd={() => openCreate("outlet")} onEdit={(outlet) => openEdit({ type: "outlet", record: outlet })} onBulkImport={() => openBulkImport("outlet")} />}
        {activeView === "partners" && (
          <PartnersView brands={brands} records={visiblePartnerRecords} partnerFilter={partnerFilter} onFilter={setPartnerFilter} onAdd={() => openCreate("brand")} onEdit={(brand) => openEdit({ type: "brand", record: brand })} onBulkImport={() => openBulkImport("brand")} />
        )}
        {activeView === "ops" && <OpsView salesmen={salesmen} onAdd={() => openCreate("salesman")} onEdit={(person) => openEdit({ type: "salesman", record: person })} onBulkImport={() => openBulkImport("salesman")} />}
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
            onSaveMeta={saveMetaIntegration}
            onSaveAI={saveAIProvider}
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

function QueuePanel({ records, selectedId, onSelect }: { records: CommandRecord[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Verification Queue</h2>
          <p>AI extracts field signals. Ops confirms what becomes official.</p>
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
          <Field label="Field agent" value={record.fieldAgent} />
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
      setError("Upload a file or paste a field message first.");
      return;
    }

    setError("");
    setIsExtracting(true);

    try {
      const response = await fetch("/api/ai/extract-media", {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        throw new Error(await response.text());
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
            <h2>Upload Field Evidence</h2>
            <p>Test WhatsApp-style voice notes, bill images, PDFs, shelf photos, payment screenshots, or text updates before wiring them into verification.</p>
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
            <label htmlFor="media-note">Optional field message</label>
            <textarea id="media-note" name="note" rows={6} placeholder="Example: Outlet Raj Stores, bill uploaded, payment pending 12400, ask Ramesh to follow up tomorrow." />
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
              <Field label="Provider" value={result.provider} />
              <Field label="Model" value={result.model} />
            </div>
            {result.warning && <p className="form-error">{result.warning}</p>}
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
            <h2>Field Team</h2>
            <p>Sales executives mapped to territories and WhatsApp numbers.</p>
          </div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={onBulkImport}>
              Bulk Import
            </button>
            <button className="primary-button" onClick={onAdd}>
              Add Salesman
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
        <h2>System Model</h2>
        <ul className="clean-list">
          <li><strong>Field:</strong> WhatsApp messages, images, voice notes, and location pings.</li>
          <li><strong>Backend:</strong> ingestion, extraction, confidence scoring, task assignment.</li>
          <li><strong>Internal:</strong> command center for verification and exception handling.</li>
          <li><strong>Partners:</strong> verified dashboards and approved reports.</li>
        </ul>
      </article>
    </section>
  );
}

function TasksView({ tasks, onAdd, onEdit, onBulkImport }: { tasks: TaskRow[]; onAdd: () => void; onEdit: (task: TaskRow) => void; onBulkImport: () => void }) {
  return (
    <section className="ops-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Tasks & Follow-Ups</h2>
            <p>Manual and AI-created follow-ups for payments, orders, complaints, and field action.</p>
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
    <CrudPanel title="Bills" description="Invoice records captured from field updates, photos, or admin entry." onAdd={onAdd} onBulkImport={onBulkImport} addLabel="Add Bill">
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
  onSaveMeta,
  onSaveAI
}: {
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
  onSaveMeta: (event: FormEvent<HTMLFormElement>) => void;
  onSaveAI: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="integrations-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Meta WhatsApp Cloud API</h2>
            <p>Connect the official Meta account that receives field messages and sends reminders.</p>
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
            <Select name="provider" label="Provider" options={["sarvam", "gemini", "ollama_gemma", "manual"]} defaultValue={aiProvider.provider} />
            <Input name="model" label="Model" defaultValue={aiProvider.model} />
            <Input name="baseUrl" label="Base URL" defaultValue={aiProvider.baseUrl} placeholder="Optional. Sarvam defaults to https://api.sarvam.ai" required={false} />
            <Input name="apiKey" label="API key" type="password" placeholder={aiProvider.hasApiKey ? "Saved. Enter only to replace." : "Sarvam, Gemini, or external provider key"} required={!aiProvider.hasApiKey && aiProvider.provider !== "manual"} />
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
  initialValues?: OutletRow | BrandOption | SalesmanRow | TaskRow | TerritoryRow | PaymentRow | OrderRow | BillRow;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(initialValues);
  const noun =
    type === "brand"
      ? "Brand Client"
      : type === "salesman"
        ? "Salesman"
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
                <Input name="name" label="Salesman name" defaultValue={salesmanValues?.name} />
                <Input name="phone" label="WhatsApp number" defaultValue={salesmanValues?.phone} />
                <Input name="city" label="City" defaultValue={salesmanValues?.city} />
                <Input name="territory" label="Territory" defaultValue={salesmanValues?.territory} />
                <Select name="status" label="Status" options={["Active", "Inactive"]} defaultValue={salesmanValues?.status} />
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
