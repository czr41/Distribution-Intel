"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BillRow, BrandOption, OrderRow, OutletRow, PaymentRow, SalesmanRow, TaskRow, TerritoryRow } from "./types";

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
  status: z.enum(["Active", "Prospect", "Inactive"])
});

const salesmanSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  territory: z.string().min(1),
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
  provider: z.enum(["gemini", "ollama_gemma", "manual"]),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  extractionMode: z.enum(["structured_json", "draft_only"]),
  status: z.enum(["Connected", "Draft", "Disabled"])
});

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formId(formData: FormData) {
  return z.string().uuid().parse(formValue(formData, "id"));
}

function brandStatus(status?: string | null): BrandOption["status"] {
  return status === "inactive" ? "Inactive" : "Active";
}

function outletStatus(status?: string | null): OutletRow["status"] {
  if (status === "inactive") return "Inactive";
  if (status === "prospect") return "Prospect";
  return "Active";
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

function numberInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Enter a valid number.");
  return numeric;
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

export async function createOutletAction(formData: FormData): Promise<OutletRow> {
  const input = outletSchema.parse({
    name: formValue(formData, "name"),
    owner: formValue(formData, "owner"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    channel: formValue(formData, "channel"),
    brand: formValue(formData, "brand"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .insert({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
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
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const brandId = await findBrandIdByName(supabase, input.brand);

  const { data: outlet, error: outletError } = await supabase
    .from("outlets")
    .update({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      whatsapp_number: input.phone,
      city: input.city,
      channel_type: input.channel,
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
    status: outletStatus(outlet.status)
  };
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
  const email = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\\.|\\.$/g, "")}.${Date.now()}@field.local`;
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
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
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
    description: data.description ?? "Created from verified field signal.",
    taskType: data.task_type,
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
    outlet: formValue(formData, "outlet"),
    brand: formValue(formData, "brand"),
    dueDate: formValue(formData, "dueDate"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const [brandId, outletId] = await Promise.all([findBrandIdByName(supabase, input.brand), findOutletIdByName(supabase, input.outlet)]);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      description: input.description,
      task_type: input.taskType,
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
    description: data.description ?? "Created from verified field signal.",
    taskType: data.task_type,
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
