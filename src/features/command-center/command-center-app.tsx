"use client";

import { FormEvent, useMemo, useState } from "react";
import type { BrandOption, CommandCenterData, CommandRecord, OutletRow, SalesmanRow } from "./types";

type View = "command" | "inbox" | "verification" | "outlets" | "tasks" | "reports" | "partners" | "ops";
type ModalType = "outlet" | "brand" | "salesman" | null;
type CommandCenterActions = {
  createBrand: (formData: FormData) => Promise<void>;
  createOutlet: (formData: FormData) => Promise<void>;
  createSalesman: (formData: FormData) => Promise<void>;
};

const viewTitles: Record<View, string> = {
  command: "Command Center",
  inbox: "WhatsApp Inbox",
  verification: "Verification Queue",
  outlets: "Outlet Master",
  tasks: "Tasks & Payments",
  reports: "Reports",
  partners: "Brand Partner Dashboard",
  ops: "Operations Model"
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function confidenceLabel(record: CommandRecord) {
  return record.confidence >= 0.85 ? "High confidence" : "Needs review";
}

export function CommandCenterApp({ initialData, actions }: { initialData: CommandCenterData; actions: CommandCenterActions }) {
  const [activeView, setActiveView] = useState<View>("command");
  const [selectedId, setSelectedId] = useState(initialData.records[0]?.id ?? "");
  const [records, setRecords] = useState<CommandRecord[]>(initialData.records);
  const [brands, setBrands] = useState<BrandOption[]>(initialData.brands);
  const [outlets, setOutlets] = useState<OutletRow[]>(initialData.outlets);
  const [salesmen, setSalesmen] = useState<SalesmanRow[]>(initialData.salesmen);
  const [modalType, setModalType] = useState<ModalType>(null);
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

    setModalType(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <strong>FieldOps</strong>
            <span>Distribution OS</span>
          </div>
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
            <p className="eyebrow">WhatsApp-first distribution command center</p>
            <h1>{viewTitles[activeView]}</h1>
          </div>
          <div className="topbar-actions">
            <button className="primary-button" onClick={() => setModalType("outlet")}>
              Add Master Data
            </button>
            <button className="primary-button" onClick={() => records.find((record) => record.status === "pending") && verifyRecord(records.find((record) => record.status === "pending")!.id)}>
              Verify Next
            </button>
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

        {activeView === "outlets" && <OutletsView outlets={outlets} onAdd={() => setModalType("outlet")} />}
        {activeView === "partners" && (
          <PartnersView brands={brands} records={visiblePartnerRecords} partnerFilter={partnerFilter} onFilter={setPartnerFilter} onAdd={() => setModalType("brand")} />
        )}
        {activeView === "ops" && <OpsView salesmen={salesmen} onAdd={() => setModalType("salesman")} />}
        {activeView === "tasks" && <TasksView />}
        {activeView === "reports" && <ReportsView />}
      </main>

      {modalType && <MasterDataModal type={modalType} brands={brands} onClose={() => setModalType(null)} onSubmit={addMasterData} />}
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

function OutletsView({ outlets, onAdd }: { outlets: OutletRow[]; onAdd: () => void }) {
  return (
    <section className="table-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Outlet Master</h2>
            <p>Verified retailer database with visit, payment, and intelligence context.</p>
          </div>
          <button className="primary-button" onClick={onAdd}>
            Add Outlet
          </button>
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
  onAdd
}: {
  brands: BrandOption[];
  records: CommandRecord[];
  partnerFilter: string;
  onFilter: (value: string) => void;
  onAdd: () => void;
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

function OpsView({ salesmen, onAdd }: { salesmen: SalesmanRow[]; onAdd: () => void }) {
  return (
    <section className="ops-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Field Team</h2>
            <p>Sales executives mapped to territories and WhatsApp numbers.</p>
          </div>
          <button className="primary-button" onClick={onAdd}>
            Add Salesman
          </button>
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

function TasksView() {
  return (
    <section className="ops-grid">
      <article className="panel">
        <h2>Tasks & Follow-Ups</h2>
        <div className="task-list">
          {["Payment follow-up", "Order confirmation", "Display material request"].map((task) => (
            <article className="task-row" key={task}>
              <div className="queue-top">
                <strong>{task}</strong>
                <span className="tag blue">Open</span>
              </div>
              <p>Created from verified field signal.</p>
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

function MasterDataModal({ type, brands, onClose, onSubmit }: { type: Exclude<ModalType, null>; brands: BrandOption[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const title = type === "outlet" ? "Add Outlet" : type === "brand" ? "Add Brand Client" : "Add Salesman";
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

function Input({ name, label }: { name: string; label: string }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} required />
    </div>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} required>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
