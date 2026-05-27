import { createSupabaseReadClient } from "@/lib/supabase/admin";
import type {
  AIProviderSettings,
  BillRow,
  BrandOption,
  CommandCenterData,
  CommandRecord,
  MetaIntegrationSettings,
  OpenAIIntegrationSettings,
  OrderRow,
  OutletRow,
  PaymentRow,
  SalesmanRow,
  TaskRow,
  TerritoryRow
} from "./types";

type OutletBrandJoin = {
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type OutletResult = {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  city: string;
  channel_type: string | null;
  status: string | null;
  outlet_brands?: OutletBrandJoin[] | null;
};

type SalesmanResult = {
  id: string;
  phone: string;
  status: string | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
  territories?: { name?: string | null; city?: string | null } | { name?: string | null; city?: string | null }[] | null;
};

type TaskResult = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type TerritoryResult = {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string | null;
  status: string | null;
};

type PaymentResult = {
  id: string;
  amount_due: number | string | null;
  amount_collected: number | string | null;
  due_date: string | null;
  promised_payment_date: string | null;
  payment_mode: string | null;
  status: string | null;
  risk_level: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type OrderResult = {
  id: string;
  expected_value: number | string | null;
  expected_delivery_date: string | null;
  status: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type BillResult = {
  id: string;
  bill_number: string | null;
  bill_date: string | null;
  total_amount: number | string | null;
  payment_status: string | null;
  outlets?: { name?: string | null } | { name?: string | null }[] | null;
  brands?: { name?: string | null } | { name?: string | null }[] | null;
};

type IntegrationSettingsResult = {
  id: string;
  display_name: string | null;
  status: string | null;
  phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  business_portfolio_id: string | null;
  graph_api_version: string | null;
  webhook_verify_token: string | null;
  access_token: string | null;
  app_secret: string | null;
  last_test_status: string | null;
  last_error: string | null;
  updated_at: string | null;
};

type AIProviderSettingsResult = {
  id: string;
  provider: string | null;
  model: string | null;
  status: string | null;
  base_url: string | null;
  api_key: string | null;
  extraction_mode: string | null;
  config_json: unknown;
  last_test_status: string | null;
  last_error: string | null;
  updated_at: string | null;
};

function displayStatus(status?: string | null): "Active" | "Prospect" | "Inactive" {
  if (status === "prospect") return "Prospect";
  if (status === "inactive") return "Inactive";
  return "Active";
}

function displayBrandStatus(status?: string | null): "Active" | "Inactive" {
  return status === "inactive" ? "Inactive" : "Active";
}

function displayTaskStatus(status?: string | null): TaskRow["status"] {
  if (status === "in_progress") return "In progress";
  if (status === "waiting_for_response") return "Waiting for response";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "overdue") return "Overdue";
  return "Open";
}

function displayTaskPriority(priority?: string | null): TaskRow["priority"] {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function numberValue(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function displayRiskLevel(risk?: string | null): PaymentRow["riskLevel"] {
  if (risk === "low") return "Low";
  if (risk === "high") return "High";
  if (risk === "critical") return "Critical";
  return "Medium";
}

function displayPaymentStatus(status?: string | null): PaymentRow["status"] {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "disputed") return "Disputed";
  if (status === "written_off") return "Written off";
  return "Due";
}

function displayOrderStatus(status?: string | null): OrderRow["status"] {
  if (status === "confirmed") return "Confirmed";
  if (status === "billed") return "Billed";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "on_hold") return "On hold";
  return "Intent captured";
}

function displayConnectionStatus(status?: string | null): "Connected" | "Draft" | "Disabled" {
  if (status === "connected") return "Connected";
  if (status === "disabled") return "Disabled";
  return "Draft";
}

function displayOpenAIStatus(status?: string | null): "Connected" | "Draft" | "Disabled" {
  if (status === "Connected" || status === "Draft" || status === "Disabled") return status;
  return displayConnectionStatus(status);
}

function defaultMetaIntegration(): MetaIntegrationSettings {
  return {
    displayName: "Meta WhatsApp Cloud API",
    status: "Draft",
    phoneNumberId: "",
    whatsappBusinessAccountId: "",
    businessPortfolioId: "",
    graphApiVersion: "v25.0",
    webhookUrl: "/api/webhooks/whatsapp",
    hasAccessToken: false,
    hasAppSecret: false,
    hasVerifyToken: false,
    lastTestStatus: "Not tested",
    lastError: "",
    updatedAt: "--"
  };
}

function defaultAIProvider(): AIProviderSettings {
  return {
    provider: "sarvam",
    model: "saaras:v3",
    status: "Draft",
    baseUrl: "",
    hasApiKey: false,
    extractionMode: "structured_json",
    lastTestStatus: "Not tested",
    lastError: "",
    updatedAt: "--"
  };
}

function defaultOpenAIIntegration(): OpenAIIntegrationSettings {
  return {
    status: "Draft",
    model: "gpt-5.4-mini",
    transcriptionModel: "gpt-4o-mini-transcribe",
    baseUrl: "https://api.openai.com/v1",
    hasApiKey: false,
    lastTestStatus: "Not configured",
    lastError: "",
    updatedAt: "--"
  };
}

function openAIConfigFromJson(config: unknown): Partial<OpenAIIntegrationSettings> & { apiKey?: string } {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  const openAI = (config as { openaiFallback?: unknown }).openaiFallback;
  if (!openAI || typeof openAI !== "object" || Array.isArray(openAI)) return {};

  return openAI as Partial<OpenAIIntegrationSettings> & { apiKey?: string };
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const supabase = createSupabaseReadClient();

  const [
    brandsResult,
    outletsResult,
    salesmenResult,
    tasksResult,
    territoriesResult,
    paymentsResult,
    ordersResult,
    billsResult,
    metaIntegrationResult,
    aiProviderResult
  ] = await Promise.all([
    supabase.from("brands").select("id,name,category,contact_person,status").order("created_at", { ascending: false }),
    supabase
      .from("outlets")
      .select("id,name,owner_name,phone,city,channel_type,status,outlet_brands(brands(name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("field_executives")
      .select("id,phone,status,users!field_executives_user_id_fkey(name),territories(name,city)")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id,title,description,task_type,due_date,priority,status,outlets(name),brands(name)")
      .order("created_at", { ascending: false }),
    supabase.from("territories").select("id,name,city,state,region,status").order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id,amount_due,amount_collected,due_date,promised_payment_date,payment_mode,status,risk_level,outlets(name),brands(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,expected_value,expected_delivery_date,status,outlets(name),brands(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("bills")
      .select("id,bill_number,bill_date,total_amount,payment_status,outlets(name),brands(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("integration_settings")
      .select("id,display_name,status,phone_number_id,whatsapp_business_account_id,business_portfolio_id,graph_api_version,webhook_verify_token,access_token,app_secret,last_test_status,last_error,updated_at")
      .eq("provider", "meta_whatsapp")
      .maybeSingle(),
    supabase
      .from("ai_provider_settings")
      .select("id,provider,model,status,base_url,api_key,extraction_mode,config_json,last_test_status,last_error,updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (brandsResult.error) throw new Error(brandsResult.error.message);
  if (outletsResult.error) throw new Error(outletsResult.error.message);
  if (salesmenResult.error) throw new Error(salesmenResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (territoriesResult.error) throw new Error(territoriesResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (billsResult.error) throw new Error(billsResult.error.message);
  if (metaIntegrationResult.error) throw new Error(metaIntegrationResult.error.message);
  if (aiProviderResult.error) throw new Error(aiProviderResult.error.message);

  const brands: BrandOption[] = (brandsResult.data ?? []).map((brand) => ({
    id: brand.id,
    name: brand.name,
    category: brand.category ?? "Uncategorized",
    contact: brand.contact_person ?? "Internal ops",
    status: displayBrandStatus(brand.status)
  }));

  const outlets: OutletRow[] = ((outletsResult.data ?? []) as OutletResult[]).map((outlet) => {
    const linkedBrand = Array.isArray(outlet.outlet_brands) ? outlet.outlet_brands[0]?.brands : undefined;
    const brandName = Array.isArray(linkedBrand) ? linkedBrand[0]?.name : linkedBrand?.name;

    return {
      id: outlet.id,
      name: outlet.name,
      city: outlet.city,
      channel: outlet.channel_type ?? "Unassigned",
      brand: brandName ?? "Unassigned",
      status: displayStatus(outlet.status),
      owner: outlet.owner_name ?? "",
      phone: outlet.phone ?? ""
    };
  });

  const salesmen: SalesmanRow[] = ((salesmenResult.data ?? []) as SalesmanResult[]).map((person) => {
    const user = Array.isArray(person.users) ? person.users[0] : person.users;
    const territory = Array.isArray(person.territories) ? person.territories[0] : person.territories;

    return {
      id: person.id,
      name: user?.name ?? "Unnamed executive",
      phone: person.phone,
      city: territory?.city ?? "Unassigned",
      territory: territory?.name ?? "Unassigned",
      status: displayBrandStatus(person.status)
    };
  });

  const records: CommandRecord[] = outlets.slice(0, 4).map((outlet, index) => ({
    id: `record-${outlet.id}`,
    outlet: outlet.name,
    city: outlet.city,
    partner: outlet.brand,
    fieldAgent: salesmen[index % Math.max(salesmen.length, 1)]?.name ?? "Field Team",
    type: index === 1 ? "Stockout" : "Sale",
    units: index === 1 ? 0 : 12 + index * 6,
    value: index === 1 ? 0 : (12 + index * 6) * 150,
    status: index < 2 ? "pending" : "verified",
    confidence: index === 1 ? 0.63 : 0.9,
    evidence: index === 1 ? "Voice note transcription" : "Shelf photo + WhatsApp text",
    message: index === 1 ? "Retailer reported stock issue and requested refill." : `Field update captured for ${outlet.name}.`,
    createdAt: "10:12"
  }));

  const tasks: TaskRow[] = ((tasksResult.data ?? []) as TaskResult[]).map((task) => {
    const outlet = Array.isArray(task.outlets) ? task.outlets[0] : task.outlets;
    const brand = Array.isArray(task.brands) ? task.brands[0] : task.brands;

    return {
      id: task.id,
      title: task.title,
      description: task.description ?? "Created from verified field signal.",
      taskType: task.task_type,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      dueDate: task.due_date ?? "No due date",
      priority: displayTaskPriority(task.priority),
      status: displayTaskStatus(task.status)
    };
  });

  const territories: TerritoryRow[] = ((territoriesResult.data ?? []) as TerritoryResult[]).map((territory) => ({
    id: territory.id,
    name: territory.name,
    city: territory.city,
    state: territory.state,
    region: territory.region ?? "Unassigned",
    status: displayBrandStatus(territory.status)
  }));

  const payments: PaymentRow[] = ((paymentsResult.data ?? []) as PaymentResult[]).map((payment) => {
    const outlet = Array.isArray(payment.outlets) ? payment.outlets[0] : payment.outlets;
    const brand = Array.isArray(payment.brands) ? payment.brands[0] : payment.brands;

    return {
      id: payment.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      amountDue: numberValue(payment.amount_due),
      amountCollected: numberValue(payment.amount_collected),
      dueDate: payment.due_date ?? "No due date",
      promisedPaymentDate: payment.promised_payment_date ?? "No promise",
      paymentMode: payment.payment_mode ?? "Unassigned",
      status: displayPaymentStatus(payment.status),
      riskLevel: displayRiskLevel(payment.risk_level)
    };
  });

  const orders: OrderRow[] = ((ordersResult.data ?? []) as OrderResult[]).map((order) => {
    const outlet = Array.isArray(order.outlets) ? order.outlets[0] : order.outlets;
    const brand = Array.isArray(order.brands) ? order.brands[0] : order.brands;

    return {
      id: order.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      expectedValue: numberValue(order.expected_value),
      expectedDeliveryDate: order.expected_delivery_date ?? "No delivery date",
      status: displayOrderStatus(order.status)
    };
  });

  const bills: BillRow[] = ((billsResult.data ?? []) as BillResult[]).map((bill) => {
    const outlet = Array.isArray(bill.outlets) ? bill.outlets[0] : bill.outlets;
    const brand = Array.isArray(bill.brands) ? bill.brands[0] : bill.brands;

    return {
      id: bill.id,
      outlet: outlet?.name ?? "Unassigned",
      brand: brand?.name ?? "Unassigned",
      billNumber: bill.bill_number ?? "Unnumbered",
      billDate: bill.bill_date ?? "No bill date",
      totalAmount: numberValue(bill.total_amount),
      paymentStatus: displayPaymentStatus(bill.payment_status)
    };
  });

  const metaRow = metaIntegrationResult.data as IntegrationSettingsResult | null;
  const metaIntegration: MetaIntegrationSettings = metaRow
    ? {
        id: metaRow.id,
        displayName: metaRow.display_name ?? "Meta WhatsApp Cloud API",
        status: displayConnectionStatus(metaRow.status),
        phoneNumberId: metaRow.phone_number_id ?? "",
        whatsappBusinessAccountId: metaRow.whatsapp_business_account_id ?? "",
        businessPortfolioId: metaRow.business_portfolio_id ?? "",
        graphApiVersion: metaRow.graph_api_version ?? "v25.0",
        webhookUrl: "/api/webhooks/whatsapp",
        hasAccessToken: Boolean(metaRow.access_token),
        hasAppSecret: Boolean(metaRow.app_secret),
        hasVerifyToken: Boolean(metaRow.webhook_verify_token),
        lastTestStatus: metaRow.last_test_status ?? "Not tested",
        lastError: metaRow.last_error ?? "",
        updatedAt: metaRow.updated_at ?? "--"
      }
    : defaultMetaIntegration();

  const aiRow = aiProviderResult.data as AIProviderSettingsResult | null;
  const openAIConfig = openAIConfigFromJson(aiRow?.config_json);
  const aiProvider: AIProviderSettings = aiRow
    ? {
        id: aiRow.id,
        provider: aiRow.provider === "sarvam" || aiRow.provider === "openai" || aiRow.provider === "ollama_gemma" || aiRow.provider === "manual" ? aiRow.provider : "gemini",
        model: aiRow.model ?? (aiRow.provider === "sarvam" ? "saaras:v3" : aiRow.provider === "openai" ? "gpt-5.4-mini" : "gemini-2.5-flash"),
        status: displayConnectionStatus(aiRow.status),
        baseUrl: aiRow.base_url ?? "",
        hasApiKey: Boolean(aiRow.api_key),
        extractionMode: aiRow.extraction_mode === "draft_only" ? "draft_only" : "structured_json",
        lastTestStatus: aiRow.last_test_status ?? "Not tested",
        lastError: aiRow.last_error ?? "",
        updatedAt: aiRow.updated_at ?? "--"
      }
    : defaultAIProvider();
  const openAIDefaults = defaultOpenAIIntegration();
  const openAIIntegration: OpenAIIntegrationSettings = {
    status: displayOpenAIStatus(openAIConfig.status),
    model: typeof openAIConfig.model === "string" && openAIConfig.model ? openAIConfig.model : openAIDefaults.model,
    transcriptionModel:
      typeof openAIConfig.transcriptionModel === "string" && openAIConfig.transcriptionModel
        ? openAIConfig.transcriptionModel
        : openAIDefaults.transcriptionModel,
    baseUrl: typeof openAIConfig.baseUrl === "string" && openAIConfig.baseUrl ? openAIConfig.baseUrl : openAIDefaults.baseUrl,
    hasApiKey: Boolean(openAIConfig.apiKey || process.env.OPENAI_API_KEY),
    lastTestStatus:
      typeof openAIConfig.lastTestStatus === "string" && openAIConfig.lastTestStatus
        ? openAIConfig.lastTestStatus
        : openAIDefaults.lastTestStatus,
    lastError: typeof openAIConfig.lastError === "string" ? openAIConfig.lastError : "",
    updatedAt: typeof openAIConfig.updatedAt === "string" && openAIConfig.updatedAt ? openAIConfig.updatedAt : openAIDefaults.updatedAt
  };

  return { records, brands, outlets, salesmen, tasks, territories, payments, orders, bills, metaIntegration, aiProvider, openAIIntegration };
}
