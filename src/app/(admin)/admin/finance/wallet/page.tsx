import { ShieldAlert } from "lucide-react";
import { getAdminUsersList } from "@/lib/data/admin/users";
import { AdminWalletAdjustForm } from "@/components/admin/admin-wallet-adjust-form";

export default async function AdminWalletAdjustPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const params = await searchParams;
  const users = await getAdminUsersList();
  const totalEscrowBalance = users.reduce((acc, u) => acc + u.walletBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Wallet Management &amp; Balance Adjustments</h1>
        <p className="text-xs text-slate-500">
          Manual credit and debit adjustments. Every action automatically creates an immutable double-entry ledger entry.
        </p>
      </div>

      {/* Core Rule Invariant Alert */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Core Financial Ledger Guarantee</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
            Never change a user&apos;s wallet balance without a corresponding financial ledger transaction.
            Every adjustment is permanently stamped with Admin ID, Reason, Prev Balance, New Balance and Transaction ID.
          </p>
        </div>
      </div>

      <AdminWalletAdjustForm
        users={users}
        initialUserId={params.userId}
        totalEscrowBalance={totalEscrowBalance}
      />
    </div>
  );
}
