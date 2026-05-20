import { CommandCenterApp } from "@/features/command-center/command-center-app";
import {
  createBrandAction,
  createOutletAction,
  createSalesmanAction,
  createTaskAction,
  saveAIProviderAction,
  saveMetaIntegrationAction
} from "@/features/command-center/actions";
import { getCommandCenterData } from "@/features/command-center/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getCommandCenterData().catch((error: unknown) => ({
    records: [],
    brands: [],
    outlets: [],
    salesmen: [],
    tasks: [],
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
      provider: "gemini" as const,
      model: "gemini-2.5-flash",
      status: "Draft" as const,
      baseUrl: "",
      hasApiKey: false,
      extractionMode: "structured_json" as const,
      lastTestStatus: "Not tested",
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
        saveMetaIntegration: saveMetaIntegrationAction,
        saveAIProvider: saveAIProviderAction
      }}
    />
  );
}
