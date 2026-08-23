import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/page-header";
import { getWarehouses } from "@/lib/data/warehouses";

export default async function NewOrderPage() {
  const warehouses = await getWarehouses();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>

      <PageHeader
        title="Create New E-Commerce Order"
        description="Enter customer delivery details, product specs, and package dimensions to prepare for instant courier shipping."
      />

      <OrderForm warehouses={warehouses} />
    </>
  );
}
