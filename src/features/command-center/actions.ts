"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppUserRow, BillRow, BrandOption, OrderRow, OutletRow, PaymentRow, SalesmanRow, SkuRow, TaskRow, TerritoryRow, VerificationDraftRecord } from "./types";

const statusMap = {
  Active: "active",
  Prospect: "prospect",
  Inactive: "inactive"
} as const;

const brandSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contact: z.string().min(1),
  status: z.enum(["Active", "Inactive"])
});

const outletSchema = z.object({
  name: z.string().min(1),
  owner: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  channel: z.string().min(1),
  brand: z.string().optional(),
  territory: z.string().optional(),
  assignedSalesman: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Inactive"])
});

const salesmanSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  territory: z.string().min(1),
  status: z.enum(["Active", "Inactive"])
});

const userRoleMap = {
  Admin: "super_admin",
  Manager: "operations_manager",
  "Admin Operator": "admin_operator",
  "Sales Executive": "field_executive",
  "Brand Viewer": "brand_partner_viewer",
  "Brand Manager": "brand_partner_manager"
} as const;

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  role: z.enum(["Admin", "Manager", "Admin Operator", "Sales Executive", "Brand Viewer", "Brand Manager"]),
  territory: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const taskStatusMap = {
  Open: "open",
  "In progress": "in_progress",
  "Waiting for response": "waiting_for_response",
  Completed: "completed",
  Cancelled: "cancelled",
  Overdue: "overdue"
} as const;

const taskPriorityMap = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical"
} as const;

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  taskType: z.string().min(1),
  assignedTo: z.string().optional(),
  outlet: z.string().min(1),
  brand: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Open", "In progress", "Waiting for response", "Completed", "Cancelled", "Overdue"])
});

const territorySchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  region: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const skuSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  brand: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  mrp: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

const paymentStatusMap = {
  Due: "due",
  "Partially paid": "partially_paid",
  Paid: "paid",
  Overdue: "overdue",
  Disputed: "disputed",
  "Written off": "written_off"
} as const;

const riskLevelMap = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical"
} as const;

const paymentSchema = z.object({
  outlet: z.string().min(1),
  brand: z.string().min(1),
  amountDue: z.string().min(1),
  amountCollected: z.string().optional(),
  dueDate: z.string().optional(),
  promisedPaymentDate: z.string().optional(),
  paymentMode: z.string().optional(),
  status: z.enum(["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"]),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"])
});

const orderStatusMap = {
  "Intent captured": "intent_captured",
  Confirmed: "confirmed",
  Billed: "billed",
  Delivered: "delivered",
  Cancelled: "cancelled",
  "On hold": "on_hold"
} as const;

const orderSchema = z.object({
  outlet: z.string().min(1),
  brand: z.string().min(1),
  expectedValue: z.string().min(1),
  expectedDeliveryDate: z.string().optional(),
  status: z.enum(["Intent captured", "Confirmed", "Billed", "Delivered", "Cancelled", "On hold"])
});

const billSchema = z.object({
  outlet: z.string().min(1),
  brand: z.string().min(1),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  totalAmount: z.string().min(1),
  paymentStatus: z.enum(["Due", "Partially paid", "Paid", "Overdue", "Disputed", "Written off"])
});

const connectionStatusMap = {
  Connected: "connected",
  Draft: "draft",
  Disabled: "disabled"
} as const;

