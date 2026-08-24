/**
 * Maps Shadowfax tracking states to standardized system shipment statuses
 */
export function mapShadowfaxStatus(status: string): string {
  const normalized = (status || "").toLowerCase().trim();

  if (normalized.includes("new") || normalized.includes("request_created")) {
    return "MANIFESTED";
  }
  if (normalized.includes("assigned")) {
    return "MANIFESTED";
  }
  if (normalized.includes("out for pickup") || normalized.includes("ofp")) {
    return "OUT_FOR_PICKUP";
  }
  if (normalized.includes("picked")) {
    return "PICKED_UP";
  }
  if (normalized.includes("received at hub") || normalized.includes("in transit") || normalized.includes("bag in transit") || normalized.includes("received at return dc")) {
    return "IN_TRANSIT";
  }
  if (normalized.includes("out for delivery") || normalized.includes("ofd")) {
    return "OUT_FOR_DELIVERY";
  }
  if (normalized.includes("returned to client") || normalized.includes("delivered") || normalized.includes("rts_d")) {
    return "DELIVERED";
  }
  if (normalized.includes("cancelled")) {
    return "CANCELLED";
  }
  if (normalized.includes("qc failed") || normalized.includes("undelivered") || normalized.includes("not contactable") || normalized.includes("cid") || normalized.includes("not attempted") || normalized.includes("on hold")) {
    return "NDR";
  }
  if (normalized.includes("lost")) {
    return "LOST";
  }

  return "IN_TRANSIT";
}
