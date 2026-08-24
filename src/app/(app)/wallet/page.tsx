import { PageHeader } from "@/components/page-header";
import { SimpleWalletView } from "@/components/wallet/simple-wallet-view";
import { getWalletSummary } from "@/lib/data/wallet";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const summary = await getWalletSummary(params.type);

  return (
    <SimpleWalletView
      availableBalance={summary.availableBalance}
      pendingCod={summary.pendingCod}
      totalUsed={summary.totalUsed}
      isLowBalance={summary.isLowBalance}
      transactions={summary.transactions}
    />
  );
}
