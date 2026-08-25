import Link from "next/link";
import { Compass, Search, Truck } from "lucide-react";

export default function TrackSearchPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Truck size={19} />
            </span>
            <span className="text-base font-black tracking-tight text-slate-900">
              Shipwave Live Track
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-xs">
          <Compass size={32} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Track Your Shipment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
          Enter your Waybill / AWB tracking number to check real-time courier movement, pickup status, and estimated delivery.
        </p>

        <form
          action="/track"
          method="GET"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem("awb") as HTMLInputElement;
            if (input?.value) {
              window.location.href = `/track/${encodeURIComponent(input.value.trim())}`;
            }
          }}
          className="mt-6 flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50"
        >
          <div className="relative flex-1">
            <input
              type="text"
              name="awb"
              required
              placeholder="Enter AWB (e.g. SF37164698327, DLV, XPB)..."
              className="h-11 w-full rounded-xl bg-slate-50/50 pl-10 pr-3 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-mono font-bold"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="submit"
            className="h-11 rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            Track Parcel
          </button>
        </form>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 ShopWave Logistics. Public Tracking Engine.</p>
      </footer>
    </div>
  );
}
