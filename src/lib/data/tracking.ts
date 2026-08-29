import { getCourierProvider } from "@/lib/couriers/registry";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";

export interface PublicTrackingMilestone {
  label: string;
  sublabel: string;
  status: "completed" | "current" | "upcoming";
  timestamp?: string;
  location?: string;
}

export interface PublicTrackingCheckpoint {
  status: string;
  activity: string;
  location: string;
  timestamp: string;
}

export interface PublicTrackingData {
  awbNumber: string;
  orderNumber: string;
  courierName: string;
  courierCode: string;
  currentStatus: string;
  currentStatusText: string;
  currentStatusColor: string;
  currentLocation: string;
  originCity: string;
  originPincode: string;
  destinationCity: string;
  destinationState: string;
  destinationPincode: string;
  recipientName: string;
  isPickedUp: boolean;
  pickupScheduledDate: string;
  estimatedDeliveryDate: string;
  milestones: PublicTrackingMilestone[];
  checkpoints: PublicTrackingCheckpoint[];
  isNotFound?: boolean;
}

export async function getPublicTrackingData(awbNumber: string): Promise<PublicTrackingData> {
  const cleanAwb = awbNumber.trim().toUpperCase();

  // 1. Query Supabase (using service client or effective session so public track page works for buyers without login!)
  const supabase = createServiceClient();
  let shipment: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from("ecommerce_shipments")
        .select(`
          *,
          courier_provider:courier_providers(*),
          warehouse:warehouses(*),
          order:orders(
            *,
            customer:customers(*),
            items:order_items(*)
          ),
          tracking_events(*)
        `)
        .eq("awb_number", cleanAwb)
        .maybeSingle();

      if (data) {
        shipment = data;
      }
    } catch (err) {
      console.error("[getPublicTrackingData] DB query error:", err);
    }
  }

  if (!shipment) {
    return {
      awbNumber: cleanAwb,
      orderNumber: "",
      courierName: "Courier Partner",
      courierCode: "courier",
      currentStatus: "NOT_FOUND",
      currentStatusText: "Shipment Not Found",
      currentStatusColor: "bg-rose-100 text-rose-900 border-rose-300",
      currentLocation: "No location scans available",
      originCity: "—",
      originPincode: "—",
      destinationCity: "—",
      destinationState: "—",
      destinationPincode: "—",
      recipientName: "—",
      isPickedUp: false,
      pickupScheduledDate: "—",
      estimatedDeliveryDate: "—",
      milestones: [],
      checkpoints: [],
      isNotFound: true,
    };
  }

  // Determine carrier and origin/destination
  const carrierName =
    shipment.courier_provider?.name ||
    (cleanAwb.startsWith("SFX") || cleanAwb.startsWith("SF")
      ? "Shadowfax Forward"
      : "Shadowfax Express Logistics");

  const courierCode = shipment.courier_provider?.code || "shadowfax";
  const orderNumber = shipment.order?.order_number || `ORD-${cleanAwb.slice(-6)}`;
  const originCity = shipment.warehouse?.city || "New Delhi";
  const originPincode = shipment.pickup_pincode || shipment.warehouse?.pincode || "110020";
  const destinationCity = shipment.order?.customer?.city || "Destination Hub";
  const destinationState = shipment.order?.customer?.state || "";
  const destinationPincode = shipment.delivery_pincode || shipment.order?.customer?.pincode || "—";
  const recipientName = shipment.order?.customer?.full_name || "Consignee";

  const rawStatus = (shipment.shipment_status || "MANIFESTED").toUpperCase();
  const isCancelled = rawStatus === "CANCELLED";
  const isDelivered = rawStatus === "DELIVERED";
  const isOutForDelivery = rawStatus === "OUT_FOR_DELIVERY";
  const isInTransit = rawStatus === "IN_TRANSIT";
  const isPickedUp = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(rawStatus);

  let currentStatusText = "Awaiting Courier Rider Pickup";
  let currentStatusColor = "bg-amber-100 text-amber-900 border-amber-300";
  let currentLocation = `${originCity} Hub (${originPincode})`;

  if (isCancelled) {
    currentStatusText = "Shipment Cancelled";
    currentStatusColor = "bg-rose-100 text-rose-900 border-rose-300";
    currentLocation = "Cancelled with Courier";
  } else if (isDelivered) {
    currentStatusText = "Delivered & Signed";
    currentStatusColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
    currentLocation = `${destinationCity}, ${destinationState} (${destinationPincode})`;
  } else if (isOutForDelivery) {
    currentStatusText = "Out for Delivery (Rider on the Way)";
    currentStatusColor = "bg-blue-100 text-blue-900 border-blue-300";
    currentLocation = `${destinationCity} Local Delivery Hub`;
  } else if (isInTransit) {
    currentStatusText = "In Transit to Destination Facility";
    currentStatusColor = "bg-indigo-100 text-indigo-900 border-indigo-300";
    currentLocation = `En route to ${destinationCity} Sort Center`;
  } else if (isPickedUp) {
    currentStatusText = "Picked Up & Departed Origin Hub";
    currentStatusColor = "bg-sky-100 text-sky-900 border-sky-300";
    currentLocation = `${originCity} Mother Sort Hub`;
  }

  // Est Delivery Date calculation
  const estDate = shipment?.estimated_delivery_date
    ? new Date(shipment.estimated_delivery_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const pickupDate = shipment?.pickup_scheduled_date || new Date().toISOString().slice(0, 10);

  // Build 5-Stage Stepper
  const milestones: PublicTrackingMilestone[] = [
    {
      label: "Order Manifested",
      sublabel: "AWB Generated",
      status: "completed",
      timestamp: shipment?.created_at
        ? new Date(shipment.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "Completed",
      location: `${originCity} (${originPincode})`,
    },
    {
      label: "Picked Up",
      sublabel: isPickedUp ? "Handover Done" : "Rider Scheduled",
      status: isPickedUp ? "completed" : "current",
      timestamp: isPickedUp ? "Handed over to Shadowfax Rider" : "Expected Today by 5:00 PM",
      location: `${originCity} Warehouse`,
    },
    {
      label: "In Transit",
      sublabel: isInTransit || isOutForDelivery || isDelivered ? "Moving across hubs" : "Pending Departure",
      status: isDelivered || isOutForDelivery ? "completed" : isInTransit ? "current" : "upcoming",
      timestamp: isInTransit ? "Connected via Air/Surface Linehaul" : undefined,
      location: `${originCity} → ${destinationCity}`,
    },
    {
      label: "Out for Delivery",
      sublabel: isOutForDelivery || isDelivered ? "Courier Out for Delivery" : "Local delivery branch",
      status: isDelivered ? "completed" : isOutForDelivery ? "current" : "upcoming",
      timestamp: isOutForDelivery ? "Rider out with parcel" : undefined,
      location: `${destinationCity} Hub`,
    },
    {
      label: "Delivered",
      sublabel: isDelivered ? "Successfully Delivered" : `Est. ${estDate}`,
      status: isDelivered ? "completed" : "upcoming",
      timestamp: isDelivered ? "Signed by Consignee" : undefined,
      location: destinationCity,
    },
  ];

  // Scan Checkpoints - Only real data from DB / webhooks
  const checkpoints: PublicTrackingCheckpoint[] = [];

  if (shipment?.tracking_events && shipment.tracking_events.length > 0) {
    for (const ev of shipment.tracking_events) {
      checkpoints.push({
        status: ev.status || "STATUS_UPDATE",
        activity: ev.activity || "Package scanned",
        location: ev.location || `${originCity} Hub`,
        timestamp: new Date(ev.scan_datetime || ev.created_at).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  } else {
    // Only show AWB creation event (real timestamp) - no fake status injection
    checkpoints.push({
      status: "MANIFESTED",
      activity: `AWB ${cleanAwb} created & registered with ${carrierName}`,
      location: `${originCity} (${originPincode})`,
      timestamp: shipment?.created_at
        ? new Date(shipment.created_at).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    });
  }

  return {
    awbNumber: cleanAwb,
    orderNumber,
    courierName: carrierName,
    courierCode,
    currentStatus: rawStatus,
    currentStatusText,
    currentStatusColor,
    currentLocation,
    originCity,
    originPincode,
    destinationCity,
    destinationState,
    destinationPincode,
    recipientName,
    isPickedUp,
    pickupScheduledDate: pickupDate,
    estimatedDeliveryDate: estDate,
    milestones,
    checkpoints,
  };
}
