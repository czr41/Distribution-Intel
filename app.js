const state = {
  selectedId: "rec-101",
  activeView: "command",
  messages: [
    {
      from: "field",
      text: "Outlet: Raj Stores, Pune. Sold 24 units of NourishCo Active. Cash collected. Shelf photo sent.",
    },
    {
      from: "ops",
      text: "Received. AI extracted sale + proof. Pending verification.",
    },
  ],
  records: [
    {
      id: "rec-101",
      outlet: "Raj Stores",
      city: "Pune",
      partner: "NourishCo",
      fieldAgent: "Meera S.",
      type: "Sale",
      units: 24,
      value: 3600,
      status: "pending",
      confidence: 0.91,
      evidence: "Shelf photo + WhatsApp text",
      message: "Sold 24 units of NourishCo Active. Cash collected.",
      createdAt: "10:12",
    },
    {
      id: "rec-102",
      outlet: "Fresh Basket",
      city: "Nashik",
      partner: "GlowWell",
      fieldAgent: "Arjun K.",
      type: "Stockout",
      units: 0,
      value: 0,
      status: "pending",
      confidence: 0.63,
      evidence: "Voice note transcription",
      message: "Owner says GlowWell sachets are sold out and wants refill by Friday.",
      createdAt: "10:24",
    },
    {
      id: "rec-103",
      outlet: "Metro Mini Mart",
      city: "Mumbai",
      partner: "DailyBite",
      fieldAgent: "Nisha P.",
      type: "Merchandising",
      units: 12,
      value: 900,
      status: "verified",
      confidence: 0.87,
      evidence: "Photo + geo tag",
      message: "Counter display placed near billing. 12 trial packs billed.",
      createdAt: "09:48",
    },
    {
      id: "rec-104",
      outlet: "Om Super Shop",
      city: "Thane",
      partner: "NourishCo",
      fieldAgent: "Ravi M.",
      type: "Order",
      units: 48,
      value: 7200,
      status: "verified",
      confidence: 0.94,
      evidence: "Order text + outlet confirmation",
      message: "Retailer confirmed 48 units for tomorrow delivery.",
      createdAt: "09:30",
    },
  ],
  brands: [
    { id: "brand-1", name: "NourishCo", category: "Nutrition", contact: "Ananya Rao", status: "Active" },
    { id: "brand-2", name: "GlowWell", category: "Personal care", contact: "Karan Mehta", status: "Active" },
    { id: "brand-3", name: "DailyBite", category: "Packaged foods", contact: "Priya Nair", status: "Active" },
  ],
  outlets: [
    { id: "outlet-1", name: "Raj Stores", city: "Pune", channel: "Kirana", brand: "NourishCo", status: "Active", owner: "Raj Patil", phone: "+91 90000 10001" },
    { id: "outlet-2", name: "Fresh Basket", city: "Nashik", channel: "Supermarket", brand: "GlowWell", status: "Prospect", owner: "S. Kale", phone: "+91 90000 10002" },
    { id: "outlet-3", name: "Metro Mini Mart", city: "Mumbai", channel: "Supermarket", brand: "DailyBite", status: "Active", owner: "Nisha Shah", phone: "+91 90000 10003" },
    { id: "outlet-4", name: "Om Super Shop", city: "Thane", channel: "Kirana", brand: "NourishCo", status: "Active", owner: "Omkar Jadhav", phone: "+91 90000 10004" },
  ],
  salesmen: [
    { id: "sales-1", name: "Meera S.", phone: "+91 98888 10001", city: "Pune", territory: "Pune West", status: "Active" },
    { id: "sales-2", name: "Arjun K.", phone: "+91 98888 10002", city: "Nashik", territory: "Nashik Core", status: "Active" },
    { id: "sales-3", name: "Ravi M.", phone: "+91 98888 10003", city: "Thane", territory: "Thane Retail", status: "Active" },
  ],
  modalType: null,
};

