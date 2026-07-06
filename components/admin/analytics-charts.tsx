"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type RevenueMonth = {
  month: string;
  revenueInRupees: number;
  orderCount: number;
};

type StatusStat = {
  status: string;
  count: number;
};

type TopProduct = {
  name: string;
  orderCount: number;
};

type Props = {
  revenueByMonth: RevenueMonth[];
  ordersByStatus: StatusStat[];
  topProducts: TopProduct[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function AnalyticsCharts({ revenueByMonth, ordersByStatus, topProducts }: Props) {
  return (
    <div className="space-y-8">
      {/* Revenue by Month */}
      <div className="rounded-md border border-steel-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel-600">
          Revenue &amp; Orders — Last 12 Months
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueByMonth} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="revenue"
              tickFormatter={(v: number) => INR_FORMATTER.format(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 11 }}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value, name) => {
                const num = Number(value);
                if (name === "Revenue (₹)") return [INR_FORMATTER.format(num), name];
                return [num, name];
              }}
            />
            <Legend />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenueInRupees"
              stroke="#3b82f6"
              fill="#bfdbfe"
              name="Revenue (₹)"
              strokeWidth={2}
            />
            <Area
              yAxisId="orders"
              type="monotone"
              dataKey="orderCount"
              stroke="#22c55e"
              fill="#bbf7d0"
              name="Orders"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <div className="rounded-md border border-steel-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel-600">
            Orders by Status
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersByStatus} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Orders" radius={0}>
                {ordersByStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-md border border-steel-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel-600">
            Top 5 Products (Last 90 Days)
          </h2>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-steel-500">No order data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="orderCount" name="Orders" fill="#3b82f6" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
