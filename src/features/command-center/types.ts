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

export type CommandCenterData = {
  records: CommandRecord[];
  brands: BrandOption[];
  outlets: OutletRow[];
  salesmen: SalesmanRow[];
};
