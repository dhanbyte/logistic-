import { getAdminUsersList } from "@/lib/data/admin/users";
import { AdminKycClient } from "@/components/admin/admin-kyc-client";

export default async function AdminKycPage() {
  const users = await getAdminUsersList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">KYC Verification &amp; Document Review</h1>
        <p className="text-xs text-slate-500">
          Verify government identifiers, verified bank accounts and business registrations for legal compliance.
        </p>
      </div>

      <AdminKycClient users={users} />
    </div>
  );
}