const modules = [
  ["WhatsApp Ingestion", "Connect Twilio, Gupshup, or Meta Cloud API for field messages, media, and delivery status."],
  ["AI Extraction", "Normalize text, photos, and voice notes into sale, stock, outlet, task, and evidence records."],
  ["Verification Queue", "Route low-confidence or partner-visible facts to internal ops before publishing."],
  ["Partner Dashboards", "Expose verified coverage, sales, stockout, and merchandising views by brand partner."],
  ["Provider Interfaces", "Keep messaging, extraction, storage, and analytics providers replaceable behind contracts."],
];

const tasks = [
  ["Payment follow-up", "Sri Lakshmi Stores", "High", "Due today"],
  ["Order confirmation", "Fresh Basket", "Medium", "Waiting for retailer"],
  ["Display material request", "Metro Mini Mart", "Low", "Open"],
];

const payments = [
  ["Raj Stores", "NourishCo", 12400, "Overdue", "High"],
  ["Om Super Shop", "NourishCo", 7200, "Due", "Medium"],
  ["Fresh Basket", "GlowWell", 3800, "Disputed", "High"],
];

const reports = [
  ["Draft generated", "Weekly NourishCo city expansion report"],
  ["Manager review", "Requires approval before brand sharing"],
  ["Exports", "PDF, CSV, and Excel-ready verified datasets"],
];

