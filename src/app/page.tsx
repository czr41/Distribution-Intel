import { CommandCenterApp } from "@/features/command-center/command-center-app";
import { createBrandAction, createOutletAction, createSalesmanAction, createTaskAction } from "@/features/command-center/actions";
import { getCommandCenterData } from "@/features/command-center/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getCommandCenterData().catch((error: unknown) => ({
    records: [],
    brands: [],
    outlets: [],
    salesmen: [],
    tasks: [],
    setupError: error instanceof Error ? error.message : "Unable to load Supabase data"
  }));

  return (
    <CommandCenterApp
      initialData={data}
      actions={{
        createBrand: createBrandAction,
        createOutlet: createOutletAction,
        createSalesman: createSalesmanAction,
        createTask: createTaskAction
      }}
    />
  );
}
