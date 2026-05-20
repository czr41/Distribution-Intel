export type CommandRecord = {
  id: string;
  outlet: string;
  city: string;
  partner: string;
  fieldAgent: string;
  type: "Sale" | "Stockout" | "Merchandising" | "Order" | "Visit";
  units: number;
  value: number;
  status: "pending" | "verified" | "needs field clarification";
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
  status: "Active" | "Inactive";
};

export type OutletRow = {
  id: string;
  name: string;
  city: string;
  channel: string;
  brand: string;
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

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  taskType: string;
  outlet: string;
  brand: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In progress" | "Waiting for response" | "Completed" | "Cancelled" | "Overdue";
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
  provider: "gemini" | "ollama_gemma" | "manual";
  model: string;
  status: "Connected" | "Draft" | "Disabled";
  baseUrl: string;
  hasApiKey: boolean;
  extractionMode: "structured_json" | "draft_only";
  lastTestStatus: string;
  lastError: string;
  updatedAt: string;
};

export type CommandCenterData = {
  records: CommandRecord[];
  brands: BrandOption[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  tasks: TaskRow[];
  metaIntegration: MetaIntegrationSettings;
  aiProvider: AIProviderSettings;
  setupError?: string;
};
