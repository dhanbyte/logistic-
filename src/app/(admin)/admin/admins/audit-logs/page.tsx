import { History, Lock, Search, ShieldCheck, User } from "lucide-react";

export default function AdminAuditLogsPage() {
  const logs = [
    {
      id: "log-101",
      adminName: "Dhananjay (Super Admin)",
      action: "WALLET_ADJUSTMENT_CREDIT",
      targetType: "WALLET",
      targetId: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5",
      details: "Manual credit of ₹5,000 for verified shipper promotion. Prev: ₹10,400 -> New: ₹15,400.",
      timestamp: "2026-08-24 15:50",
      ipAddress: "127.0.0.1",
    },
    {
      id: "log-102",
      adminName: "Dhananjay (Super Admin)",
      action: "KYC_APPROVED",
      targetType: "KYC",
      targetId: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5",
      details: "KYC documents verified against NSDL PAN & GSTIN Database.",
      timestamp: "2026-08-24 14:15",
      ipAddress: "127.0.0.1",
    },
    {
      id: "log-103",
      adminName: "Dhananjay (Super Admin)",
      action: "SHIPPING_RATE_UPDATED",
      targetType: "RATE",
      targetId: "slab-01",
      details: "Updated Shadowfax Zone A 0-500g rate to Prepaid ₹49, COD ₹69.",
      timestamp: "2026-08-24 12:00",
      ipAddress: "127.0.0.1",
    },
    {
      id: "log-104",
      adminName: "Dhananjay (Super Admin)",
      action: "REMITTANCE_APPROVED",
      targetType: "REMITTANCE",
      targetId: "rem-req-02",
      details: "Bank payout of ₹8,488.2 released. Bank UTR: HDFC9821029109.",
      timestamp: "2026-08-20 14:05",
      ipAddress: "127.0.0.1",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Immutable Staff Audit Logs</h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 flex items-center gap-1">
              <Lock size={12} /> Non-Editable Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every administrative change, wallet adjustment, KYC verdict, rate update, and payout is permanently stamped.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Log ID &amp; Timestamp</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Audit Details &amp; Balance Changes</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-900">{l.id}</p>
                    <p className="text-[11px] text-slate-400">{l.timestamp}</p>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {l.adminName}
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded bg-indigo-50 border border-indigo-200 font-mono text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                      {l.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                    <span className="font-bold">{l.targetType}:</span> {l.targetId.slice(0, 12)}…
                  </td>

                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {l.details}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                    {l.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
