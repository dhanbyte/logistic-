import { Plus, ShieldCheck, User, Users } from "lucide-react";

export default function AdminStaffPage() {
  const staff = [
    {
      id: "adm-01",
      name: "Dhananjay",
      email: "dhananjay.win2004@gmail.com",
      role: "SUPER_ADMIN",
      permissions: "Full System & Financial Authority",
      lastLogin: "2026-08-24 16:45",
      status: "ACTIVE",
    },
    {
      id: "adm-02",
      name: "Operations Manager",
      email: "ops@shipwave.in",
      role: "OPERATIONS_ADMIN",
      permissions: "Couriers, Shipments, NDR & Manifest",
      lastLogin: "2026-08-24 10:00",
      status: "ACTIVE",
    },
    {
      id: "adm-03",
      name: "Finance Officer",
      email: "finance@shipwave.in",
      role: "FINANCE_ADMIN",
      permissions: "Ledger, Remittances & Settlements",
      lastLogin: "2026-08-23 18:30",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Staff &amp; Team Management</h1>
          <p className="text-xs text-slate-500">
            Internal administrators with granular role-based access control (RBAC).
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Admin Name &amp; Email</th>
              <th className="py-3 px-4">Role Badge</th>
              <th className="py-3 px-4">Permission Scope</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.email}</p>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      s.role === "SUPER_ADMIN"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {s.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-700">{s.permissions}</td>
                <td className="py-3 px-4 text-slate-400">{s.lastLogin}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    {s.status}
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
