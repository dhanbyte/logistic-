import { Activity, CheckCircle2, Flame, Globe, Radio, ShieldCheck } from "lucide-react";

export default function AdminCourierApiLogsPage() {
  const apiLogs = [
    {
      id: "api-log-01",
      courier: "Shadowfax Express",
      endpoint: "POST /v3/clients/orders/cancel/",
      requestBody: '{"request_id": "SF37164698496"}',
      responseCode: 200,
      responseBody: '{"status": 200, "message": "Request has been marked as cancelled"}',
      latency: "214ms",
      timestamp: "2026-08-24 15:30:12",
    },
    {
      id: "api-log-02",
      courier: "Shadowfax Express",
      endpoint: "POST /v2/clients/requests",
      requestBody: '{"order_id": "ORD-564240", "pickup_pincode": 201301}',
      responseCode: 201,
      responseBody: '{"awb_number": "SF37164698496", "status": "ASSIGNED"}',
      latency: "280ms",
      timestamp: "2026-08-24 12:15:00",
    },
    {
      id: "api-log-03",
      courier: "Xpressbees",
      endpoint: "POST /api/shipments2/track",
      requestBody: '{"awb": "XB3910291029"}',
      responseCode: 200,
      responseBody: '{"status": "IN_TRANSIT", "location": "DELHI HUB"}',
      latency: "195ms",
      timestamp: "2026-08-24 11:00:00",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Courier API Telemetry &amp; Gateway Logs</h1>
        <p className="text-xs text-slate-500">
          Raw HTTP payload traces, rate limit quotas, response latencies and webhook deliveries.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Timestamp &amp; Courier</th>
              <th className="py-3 px-4">Endpoint &amp; Method</th>
              <th className="py-3 px-4">Request Payload</th>
              <th className="py-3 px-4">Response Payload</th>
              <th className="py-3 px-4">HTTP Status</th>
              <th className="py-3 px-4 text-right">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {apiLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{l.courier}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{l.timestamp}</p>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{l.endpoint}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                  {l.requestBody}
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-emerald-700 max-w-xs truncate">
                  {l.responseBody}
                </td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    {l.responseCode} OK
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                  {l.latency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
