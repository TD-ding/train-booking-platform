import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Train, ArrowRight } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, statusLabels, statusColors } from "@/lib/utils";
import type { Booking } from "@/types";

export default function Orders() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadBookings = useCallback(async (tab?: string) => {
    const currentTab = tab ?? activeTab;
    const params = currentTab !== "all" ? `?status=${currentTab}` : "";
    try {
      const res = await api.get(`/bookings/my${params}`);
      setBookings(res.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    loadBookings(tab);
  };

  const handleCancel = async (id: number) => {
    if (!confirm("确定要取消此订单吗？")) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      loadBookings();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "取消失败");
    }
  };

  const handlePay = async (id: number) => {
    try {
      await api.post(`/bookings/${id}/pay`);
      loadBookings();
    } catch {
      alert("支付失败");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">请先登录查看订单</p>
        <Button asChild><Link to="/login">去登录</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">我的订单</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待支付</TabsTrigger>
          <TabsTrigger value="paid">已支付</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
          <TabsTrigger value="refunded">已退票</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : bookings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">暂无订单记录</p>
              <Button asChild variant="outline"><Link to="/search">去查询车次</Link></Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">
                            <Train className="w-3 h-3 mr-1" />
                            {b.train_number}
                          </Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>
                            {statusLabels[b.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{b.from_station_name}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{b.to_station_name}</span>
                          <span className="text-gray-400">{b.departure_time}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {b.passenger_name} | {b.seat_type_name} | {b.seat_number} | 订单号：{b.order_number}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-railway-orange">{formatPrice(b.price)}</div>
                        <div className="flex gap-2">
                          {b.status === "pending" && (
                            <>
                              <Button size="sm" className="bg-railway-orange hover:bg-orange-600" onClick={() => handlePay(b.id)}>支付</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancel(b.id)}>取消</Button>
                            </>
                          )}
                          {b.status === "paid" && (
                            <Button size="sm" variant="outline" onClick={() => handleCancel(b.id)}>退票</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