const selectors = {
  tabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  title: document.getElementById("view-title"),
  queueList: document.getElementById("queue-list"),
  detail: document.getElementById("record-detail"),
  filter: document.getElementById("queue-filter"),
  pending: document.getElementById("pending-count"),
  verified: document.getElementById("verified-count"),
  coverage: document.getElementById("coverage-rate"),
  accuracy: document.getElementById("accuracy-rate"),
  verifyNext: document.getElementById("verify-next-btn"),
  seed: document.getElementById("seed-btn"),
  chatFeed: document.getElementById("chat-feed"),
  messageForm: document.getElementById("message-form"),
  messageInput: document.getElementById("message-input"),
  extractor: document.getElementById("extractor-card"),
  partnerGrid: document.getElementById("partner-grid"),
  partnerSelect: document.getElementById("partner-select"),
  moduleList: document.getElementById("module-list"),
  messageList: document.getElementById("message-list"),
  evidence: document.getElementById("evidence-detail"),
  verificationForm: document.getElementById("verification-form"),
  outletTable: document.getElementById("outlet-table"),
  taskList: document.getElementById("task-list"),
  paymentList: document.getElementById("payment-list"),
  reportList: document.getElementById("report-list"),
  salesmanTable: document.getElementById("salesman-table"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  closeModal: document.getElementById("close-modal-btn"),
  masterForm: document.getElementById("master-form"),
  modalTitle: document.getElementById("modal-title"),
  modalEyebrow: document.getElementById("modal-eyebrow"),
  quickAdd: document.getElementById("quick-add-btn"),
};

const persisted = localStorage.getItem("fieldops-state");
if (persisted) {
  try {
    const parsed = JSON.parse(persisted);
    state.brands = parsed.brands || state.brands;
    state.outlets = parsed.outlets || state.outlets;
    state.salesmen = parsed.salesmen || state.salesmen;
  } catch {
    localStorage.removeItem("fieldops-state");
  }
}

function persistMasterData() {
  localStorage.setItem(
    "fieldops-state",
    JSON.stringify({
      brands: state.brands,
      outlets: state.outlets,
      salesmen: state.salesmen,
    })
  );
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function confidenceTag(record) {
  return record.confidence >= 0.85 ? '<span class="tag">High confidence</span>' : '<span class="tag warn">Needs review</span>';
}

function filteredRecords() {
  const filter = selectors.filter.value;
  return state.records.filter((record) => {
    if (filter === "high") return record.confidence >= 0.85;
    if (filter === "low") return record.confidence < 0.85;
    return true;
  });
}

function renderMetrics() {
  const pending = state.records.filter((record) => record.status === "pending").length;
  const verified = state.records.filter((record) => record.status === "verified").length;
  const accepted = state.records.filter((record) => record.confidence >= 0.85).length;
  selectors.pending.textContent = pending;
  selectors.verified.textContent = verified;
  selectors.coverage.textContent = `${Math.round((verified / state.records.length) * 100)}%`;
  selectors.accuracy.textContent = `${Math.round((accepted / state.records.length) * 100)}%`;
}

function renderQueue() {
  selectors.queueList.innerHTML = filteredRecords()
    .map(
      (record) => `
        <button class="queue-item ${record.id === state.selectedId ? "active" : ""}" data-record-id="${record.id}">
          <div class="queue-top">
            <strong>${record.outlet}</strong>
            ${confidenceTag(record)}
          </div>
          <p>${record.message}</p>
          <div class="record-meta">
            <span>${record.partner}</span>
            <span>${record.city}</span>
            <span>${record.createdAt}</span>
            <span class="tag blue">${record.status}</span>
          </div>
        </button>
      `
    )
    .join("");
}

function renderDetail() {
  const record = state.records.find((item) => item.id === state.selectedId) || state.records[0];
  if (!record) {
    selectors.detail.innerHTML = "<p>No records yet.</p>";
    return;
  }

  selectors.detail.innerHTML = `
    <div>
      <div class="tag-row">
        <span class="tag blue">${record.type}</span>
        ${confidenceTag(record)}
        <span class="tag">${record.status}</span>
      </div>
      <h2>${record.outlet}</h2>
      <p>${record.message}</p>
    </div>
    <div class="field-grid">
      <div class="field"><span>Partner</span><strong>${record.partner}</strong></div>
      <div class="field"><span>Field agent</span><strong>${record.fieldAgent}</strong></div>
      <div class="field"><span>Units</span><strong>${record.units}</strong></div>
      <div class="field"><span>Value</span><strong>${money(record.value)}</strong></div>
      <div class="field"><span>City</span><strong>${record.city}</strong></div>
      <div class="field"><span>Confidence</span><strong>${Math.round(record.confidence * 100)}%</strong></div>
    </div>
    <div class="evidence-box">${record.evidence}</div>
    <div class="action-row">
      <button class="approve" data-action="verify" data-record-id="${record.id}">Approve</button>
      <button class="reject" data-action="reject" data-record-id="${record.id}">Send Back</button>
    </div>
  `;
}

function renderChat() {
  selectors.chatFeed.innerHTML = state.messages
    .map((message) => `<div class="message ${message.from === "ops" ? "outbound" : ""}">${message.text}</div>`)
    .join("");
  selectors.chatFeed.scrollTop = selectors.chatFeed.scrollHeight;
}

function renderInboxList() {
  selectors.messageList.innerHTML = state.records
    .map(
      (record) => `
        <button class="message-row" data-record-id="${record.id}">
          <div class="queue-top">
            <strong>${record.fieldAgent}</strong>
            <span class="tag blue">${record.type}</span>
          </div>
          <p>${record.message}</p>
          <div class="record-meta">
            <span>${record.evidence}</span>
            <span>${record.createdAt}</span>
          </div>
        </button>
      `
    )
    .join("");
}

function extractMessage(text) {
  const outletMatch = text.match(/outlet:\s*([^,.]+)/i);
  const unitsMatch = text.match(/(\d+)\s*(units|pcs|cases)?/i);
  const partner = state.brands.find((brand) => text.toLowerCase().includes(brand.name.toLowerCase()))?.name || state.brands[0]?.name || "Unassigned";
  const units = unitsMatch ? Number(unitsMatch[1]) : 0;
  return {
    id: `rec-${Date.now()}`,
    outlet: outletMatch ? outletMatch[1].trim() : "Unmatched Outlet",
    city: text.toLowerCase().includes("mumbai") ? "Mumbai" : text.toLowerCase().includes("pune") ? "Pune" : "Unconfirmed",
    partner,
    fieldAgent: "Field Team",
    type: text.toLowerCase().includes("stock") ? "Stockout" : units > 0 ? "Sale" : "Visit",
    units,
    value: units * 150,
    status: "pending",
    confidence: outletMatch && unitsMatch ? 0.86 : 0.58,
    evidence: text.toLowerCase().includes("photo") ? "WhatsApp text + media mention" : "WhatsApp text",
    message: text,
    createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function renderExtractor() {
  const latest = state.records[0];
  selectors.extractor.innerHTML = `
    <div class="field"><span>Provider</span><strong>ExtractionProvider.extract(message)</strong></div>
    <div class="field"><span>Detected outlet</span><strong>${latest.outlet}</strong></div>
    <div class="field"><span>Detected event</span><strong>${latest.type}</strong></div>
    <div class="field"><span>Confidence</span><strong>${Math.round(latest.confidence * 100)}%</strong></div>
    <div class="field"><span>Routing decision</span><strong>${latest.confidence >= 0.85 ? "Ops quick approve" : "Manual review required"}</strong></div>
  `;
}

function renderVerification() {
  const record = state.records.find((item) => item.id === state.selectedId) || state.records[0];
  selectors.evidence.innerHTML = `
    <div class="evidence-card">
      <span class="tag blue">${record.evidence}</span>
      <h2>${record.outlet}</h2>
      <p>${record.message}</p>
      <div class="record-meta">
        <span>Source: WhatsApp</span>
        <span>Agent: ${record.fieldAgent}</span>
        <span>Time: ${record.createdAt}</span>
      </div>
    </div>
    <div class="evidence-box">Media / OCR / Transcript Preview</div>
    <div class="evidence-card">
      <strong>Audit rule</strong>
      <p>Raw message is immutable. AI draft and verified record remain separate.</p>
    </div>
  `;

  selectors.verificationForm.innerHTML = `
    <div class="draft-form">
      <div class="form-field"><label>Record type</label><input value="${record.type}" /></div>
      <div class="form-field"><label>Outlet</label><input value="${record.outlet}" /></div>
      <div class="form-field"><label>Brand</label><input value="${record.partner}" /></div>
      <div class="form-field"><label>City</label><input value="${record.city}" /></div>
      <div class="form-field"><label>Units</label><input value="${record.units}" /></div>
      <div class="form-field"><label>Value</label><input value="${record.value}" /></div>
    </div>
    <div class="tag-row">
      ${confidenceTag(record)}
      <span class="tag blue">A approve</span>
      <span class="tag blue">R reject</span>
      <span class="tag blue">C clarify</span>
      <span class="tag blue">N new outlet</span>
    </div>
    <div class="action-row">
      <button class="approve" data-action="verify" data-record-id="${record.id}">Approve Verified Record</button>
      <button class="reject" data-action="reject" data-record-id="${record.id}">Ask Clarification</button>
    </div>
  `;
}

function renderPartners() {
  const selected = selectors.partnerSelect.value || "all";
  selectors.partnerSelect.innerHTML = `
    <option value="all">All partners</option>
    ${state.brands.map((brand) => `<option value="${brand.name}" ${selected === brand.name ? "selected" : ""}>${brand.name}</option>`).join("")}
  `;
  const visible = state.records.filter((record) => record.status === "verified" && (selected === "all" || record.partner === selected));
  const byPartner = visible.reduce((acc, record) => {
    acc[record.partner] ||= { partner: record.partner, outlets: 0, units: 0, value: 0 };
    acc[record.partner].outlets += 1;
    acc[record.partner].units += record.units;
    acc[record.partner].value += record.value;
    return acc;
  }, {});

  const cards = Object.values(byPartner);
  const emptyBrands = state.brands.filter((brand) => !cards.some((card) => card.partner === brand.name) && (selected === "all" || selected === brand.name));
  selectors.partnerGrid.innerHTML = cards.length
    ? cards
        .map(
          (card) => `
            <article class="partner-card">
              <div>
                <h2>${card.partner}</h2>
                <p>${card.outlets} verified outlet updates</p>
              </div>
              <div class="field-grid">
                <div class="field"><span>Units</span><strong>${card.units}</strong></div>
                <div class="field"><span>Sales</span><strong>${money(card.value)}</strong></div>
              </div>
              <div>
                <div class="record-meta"><span>Coverage quality</span><strong>${Math.min(100, 62 + card.outlets * 18)}%</strong></div>
                <div class="bar"><span style="width:${Math.min(100, 62 + card.outlets * 18)}%"></span></div>
              </div>
            </article>
          `
        )
        .join("") +
      emptyBrands
        .map(
          (brand) => `
            <article class="partner-card">
              <div>
                <h2>${brand.name}</h2>
                <p>${brand.category} client managed by ${brand.contact || "internal ops"}</p>
              </div>
              <div class="field-grid">
                <div class="field"><span>Verified outlets</span><strong>0</strong></div>
                <div class="field"><span>Status</span><strong>${brand.status}</strong></div>
              </div>
              <div class="bar"><span style="width:8%"></span></div>
            </article>
          `
        )
        .join("")
    : '<article class="partner-card"><h2>No verified records</h2><p>Approve queue items to publish partner-visible data.</p></article>';
}

function renderModules() {
  selectors.moduleList.innerHTML = modules
    .map(([title, body]) => `<article class="module-card"><h3>${title}</h3><p>${body}</p></article>`)
    .join("");
}

function renderOutlets() {
  selectors.outletTable.innerHTML = `
    <div class="table-row header">
      <span>Outlet</span><span>City</span><span>Channel</span><span>Brand</span><span>Status</span>
    </div>
    ${state.outlets
      .map(
        (outlet) => `
          <div class="table-row">
            <strong>${outlet.name}</strong>
            <span>${outlet.city}</span>
            <span>${outlet.channel}</span>
            <span>${outlet.brand}</span>
            <span class="tag ${outlet.status === "Prospect" ? "warn" : ""}">${outlet.status}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function renderSalesmen() {
  selectors.salesmanTable.innerHTML = `
    <div class="table-row salesman header">
      <span>Salesman</span><span>WhatsApp</span><span>Territory</span><span>Status</span>
    </div>
    ${state.salesmen
      .map(
        (person) => `
          <div class="table-row salesman">
            <strong>${person.name}</strong>
            <span>${person.phone}</span>
            <span>${person.territory}, ${person.city}</span>
            <span class="tag">${person.status}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function renderTasks() {
  selectors.taskList.innerHTML = tasks
    .map(
      ([type, outlet, priority, status]) => `
        <article class="task-row">
          <div class="queue-top"><strong>${type}</strong><span class="tag ${priority === "High" ? "warn" : "blue"}">${priority}</span></div>
          <p>${outlet}</p>
          <div class="record-meta"><span>${status}</span></div>
        </article>
      `
    )
    .join("");

  selectors.paymentList.innerHTML = payments
    .map(
      ([outlet, brand, amount, status, risk]) => `
        <article class="task-row">
          <div class="queue-top"><strong>${outlet}</strong><span class="tag ${risk === "High" ? "warn" : "blue"}">${risk} risk</span></div>
          <p>${brand} - ${money(amount)}</p>
          <div class="record-meta"><span>${status}</span></div>
        </article>
      `
    )
    .join("");
}

function renderReports() {
  selectors.reportList.innerHTML = reports
    .map(([title, body]) => `<article class="module-card"><h3>${title}</h3><p>${body}</p></article>`)
    .join("");
}

const formConfigs = {
  outlet: {
    eyebrow: "Outlet master",
    title: "Add Outlet",
    fields: [
      ["name", "Outlet name", "text", "Raj Stores"],
      ["owner", "Owner / contact person", "text", "Raj Patil"],
      ["phone", "Phone / WhatsApp", "tel", "+91 90000 10001"],
      ["city", "City", "text", "Pune"],
      ["channel", "Channel type", "text", "Kirana"],
      ["brand", "Brand client", "select", ""],
      ["status", "Status", "select", ""],
    ],
  },
  brand: {
    eyebrow: "Client setup",
    title: "Add Brand Client",
    fields: [
      ["name", "Brand / client name", "text", "NourishCo"],
      ["category", "Category", "text", "Nutrition"],
      ["contact", "Contact person", "text", "Ananya Rao"],
      ["email", "Contact email", "email", "ops@example.com"],
      ["phone", "Contact phone", "tel", "+91 90000 20001"],
      ["status", "Status", "select", ""],
    ],
  },
  salesman: {
    eyebrow: "Field team",
    title: "Add Salesman",
    fields: [
      ["name", "Salesman name", "text", "Meera S."],
      ["phone", "WhatsApp number", "tel", "+91 98888 10001"],
      ["city", "City", "text", "Pune"],
      ["territory", "Territory", "text", "Pune West"],
      ["manager", "Manager", "text", "Ops Manager"],
      ["status", "Status", "select", ""],
    ],
  },
};

function fieldOptions(name) {
  if (name === "brand") return state.brands.map((brand) => brand.name);
  if (name === "status") return ["Active", "Prospect", "Inactive"];
  return [];
}

function openForm(type) {
  const config = formConfigs[type];
  if (!config) return;
  state.modalType = type;
  selectors.modalEyebrow.textContent = config.eyebrow;
  selectors.modalTitle.textContent = config.title;
  selectors.masterForm.innerHTML = `
    <div class="form-grid">
      ${config.fields
        .map(([name, label, kind, placeholder]) => {
          const wide = ["email", "manager"].includes(name) ? " wide" : "";
          if (kind === "select") {
            return `
              <div class="form-field${wide}">
                <label for="field-${name}">${label}</label>
                <select id="field-${name}" name="${name}" required>
                  ${fieldOptions(name).map((option) => `<option value="${option}">${option}</option>`).join("")}
                </select>
              </div>
            `;
          }
          return `
            <div class="form-field${wide}">
              <label for="field-${name}">${label}</label>
              <input id="field-${name}" name="${name}" type="${kind}" placeholder="${placeholder}" required />
            </div>
          `;
        })
        .join("")}
    </div>
    <p class="form-error" id="form-error" hidden></p>
    <div class="action-row">
      <button class="approve" type="submit">Save ${config.title.replace("Add ", "")}</button>
      <button class="reject" type="button" id="cancel-form-btn">Cancel</button>
    </div>
  `;
  selectors.modalBackdrop.hidden = false;
}

function closeForm() {
  state.modalType = null;
  selectors.modalBackdrop.hidden = true;
  selectors.masterForm.innerHTML = "";
}

function addMasterRecord(type, values) {
  if (type === "outlet") {
    state.outlets.unshift({
      id: `outlet-${Date.now()}`,
      name: values.name,
      owner: values.owner,
      phone: values.phone,
      city: values.city,
      channel: values.channel,
      brand: values.brand,
      status: values.status,
    });
    state.activeView = "outlets";
  }

  if (type === "brand") {
    state.brands.unshift({
      id: `brand-${Date.now()}`,
      name: values.name,
      category: values.category,
      contact: values.contact,
      email: values.email,
      phone: values.phone,
      status: values.status,
    });
    state.activeView = "partners";
  }

  if (type === "salesman") {
    state.salesmen.unshift({
      id: `sales-${Date.now()}`,
      name: values.name,
      phone: values.phone,
      city: values.city,
      territory: values.territory,
      manager: values.manager,
      status: values.status,
    });
    state.activeView = "ops";
  }

  persistMasterData();
}

function setActiveView(viewName) {
  state.activeView = viewName;
  selectors.tabs.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  selectors.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  const titles = {
    command: "Command Center",
    inbox: "WhatsApp Inbox",
    verification: "Verification Queue",
    outlets: "Outlet Master",
    tasks: "Tasks & Payments",
    reports: "Reports",
    partners: "Brand Partner Dashboard",
    ops: "Operations Model",
  };
  selectors.title.textContent = titles[viewName] || "Command Center";
}

function renderAll() {
  renderMetrics();
  renderQueue();
  renderDetail();
  renderChat();
  renderInboxList();
  renderExtractor();
  renderVerification();
  renderPartners();
  renderModules();
  renderOutlets();
  renderSalesmen();
  renderTasks();
  renderReports();
}

function verifyRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (record) {
    record.status = "verified";
    record.confidence = Math.max(record.confidence, 0.88);
    state.messages.push({ from: "ops", text: `${record.outlet} verified. Partner dashboard updated.` });
  }
  renderAll();
}

function rejectRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (record) {
    record.status = "needs field clarification";
    state.messages.push({ from: "ops", text: `${record.outlet}: please confirm missing details before publishing.` });
  }
  renderAll();
}

selectors.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveView(tab.dataset.view);
  });
});

