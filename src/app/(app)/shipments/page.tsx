import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EcommerceShipmentsTable } from "@/components/shipments/ecommerce-shipments-table";
import { buttonClassName } from "@/components/ui/button";
import { getEcommerceShipments } from "@/lib/data/ecommerce-shipments";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    courier?: string;
    paymentMode?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const result = await getEcommerceShipments({
    q: params.q,
    status: params.status,
    courier: params.courier,
    paymentMode: params.paymentMode,
    page: Number(params.page) || 1,
    pageSize: 10,
  });

  return (
    <>
      <PageHeader
        title="Shipments & AWB Tracking"
        description="Monitor active parcel movements, courier SLAs, and delivery status in real-time."
      >
        <Link
          href="/orders"
          className={`${buttonClassName()} bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs`}
        >
          Book New Shipment
        </Link>
      </PageHeader>

      <EcommerceShipmentsTable
        shipments={result.shipments}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
      />
    </>
  );
}
