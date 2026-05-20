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

export type CommandCenterData = {
  records: CommandRecord[];
  brands: BrandOption[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
  tasks: TaskRow[];
  setupError?: string;
};
