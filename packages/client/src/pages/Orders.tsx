import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Train, ArrowRight, Clock, CreditCard, User, Hash } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, statusLabels, statusColors } from "@/lib/utils";
import type { Booking } from "@/types";

const TAB_ITEMS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待支付" },
  { value: "paid", label: "已支付" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
  { value: "refunded", label: "已退票" },
];

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
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <h1 className="text-lg md:text-xl font-bold mb-3 md:mb-4">我的订单</h1>

      {/* Scrollable tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-3 px-3 md:mx-0 md:px-0">
        {TAB_ITEMS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === t.value
                ? "bg-railway-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">暂无订单记录</p>
          <Button asChild variant="outline"><Link to="/">去查询车次</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Header: train number + status */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Train className="w-3 h-3 mr-1" />
                    {b.train_number}
                  </Badge>
                  <span className="text-xs text-gray-400">{b.train_type}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[b.status]}`}>
                  {statusLabels[b.status]}
                </span>
              </div>

              <CardContent className="p-4">
                {/* Route */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{b.from_station_name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{b.departure_time}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <div className="w-1 h-1 rounded-full bg-railway-primary" />
                    <div className="w-8 md:w-16 h-px bg-gray-300" />
                    <ArrowRight className="w-3 h-3 text-railway-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{b.to_station_name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{b.arrival_time}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-gray-400">历时</div>
                    <div className="text-xs font-medium text-gray-600">{b.duration}</div>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">乘客：</span>
                    <span className="font-medium">{b.passenger_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">座位：</span>
                    <span className="font-medium">{b.seat_type_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">座号：</span>
                    <span className="font-medium">{b.seat_number || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-[10px]">№</span>
                    <span className="text-gray-500">订单：</span>
                    <span className="font-mono text-gray-400 truncate">{b.order_number?.slice(-10)}</span>
                  </div>
                </div>

                {/* Footer: price + actions */}
                <div className="flex items-center justify-between">
                  <div className="font-bold text-railway-orange text-lg">{formatPrice(b.price)}</div>
                  <div className="flex gap-2">
                    {b.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-railway-orange hover:bg-orange-600 h-8 text-xs" onClick={() => handlePay(b.id)}>
                          立即支付
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCancel(b.id)}>
                          取消订单
                        </Button>
                      </>
                    )}
                    {b.status === "paid" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleCancel(b.id)}>
                        申请退票
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
