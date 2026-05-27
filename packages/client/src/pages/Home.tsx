import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowRight, Train, MapPin, X } from "lucide-react";
import api from "@/services/api";
import type { Station } from "@/types";

function StationInput({
  label, value, onChange, onSelect, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  onSelect: (s: Station) => void; placeholder: string;
}) {
  const [results, setResults] = useState<Station[]>([]);
  const [show, setShow] = useState(false);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/stations").then((res) => setAllStations(res.data));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setShow(true);
    if (!v.trim()) { setResults(allStations.slice(0, 8)); return; }
    const q = v.toLowerCase();
    const matched = allStations.filter(
      (s) => s.name.includes(v) || s.pinyin.includes(q) || s.city.includes(v)
    );
    setResults(matched.slice(0, 8));
  };

  const display = results.length > 0 ? results : allStations.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setShow(true); if (!value.trim()) setResults(allStations.slice(0, 8)); }}
          placeholder={placeholder}
          className="w-full h-11 pl-4 pr-8 rounded-md border border-gray-300 focus:ring-2 focus:ring-railway-primary focus:border-transparent outline-none text-sm"
        />
        {value && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => { onChange(""); setResults([]); }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {show && (
        <div className="absolute z-30 w-full bg-white border rounded-lg shadow-xl max-h-64 overflow-auto mt-1">
          {display.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">未找到匹配车站</div>
          ) : (
            display.map((s) => (
              <button
                key={s.id}
                className="w-full text-left px-4 py-2.5 hover:bg-railway-50 text-sm flex items-center justify-between transition-colors"
                onClick={() => { onSelect(s); setShow(false); setResults([]); }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="text-gray-400 text-xs">{s.city}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);

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
      <section className="bg-gradient-to-br from-railway-primary to-railway-dark text-white py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">火车票在线订购</h1>
          <p className="text-railway-200 mb-6 md:mb-8 text-base md:text-lg">便捷、安全、快速的火车票查询和预订服务</p>

          <Card className="bg-white text-gray-900 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-end">
                <StationInput
                  label="出发站" placeholder="输入站名、城市或拼音"
                  value={fromStation}
                  onChange={setFromStation}
                  onSelect={(s) => { setSelectedFrom(s); setFromStation(s.name); }}
                />
                <button
                  onClick={swapStations}
                  className="p-2 text-railway-primary hover:bg-railway-50 rounded-full hidden md:flex items-center justify-center mb-5"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <StationInput
                  label="到达站" placeholder="输入站名、城市或拼音"
                  value={toStation}
                  onChange={setToStation}
                  onSelect={(s) => { setSelectedTo(s); setToStation(s.name); }}
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
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

      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">为什么选择我们</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: "🔍", title: "智能查询", desc: "快速查询全国列车时刻表和余票信息" },
            { icon: "🚄", title: "便捷购票", desc: "支持多种座位类型，一键完成购票流程" },
            { icon: "📱", title: "订单管理", desc: "随时查看和管理您的订单，支持在线退票" },
          ].map((f) => (
            <Card key={f.title} className="text-center p-5 md:p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl md:text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-base md:text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-railway-50 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">热门路线</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { from: "北京南", to: "上海虹桥", price: "553", fromId: 1, toId: 3 },
              { from: "广州南", to: "深圳北", price: "75", fromId: 5, toId: 6 },
              { from: "成都东", to: "重庆北", price: "154", fromId: 7, toId: 13 },
              { from: "郑州东", to: "西安北", price: "269", fromId: 14, toId: 9 },
            ].map((r) => (
              <Card key={`${r.from}-${r.to}`} className="p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/search?from=${r.fromId}&to=${r.toId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm md:text-base truncate">{r.from}</div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs my-0.5">
                      <Train className="w-3 h-3" />
                      <span className="truncate">{r.to}</span>
                    </div>
                  </div>
                  <div className="text-railway-orange font-bold text-sm md:text-lg ml-2 whitespace-nowrap">
                    ¥{r.price}<span className="text-[10px] md:text-xs text-gray-400 font-normal">起</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
