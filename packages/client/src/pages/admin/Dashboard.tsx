import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import api from "@/services/api";
import { formatPrice, statusLabels, statusColors } from "@/lib/utils";
import type { DashboardData } from "@/types";

function BarChart({ data, maxValue, labelFn, valueFn, colorFn }: {
  data: Record<string, unknown>[];
  maxValue: number;
  labelFn: (d: Record<string, unknown>) => string;
  valueFn: (d: Record<string, unknown>) => number;
  colorFn?: (d: Record<string, unknown>, i: number) => string;
}) {
  if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>;
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const v = valueFn(d);
        const h = maxValue > 0 ? Math.max((v / maxValue) * 100, 2) : 2;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-gray-500 font-medium">{v}</span>
            <div
              className="w-full rounded-t-sm transition-all duration-300"
              style={{
                height: `${h}%`,
                background: colorFn ? colorFn(d, i) : `hsl(212 79% ${35 + i * 5}%)`,
              }}
            />
            <span className="text-[10px] text-gray-400 truncate w-full text-center">
              {labelFn(d)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, labelFn, valueFn }: {
  data: Record<string, unknown>[];
  labelFn: (d: Record<string, unknown>) => string;
  valueFn: (d: Record<string, unknown>) => number;
}) {
  if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>;
  const total = data.reduce((s, d) => s + valueFn(d), 0);
  const colors = ["#1a6fc4", "#ff6600", "#22c55e", "#a855f7", "#eab308", "#ef4444", "#06b6d4", "#f97316", "#6366f1", "#ec4899"];

  const offsets: number[] = [];
  let acc = 0;
  for (const d of data) {
    offsets.push(acc);
    acc += total > 0 ? (valueFn(d) / total) * 100 : 0;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28 md:w-36 md:h-36 shrink-0 -rotate-90">
        {data.map((d, i) => {
          const pct = total > 0 ? (valueFn(d) / total) * 100 : 0;
          return (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="18"
              strokeDasharray={`${pct * 2.513} ${251.3 - pct * 2.513}`}
              strokeDashoffset={`${-offsets[i] * 2.513}`}
            />
          );
        })}
        <circle cx="50" cy="50" r="31" fill="white" />
        <text x="50" y="48" textAnchor="middle" className="fill-gray-800" fontSize="14" fontWeight="bold" transform="rotate(90,50,50)">
          {total}
        </text>
        <text x="50" y="60" textAnchor="middle" className="fill-gray-400" fontSize="7" transform="rotate(90,50,50)">
          总订单
        </text>
      </svg>
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="truncate flex-1">{labelFn(d)}</span>
            <span className="font-medium text-gray-600 shrink-0">{valueFn(d)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>;
  if (!data) return null;

  const stats = [
    { icon: ShoppingCart, label: "总订单数", value: data.totalOrders, color: "bg-blue-50 text-blue-600" },
    { icon: DollarSign, label: "总收入", value: formatPrice(data.totalRevenue), color: "bg-green-50 text-green-600" },
    { icon: Users, label: "注册用户", value: data.totalUsers, color: "bg-purple-50 text-purple-600" },
    { icon: TrendingUp, label: "今日订单", value: data.todayOrders, color: "bg-orange-50 text-orange-600" },
  ];

  const maxTrendCount = Math.max(...(data.salesTrend?.map((t) => t.count) || [1]), 1);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 md:p-2 rounded-lg ${s.color}`}><s.icon className="w-4 h-4 md:w-5 md:h-5" /></div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-base md:text-xl font-bold truncate">{s.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 近7天售票趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={(data.salesTrend || []) as Record<string, unknown>[]}
              maxValue={maxTrendCount}
              labelFn={(d) => String(d.date).slice(5)}
              valueFn={(d) => Number(d.count)}
              colorFn={(_, i) => `hsl(212, 79%, ${40 + i * 5}%)`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> 热门路线占比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={(data.routeDistribution || []) as Record<string, unknown>[]}
              labelFn={(d) => `${d.from_station}→${d.to_station}`}
              valueFn={(d) => Number(d.count)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Existing: popular routes + recent orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm md:text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />热门路线</CardTitle></CardHeader>
          <CardContent>
            {data.popularRoutes.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {data.popularRoutes.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-railway-primary text-white text-xs flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm">{r.from_station} → {r.to_station}</span>
                    </div>
                    <span className="text-sm font-medium">{r.count}单</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm md:text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />最近订单</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>路线</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.slice(0, 5).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs">{o.order_number?.slice(-8)}</TableCell>
                    <TableCell className="text-xs">{o.from_station_name}→{o.to_station_name}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>
                        {statusLabels[o.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{formatPrice(o.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
