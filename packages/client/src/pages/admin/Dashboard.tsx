import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import api from "@/services/api";
import { formatPrice, statusLabels, statusColors } from "@/lib/utils";
import type { DashboardData } from "@/types";

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />热门路线</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />最近订单</CardTitle></CardHeader>
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
