export type DemoRecord = {
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

export type DemoBrand = {
  id: string;
  name: string;
  category: string;
  contact: string;
  status: "Active" | "Inactive";
};

export type DemoOutlet = {
  id: string;
  name: string;
  city: string;
  channel: string;
  brand: string;
  status: "Active" | "Prospect" | "Inactive";
  owner: string;
  phone: string;
};

export type DemoSalesman = {
  id: string;
  name: string;
  phone: string;
  city: string;
  territory: string;
  status: "Active" | "Inactive";
};

export const initialRecords: DemoRecord[] = [
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
    createdAt: "10:12"
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
    createdAt: "10:24"
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
    createdAt: "09:48"
  }
];

export const initialBrands: DemoBrand[] = [
  { id: "brand-1", name: "NourishCo", category: "Nutrition", contact: "Ananya Rao", status: "Active" },
  { id: "brand-2", name: "GlowWell", category: "Personal care", contact: "Karan Mehta", status: "Active" },
  { id: "brand-3", name: "DailyBite", category: "Packaged foods", contact: "Priya Nair", status: "Active" }
];

export const initialOutlets: DemoOutlet[] = [
  { id: "outlet-1", name: "Raj Stores", city: "Pune", channel: "Kirana", brand: "NourishCo", status: "Active", owner: "Raj Patil", phone: "+91 90000 10001" },
  { id: "outlet-2", name: "Fresh Basket", city: "Nashik", channel: "Supermarket", brand: "GlowWell", status: "Prospect", owner: "S. Kale", phone: "+91 90000 10002" },
  { id: "outlet-3", name: "Metro Mini Mart", city: "Mumbai", channel: "Supermarket", brand: "DailyBite", status: "Active", owner: "Nisha Shah", phone: "+91 90000 10003" }
];

export const initialSalesmen: DemoSalesman[] = [
  { id: "sales-1", name: "Meera S.", phone: "+91 98888 10001", city: "Pune", territory: "Pune West", status: "Active" },
  { id: "sales-2", name: "Arjun K.", phone: "+91 98888 10002", city: "Nashik", territory: "Nashik Core", status: "Active" },
  { id: "sales-3", name: "Ravi M.", phone: "+91 98888 10003", city: "Thane", territory: "Thane Retail", status: "Active" }
];