selectors.queueList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-record-id]");
  if (!item) return;
  state.selectedId = item.dataset.recordId;
  renderQueue();
  renderDetail();
});

selectors.messageList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-record-id]");
  if (!item) return;
  state.selectedId = item.dataset.recordId;
  renderAll();
});

selectors.detail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "verify") verifyRecord(button.dataset.recordId);
  if (button.dataset.action === "reject") rejectRecord(button.dataset.recordId);
});

selectors.verificationForm.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "verify") verifyRecord(button.dataset.recordId);
  if (button.dataset.action === "reject") rejectRecord(button.dataset.recordId);
});

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open-form]");
  if (opener) {
    openForm(opener.dataset.openForm);
    return;
  }

  if (event.target === selectors.modalBackdrop || event.target === selectors.closeModal || event.target.id === "cancel-form-btn") {
    closeForm();
  }
});

selectors.quickAdd.addEventListener("click", () => openForm("outlet"));

selectors.masterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(selectors.masterForm).entries());
  const error = document.getElementById("form-error");
  const missing = Object.entries(values).find(([, value]) => !String(value).trim());

  if (missing) {
    error.textContent = "Please fill every required field before saving.";
    error.hidden = false;
    return;
  }

  addMasterRecord(state.modalType, values);
  closeForm();
  setActiveView(state.activeView);
  renderAll();
});

