import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Clock, ArrowRight, ArrowLeftRight, ArrowUpDown } from "lucide-react";
import api from "@/services/api";
import type { TrainSearchResult, Station } from "@/types";
import { formatPrice } from "@/lib/utils";

function seatAvailabilityColor(available: number, total: number): string {
  if (available <= 0) return "bg-gray-50 border-gray-200 text-gray-400";
  const ratio = available / total;
  if (ratio < 0.1) return "bg-red-50 border-red-200";
  if (ratio < 0.3) return "bg-orange-50 border-orange-200";
  return "bg-green-50 border-green-200";
}

function seatAvailabilityText(available: number): { text: string; cls: string } {
  if (available <= 0) return { text: "无票", cls: "text-gray-400" };
  if (available < 10) return { text: `余${available}张`, cls: "text-red-500" };
  if (available < 50) return { text: `余${available}张`, cls: "text-orange-500" };
  return { text: `余${available}张`, cls: "text-green-600" };
}

type SortKey = "time" | "price" | "duration";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "time", label: "出发时间" },
  { key: "price", label: "最低价" },
  { key: "duration", label: "历时" },
];

function parseDuration(d: string): number {
  const h = d.match(/(\d+)小时/);
  const m = d.match(/(\d+)分/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("time");

  useEffect(() => {
    api.get("/stations").then((res) => setStations(res.data));
  }, []);

  const searchTrains = useCallback(async () => {
    if (!fromId || !toId) return;
    try {
      const res = await api.get(`/trains/search?from_station_id=${fromId}&to_station_id=${toId}&date=${date}`);
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }, [fromId, toId, date]);

  useEffect(() => {
    searchTrains();
  }, [searchTrains]);

  const sortedResults = useMemo(() => {
    const copy = [...results];
    if (sortKey === "time") {
      copy.sort((a, b) => (a.from_stop?.from_dep_time || "").localeCompare(b.from_stop?.from_dep_time || ""));
    } else if (sortKey === "price") {
      copy.sort((a, b) => {
        const aMin = a.seats.length > 0 ? Math.min(...a.seats.map((s) => s.price)) : Infinity;
        const bMin = b.seats.length > 0 ? Math.min(...b.seats.map((s) => s.price)) : Infinity;
        return aMin - bMin;
      });
    } else if (sortKey === "duration") {
      copy.sort((a, b) => parseDuration(a.train.duration) - parseDuration(b.train.duration));
    }
    return copy;
  }, [results, sortKey]);

  const fromStation = stations.find((s) => s.id === Number(fromId));
  const toStation = stations.find((s) => s.id === Number(toId));

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-bold">
          {fromStation?.name || "出发站"} → {toStation?.name || "到达站"}
          <span className="text-gray-500 text-sm font-normal ml-2">{date}</span>
        </h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500">共找到 {results.length} 个车次</p>
          {results.length > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    sortKey === opt.key
                      ? "bg-railway-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">正在查询中...</div>
      ) : results.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <p className="text-gray-500 mb-4">未找到符合条件的车次</p>
          <Button variant="outline" onClick={() => navigate("/")}>返回首页重新搜索</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedResults.map((r, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-railway-primary text-white text-sm px-2.5 py-0.5">
                      <Train className="w-3.5 h-3.5 mr-1" />
                      {r.train.train_number}
                    </Badge>
                    <span className="text-xs text-gray-500">{r.train.train_type}</span>
                  </div>
                  <Link to={`/train/${r.train.id}?from=${fromId}&to=${toId}`}
                    className="text-xs text-railway-primary hover:underline">
                    经停站详情 →
                  </Link>
                </div>

                <div className="flex flex-col md:flex-row">
                  <div className="flex items-center justify-around md:justify-center md:gap-8 px-4 py-4 md:px-8 md:py-6 md:min-w-[280px]">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-0.5">{r.from_station?.name}</div>
                      <div className="text-xl md:text-2xl font-bold text-railway-primary">{r.from_stop?.from_dep_time}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2 md:px-4">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {r.train.duration}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-railway-primary" />
                        <div className="w-16 md:w-24 h-px bg-gray-300" />
                        <ArrowLeftRight className="w-3.5 h-3.5 text-railway-primary" />
                        <div className="w-16 md:w-24 h-px bg-gray-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-railway-primary" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-0.5">{r.to_station?.name}</div>
                      <div className="text-xl md:text-2xl font-bold text-railway-primary">{r.to_stop?.to_arr_time}</div>
                    </div>
                  </div>

                  <div className="flex-1 border-t md:border-t-0 md:border-l px-3 py-3 md:px-4 md:py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {r.seats.map((seat) => {
                        const sold = seat.available_seats <= 0;
                        const avail = seatAvailabilityText(seat.available_seats);
                        return (
                          <button
                            key={seat.seat_type_id}
                            onClick={() => !sold && navigate(`/booking?train=${r.train.id}&seat=${seat.seat_type_id}&from=${fromId}&to=${toId}`)}
                            disabled={sold}
                            className={`text-center p-2 md:p-2.5 rounded-lg border-2 transition-all ${seatAvailabilityColor(seat.available_seats, seat.total_seats)} ${sold ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-md active:scale-[0.98]"}`}
                          >
                            <div className="text-xs font-medium text-gray-600 mb-0.5">{seat.seat_type_name}</div>
                            <div className={`font-bold text-sm md:text-base ${sold ? "text-gray-400" : "text-railway-primary"}`}>
                              {formatPrice(seat.price)}
                            </div>
                            <div className={`text-xs font-medium ${avail.cls}`}>
                              {avail.text}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          重新搜索
        </Button>
      </div>
    </div>
  );
}
