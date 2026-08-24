import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  Percent,
  TrendingUp,
  Truck,
} from "lucide-react";
import { ProfitChart, StatusChart } from "@/components/analytics/breakdown-charts";
import { PerformanceChart } from "@/components/analytics/performance-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getReportingData } from "@/lib/data/reporting";
import { formatMoney } from "@/lib/utils";

export default async function AnalyticsPage() {
  const report = await getReportingData();

  return (
    <>
      <PageHeader
        title="E-Commerce & Logistics Analytics"
        description="Comprehensive financial performance, delivery success rates, and courier SLAs."
      />

      {/* Top 4 Financial KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatMoney(report.revenue, report.currency)}
          detail="Total fulfilled merchandise"
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Net Margin / Profit"
          value={formatMoney(report.profit, report.currency)}
          detail="Revenue minus freight costs"
          icon={TrendingUp}
        />
        <KpiCard
          label="Average Margin"
          value={`${report.averageMargin}%`}
          detail="Realized profit ratio"
          icon={Percent}
          tone="blue"
        />
        <KpiCard
          label="Total Shipments"
          value={String(report.shipmentCount)}
          detail={`${report.active} active in-transit`}
          icon={PackageCheck}
          tone="amber"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Performance Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h2 className="font-semibold text-slate-900">Revenue, Costs &amp; Profit Trends</h2>
              <p className="text-xs text-slate-500">
                Monthly trajectory of revenue and shipping spend in {report.currency}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={report.monthly} currency={report.currency} />
          </CardContent>
        </Card>

        {/* Shipments by Status */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Shipments by Lifecycle Status</h2>
          </CardHeader>
          <CardContent>
            <StatusChart data={report.statuses} />
          </CardContent>
        </Card>

        {/* Profit by Channel/Client */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Profit Breakdown by Sales Channel</h2>
          </CardHeader>
          <CardContent>
            <ProfitChart data={report.profitByClient} currency={report.currency} />
          </CardContent>
        </Card>

        {/* Top Channels */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Top Sales Channels by Revenue</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.topClients.map((client, index) => (
              <div className="flex items-center justify-between" key={client.name}>
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{client.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatMoney(client.revenue, report.currency)}
                </span>
              </div>
            ))}
            {!report.topClients.length && (
              <p className="py-6 text-center text-sm text-slate-500">No channel revenue data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Couriers */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Courier Partner Performance</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.topCarriers.map((carrier, index) => (
              <div className="flex items-center justify-between" key={carrier.name}>
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{carrier.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                  {carrier.completed} Delivered
                </span>
              </div>
            ))}
            {!report.topCarriers.length && (
              <p className="py-6 text-center text-sm text-slate-500">No completed shipments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
