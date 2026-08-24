import { Lock, ShieldAlert, ShieldCheck } from "lucide-react";

export default function AdminRolesPage() {
  const roles = [
    {
      name: "Super Admin",
      description: "Unrestricted access across all financial ledgers, rates, users, KYC, settings, and staff.",
      usersCount: 1,
      access: "Full System (Read / Write / Delete / Execute)",
    },
    {
      name: "Finance Admin",
      description: "Access to wallet ledgers, payment gateways, remittances (&le; ₹50k), and COD settlements.",
      usersCount: 1,
      access: "Finance & Settlements Suite",
    },
    {
      name: "Operations Admin",
      description: "Manage courier partners, order dispatches, live tracking, NDR escalation and RTO.",
      usersCount: 1,
      access: "Orders, Shipments & Couriers",
    },
    {
      name: "Support Executive",
      description: "Respond to merchant helpdesk tickets, view order tracking, and escalate disputes.",
      usersCount: 0,
      access: "Support Desk & Notifications (Read-Only Orders)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-slate-500">
          Configure security clearance levels and operational permissions for internal employees.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((r, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">{r.name}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                {r.usersCount} Staff Assigned
              </span>
            </div>
            <p className="text-xs text-slate-500">{r.description}</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Scope:</span>
              <strong className="text-indigo-700">{r.access}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
