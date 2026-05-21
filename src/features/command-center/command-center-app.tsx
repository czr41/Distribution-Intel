"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AIProviderSettings, BrandOption, CommandCenterData, CommandRecord, MetaIntegrationSettings, OutletRow, SalesmanRow, TaskRow } from "./types";

type View = "command" | "inbox" | "verification" | "outlets" | "tasks" | "reports" | "partners" | "ops" | "integrations";
type ModalType = "outlet" | "brand" | "salesman" | "task" | null;
type BulkImportType = Exclude<ModalType, null>;
type CommandCenterActions = {
  createBrand: (formData: FormData) => Promise<void>;
  createOutlet: (formData: FormData) => Promise<void>;
  createSalesman: (formData: FormData) => Promise<void>;
  createTask: (formData: FormData) => Promise<void>;
  saveMetaIntegration: (formData: FormData) => Promise<void>;
  saveAIProvider: (formData: FormData) => Promise<void>;
};

const viewTitles: Record<View, string> = {
  command: "Command Center",
  inbox: "WhatsApp Inbox",
  verification: "Verification Queue",
  outlets: "Outlet Master",
  tasks: "Tasks & Payments",
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
  const [metaIntegration, setMetaIntegration] = useState<MetaIntegrationSettings>(initialData.metaIntegration);
  const [aiProvider, setAIProvider] = useState<AIProviderSettings>(initialData.aiProvider);
  const [tasks, setTasks] = useState<TaskRow[]>(
    initialData.tasks.length
      ? initialData.tasks
      : [
          {
            id: "demo-task-payment",
            title: "Payment follow-up",
            description: "Call retailer and confirm pending collection window.",
            taskType: "Payment follow-up",
            outlet: "Raj Stores",
            brand: brands[0]?.name ?? "Unassigned",
            dueDate: "Today",
            priority: "High",
            status: "Open"
          },
          {
            id: "demo-task-order",
            title: "Order confirmation",
            description: "Confirm next order quantity after verification.",
            taskType: "Order confirmation",
            outlet: "Fresh Basket",
            brand: brands[1]?.name ?? brands[0]?.name ?? "Unassigned",
            dueDate: "Tomorrow",
            priority: "Medium",
            status: "Open"
          },
          {
            id: "demo-task-display",
            title: "Display material request",
            description: "Share display material requirement with operations.",
            taskType: "Display material request",
            outlet: "Unassigned",
            brand: brands[0]?.name ?? "Unassigned",
            dueDate: "This week",
            priority: "Low",
            status: "Waiting for response"
          }
        ]
  );
  const [modalType, setModalType] = useState<ModalType>(null);
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
    const value = (key: string) => String(form.get(key) ?? "").trim();

    if (modalType === "outlet") {
      await actions.createOutlet(form);
      setOutlets((current) => [
        {
          id: `outlet-${Date.now()}`,
          name: value("name"),
          owner: value("owner"),
          phone: value("phone"),
          city: value("city"),
          channel: value("channel"),
          brand: value("brand"),
          status: value("status") as OutletRow["status"]
        },
        ...current
      ]);
      setActiveView("outlets");
    }

    if (modalType === "brand") {
      await actions.createBrand(form);
      setBrands((current) => [
        {
          id: `brand-${Date.now()}`,
          name: value("name"),
          category: value("category"),
          contact: value("contact"),
          status: value("status") as BrandOption["status"]
        },
        ...current
      ]);
      setActiveView("partners");
    }

    if (modalType === "salesman") {
      await actions.createSalesman(form);
      setSalesmen((current) => [
        {
          id: `sales-${Date.now()}`,
          name: value("name"),
          phone: value("phone"),
          city: value("city"),
          territory: value("territory"),
          status: value("status") as SalesmanRow["status"]
        },
        ...current
      ]);
      setActiveView("ops");
    }

    if (modalType === "task") {
      await actions.createTask(form);
      setTasks((current) => [
        {
          id: `task-${Date.now()}`,
          title: value("title"),
          description: value("description"),
          taskType: value("taskType"),
          outlet: value("outlet"),
          brand: value("brand"),
          dueDate: value("dueDate") || "No due date",
          priority: value("priority") as TaskRow["priority"],
          status: value("status") as TaskRow["status"]
        },
        ...current
      ]);
      setActiveView("tasks");
    }

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
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.outlet.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        await actions.createOutlet(form);
      }
      setOutlets((current) => [
        ...rows.map((row, index) => ({
          id: `bulk-outlet-${Date.now()}-${index}`,
          name: row.name,
          owner: row.owner,
          phone: row.phone,
          city: row.city,
          channel: row.channel,
          brand: row.brand,
          status: (row.status || "Active") as OutletRow["status"]
        })),
        ...current
      ]);
      setActiveView("outlets");
    }

    if (type === "brand") {
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.brand.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        await actions.createBrand(form);
      }
      setBrands((current) => [
        ...rows.map((row, index) => ({
          id: `bulk-brand-${Date.now()}-${index}`,
          name: row.name,
          category: row.category,
          contact: row.contact,
          status: (row.status || "Active") as BrandOption["status"]
        })),
        ...current
      ]);
      setActiveView("partners");
    }

    if (type === "salesman") {
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.salesman.columns.forEach((column) => form.set(column, column === "status" ? row[column] || "Active" : row[column] ?? ""));
        await actions.createSalesman(form);
      }
      setSalesmen((current) => [
        ...rows.map((row, index) => ({
          id: `bulk-salesman-${Date.now()}-${index}`,
          name: row.name,
          phone: row.phone,
          city: row.city,
          territory: row.territory,
          status: (row.status || "Active") as SalesmanRow["status"]
        })),
        ...current
      ]);
      setActiveView("ops");
    }

    if (type === "task") {
      for (const row of rows) {
        const form = new FormData();
        bulkTemplates.task.columns.forEach((column) => {
          if (column === "priority") form.set(column, row[column] || "Medium");
          else if (column === "status") form.set(column, row[column] || "Open");
          else form.set(column, row[column] ?? "");
        });
        await actions.createTask(form);
      }
      setTasks((current) => [
        ...rows.map((row, index) => ({
          id: `bulk-task-${Date.now()}-${index}`,
          title: row.title,
          description: row.description,
          taskType: row.taskType,
          outlet: row.outlet,
          brand: row.brand,
          dueDate: row.dueDate || "No due date",
          priority: (row.priority || "Medium") as TaskRow["priority"],
          status: (row.status || "Open") as TaskRow["status"]
        })),
        ...current
      ]);
      setActiveView("tasks");
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
      { label: "Add Outlet", action: () => setModalType("outlet") },
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
    outlets: [
      { label: "Add Outlet", action: () => setModalType("outlet") },
      { label: "Bulk Import", action: () => openBulkImport("outlet") }
    ],
    tasks: [
      { label: "Create Task", action: () => setModalType("task") },
      { label: "Bulk Import", action: () => openBulkImport("task") }
    ],
    reports: [{ label: "Generate Report", action: () => setActiveView("reports") }],
    partners: [
      { label: "Add Client", action: () => setModalType("brand") },
      { label: "Bulk Import", action: () => openBulkImport("brand") }
    ],
    ops: [
      { label: "Add Salesman", action: () => setModalType("salesman") },
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

        {activeView === "outlets" && <OutletsView outlets={outlets} onAdd={() => setModalType("outlet")} onBulkImport={() => openBulkImport("outlet")} />}
        {activeView === "partners" && (
          <PartnersView brands={brands} records={visiblePartnerRecords} partnerFilter={partnerFilter} onFilter={setPartnerFilter} onAdd={() => setModalType("brand")} onBulkImport={() => openBulkImport("brand")} />
        )}
        {activeView === "ops" && <OpsView salesmen={salesmen} onAdd={() => setModalType("salesman")} onBulkImport={() => openBulkImport("salesman")} />}
        {activeView === "tasks" && <TasksView tasks={tasks} onAdd={() => setModalType("task")} onBulkImport={() => openBulkImport("task")} />}
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

      {modalType && <MasterDataModal type={modalType} brands={brands} onClose={() => setModalType(null)} onSubmit={addMasterData} />}
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

function OutletsView({ outlets, onAdd, onBulkImport }: { outlets: OutletRow[]; onAdd: () => void; onBulkImport: () => void }) {
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
          </div>
          {outlets.map((outlet) => (
            <div className="table-row" key={outlet.id}>
              <strong>{outlet.name}</strong>
              <span>{outlet.city}</span>
              <span>{outlet.channel}</span>
              <span>{outlet.brand}</span>
              <span className={`tag ${outlet.status === "Prospect" ? "warn" : ""}`}>{outlet.status}</span>
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
  onBulkImport
}: {
  brands: BrandOption[];
  records: CommandRecord[];
  partnerFilter: string;
  onFilter: (value: string) => void;
  onAdd: () => void;
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
                <h2>{brand.name}</h2>
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

function OpsView({ salesmen, onAdd, onBulkImport }: { salesmen: SalesmanRow[]; onAdd: () => void; onBulkImport: () => void }) {
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

function TasksView({ tasks, onAdd, onBulkImport }: { tasks: TaskRow[]; onAdd: () => void; onBulkImport: () => void }) {
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
                <span className={`tag ${task.priority === "High" || task.priority === "Critical" ? "warn" : "blue"}`}>{task.priority}</span>
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
            <Select name="provider" label="Provider" options={["gemini", "ollama_gemma", "manual"]} defaultValue={aiProvider.provider} />
            <Input name="model" label="Model" defaultValue={aiProvider.model} />
            <Input name="baseUrl" label="Base URL" defaultValue={aiProvider.baseUrl} placeholder="Optional for Gemini, required for external Gemma/Ollama" required={false} />
            <Input name="apiKey" label="API key" type="password" placeholder={aiProvider.hasApiKey ? "Saved. Enter only to replace." : "Gemini API key or external provider key"} required={!aiProvider.hasApiKey && aiProvider.provider !== "manual"} />
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

function MasterDataModal({ type, brands, onClose, onSubmit }: { type: Exclude<ModalType, null>; brands: BrandOption[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const title = type === "outlet" ? "Add Outlet" : type === "brand" ? "Add Brand Client" : type === "salesman" ? "Add Salesman" : "Create Task";
  const brandOptions = brands.length ? brands.map((brand) => brand.name) : ["Unassigned"];
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
          <div className="form-grid">
            {type === "outlet" && (
              <>
                <Input name="name" label="Outlet name" />
                <Input name="owner" label="Owner / contact" />
                <Input name="phone" label="Phone / WhatsApp" />
                <Input name="city" label="City" />
                <Input name="channel" label="Channel type" />
                <Select name="brand" label="Brand client" options={brands.map((brand) => brand.name)} />
                <Select name="status" label="Status" options={["Active", "Prospect", "Inactive"]} />
              </>
            )}
            {type === "brand" && (
              <>
                <Input name="name" label="Brand / client name" />
                <Input name="category" label="Category" />
                <Input name="contact" label="Contact person" />
                <Select name="status" label="Status" options={["Active", "Inactive"]} />
              </>
            )}
            {type === "salesman" && (
              <>
                <Input name="name" label="Salesman name" />
                <Input name="phone" label="WhatsApp number" />
                <Input name="city" label="City" />
                <Input name="territory" label="Territory" />
                <Select name="status" label="Status" options={["Active", "Inactive"]} />
              </>
            )}
            {type === "task" && (
              <>
                <Input name="title" label="Task title" />
                <Select name="taskType" label="Task type" options={["Payment follow-up", "Order confirmation", "Delivery follow-up", "Complaint resolution", "Stock refill", "Display material request", "New outlet onboarding", "Manager escalation"]} />
                <Input name="description" label="Description" />
                <Input name="outlet" label="Outlet" />
                <Select name="brand" label="Brand client" options={brandOptions} />
                <Input name="dueDate" label="Due date" type="date" required={false} />
                <Select name="priority" label="Priority" options={["Low", "Medium", "High", "Critical"]} />
                <Select name="status" label="Status" options={["Open", "In progress", "Waiting for response", "Completed", "Cancelled", "Overdue"]} />
              </>
            )}
          </div>
          <div className="action-row">
            <button className="approve" type="submit">Save</button>
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