document.addEventListener("keydown", (event) => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
  if (!["a", "r", "c"].includes(event.key.toLowerCase())) return;
  const record = state.records.find((item) => item.id === state.selectedId);
  if (!record || !["command", "verification"].includes(state.activeView)) return;
  if (event.key.toLowerCase() === "a") verifyRecord(record.id);
  if (event.key.toLowerCase() === "r" || event.key.toLowerCase() === "c") rejectRecord(record.id);
});

selectors.filter.addEventListener("change", renderQueue);
selectors.partnerSelect.addEventListener("change", renderPartners);
selectors.verifyNext.addEventListener("click", () => {
  const next = state.records.find((record) => record.status === "pending");
  if (next) {
    state.selectedId = next.id;
    verifyRecord(next.id);
  }
});

selectors.seed.addEventListener("click", () => {
  const record = extractMessage("Outlet: City Fresh Mumbai, 18 units DailyBite, paid UPI, photo shared");
  state.records.unshift(record);
  state.selectedId = record.id;
  state.messages.push({ from: "field", text: record.message });
  renderAll();
});

selectors.messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = selectors.messageInput.value.trim();
  if (!text) return;
  const record = extractMessage(text);
  state.records.unshift(record);
  state.selectedId = record.id;
  state.messages.push({ from: "field", text });
  state.messages.push({ from: "ops", text: `Extracted ${record.type.toLowerCase()} for ${record.outlet}. Added to verification queue.` });
  selectors.messageInput.value = "";
  renderAll();
});

renderAll();
