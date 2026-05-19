import { CommandCenterApp } from "@/features/command-center/command-center-app";
import { createBrandAction, createOutletAction, createSalesmanAction } from "@/features/command-center/actions";
import { getCommandCenterData } from "@/features/command-center/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getCommandCenterData();

  return (
    <CommandCenterApp
      initialData={data}
      actions={{
        createBrand: createBrandAction,
        createOutlet: createOutletAction,
        createSalesman: createSalesmanAction
      }}
    />
  );
}
