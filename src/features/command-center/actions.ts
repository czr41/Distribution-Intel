"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  brand: z.string().min(1),
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

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createBrandAction(formData: FormData) {
  const input = brandSchema.parse({
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    contact: formValue(formData, "contact"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brands").insert({
    name: input.name,
    category: input.category,
    contact_person: input.contact,
    status: statusMap[input.status]
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function createOutletAction(formData: FormData) {
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
  const { data: brand, error: brandError } = await supabase.from("brands").select("id").eq("name", input.brand).maybeSingle();
  if (brandError) throw new Error(brandError.message);

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
    .select("id")
    .single();

  if (outletError) throw new Error(outletError.message);

  if (brand?.id) {
    const { error: linkError } = await supabase.from("outlet_brands").insert({
      outlet_id: outlet.id,
      brand_id: brand.id,
      status: "active",
      onboarded_at: new Date().toISOString()
    });
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/");
}

export async function createSalesmanAction(formData: FormData) {
  const input = salesmanSchema.parse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    territory: formValue(formData, "territory"),
    status: formValue(formData, "status")
  });

  const supabase = createSupabaseAdminClient();
  const email = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\\.|\\.$/g, "")}.${Date.now()}@field.local`;

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

  const { data: territory, error: territoryError } = await supabase
    .from("territories")
    .insert({
      name: input.territory,
      city: input.city,
      state: "Unassigned",
      status: "active"
    })
    .select("id")
    .single();

  if (territoryError) throw new Error(territoryError.message);

  const { error: executiveError } = await supabase.from("field_executives").insert({
    user_id: user.id,
    phone: input.phone,
    whatsapp_number: input.phone,
    territory_id: territory.id,
    status: statusMap[input.status]
  });

  if (executiveError) throw new Error(executiveError.message);
  revalidatePath("/");
}

export async function createTaskAction(formData: FormData) {
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
  const [brandResult, outletResult] = await Promise.all([
    supabase.from("brands").select("id").eq("name", input.brand).maybeSingle(),
    supabase.from("outlets").select("id").eq("name", input.outlet).maybeSingle()
  ]);

  if (brandResult.error) throw new Error(brandResult.error.message);
  if (outletResult.error) throw new Error(outletResult.error.message);

  const { error } = await supabase.from("tasks").insert({
    title: input.title,
    description: input.description,
    task_type: input.taskType,
    outlet_id: outletResult.data?.id,
    brand_id: brandResult.data?.id,
    due_date: input.dueDate || null,
    priority: taskPriorityMap[input.priority],
    status: taskStatusMap[input.status]
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
