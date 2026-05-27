import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Clock, ArrowRight, Users } from "lucide-react";
import api from "@/services/api";
import type { TrainSearchResult, Station } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);

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

  const fromStation = stations.find((s) => s.id === Number(fromId));
  const toStation = stations.find((s) => s.id === Number(toId));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          {fromStation?.name || "出发站"} → {toStation?.name || "到达站"}
          <span className="text-gray-500 text-sm font-normal ml-2">{date}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">共找到 {results.length} 个车次</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">正在查询中...</div>
      ) : results.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">未找到符合条件的车次</p>
          <Button variant="outline" onClick={() => navigate("/")}>返回首页重新搜索</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-gray-500">{r.from_station?.name}</div>
                      <div className="text-lg font-bold text-railway-primary">{r.from_stop?.from_dep_time}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          <Train className="w-3 h-3 mr-1" />
                          {r.train.train_number}
                        </Badge>
                        <span className="text-xs text-gray-400">{r.train.train_type}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {r.train.duration}
                      </div>
                      <Link to={`/train/${r.train.id}?from=${fromId}&to=${toId}`} className="text-xs text-railway-primary hover:underline">
                        查看经停站
                      </Link>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-gray-500">{r.to_station?.name}</div>
                      <div className="text-lg font-bold text-railway-primary">{r.to_stop?.to_arr_time}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {r.seats.map((seat) => (
                      <button
                        key={seat.seat_type_id}
                        onClick={() => navigate(`/booking?train=${r.train.id}&seat=${seat.seat_type_id}&from=${fromId}&to=${toId}`)}
                        disabled={seat.available_seats <= 0}
                        className="text-center p-2 rounded-md border hover:border-railway-primary hover:bg-railway-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-xs text-gray-500">{seat.seat_type_name}</div>
                        <div className="font-bold text-railway-orange">{formatPrice(seat.price)}</div>
                        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                          <Users className="w-3 h-3" />
                          {seat.available_seats > 0 ? `余${seat.available_seats}` : "无票"}
                        </div>
                      </button>
                    ))}
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
