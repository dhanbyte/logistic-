import Link from "next/link";
import { Plus } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import { PageHeader } from "@/components/page-header";
import { buttonClassName } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";
import { getWarehouses } from "@/lib/data/warehouses";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    paymentMode?: string;
    channel?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const [ordersResult, warehouses] = await Promise.all([
    getOrders({
      q: params.q,
      status: params.status,
      paymentMode: params.paymentMode,
      channel: params.channel,
      page: Number(params.page) || 1,
      pageSize: 10,
    }),
    getWarehouses(),
  ]);

  return (
    <>
      <PageHeader
        title="Customer Orders"
        description="Manage, verify, and generate courier shipping labels for your e-commerce orders."
      >
        <Link
          href="/orders/new"
          className={`${buttonClassName()} bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs`}
        >
          <Plus size={16} /> Create Single Order
        </Link>
      </PageHeader>

      <OrdersTable
        orders={ordersResult.orders}
        total={ordersResult.total}
        page={ordersResult.page}
        pageCount={ordersResult.pageCount}
        counts={ordersResult.counts}
        warehouses={warehouses}
      />
    </>
  );
}
