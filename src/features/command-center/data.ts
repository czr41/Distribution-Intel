import { createSupabaseReadClient } from "@/lib/supabase/admin";
import type { BrandOption, CommandCenterData, CommandRecord, OutletRow, SalesmanRow } from "./types";

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

function displayStatus(status?: string | null): "Active" | "Prospect" | "Inactive" {
  if (status === "prospect") return "Prospect";
  if (status === "inactive") return "Inactive";
  return "Active";
}

function displayBrandStatus(status?: string | null): "Active" | "Inactive" {
  return status === "inactive" ? "Inactive" : "Active";
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const supabase = createSupabaseReadClient();

  const [brandsResult, outletsResult, salesmenResult] = await Promise.all([
    supabase.from("brands").select("id,name,category,contact_person,status").order("created_at", { ascending: false }),
    supabase
      .from("outlets")
      .select("id,name,owner_name,phone,city,channel_type,status,outlet_brands(brands(name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("field_executives")
      .select("id,phone,status,users!field_executives_user_id_fkey(name),territories(name,city)")
      .order("created_at", { ascending: false })
  ]);

  if (brandsResult.error) throw new Error(brandsResult.error.message);
  if (outletsResult.error) throw new Error(outletsResult.error.message);
  if (salesmenResult.error) throw new Error(salesmenResult.error.message);

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

  return { records, brands, outlets, salesmen };
}
