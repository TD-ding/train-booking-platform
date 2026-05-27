import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Train, CreditCard, User, CheckCircle } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import type { Contact } from "@/types";

type Step = "passenger" | "confirm" | "payment" | "done";

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const trainId = searchParams.get("train");
  const seatTypeId = searchParams.get("seat");
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");

  const [step, setStep] = useState<Step>("passenger");
  const [passengerName, setPassengerName] = useState(user?.real_name || "");
  const [passengerIdCard, setPassengerIdCard] = useState("");
  const [passengerPhone, setPassengerPhone] = useState(user?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("wechat");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [price, setPrice] = useState(0);
  const [trainInfo, setTrainInfo] = useState<Record<string, unknown> | null>(null);
  const [seatInfo, setSeatInfo] = useState<Record<string, unknown> | null>(null);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!trainId || !fromId || !toId) return;
    api.get(`/trains/${trainId}`).then((res) => {
      setTrainInfo(res.data.train);
      const stop = res.data.stops.find((s: Record<string, unknown>) => String(s.station_id) === fromId);
      if (stop) setFromStation(stop.station_name as string);
      const toStop = res.data.stops.find((s: Record<string, unknown>) => String(s.station_id) === toId);
      if (toStop) setToStation(toStop.station_name as string);
    });
    api.get("/stations").then((res) => {
      const fs = res.data.find((s: Record<string, unknown>) => String(s.id) === fromId);
      if (fs) setFromStation(fs.name);
      const ts = res.data.find((s: Record<string, unknown>) => String(s.id) === toId);
      if (ts) setToStation(ts.name);
    });
    api.get("/contacts").then((res) => setContacts(res.data)).catch(() => {});
  }, [trainId, fromId, toId]);

  useEffect(() => {
    if (trainId && seatTypeId && fromId && toId) {
      api.get(`/trains/search?from_station_id=${fromId}&to_station_id=${toId}`).then((res) => {
        const result = res.data.find((r: Record<string, unknown>) => (r.train as Record<string, unknown>).id === Number(trainId));
        if (result) {
          const seat = (result.seats as Record<string, unknown>[]).find((s: Record<string, unknown>) => String(s.seat_type_id) === seatTypeId);
          if (seat) {
            setSeatInfo(seat);
            setPrice(seat.price as number);
          }
        }
      });
    }
  }, [trainId, seatTypeId, fromId, toId]);

  const selectContact = (c: Contact) => {
    setPassengerName(c.name);
    setPassengerIdCard(c.id_card);
    setPassengerPhone(c.phone);
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await api.post("/bookings", {
        train_id: Number(trainId),
        seat_type_id: Number(seatTypeId),
        from_station_id: Number(fromId),
        to_station_id: Number(toId),
        passenger_name: passengerName,
        passenger_id_card: passengerIdCard,
        passenger_phone: passengerPhone,
        payment_method: paymentMethod,
      });
      setOrderId(res.data.id);
      setOrderNumber(res.data.order_number);
      setStep("payment");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "预订失败";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await api.post(`/bookings/${orderId}/pay`);
      setStep("done");
    } catch {
      alert("支付失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!trainId || !fromId || !toId) {
    return <div className="text-center py-12">参数错误</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { key: "passenger", label: "填写乘客", icon: User },
          { key: "confirm", label: "确认订单", icon: CheckCircle },
          { key: "payment", label: "支付", icon: CreditCard },
          { key: "done", label: "完成", icon: CheckCircle },
        ].map((s, idx) => {
          const steps = ["passenger", "confirm", "payment", "done"];
          const currentIdx = steps.indexOf(step);
          const isActive = steps.indexOf(s.key) <= currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {idx > 0 && <div className={`w-8 h-0.5 ${isActive ? "bg-railway-primary" : "bg-gray-200"}`} />}
              <div className={`flex items-center gap-1 text-xs ${isActive ? "text-railway-primary" : "text-gray-400"}`}>
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary Card */}
      <Card className="mb-4 bg-railway-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-railway-primary text-white"><Train className="w-3 h-3 mr-1" />{trainInfo?.train_number as string || ""}</Badge>
            <span className="text-sm text-gray-500">{trainInfo?.train_type as string || ""}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>{fromStation}</span>
            <span className="text-gray-400">→</span>
            <span>{toStation}</span>
            {seatInfo && <Badge variant="outline">{seatInfo.seat_type_name as string}</Badge>}
          </div>
          <div className="mt-2 font-bold text-railway-orange text-lg">{formatPrice(price)}</div>
        </CardContent>
      </Card>

      {/* Step: Passenger */}
      {step === "passenger" && (
        <Card>
          <CardHeader><CardTitle className="text-base">乘客信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {contacts.length > 0 && (
              <div>
                <Label className="mb-2 block text-sm">常用联系人</Label>
                <div className="flex flex-wrap gap-2">
                  {contacts.map((c) => (
                    <Button key={c.id} variant="outline" size="sm" onClick={() => selectContact(c)}>
                      {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>姓名</Label>
              <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="请输入真实姓名" />
            </div>
            <div>
              <Label>身份证号</Label>
              <Input value={passengerIdCard} onChange={(e) => setPassengerIdCard(e.target.value)} placeholder="请输入身份证号码" />
            </div>
            <div>
              <Label>手机号</Label>
              <Input value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} placeholder="请输入手机号" />
            </div>
            <Button
              className="w-full bg-railway-orange hover:bg-orange-600"
              disabled={!passengerName || !passengerIdCard}
              onClick={() => setStep("confirm")}
            >
              下一步：确认订单
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <Card>
          <CardHeader><CardTitle className="text-base">确认订单</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">乘客姓名</div><div>{passengerName}</div>
              <div className="text-gray-500">身份证号</div><div>{passengerIdCard}</div>
              <div className="text-gray-500">手机号</div><div>{passengerPhone}</div>
              <div className="text-gray-500">车次</div><div>{trainInfo?.train_number as string}</div>
              <div className="text-gray-500">出发站</div><div>{fromStation}</div>
              <div className="text-gray-500">到达站</div><div>{toStation}</div>
              <div className="text-gray-500">座位类型</div><div>{seatInfo?.seat_type_name as string}</div>
              <div className="text-gray-500 font-semibold">票价</div><div className="font-bold text-railway-orange text-lg">{formatPrice(price)}</div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep("passenger")}>返回修改</Button>
              <Button className="flex-1 bg-railway-orange hover:bg-orange-600" onClick={handleBooking} disabled={loading}>
                {loading ? "提交中..." : "提交订单"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Payment */}
      {step === "payment" && (
        <Card>
          <CardHeader><CardTitle className="text-base">模拟支付</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-gray-500 mb-2">订单号：{orderNumber}</div>
              <div className="text-3xl font-bold text-railway-orange">{formatPrice(price)}</div>
            </div>
            <div className="space-y-2">
              <Label>支付方式</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "wechat", label: "微信支付", color: "bg-green-50 border-green-200" },
                  { value: "alipay", label: "支付宝", color: "bg-blue-50 border-blue-200" },
                  { value: "bank_card", label: "银行卡", color: "bg-gray-50 border-gray-200" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`p-3 rounded-md border text-center text-sm transition-all ${paymentMethod === m.value ? `${m.color} ring-2 ring-railway-primary` : "border-gray-200 hover:border-gray-300"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-railway-orange hover:bg-orange-600" onClick={handlePay} disabled={loading}>
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "支付中..." : "确认支付"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">支付成功！</h2>
            <p className="text-gray-500 mb-2">订单号：{orderNumber}</p>
            <p className="text-gray-500 mb-6">您的车票已预订成功，请在出发前取票乘车</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/orders")}>查看我的订单</Button>
              <Button className="bg-railway-primary" onClick={() => navigate("/")}>返回首页</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
