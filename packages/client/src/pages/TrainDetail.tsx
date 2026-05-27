import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Train, Clock, MapPin, ArrowLeft } from "lucide-react";
import api from "@/services/api";
import { formatPrice } from "@/lib/utils";

interface TrainDetail {
  train: Record<string, unknown>;
  stops: Record<string, unknown>[];
  seats: Record<string, unknown>[];
}

export default function TrainDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");

  useEffect(() => {
    if (!id) return;
    api.get(`/trains/${id}`).then((res) => setDetail(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>;
  if (!detail) return <div className="text-center py-12">车次不存在</div>;

  const train = detail.train;
  const stops = detail.stops;

  const uniqueSeatsByType = (() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const s of detail.seats) {
      const name = s.seat_type_name as string;
      if (!map.has(name)) {
        map.set(name, s);
      }
    }
    return Array.from(map.values());
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={fromId && toId ? `/search?from=${fromId}&to=${toId}` : "/search"}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回搜索结果
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-railway-primary text-white">
              <Train className="w-3 h-3 mr-1" />
              {train.train_number as string}
            </Badge>
            <span className="text-gray-500">{train.train_type as string}</span>
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" /> {train.duration as string}
            </span>
          </div>
          <CardTitle className="text-lg">
            {train.departure_time as string} 发车 → {train.arrival_time as string} 到达
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-railway-primary" />
            经停站信息
          </h3>
          <div className="relative">
            {stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stops.length - 1;
              return (
                <div key={stop.id as number} className="flex items-start gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${isFirst || isLast ? "bg-railway-primary" : "bg-gray-300"} ring-4 ring-white`} />
                    {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between pb-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{stop.station_name as string}</div>
                      <div className="text-xs text-gray-400">{stop.city as string}</div>
                    </div>
                    <div className="text-right text-sm">
                      {(stop.arrival_time as string) && <div>到 {stop.arrival_time as string}</div>}
                      {(stop.departure_time as string) && <div className="text-railway-primary font-medium">发 {stop.departure_time as string}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">座位及票价信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {uniqueSeatsByType.map((seat, idx) => (
              <div key={idx} className="text-center p-3 rounded-md border">
                <div className="text-sm text-gray-500">{seat.seat_type_name as string}</div>
                <div className="font-bold text-railway-orange text-lg">{formatPrice(seat.price as number)}</div>
                <div className="text-xs text-gray-400">余{seat.available_seats as number}张</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
