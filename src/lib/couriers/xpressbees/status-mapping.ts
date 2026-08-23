import type { EcommerceShipmentStatus } from "@/types";

/**
 * Maps Xpressbees status codes and status strings to ShopWave domain EcommerceShipmentStatus
 *
 * Xpressbees Status Codes from API specification PDF & carrier responses:
 * - "MAN", "booked", "created" -> MANIFESTED
 * - "PU", "picked_up" -> PICKED_UP
 * - "IT", "in_transit", "connected", "arrived" -> IN_TRANSIT
 * - "OFD", "out_for_delivery" -> OUT_FOR_DELIVERY
 * - "DL", "delivered" -> DELIVERED
 * - "UD", "undelivered", "exception", "ndr" -> NDR
 * - "RT-IT", "rto", "rto_initiated", "rto_in_transit" -> RTO_INITIATED
 * - "RT-DL", "rto_delivered" -> RTO_DELIVERED
 * - "CAN", "cancelled", "cancelled_by_client" -> CANCELLED
 */
export function mapXpressbeesStatus(
  statusCode?: string,
  generalStatus?: string,
  message?: string,
): EcommerceShipmentStatus {
  const code = (statusCode ?? "").toUpperCase().trim();
  const status = (generalStatus ?? "").toLowerCase().trim();
  const msg = (message ?? "").toUpperCase().trim();

  // 1. Check direct status code
  if (code === "DL") return "DELIVERED";
  if (code === "RT-DL") return "RTO_DELIVERED";
  if (code === "RT-IT" || code === "RT") return "RTO_INITIATED";
  if (code === "OFD") return "OUT_FOR_DELIVERY";
  if (code === "IT") {
    if (msg.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
    return "IN_TRANSIT";
  }
  if (code === "PU") return "PICKED_UP";
  if (code === "MAN") return "MANIFESTED";
  if (code === "UD" || code === "NDR") return "NDR";
  if (code === "CAN") return "CANCELLED";

  // 2. Check general status string from payload
  if (status === "delivered") return "DELIVERED";
  if (status === "rto_delivered") return "RTO_DELIVERED";
  if (status === "rto" || status === "rto_initiated" || status === "rto_in_transit") {
    return "RTO_INITIATED";
  }
  if (status === "out_for_delivery") return "OUT_FOR_DELIVERY";
  if (status === "in_transit") return "IN_TRANSIT";
  if (status === "picked_up") return "PICKED_UP";
  if (status === "booked" || status === "manifested" || status === "created") {
    return "MANIFESTED";
  }
  if (status === "cancelled") return "CANCELLED";
  if (status === "ndr" || status === "undelivered") return "NDR";

  // 3. Fallback message inspection
  if (msg.includes("DELIVERED") && !msg.includes("OUT FOR")) {
    return msg.includes("RTO") || msg.includes("RETURN") ? "RTO_DELIVERED" : "DELIVERED";
  }
  if (msg.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
  if (msg.includes("PICKED UP") || msg.includes("PICKUP DONE")) return "PICKED_UP";
  if (msg.includes("ARRIVED") || msg.includes("CONNECTED") || msg.includes("IN TRANSIT")) {
    return "IN_TRANSIT";
  }
  if (msg.includes("CANCEL")) return "CANCELLED";
  if (msg.includes("UNDELIVERED") || msg.includes("FAILED") || msg.includes("EXCEPTION")) {
    return "NDR";
  }

  return "MANIFESTED";
}
