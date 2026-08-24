import { redirect } from "next/navigation";
import { formatINR } from "@/lib/calculations";
import { getEcommerceShipments } from "@/lib/data/ecommerce-shipments";
import { getWarehouses } from "@/lib/data/warehouses";
import { PrintLabelButton } from "@/components/shipments/print-label-button";

export default async function ManifestPage({
  searchParams,
}: {
  searchParams: Promise<{ courier?: string; warehouseId?: string }>;
}) {
  const params = await searchParams;
  const [{ shipments }, warehouses] = await Promise.all([
    getEcommerceShipments({ pageSize: 100 }),
    getWarehouses(),
  ]);

  const defaultWarehouse = warehouses[0];
  const manifestNumber = `MNF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const manifestDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const totalWeight = shipments.reduce((sum, s) => sum + (s.weightKg || 0.5), 0);
  const totalCodAmount = shipments
    .filter((s) => s.paymentMode === "COD")
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:bg-white">
      {/* Top Bar for Screen Preview */}
      <div className="mb-4 flex w-full max-w-[850px] items-center justify-between print:hidden">
        <a
          href="/orders?status=MANIFESTED"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          &larr; Back to Manifested Orders
        </a>
        <div className="flex items-center gap-2">
          <PrintLabelButton />
        </div>
      </div>

      {/* 8.5x11 Standard Courier Handover Sheet */}
      <div className="w-full max-w-[850px] rounded-lg border border-slate-300 bg-white p-8 font-sans text-slate-900 shadow-lg print:max-w-none print:w-full print:border-none print:shadow-none print:p-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">
              COURIER PICKUP HANDOVER MANIFEST
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Official Parcel Handover &amp; Proof of Dispatch Document
            </p>
            <div className="mt-2 text-xs text-slate-700">
              <p className="font-bold">{defaultWarehouse?.warehouseName || "Dhanbyte Central Hub"}</p>
              <p>{defaultWarehouse?.addressLine1 || "Plot 12, Industrial Area, Phase 3"}</p>
              <p>
                {defaultWarehouse?.city || "New Delhi"}, {defaultWarehouse?.state || "Delhi"} -{" "}
                {defaultWarehouse?.pincode || "110020"} | Ph:{" "}
                {defaultWarehouse?.contactPhone || "9876543210"}
              </p>
              {defaultWarehouse?.gstin && <p className="font-mono">GSTIN: {defaultWarehouse.gstin}</p>}
            </div>
          </div>

          <div className="text-right">
            <span className="rounded bg-slate-900 px-3 py-1 text-xs font-mono font-black text-white uppercase block">
              {manifestNumber}
            </span>
            <p className="text-xs font-semibold text-slate-600 mt-1">Date: {manifestDate}</p>
            <p className="text-xs font-bold text-indigo-700 mt-1">
              Courier Partner: {params.courier ? params.courier.toUpperCase() : "SHADOWFAX / XPRESSBEES"}
            </p>
          </div>
        </div>

        {/* Summary Metric Boxes */}
        <div className="my-4 grid grid-cols-4 gap-3 border border-slate-200 bg-slate-50 p-3 text-xs rounded-md">
          <div>
            <span className="text-slate-500 block">Total Shipments</span>
            <span className="text-base font-black text-slate-900">{shipments.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Weight</span>
            <span className="text-base font-black text-slate-900">{totalWeight.toFixed(2)} kg</span>
          </div>
          <div>
            <span className="text-slate-500 block">Prepaid Parcels</span>
            <span className="text-base font-black text-emerald-700">
              {shipments.filter((s) => s.paymentMode === "PREPAID").length}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">COD Collectible</span>
            <span className="text-base font-black text-amber-700">{formatINR(totalCodAmount)}</span>
          </div>
        </div>

        {/* Handover Shipments Table */}
        <table className="w-full text-left text-xs border border-slate-200 mb-6">
          <thead className="border-b border-slate-300 bg-slate-100 font-bold text-slate-800">
            <tr>
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3">AWB Number</th>
              <th className="py-2 px-3">Order ID</th>
              <th className="py-2 px-3">Consignee &amp; City</th>
              <th className="py-2 px-2 text-center">Dest PIN</th>
              <th className="py-2 px-2 text-right">Weight</th>
              <th className="py-2 px-2 text-center">Payment</th>
              <th className="py-2 px-3 text-right">Collect (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {shipments.map((s, idx) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-2 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-2 px-3 font-mono font-bold text-slate-900">{s.awbNumber}</td>
                <td className="py-2 px-3 font-semibold text-slate-700">{s.order?.orderNumber || "Order"}</td>
                <td className="py-2 px-3">
                  <p className="font-semibold text-slate-900">{s.order?.customer?.fullName || "Customer"}</p>
                  <p className="text-[10px] text-slate-500">{s.order?.customer?.city || "City"}</p>
                </td>
                <td className="py-2 px-2 text-center font-mono font-bold">{s.deliveryPincode}</td>
                <td className="py-2 px-2 text-right">{s.weightKg} kg</td>
                <td className="py-2 px-2 text-center font-bold">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      s.paymentMode === "COD" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {s.paymentMode}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-bold">
                  {s.paymentMode === "COD" ? formatINR(s.codAmount) : "₹0"}
                </td>
              </tr>
            ))}

            {!shipments.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No active manifested shipments found to include in manifest.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Courier Pickup Verification & Handover Signatures */}
        <div className="border-t-2 border-slate-900 pt-4 mt-8">
          <p className="text-[11px] font-semibold text-slate-600 mb-6 leading-relaxed">
            <strong>Declaration:</strong> I hereby confirm that I have collected the above listed{" "}
            <strong>{shipments.length} package(s)</strong> in sealed, undamaged condition with intact barcodes on
            behalf of the logistics partner for forward shipment processing.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-4">
            {/* Courier Rider Signature */}
            <div className="border-t border-dashed border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-900 uppercase">Courier Pickup Rider / Driver Signature</p>
              <div className="space-y-1 text-xs text-slate-600 mt-2">
                <p>Rider Name: ____________________________</p>
                <p>Contact / Phone: _______________________</p>
                <p>Vehicle / RunSheet No: _________________</p>
                <p>Handover Time: _________________________</p>
              </div>
            </div>

            {/* Warehouse Dispatcher Signature */}
            <div className="border-t border-dashed border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-900 uppercase">Warehouse Dispatch Officer Signature</p>
              <div className="space-y-1 text-xs text-slate-600 mt-2">
                <p>Officer Name: __________________________</p>
                <p>Designation: ___________________________</p>
                <p>Seal / Stamp: __________________________</p>
                <p>Date &amp; Sign: ___________________________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