const metaIntegrationSchema = z.object({
  displayName: z.string().min(1),
  phoneNumberId: z.string().min(1),
  whatsappBusinessAccountId: z.string().min(1),
  businessPortfolioId: z.string().optional(),
  graphApiVersion: z.string().min(1),
  webhookVerifyToken: z.string().optional(),
  accessToken: z.string().optional(),
  appSecret: z.string().optional(),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const aiProviderSchema = z.object({
  provider: z.enum(["gemini", "sarvam", "openai", "ollama_gemma", "manual"]),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  extractionMode: z.enum(["structured_json", "draft_only"]),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const openAIIntegrationSchema = z.object({
  model: z.string().min(1),
  transcriptionModel: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

const verificationDraftSchema = z.object({
  id: z.string().uuid(),
  recordType: z.string().min(1),
  title: z.string().min(1),
  outletName: z.string().optional(),
  brandName: z.string().optional(),
  amount: z.string().optional(),
  quantity: z.string().optional(),
  sku: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  reviewNotes: z.string().optional()
});

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formId(formData: FormData) {
  return z.string().uuid().parse(formValue(formData, "id"));
}

function objectJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function brandStatus(status?: string | null): BrandOption["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function outletStatus(status?: string | null): OutletRow["status"] {
  if (status === "inactive") return "Inactive";
  if (status === "prospect") return "Prospect";
  return "Active";
}

function skuStatus(status?: string | null): SkuRow["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function taskStatus(status?: string | null): TaskRow["status"] {
  if (status === "in_progress") return "In progress";
  if (status === "waiting_for_response") return "Waiting for response";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "overdue") return "Overdue";
  return "Open";
}

function taskPriority(priority?: string | null): TaskRow["priority"] {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function paymentStatus(status?: string | null): PaymentRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Due";
}

function riskLevel(risk?: string | null): PaymentRow["riskLevel"] {
  if (risk === "low") return "Low";
  if (risk === "high") return "High";
  if (risk === "critical") return "Critical";
  return "Medium";
}

function orderStatus(status?: string | null): OrderRow["status"] {
  if (status === "confirmed") return "Confirmed";
  if (status === "billed") return "Billed";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "on_hold") return "On hold";
  return "Intent captured";
}

function userStatus(status?: string | null): AppUserRow["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function roleLabel(role: AppUserRow["role"]) {
  const labels: Record<AppUserRow["role"], string> = {
    super_admin: "Admin",
    operations_manager: "Manager",
    admin_operator: "Admin Operator",
    field_executive: "Sales Executive",
    brand_partner_viewer: "Brand Viewer",
    brand_partner_manager: "Brand Manager"
  };
  return labels[role] ?? role;
}

function appUserFromData(data: { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, territory = "Managed in Sales App & Team"): AppUserRow {
  return {
    id: data.id,
    name: data.name,
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role,
    roleLabel: roleLabel(data.role),
    territory,
    status: userStatus(data.status)
  };
}

function numberInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Enter a valid number.");
  return numeric;
}

function optionalNumberInput(value?: string) {
  if (!value) return 0;
  return numberInput(value);
}

function numberValue(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function findBrandIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, brandName?: string) {
  if (!brandName || brandName === "Unassigned") return null;
  const { data, error } = await supabase.from("brands").select("id").eq("name", brandName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findOutletIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, outletName?: string) {
  if (!outletName || outletName === "Unassigned") return null;
  const { data, error } = await supabase.from("outlets").select("id").eq("name", outletName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findUserIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, userName?: string) {
  if (!userName || userName === "Unassigned") return null;
  const { data, error } = await supabase.from("users").select("id").eq("name", userName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findTerritoryIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, territoryName?: string) {
  if (!territoryName || territoryName === "Unassigned") return null;
  const { data, error } = await supabase.from("territories").select("id").eq("name", territoryName).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function findExecutiveIdByName(supabase: ReturnType<typeof createSupabaseAdminClient>, executiveName?: string) {
  if (!executiveName || executiveName === "Unassigned") return null;
  const { data, error } = await supabase
    .from("field_executives")
    .select("id,users!field_executives_user_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ id: string; users?: { name?: string | null } | { name?: string | null }[] | null }>;
  const match = rows.find((person) => {
    const user = Array.isArray(person.users) ? person.users[0] : person.users;
    return user?.name === executiveName;
  });
  return match?.id ?? null;
}

function draftStatus(status?: string | null): VerificationDraftRecord["status"] {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Needs review";
}

function verificationDraftFromRow(row: {
  id: string;
  record_type: string;
  title: string;
  status: string | null;
  confidence: number | string | null;
  draft_json: Record<string, unknown> | null;
  created_at: string;
}, reviewNotes = ""): VerificationDraftRecord {
  const draftJson = row.draft_json ?? {};
  return {
    id: row.id,
    recordType: row.record_type,
    title: row.title,
    status: draftStatus(row.status),
    confidence: numberValue(row.confidence),
    primaryCategory: typeof draftJson.category === "string" ? draftJson.category : "unclear",
    secondaryCategories: Array.isArray(draftJson.secondary_categories) ? draftJson.secondary_categories.map(String) : [],
    languageDetected: typeof draftJson.language_detected === "string" ? draftJson.language_detected : "unknown",
    normalizedText: typeof draftJson.normalized_text === "string" ? draftJson.normalized_text : "",
    reasonForReview: reviewNotes || "Needs admin confirmation",
    rawText: typeof draftJson.source_text === "string" ? draftJson.source_text : "",
    transcriptText: "",
    ocrText: "",
    draftJson,
    outletName: typeof draftJson.outlet_name === "string" ? draftJson.outlet_name : "Unassigned",
    brandName: typeof draftJson.brand_name === "string" ? draftJson.brand_name : "Unassigned",
    amount: numberValue(
      typeof draftJson.amount === "number" || typeof draftJson.amount === "string"
        ? draftJson.amount
        : typeof draftJson.amount_pending === "number" || typeof draftJson.amount_pending === "string"
          ? draftJson.amount_pending
          : 0
    ),
    quantity: typeof draftJson.quantity === "string" ? draftJson.quantity : "",
    sku: typeof draftJson.sku === "string" ? draftJson.sku : "",
    createdAt: row.created_at
  };
}

async function findOrCreateTerritory(supabase: ReturnType<typeof createSupabaseAdminClient>, name: string, city: string) {
  const { data: existing, error: existingError } = await supabase
    .from("territories")
    .select("id")
    .eq("name", name)
    .eq("city", city)
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

  const { data: territory, error } = await supabase
    .from("territories")
    .insert({
      name,
      city,
      state: "Unassigned",
      status: "active"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return territory.id as string;
}

export async function createBrandAction(formData: FormData): Promise<BrandOption> {
  const input = brandSchema.parse({
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    contact: formValue(formData, "contact"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: input.name,
      category: input.category,
      contact_person: input.contact,
      status: statusMap[input.status]
    })
    .select("id,name,category,contact_person,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    category: data.category ?? "Uncategorized",
    contact: data.contact_person ?? "Internal ops",
    status: brandStatus(data.status)
  };
}

export async function updateBrandAction(formData: FormData): Promise<BrandOption> {
  const id = formId(formData);
  const input = brandSchema.parse({
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    contact: formValue(formData, "contact"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update({
      name: input.name,
      category: input.category,
      contact_person: input.contact,
      status: statusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,category,contact_person,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    category: data.category ?? "Uncategorized",
    contact: data.contact_person ?? "Internal ops",
    status: brandStatus(data.status)
  };
}

export async function createSkuAction(formData: FormData): Promise<SkuRow> {
  const input = skuSchema.parse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code"),
    brand: formValue(formData, "brand"),
    category: formValue(formData, "category"),
    unit: formValue(formData, "unit"),
    mrp: formValue(formData, "mrp"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before adding a product/SKU.");

  const { data, error } = await supabase
    .from("skus")
    .insert({
      brand_id: brandId,
      name: input.name,
      code: input.code || null,
      category: input.category || null,
      unit: input.unit || null,
      mrp: input.mrp ? numberInput(input.mrp) : 0,
      status: statusMap[input.status]
    })
    .select("id,name,code,category,unit,mrp,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    code: data.code ?? "",
    brand: input.brand,
    category: data.category ?? "Uncategorized",
    unit: data.unit ?? "Unit",
    mrp: numberValue(data.mrp),
    status: skuStatus(data.status)
  };
}

export async function updateSkuAction(formData: FormData): Promise<SkuRow> {
  const id = formId(formData);
  const input = skuSchema.parse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code"),
    brand: formValue(formData, "brand"),
    category: formValue(formData, "category"),
    unit: formValue(formData, "unit"),
    mrp: formValue(formData, "mrp"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);
  if (!brandId) throw new Error("Choose a valid brand client before updating a product/SKU.");

  const { data, error } = await supabase
    .from("skus")
    .update({
      brand_id: brandId,
      name: input.name,
      code: input.code || null,
      category: input.category || null,
      unit: input.unit || null,
      mrp: input.mrp ? numberInput(input.mrp) : 0,
      status: statusMap[input.status]
    })
    .eq("id", id)
    .select("id,name,code,category,unit,mrp,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    code: data.code ?? "",
    brand: input.brand,
    category: data.category ?? "Uncategorized",
    unit: data.unit ?? "Unit",
    mrp: numberValue(data.mrp),
    status: skuStatus(data.status)
  };
}

export async function createOutletAction(formData: FormData): Promise<OutletRow> {
  const input = outletSchema.parse({
    name: formValue(formData, "name"),
    owner: formValue(formData, "owner"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    channel: formValue(formData, "channel"),
    brand: formValue(formData, "brand"),
    territory: formValue(formData, "territory"),
    assignedSalesman: formValue(formData, "assignedSalesman"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, territoryId, assignedExecutiveId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findTerritoryIdByName(supabase, input.territory),
    findExecutiveIdByName(supabase, input.assignedSalesman)
  ]);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .insert({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
      territory_id: territoryId,
      assigned_executive_id: assignedExecutiveId,
      status: statusMap[input.status]
    })
    .select("id,name,owner_name,phone,city,channel_type,status")
    .single();

  if (outletError) throw new Error(outletError.message);

  if (brandId) {
    const { error: linkError } = await supabase.from("outlet_brands").insert({
      outlet_id: outlet.id,
      brand_id: brandId,
      status: "active",
      onboarded_at: new Date().toISOString()
    });
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/");
  return {
    id: outlet.id,
    name: outlet.name,
    owner: outlet.owner_name ?? "",
    phone: outlet.phone ?? "",
    city: outlet.city,
    channel: outlet.channel_type ?? "Unassigned",
    brand: input.brand || "Unassigned",
    territory: input.territory || "Unassigned",
    assignedSalesman: input.assignedSalesman || "Unassigned",
    status: outletStatus(outlet.status)
  };
}

export async function updateOutletAction(formData: FormData): Promise<OutletRow> {
  const id = formId(formData);
  const input = outletSchema.parse({
    name: formValue(formData, "name"),
    owner: formValue(formData, "owner"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    channel: formValue(formData, "channel"),
    brand: formValue(formData, "brand"),
    territory: formValue(formData, "territory"),
    assignedSalesman: formValue(formData, "assignedSalesman"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, territoryId, assignedExecutiveId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findTerritoryIdByName(supabase, input.territory),
    findExecutiveIdByName(supabase, input.assignedSalesman)
  ]);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .update({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
      territory_id: territoryId,
      assigned_executive_id: assignedExecutiveId,
      status: statusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,owner_name,phone,city,channel_type,status")
    .single();

  if (outletError) throw new Error(outletError.message);

  const { error: unlinkError } = await supabase.from("outlet_brands").delete().eq("outlet_id", id);
  if (unlinkError) throw new Error(unlinkError.message);
  if (brandId) {
    const { error: linkError } = await supabase.from("outlet_brands").insert({
      outlet_id: id,
      brand_id: brandId,
      status: "active",
      onboarded_at: new Date().toISOString()
    });
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/");
  return {
    id: outlet.id,
    name: outlet.name,
    owner: outlet.owner_name ?? "",
    phone: outlet.phone ?? "",
    city: outlet.city,
    channel: outlet.channel_type ?? "Unassigned",
    brand: input.brand || "Unassigned",
    territory: input.territory || "Unassigned",
    assignedSalesman: input.assignedSalesman || "Unassigned",
    status: outletStatus(outlet.status)
  };
}

export async function createUserAction(formData: FormData): Promise<AppUserRow> {
  const input = userSchema.parse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    role: formValue(formData, "role"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const role = userRoleMap[input.role];
  const email = input.email || `${input.phone.replace(/[^0-9]+/g, "") || Date.now()}@shipd2r.local`;

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email,
      phone: input.phone,
      role,
      status: statusMap[input.status]
    })
    .select("id,name,email,phone,role,status")
    .single();

  if (userError) throw new Error(userError.message);

  if (role === "field_executive") {
    const territoryId = await findOrCreateTerritory(supabase, input.territory || "Unassigned", "Unassigned");
    const { error: executiveError } = await supabase.from("field_executives").insert({
      user_id: user.id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status]
    });
    if (executiveError) throw new Error(executiveError.message);
  }

  revalidatePath("/");
  return appUserFromData(user as { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, input.territory || "Managed in Sales App & Team");
}

export async function updateUserAction(formData: FormData): Promise<AppUserRow> {
  const id = formId(formData);
  const input = userSchema.parse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    role: formValue(formData, "role"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const role = userRoleMap[input.role];
  const email = input.email || `${input.phone.replace(/[^0-9]+/g, "") || Date.now()}@shipd2r.local`;
  const now = new Date().toISOString();

  const { data: user, error: userError } = await supabase
    .from("users")
    .update({
      name: input.name,
      email,
      phone: input.phone,
      role,
      status: statusMap[input.status],
      updated_at: now
    })
    .eq("id", id)
    .select("id,name,email,phone,role,status")
    .single();

  if (userError) throw new Error(userError.message);

  if (role === "field_executive") {
    const territoryId = await findOrCreateTerritory(supabase, input.territory || "Unassigned", "Unassigned");
    const { data: existingExecutive, error: existingError } = await supabase
      .from("field_executives")
      .select("id")
      .eq("user_id", id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const payload = {
      user_id: id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status],
      updated_at: now
    };
    const { error: executiveError } = existingExecutive?.id
      ? await supabase.from("field_executives").update(payload).eq("id", existingExecutive.id)
      : await supabase.from("field_executives").insert(payload);
    if (executiveError) throw new Error(executiveError.message);
  }

  revalidatePath("/");
  return appUserFromData(user as { id: string; name: string; email: string | null; phone: string | null; role: AppUserRow["role"]; status: string | null }, input.territory || "Managed in Sales App & Team");
}

export async function createSalesmanAction(formData: FormData): Promise<SalesmanRow> {
  const input = salesmanSchema.parse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const email = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\\.|\\.$/g, "")}.${Date.now()}@sales-app.local`;
  const territoryId = await findOrCreateTerritory(supabase, input.territory, input.city);

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email,
      phone: input.phone,
      role: "field_executive",
      status: statusMap[input.status]
    })
    .select("id")
    .single();

  if (userError) throw new Error(userError.message);

  const { data: executive, error: executiveError } = await supabase
    .from("field_executives")
    .insert({
      user_id: user.id,
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status]
    })
    .select("id")
    .single();

  if (executiveError) throw new Error(executiveError.message);
  revalidatePath("/");
  return {
    id: executive.id,
    name: input.name,
    phone: input.phone,
    city: input.city,
    territory: input.territory,
    status: brandStatus(statusMap[input.status])
  };
}

export async function updateSalesmanAction(formData: FormData): Promise<SalesmanRow> {
  const id = formId(formData);
  const input = salesmanSchema.parse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: executive, error: executiveReadError } = await supabase
    .from("field_executives")
    .select("id,user_id")
    .eq("id", id)
    .single();

  if (executiveReadError) throw new Error(executiveReadError.message);

  const territoryId = await findOrCreateTerritory(supabase, input.territory, input.city);
  const now = new Date().toISOString();

  if (executive.user_id) {
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: input.name,
        phone: input.phone,
        status: statusMap[input.status],
        updated_at: now
      })
      .eq("id", executive.user_id);
    if (userError) throw new Error(userError.message);
  }

  const { error: executiveError } = await supabase
    .from("field_executives")
    .update({
      phone: input.phone,
      whatsapp_number: input.phone,
      territory_id: territoryId,
      status: statusMap[input.status],
      updated_at: now
    })
    .eq("id", id);

  if (executiveError) throw new Error(executiveError.message);
  revalidatePath("/");
  return {
    id,
    name: input.name,
    phone: input.phone,
    city: input.city,
    territory: input.territory,
    status: brandStatus(statusMap[input.status])
  };
}

export async function createTaskAction(formData: FormData): Promise<TaskRow> {
  const input = taskSchema.parse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    taskType: formValue(formData, "taskType"),
    assignedTo: formValue(formData, "assignedTo"),
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, assignedToId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findOutletIdByName(supabase, input.outlet),
    findUserIdByName(supabase, input.assignedTo)
  ]);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
      assigned_to: assignedToId,
      outlet_id: outletId,
      brand_id: brandId,
      due_date: input.dueDate || null,
      priority: taskPriorityMap[input.priority],
      status: taskStatusMap[input.status]
    })
    .select("id,title,description,task_type,due_date,priority,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "Created from verified sales or retailer signal.",
    taskType: data.task_type,
    assignedTo: input.assignedTo || "Unassigned",
    outlet: input.outlet || "Unassigned",
    brand: input.brand || "Unassigned",
    dueDate: data.due_date ?? "No due date",
    priority: taskPriority(data.priority),
    status: taskStatus(data.status)
  };
}

export async function updateTaskAction(formData: FormData): Promise<TaskRow> {
  const id = formId(formData);
  const input = taskSchema.parse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    taskType: formValue(formData, "taskType"),
    assignedTo: formValue(formData, "assignedTo"),
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId, assignedToId] = await Promise.all([
    findBrandIdByName(supabase, input.brand),
    findOutletIdByName(supabase, input.outlet),
    findUserIdByName(supabase, input.assignedTo)
  ]);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
      assigned_to: assignedToId,
      outlet_id: outletId,
      brand_id: brandId,
      due_date: input.dueDate || null,
      priority: taskPriorityMap[input.priority],
      status: taskStatusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,title,description,task_type,due_date,priority,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "Created from verified sales or retailer signal.",
    taskType: data.task_type,
    assignedTo: input.assignedTo || "Unassigned",
    outlet: input.outlet || "Unassigned",
    brand: input.brand || "Unassigned",
    dueDate: data.due_date ?? "No due date",
    priority: taskPriority(data.priority),
    status: taskStatus(data.status)
  };
}

export async function createTerritoryAction(formData: FormData): Promise<TerritoryRow> {
  const input = territorySchema.parse({
    name: formValue(formData, "name"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territories")
    .insert({
      name: input.name,
      city: input.city,
      state: input.state,
      region: input.region || null,
      status: statusMap[input.status]
    })
    .select("id,name,city,state,region,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    region: data.region ?? "Unassigned",
    status: brandStatus(data.status)
  };
}

export async function updateTerritoryAction(formData: FormData): Promise<TerritoryRow> {
  const id = formId(formData);
  const input = territorySchema.parse({
    name: formValue(formData, "name"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territories")
    .update({
      name: input.name,
      city: input.city,
      state: input.state,
      region: input.region || null,
      status: statusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,name,city,state,region,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    region: data.region ?? "Unassigned",
    status: brandStatus(data.status)
  };
}

export async function createPaymentAction(formData: FormData): Promise<PaymentRow> {
  const input = paymentSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    amountDue: formValue(formData, "amountDue"),
    amountCollected: formValue(formData, "amountCollected"),
    dueDate: formValue(formData, "dueDate"),
    promisedPaymentDate: formValue(formData, "promisedPaymentDate"),
    paymentMode: formValue(formData, "paymentMode"),
    status: formValue(formData, "status"),
    riskLevel: formValue(formData, "riskLevel")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      outlet_id: outletId,
      brand_id: brandId,
      amount_due: numberInput(input.amountDue),
      amount_collected: input.amountCollected ? numberInput(input.amountCollected) : 0,
      due_date: input.dueDate || null,
      promised_payment_date: input.promisedPaymentDate || null,
      payment_mode: input.paymentMode || null,
      status: paymentStatusMap[input.status],
      risk_level: riskLevelMap[input.riskLevel]
    })
    .select("id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,status,risk_level")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    amountDue: Number(data.amount_due ?? 0),
    amountCollected: Number(data.amount_collected ?? 0),
    dueDate: data.due_date ?? "No due date",
    promisedPaymentDate: data.promised_payment_date ?? "No promise",
    paymentMode: data.payment_mode ?? "Unassigned",
    status: paymentStatus(data.status),
    riskLevel: riskLevel(data.risk_level)
  };
}

export async function updatePaymentAction(formData: FormData): Promise<PaymentRow> {
  const id = formId(formData);
  const input = paymentSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    amountDue: formValue(formData, "amountDue"),
    amountCollected: formValue(formData, "amountCollected"),
    dueDate: formValue(formData, "dueDate"),
    promisedPaymentDate: formValue(formData, "promisedPaymentDate"),
    paymentMode: formValue(formData, "paymentMode"),
    status: formValue(formData, "status"),
    riskLevel: formValue(formData, "riskLevel")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("payments")
    .update({
      outlet_id: outletId,
      brand_id: brandId,
      amount_due: numberInput(input.amountDue),
      amount_collected: input.amountCollected ? numberInput(input.amountCollected) : 0,
      due_date: input.dueDate || null,
      promised_payment_date: input.promisedPaymentDate || null,
      payment_mode: input.paymentMode || null,
      status: paymentStatusMap[input.status],
      risk_level: riskLevelMap[input.riskLevel],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,status,risk_level")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    amountDue: Number(data.amount_due ?? 0),
    amountCollected: Number(data.amount_collected ?? 0),
    dueDate: data.due_date ?? "No due date",
    promisedPaymentDate: data.promised_payment_date ?? "No promise",
    paymentMode: data.payment_mode ?? "Unassigned",
    status: paymentStatus(data.status),
    riskLevel: riskLevel(data.risk_level)
  };
}

export async function createOrderAction(formData: FormData): Promise<OrderRow> {
  const input = orderSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    expectedValue: formValue(formData, "expectedValue"),
    expectedDeliveryDate: formValue(formData, "expectedDeliveryDate"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("orders")
    .insert({
      outlet_id: outletId,
      brand_id: brandId,
      expected_value: numberInput(input.expectedValue),
      expected_delivery_date: input.expectedDeliveryDate || null,
      status: orderStatusMap[input.status]
    })
    .select("id,expected_value,expected_delivery_date,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    expectedValue: Number(data.expected_value ?? 0),
    expectedDeliveryDate: data.expected_delivery_date ?? "No delivery date",
    status: orderStatus(data.status)
  };
}

export async function updateOrderAction(formData: FormData): Promise<OrderRow> {
  const id = formId(formData);
  const input = orderSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    expectedValue: formValue(formData, "expectedValue"),
    expectedDeliveryDate: formValue(formData, "expectedDeliveryDate"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("orders")
    .update({
      outlet_id: outletId,
      brand_id: brandId,
      expected_value: numberInput(input.expectedValue),
      expected_delivery_date: input.expectedDeliveryDate || null,
      status: orderStatusMap[input.status],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,expected_value,expected_delivery_date,status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    expectedValue: Number(data.expected_value ?? 0),
    expectedDeliveryDate: data.expected_delivery_date ?? "No delivery date",
    status: orderStatus(data.status)
  };
}

export async function createBillAction(formData: FormData): Promise<BillRow> {
  const input = billSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    billNumber: formValue(formData, "billNumber"),
    billDate: formValue(formData, "billDate"),
    totalAmount: formValue(formData, "totalAmount"),
    paymentStatus: formValue(formData, "paymentStatus")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("bills")
    .insert({
      outlet_id: outletId,
      brand_id: brandId,
      bill_number: input.billNumber || null,
      bill_date: input.billDate || null,
      total_amount: numberInput(input.totalAmount),
      payment_status: paymentStatusMap[input.paymentStatus]
    })
    .select("id,bill_number,bill_date,total_amount,payment_status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    billNumber: data.bill_number ?? "Unnumbered",
    billDate: data.bill_date ?? "No bill date",
    totalAmount: Number(data.total_amount ?? 0),
    paymentStatus: paymentStatus(data.payment_status)
  };
}

export async function updateBillAction(formData: FormData): Promise<BillRow> {
  const id = formId(formData);
  const input = billSchema.parse({
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    billNumber: formValue(formData, "billNumber"),
    billDate: formValue(formData, "billDate"),
    totalAmount: formValue(formData, "totalAmount"),
    paymentStatus: formValue(formData, "paymentStatus")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);
  const { data, error } = await supabase
    .from("bills")
    .update({
      outlet_id: outletId,
      brand_id: brandId,
      bill_number: input.billNumber || null,
      bill_date: input.billDate || null,
      total_amount: numberInput(input.totalAmount),
      payment_status: paymentStatusMap[input.paymentStatus],
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,bill_number,bill_date,total_amount,payment_status")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return {
    id: data.id,
    outlet: input.outlet,
    brand: input.brand,
    billNumber: data.bill_number ?? "Unnumbered",
    billDate: data.bill_date ?? "No bill date",
    totalAmount: Number(data.total_amount ?? 0),
    paymentStatus: paymentStatus(data.payment_status)
  };
}

function draftInput(formData: FormData) {
  const input = verificationDraftSchema.parse({
    id: formValue(formData, "id"),
    recordType: formValue(formData, "recordType"),
    title: formValue(formData, "title"),
    outletName: formValue(formData, "outletName"),
    brandName: formValue(formData, "brandName"),
    amount: formValue(formData, "amount"),
    quantity: formValue(formData, "quantity"),
    sku: formValue(formData, "sku"),
    notes: formValue(formData, "notes"),
    dueDate: formValue(formData, "dueDate"),
    reviewNotes: formValue(formData, "reviewNotes")
  });

  return {
    ...input,
    outletName: input.outletName || "Unassigned",
    brandName: input.brandName || "Unassigned",
    amount: input.amount || "0",
    notes: input.notes || ""
  };
}

async function readDraftForDecision(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await supabase
    .from("draft_business_records")
    .select("id,incoming_message_id,record_type,title,draft_json,confidence,status,created_at")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as {
    id: string;
    incoming_message_id: string;
    record_type: string;
    title: string;
    draft_json: Record<string, unknown> | null;
    confidence: number | string | null;
    status: string | null;
    created_at: string;
  };
}

function editedDraftJson(existing: Record<string, unknown> | null, input: ReturnType<typeof draftInput>): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    outlet_name: input.outletName,
    brand_name: input.brandName,
    amount: optionalNumberInput(input.amount),
    amount_pending: optionalNumberInput(input.amount),
    quantity: input.quantity || null,
    sku: input.sku || null,
    notes: input.notes || null,
    due_date: input.dueDate || null,
    admin_review_notes: input.reviewNotes || null
  };
}

export async function updateVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      review_notes: input.reviewNotes || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes);
}

export async function rejectVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      status: "rejected",
      review_notes: input.reviewNotes || "Rejected by admin",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes || "Rejected by admin");
}

export async function approveVerificationDraftAction(formData: FormData): Promise<VerificationDraftRecord> {
  const input = draftInput(formData);
  const supabase = createSupabaseAdminClient();
  const current = await readDraftForDecision(supabase, input.id);
  const draftJson = editedDraftJson(current.draft_json, input);
  const [outletId, brandId] = await Promise.all([
    findOutletIdByName(supabase, input.outletName),
    findBrandIdByName(supabase, input.brandName)
  ]);
  const amount = optionalNumberInput(input.amount);
  const now = new Date().toISOString();
  let approvedEntityType = input.recordType;
  let approvedEntityId: string | null = null;

  if (input.recordType === "visit") {
    const { data, error } = await supabase
      .from("visits")
      .insert({
        outlet_id: outletId,
        visit_datetime: now,
        visit_type: "routine_visit",
        productive: amount > 0 || Boolean(input.quantity),
        outcome: input.notes || input.title,
        notes: input.notes || String(draftJson.source_text ?? ""),
        source_message_id: current.incoming_message_id,
        verified_at: now
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "order") {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        outlet_id: outletId,
        brand_id: brandId,
        expected_value: amount,
        expected_delivery_date: input.dueDate || null,
        status: "intent_captured",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "bill") {
    const { data, error } = await supabase
      .from("bills")
      .insert({
        outlet_id: outletId,
        brand_id: brandId,
        total_amount: amount,
        payment_status: "due",
        ocr_text: String(draftJson.source_text ?? ""),
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "payment") {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        outlet_id: outletId,
        brand_id: brandId,
        amount_due: amount,
        amount_collected: String(draftJson.payment_status ?? "") === "collected" ? amount : 0,
        due_date: input.dueDate || null,
        promised_payment_date: input.dueDate || null,
        status: String(draftJson.payment_status ?? "") === "collected" ? "paid" : "due",
        risk_level: amount > 10000 ? "high" : "medium",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else if (input.recordType === "outlet") {
    const existingOutletId = outletId;
    if (existingOutletId) {
      approvedEntityId = existingOutletId;
    } else {
      const { data, error } = await supabase
        .from("outlets")
        .insert({
          name: input.outletName,
          city: "Unassigned",
          status: "prospect",
          channel_type: "Unassigned"
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      approvedEntityId = data.id;
    }
  } else if (input.recordType === "competitor_insight") {
    const { data, error } = await supabase
      .from("competitor_insights")
      .insert({
        brand_id: brandId,
        outlet_id: outletId,
        competitor_name: typeof draftJson.competitor_name === "string" && draftJson.competitor_name ? draftJson.competitor_name : "Unassigned competitor",
        margin_or_scheme: typeof draftJson.competitor_margin === "string" ? draftJson.competitor_margin : null,
        insight_text: input.notes || String(draftJson.source_text ?? input.title),
        impact_level: amount > 0 ? "high" : "medium",
        evidence_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  } else {
    approvedEntityType = "task";
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: input.title,
        description: input.notes || String(draftJson.source_text ?? ""),
        task_type: input.recordType,
        outlet_id: outletId,
        brand_id: brandId,
        due_date: input.dueDate || null,
        priority: current.confidence && Number(current.confidence) < 0.75 ? "high" : "medium",
        status: "open",
        source_message_id: current.incoming_message_id
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    approvedEntityId = data.id;
  }

  const { data, error } = await supabase
    .from("draft_business_records")
    .update({
      record_type: input.recordType,
      title: input.title,
      draft_json: draftJson,
      status: "approved",
      review_notes: input.reviewNotes || "Approved by admin",
      approved_entity_type: approvedEntityType,
      approved_entity_id: approvedEntityId,
      approved_at: now,
      updated_at: now
    })
    .eq("id", input.id)
    .select("id,record_type,title,status,confidence,draft_json,created_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return verificationDraftFromRow(data, input.reviewNotes || "Approved by admin");
}

export async function saveMetaIntegrationAction(formData: FormData) {
  const input = metaIntegrationSchema.parse({
    displayName: formValue(formData, "displayName"),
    phoneNumberId: formValue(formData, "phoneNumberId"),
    whatsappBusinessAccountId: formValue(formData, "whatsappBusinessAccountId"),
    businessPortfolioId: formValue(formData, "businessPortfolioId"),
    graphApiVersion: formValue(formData, "graphApiVersion"),
    webhookVerifyToken: formValue(formData, "webhookVerifyToken"),
    accessToken: formValue(formData, "accessToken"),
    appSecret: formValue(formData, "appSecret"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("integration_settings")
    .select("id,webhook_verify_token,access_token,app_secret")
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    provider: "meta_whatsapp",
    display_name: input.displayName,
    status: connectionStatusMap[input.status],
    phone_number_id: input.phoneNumberId,
    whatsapp_business_account_id: input.whatsappBusinessAccountId,
    business_portfolio_id: input.businessPortfolioId || null,
    graph_api_version: input.graphApiVersion,
    webhook_verify_token: input.webhookVerifyToken || existing?.webhook_verify_token || null,
    access_token: input.accessToken || existing?.access_token || null,
    app_secret: input.appSecret || existing?.app_secret || null,
    last_test_status: "Configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("integration_settings").update(payload).eq("id", existing.id)
    : await supabase.from("integration_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function saveAIProviderAction(formData: FormData) {
  const input = aiProviderSchema.parse({
    provider: formValue(formData, "provider"),
    model: formValue(formData, "model"),
    baseUrl: formValue(formData, "baseUrl"),
    apiKey: formValue(formData, "apiKey"),
    extractionMode: formValue(formData, "extractionMode"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("ai_provider_settings")
    .select("id,api_key")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    provider: input.provider,
    model: input.model,
    status: connectionStatusMap[input.status],
    base_url: input.baseUrl || null,
    api_key: input.apiKey || existing?.api_key || null,
    extraction_mode: input.extractionMode,
    last_test_status: "Configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("ai_provider_settings").update(payload).eq("id", existing.id)
    : await supabase.from("ai_provider_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function saveOpenAIIntegrationAction(formData: FormData) {
  const input = openAIIntegrationSchema.parse({
    model: formValue(formData, "model"),
    transcriptionModel: formValue(formData, "transcriptionModel"),
    baseUrl: formValue(formData, "baseUrl"),
    apiKey: formValue(formData, "apiKey"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("ai_provider_settings")
    .select("id,config_json")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const currentConfig = objectJson(existing?.config_json);
  const currentOpenAI = objectJson(currentConfig.openaiFallback);
  const existingOpenAIKey = typeof currentOpenAI.apiKey === "string" && currentOpenAI.apiKey ? currentOpenAI.apiKey : null;
  const savedApiKey = input.apiKey || existingOpenAIKey;
  const savedStatus = input.status === "Draft" && savedApiKey ? "Connected" : input.status;
  const openaiFallback = {
    ...currentOpenAI,
    status: savedStatus,
    model: input.model,
    transcriptionModel: input.transcriptionModel,
    baseUrl: input.baseUrl || "https://api.openai.com/v1",
    apiKey: savedApiKey,
    lastTestStatus: savedApiKey ? "Configuration saved. API key is stored." : "Configuration saved without API key",
    lastError: null,
    updatedAt: new Date().toISOString()
  };

  const payload = {
    config_json: {
      ...currentConfig,
      openaiFallback
    },
    last_test_status: "OpenAI fallback configuration saved",
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const { error } = existing?.id
    ? await supabase.from("ai_provider_settings").update(payload).eq("id", existing.id)
    : await supabase.from("ai_provider_settings").insert({
        provider: "sarvam",
        model: "saaras:v3",
        status: "draft",
        extraction_mode: "structured_json",
        ...payload
      });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
