"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cloneOrderAction } from "@/app/ecommerce-actions";

export function CloneOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClone() {
    setLoading(true);
    toast.info(`Cloning order ${orderNumber}…`);
    const res = await cloneOrderAction(orderId);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
      if (res.data?.orderId) {
        router.push(`/orders/${res.data.orderId}`);
      } else {
        router.push("/orders");
      }
    } else {
      toast.error(res.message);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClone}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-2xs cursor-pointer disabled:opacity-50"
    >
      <Copy size={13} className="text-indigo-600" />
      <span>{loading ? "Cloning…" : "Clone & Re-Ship"}</span>
    </button>
  );
}
