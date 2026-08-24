"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Currency, ShipmentStatus } from "@/types";

const colors = ["#2563eb", "#7c3aed", "#b45309", "#178563", "#64748b", "#dc2626"];

export function StatusChart({
  data,
}: {
  data: { name: ShipmentStatus; value: number }[];
}) {
  const total = data.reduce((acc, i) => acc + i.value, 0);

  return (
    <div className="h-64">
      {total === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-400">
          No shipment status data to display
        </div>
      ) : (
        <div aria-hidden="true" className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={86}
                paddingAngle={3}
              >
                {data.map((item, index) => (
                  <Cell fill={colors[index % colors.length]} key={item.name} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul
        aria-label="Shipment status totals"
        className="flex flex-wrap justify-center gap-3 mt-2"
      >
        {data.map((item, index) => (
          <li key={item.name} className="text-xs text-slate-600 flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: colors[index % colors.length] }}
            />
            {item.name}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProfitChart({
  data,
  currency,
}: {
  data: { name: string; profit: number }[];
  currency: Currency;
}) {
  return (
    <>
      <div aria-hidden="true" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -15, right: 8 }}>
            <CartesianGrid vertical={false} stroke="#eef0f3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`
              }
            />
            <Tooltip
              formatter={(value) => `₹${Number(value).toLocaleString()}`}
            />
            <Bar dataKey="profit" fill="#176b57" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Profit by client in {currency}</caption>
        <thead>
          <tr>
            <th scope="col">Client</th>
            <th scope="col">Profit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <th scope="row">{item.name}</th>
              <td>{item.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
