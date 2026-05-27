import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowRight, Train } from "lucide-react";
import api from "@/services/api";
import type { Station } from "@/types";

export default function Home() {
  const navigate = useNavigate();
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fromResults, setFromResults] = useState<Station[]>([]);
  const [toResults, setToResults] = useState<Station[]>([]);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);

  const searchStations = async (query: string, type: "from" | "to") => {
    if (!query.trim()) {
      if (type === "from") { setFromResults([]); } else { setToResults([]); }
      return;
    }
    const res = await api.get(`/stations/search?q=${encodeURIComponent(query)}`);
    if (type === "from") { setFromResults(res.data); } else { setToResults(res.data); }
  };

  const selectStation = (station: Station, type: "from" | "to") => {
    if (type === "from") {
      setSelectedFrom(station);
      setFromStation(station.name);
      setShowFrom(false);
    } else {
      setSelectedTo(station);
      setToStation(station.name);
      setShowTo(false);
    }
  };

  const swapStations = () => {
    const tmpStation = selectedFrom;
    const tmpName = fromStation;
    setSelectedFrom(selectedTo);
    setFromStation(toStation);
    setSelectedTo(tmpStation);
    setToStation(tmpName);
  };

  const handleSearch = () => {
    if (!selectedFrom || !selectedTo) {
      alert("请选择出发站和到达站");
      return;
    }
    navigate(`/search?from=${selectedFrom.id}&to=${selectedTo.id}&date=${date}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-railway-primary to-railway-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">火车票在线订购</h1>
          <p className="text-railway-200 mb-8 text-lg">便捷、安全、快速的火车票查询和预订服务</p>

          {/* Search Box */}
          <Card className="bg-white text-gray-900 shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <div className="relative">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">出发站</label>
                  <input
                    type="text"
                    value={fromStation}
                    onChange={(e) => { setFromStation(e.target.value); setShowFrom(true); searchStations(e.target.value, "from"); setSelectedFrom(null); }}
                    onFocus={() => setShowFrom(true)}
                    placeholder="请输入出发站"
                    className="w-full h-11 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-railway-primary focus:border-transparent outline-none"
                  />
                  {showFrom && fromResults.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto mt-1">
                      {fromResults.map((s) => (
                        <button key={s.id} className="w-full text-left px-4 py-2 hover:bg-railway-50 text-sm" onClick={() => selectStation(s, "from")}>
                          {s.name} <span className="text-gray-400">{s.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={swapStations} className="p-2 text-railway-primary hover:bg-railway-50 rounded-full hidden md:flex items-center justify-center mb-1">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">到达站</label>
                  <input
                    type="text"
                    value={toStation}
                    onChange={(e) => { setToStation(e.target.value); setShowTo(true); searchStations(e.target.value, "to"); setSelectedTo(null); }}
                    onFocus={() => setShowTo(true)}
                    placeholder="请输入到达站"
                    className="w-full h-11 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-railway-primary focus:border-transparent outline-none"
                  />
                  {showTo && toResults.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto mt-1">
                      {toResults.map((s) => (
                        <button key={s.id} className="w-full text-left px-4 py-2 hover:bg-railway-50 text-sm" onClick={() => selectStation(s, "to")}>
                          {s.name} <span className="text-gray-400">{s.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">出发日期</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-railway-primary focus:border-transparent outline-none"
                  />
                </div>
                <Button onClick={handleSearch} className="h-11 px-8 bg-railway-orange hover:bg-orange-600 text-white w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  查询车票
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">为什么选择我们</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: "智能查询", desc: "快速查询全国列车时刻表和余票信息" },
            { icon: "🚄", title: "便捷购票", desc: "支持多种座位类型，一键完成购票流程" },
            { icon: "📱", title: "订单管理", desc: "随时查看和管理您的订单，支持在线退票" },
          ].map((f) => (
            <Card key={f.title} className="text-center p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Routes */}
      <section className="bg-railway-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">热门路线</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { from: "北京南", to: "上海虹桥", price: "553" },
              { from: "广州南", to: "深圳北", price: "75" },
              { from: "成都东", to: "重庆北", price: "154" },
              { from: "郑州东", to: "西安北", price: "269" },
            ].map((r) => (
              <Card key={`${r.from}-${r.to}`} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/search")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.from}</div>
                    <div className="flex items-center gap-1 text-gray-400 text-sm my-1">
                      <Train className="w-3 h-3" />
                    </div>
                    <div className="font-semibold">{r.to}</div>
                  </div>
                  <div className="text-railway-orange font-bold text-lg">¥{r.price}<span className="text-xs text-gray-400 font-normal">起</span></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
