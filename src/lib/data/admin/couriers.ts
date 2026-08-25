import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import type { AdminCourierPartner, AdminShippingRateSlab } from "@/types/admin";

export async function getAdminCouriers(): Promise<AdminCourierPartner[]> {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  if (!supabase) return [];

  const [{ data: providers }, { data: shipments }] = await Promise.all([
    supabase.from("courier_providers").select("*").order("name"),
    supabase.from("ecommerce_shipments").select("id, courier_provider_id, shipment_status"),
  ]);

  const shipmentMap = new Map<string, { total: number; delivered: number }>();
  (shipments || []).forEach((s: any) => {
    if (s.courier_provider_id) {
      const cur = shipmentMap.get(s.courier_provider_id) || { total: 0, delivered: 0 };
      cur.total++;
      if (s.shipment_status === "DELIVERED") cur.delivered++;
      shipmentMap.set(s.courier_provider_id, cur);
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dhanbyte.me";

  return (providers || []).map((p: any) => {
    const stats = shipmentMap.get(p.id) || { total: 0, delivered: 0 };
    const successRate = stats.total > 0 ? Number(((stats.delivered / stats.total) * 100).toFixed(1)) : 100;
    const isLive = p.code === "shadowfax" || p.code === "xpressbees";

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      apiStatus: isLive ? "HEALTHY" : "READY_FOR_KEYS",
      isActive: p.is_active || isLive,
      codAvailable: Boolean(p.supports_cod),
      prepaidAvailable: Boolean(p.supports_prepaid),
      totalShipments: stats.total,
      successRate,
      avgDeliveryDays: 2.4,
      lastPingMs: isLive ? (p.code === "shadowfax" ? 185 : 240) : 0,
      environment: "PRODUCTION",
      webhookUrl: `${appUrl}/api/webhooks/${p.code}`,
    };
  });
}


export async function getAdminRateSlabs(): Promise<AdminShippingRateSlab[]> {
  return [
    {
      id: "slab-01",
      courierCode: "shadowfax",
      courierName: "Shadowfax Express",
      zone: "ZONE_A",
      weightSlab: "0-500g",
      courierBaseCost: 38,
      userPrepaidPrice: 49,
      userCodPrice: 69,
      platformMarginPrepaid: 11,
      platformMarginCod: 31,
    },
    {
      id: "slab-02",
      courierCode: "shadowfax",
      courierName: "Shadowfax Express",
      zone: "ZONE_B",
      weightSlab: "0-500g",
      courierBaseCost: 45,
      userPrepaidPrice: 59,
      userCodPrice: 79,
      platformMarginPrepaid: 14,
      platformMarginCod: 34,
    },
    {
      id: "slab-03",
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface",
      zone: "ZONE_A",
      weightSlab: "500g-1kg",
      courierBaseCost: 52,
      userPrepaidPrice: 69,
      userCodPrice: 89,
      platformMarginPrepaid: 17,
      platformMarginCod: 37,
    },
    {
      id: "slab-04",
      courierCode: "delhivery",
      courierName: "Delhivery Direct",
      zone: "ZONE_C",
      weightSlab: "1kg-2kg",
      courierBaseCost: 75,
      userPrepaidPrice: 99,
      userCodPrice: 125,
      platformMarginPrepaid: 24,
      platformMarginCod: 50,
    },
  ];
}
