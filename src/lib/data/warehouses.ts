import { mockWarehouses } from "@/data/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Warehouse } from "@/types";

export async function getWarehouses(): Promise<Warehouse[]> {
  const supabase = await createClient();
  if (!supabase) {
    return mockWarehouses;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return mockWarehouses;

  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  // If user has no warehouse yet in Supabase, auto-seed a default primary warehouse
  if (!error && (!data || data.length === 0)) {
    const { data: newWh } = await supabase
      .from("warehouses")
      .insert({
        user_id: user.id,
        warehouse_name: "Primary Fulfillment Hub",
        contact_person: "Operations Manager",
        contact_phone: "9876543210",
        address_line1: "Okhla Industrial Area, Phase III",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110020",
        is_default: true,
        is_active: true,
      })
      .select("*")
      .single();

    if (newWh) {
      return [
        {
          id: newWh.id,
          userId: newWh.user_id,
          warehouseName: newWh.warehouse_name,
          contactPerson: newWh.contact_person,
          contactPhone: newWh.contact_phone,
          contactEmail: newWh.contact_email,
          addressLine1: newWh.address_line1,
          addressLine2: newWh.address_line2,
          city: newWh.city,
          state: newWh.state,
          pincode: newWh.pincode,
          gstin: newWh.gstin,
          isDefault: newWh.is_default,
          isActive: newWh.is_active,
          createdAt: newWh.created_at,
          updatedAt: newWh.updated_at,
        },
      ];
    }
    return mockWarehouses;
  }

  if (error || !data || data.length === 0) {
    return mockWarehouses;
  }

  return data.map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    warehouseName: w.warehouse_name,
    contactPerson: w.contact_person,
    contactPhone: w.contact_phone,
    contactEmail: w.contact_email,
    addressLine1: w.address_line1,
    addressLine2: w.address_line2,
    city: w.city,
    state: w.state,
    pincode: w.pincode,
    gstin: w.gstin,
    isDefault: w.is_default,
    isActive: w.is_active,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  }));
}

export async function getDefaultWarehouse(): Promise<Warehouse | null> {
  const warehouses = await getWarehouses();
  return warehouses.find((w) => w.isDefault) ?? warehouses[0] ?? null;
}
