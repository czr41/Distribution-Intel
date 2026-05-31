import { CommandCenterApp } from "@/features/command-center/command-center-app";
import {
  createBrandAction,
  createOutletAction,
  createSalesmanAction,
  createTaskAction,
  createTerritoryAction,
  createSkuAction,
  createPaymentAction,
  createOrderAction,
  createBillAction,
  createUserAction,
  saveAIProviderAction,
  saveOpenAIIntegrationAction,
  saveMetaIntegrationAction,
  approveVerificationDraftAction,
  rejectVerificationDraftAction,
  updateVerificationDraftAction,
  updateBrandAction,
  updateOutletAction,
  updateSalesmanAction,
  updateTaskAction,
  updateTerritoryAction,
  updateSkuAction,
  updatePaymentAction,
  updateOrderAction,
  updateBillAction,
  updateUserAction
} from "@/features/command-center/actions";
import { getCommandCenterData } from "@/features/command-center/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getCommandCenterData().catch((error: unknown) => ({
    records: [],
    users: [],
    brands: [],
    outlets: [],
    salesmen: [],
    skus: [],
    tasks: [],
    territories: [],
    payments: [],
    orders: [],
    bills: [],
    verificationDrafts: [],
    metaIntegration: {
      displayName: "Meta WhatsApp Cloud API",
      status: "Draft" as const,
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
    },
    aiProvider: {
      provider: "sarvam" as const,
      model: "saaras:v3",
      status: "Draft" as const,
      baseUrl: "",
      hasApiKey: false,
      extractionMode: "structured_json" as const,
      lastTestStatus: "Not tested",
      lastError: "",
      updatedAt: "--"
    },
    openAIIntegration: {
      status: "Draft" as const,
      model: "gpt-5.4-mini",
      transcriptionModel: "gpt-4o-mini-transcribe",
      baseUrl: "https://api.openai.com/v1",
      hasApiKey: false,
      lastTestStatus: "Not configured",
      lastError: "",
      updatedAt: "--"
    },
    setupError: error instanceof Error ? error.message : "Unable to load Supabase data"
  }));

  return (
    <CommandCenterApp
      initialData={data}
      actions={{
        createBrand: createBrandAction,
        createOutlet: createOutletAction,
        createSalesman: createSalesmanAction,
        createTask: createTaskAction,
        createTerritory: createTerritoryAction,
        createSku: createSkuAction,
        createPayment: createPaymentAction,
        createOrder: createOrderAction,
        createBill: createBillAction,
        createUser: createUserAction,
        updateBrand: updateBrandAction,
        updateOutlet: updateOutletAction,
        updateSalesman: updateSalesmanAction,
        updateTask: updateTaskAction,
        updateTerritory: updateTerritoryAction,
        updateSku: updateSkuAction,
        updatePayment: updatePaymentAction,
        updateOrder: updateOrderAction,
        updateBill: updateBillAction,
        updateUser: updateUserAction,
        saveMetaIntegration: saveMetaIntegrationAction,
        saveAIProvider: saveAIProviderAction,
        saveOpenAIIntegration: saveOpenAIIntegrationAction,
        updateVerificationDraft: updateVerificationDraftAction,
        approveVerificationDraft: approveVerificationDraftAction,
        rejectVerificationDraft: rejectVerificationDraftAction
      }}
    />
  );
}
