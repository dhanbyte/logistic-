import { notFound } from "next/navigation";
import { formatINR } from "@/lib/calculations";
import { getEcommerceShipmentById } from "@/lib/data/ecommerce-shipments";
import { PrintLabelButton } from "@/components/shipments/print-label-button";

export default async function ShipmentLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { shipment } = await getEcommerceShipmentById(id);

  if (!shipment) {
    notFound();
  }

  const order = shipment.order;
  const customer = order?.customer;
  const warehouse = shipment.warehouse;
  const isCod = shipment.paymentMode === "COD";

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:bg-white">
      {/* Top Bar for Screen Preview */}
      <div className="mb-4 flex w-full max-w-[400px] items-center justify-between print:hidden">
        <a
          href={`/shipments/${id}`}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          &larr; Back to Shipment
        </a>
        <PrintLabelButton labelUrl={shipment.labelUrl} awbNumber={shipment.awbNumber} />
      </div>

      {/* 4x6 Inch Thermal Label Container */}
      <div className="w-full max-w-[400px] rounded-lg border-2 border-slate-900 bg-white p-4 font-sans text-slate-900 shadow-lg print:max-w-none print:w-[4in] print:min-h-[6in] print:border-none print:shadow-none print:p-2">
        {/* Header: Carrier Name & Routing Code */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">
              {shipment.courierProvider?.name || "Shipwave Express"}
            </h1>
            <p className="text-[10px] font-bold text-slate-600">
              E-COMMERCE AIR/SURFACE LOGISTICS
            </p>
          </div>
          <div className="text-right">
            <span className="rounded border-2 border-slate-900 px-2 py-0.5 text-xs font-black uppercase">
              {shipment.routingCode || `${shipment.deliveryPincode.slice(0, 3)}-XB`}
            </span>
          </div>
        </div>

        {/* Barcode & AWB Section */}
        <div className="my-3 text-center border-b-2 border-slate-900 pb-3">
          {/* Visual Barcode Pattern */}
          <div className="mx-auto flex h-14 w-full max-w-[320px] items-stretch justify-between px-2 py-1 bg-white">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className={`bg-slate-950 ${
                  i % 3 === 0
                    ? "w-1.5"
                    : i % 5 === 0
                      ? "w-1"
                      : i % 2 === 0
                        ? "w-0.5"
                        : "w-[1px]"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 font-mono text-sm font-black tracking-widest uppercase">
            AWB: {shipment.awbNumber}
          </p>
          <p className="text-[10px] font-semibold text-slate-500">
            Order Ref: {order?.orderNumber || "ORD-001"}
          </p>
        </div>

        {/* Payment & COD Badge */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 py-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Payment Mode
            </span>
            <span
              className={`inline-block rounded px-2 py-0.5 text-sm font-black uppercase ${
                isCod ? "bg-slate-900 text-white" : "border border-slate-900 text-slate-900"
              }`}
            >
              {shipment.paymentMode}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              {isCod ? "COD Collectible" : "Total Paid Amount"}
            </span>
            <span className="text-base font-black">
              {formatINR(isCod ? shipment.codAmount : shipment.declaredValue)}
            </span>
          </div>
        </div>

        {/* Deliver To: Buyer Destination */}
        <div className="border-b-2 border-slate-900 py-2.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
            Deliver To (Consignee):
          </span>
          <p className="text-sm font-black">{customer?.fullName || "Buyer Name"}</p>
          <p className="text-xs leading-snug mt-0.5">
            {customer?.addressLine1}
            {customer?.addressLine2 ? `, ${customer?.addressLine2}` : ""}
          </p>
          <p className="text-xs font-bold mt-0.5">
            {customer?.city}, {customer?.state}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono font-black text-white">
              PIN: {shipment.deliveryPincode}
            </span>
            <span className="text-xs font-bold">Ph: {customer?.phone}</span>
          </div>
        </div>

        {/* Package Specs & SKU Items */}
        <div className="border-b-2 border-slate-900 py-2 text-[10px]">
          <div className="grid grid-cols-3 gap-1 border-b border-slate-200 pb-1.5 mb-1.5 font-semibold">
            <div>
              <span className="text-slate-500 block">Weight</span>
              <span>{shipment.weightKg} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Chargeable</span>
              <span className="font-bold">{shipment.chargeableWeightKg} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dimensions</span>
              <span>
                {shipment.lengthCm}x{shipment.widthCm}x{shipment.heightCm} cm
              </span>
            </div>
          </div>

          <p className="font-bold text-[11px] mb-0.5">Items in Package:</p>
          <div className="space-y-0.5 text-slate-700">
            {order?.items?.length ? (
              order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.productName} ({item.sku || "SKU-01"})
                  </span>
                  <span className="font-bold">x{item.quantity}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <span>E-Commerce Apparel/Goods</span>
                <span className="font-bold">x1</span>
              </div>
            )}
          </div>
        </div>

        {/* Return / Origin Dispatch Address */}
        <div className="pt-2 text-[9px] text-slate-600">
          <span className="font-bold uppercase tracking-wider text-slate-800 block">
            Return To / Shipped By:
          </span>
          <p className="font-bold text-slate-900">
            {warehouse?.warehouseName || "Shipwave Warehouse"}
          </p>
          <p>{warehouse?.addressLine1}</p>
          <p>
            {warehouse?.city}, {warehouse?.state} - {shipment.pickupPincode} | Ph:{" "}
            {warehouse?.contactPhone}
          </p>
          {warehouse?.gstin && <p className="mt-0.5">GSTIN: {warehouse.gstin}</p>}
        </div>
      </div>
    </div>
  );
}
