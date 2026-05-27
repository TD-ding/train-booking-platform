import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/services/api";
import { formatPrice, statusLabels, statusColors } from "@/lib/utils";
import type { Booking } from "@/types";

export default function OrderManagement() {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const loadOrders = useCallback(async (currentTab?: string) => {
    setLoading(true);
    const t = currentTab ?? tab;
    const params = t !== "all" ? `?status=${t}` : "";
    try {
      const res = await api.get(`/admin/orders${params}`);
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    loadOrders(newTab);
  };

  const handleRefund = async (id: number) => {
    if (!confirm("确定对此订单进行退票处理？")) return;
    try {
      await api.post(`/admin/orders/${id}/refund`);
      loadOrders();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "退票失败");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">订单管理</h1>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待支付</TabsTrigger>
          <TabsTrigger value="paid">已支付</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
          <TabsTrigger value="refunded">已退票</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>车次</TableHead>
                      <TableHead>路线</TableHead>
                      <TableHead>乘客</TableHead>
                      <TableHead>座位</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs font-mono">{o.order_number}</TableCell>
                        <TableCell>{o.username}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{o.train_number}</Badge></TableCell>
                        <TableCell className="text-sm">{o.from_station_name}→{o.to_station_name}</TableCell>
                        <TableCell>{o.passenger_name}</TableCell>
                        <TableCell>{o.seat_type_name}</TableCell>
                        <TableCell className="font-medium">{formatPrice(o.price)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                        </TableCell>
                        <TableCell>
                          {o.status === "paid" && (
                            <Button size="sm" variant="outline" className="text-red-500 text-xs h-7" onClick={() => handleRefund(o.id)}>退票</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
