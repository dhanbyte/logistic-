import { Bell, CheckCircle2, Mail, MessageSquare, Send, Smartphone } from "lucide-react";

export default function AdminNotificationsLogPage() {
  const logs = [
    {
      id: "notif-01",
      channel: "WHATSAPP",
      recipient: "+91 98765 43210 (Dhananjay)",
      title: "Order Dispatched via Shadowfax",
      body: "Your order ORD-564240 has been picked up. AWB: SF37164698496. Track at dhanbyte.me",
      status: "DELIVERED",
      timestamp: "2026-08-24 12:16",
    },
    {
      id: "notif-02",
      channel: "SMS",
      recipient: "+91 98112 23344 (Buyer)",
      title: "Out for Delivery Alert",
      body: "ShipWave: Your shipment SF37164698496 is out for delivery today. OTP is 4910.",
      status: "DELIVERED",
      timestamp: "2026-08-24 14:00",
    },
    {
      id: "notif-03",
      channel: "EMAIL",
      recipient: "dhananjay.win2004@gmail.com",
      title: "Daily Manifest Summary",
      body: "Manifest generated with 1 parcel for Shadowfax Express.",
      status: "SENT",
      timestamp: "2026-08-24 12:15",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Multi-Channel Notifications Dispatch Log</h1>
        <p className="text-xs text-slate-500">
          Trace outbound WhatsApp, SMS and Email messages sent to shippers and buyers.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Channel &amp; Time</th>
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Template Title</th>
              <th className="py-3 px-4">Message Body Preview</th>
              <th className="py-3 px-4 text-right">Delivery Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                      l.channel === "WHATSAPP"
                        ? "bg-emerald-100 text-emerald-800"
                        : l.channel === "SMS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {l.channel}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{l.timestamp}</p>
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-800">{l.recipient}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{l.title}</td>
                <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{l.body}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
