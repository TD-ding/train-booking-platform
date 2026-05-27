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

function seatAvailColor(available: number, total: number): string {
  if (available <= 0) return "border-gray-200 bg-gray-50";
  const r = available / total;
  if (r < 0.1) return "border-red-200 bg-red-50";
  if (r < 0.3) return "border-orange-200 bg-orange-50";
  return "border-green-200 bg-green-50";
}

function seatAvailText(available: number): { text: string; cls: string } {
  if (available <= 0) return { text: "已售罄", cls: "text-gray-400" };
  if (available < 10) return { text: `余${available}张`, cls: "text-red-500" };
  if (available < 50) return { text: `余${available}张`, cls: "text-orange-500" };
  return { text: `余${available}张`, cls: "text-green-600" };
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
      if (!map.has(name)) map.set(name, s);
    }
    return Array.from(map.values());
  })();

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <Button variant="ghost" asChild className="mb-3">
        <Link to={fromId && toId ? `/search?from=${fromId}&to=${toId}` : "/search"}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回搜索结果
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Badge className="bg-railway-primary text-white text-sm px-3 py-1">
              <Train className="w-3.5 h-3.5 mr-1" />
              {train.train_number as string}
            </Badge>
            <span className="text-gray-500 text-sm">{train.train_type as string}</span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {train.duration as string}
            </span>
          </div>
          <CardTitle className="text-base md:text-lg">
            {train.departure_time as string} 发车 → {train.arrival_time as string} 到达
          </CardTitle>
        </CardHeader>

        <CardContent>
          <h3 className="font-semibold mb-5 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-railway-primary" />
            经停站信息
          </h3>

          <div className="relative ml-2 md:ml-4">
            {/* Vertical rail line */}
            <div className="absolute left-[11px] md:left-[15px] top-3 bottom-3 w-[3px] bg-gradient-to-b from-railway-primary via-gray-300 to-railway-primary rounded-full" />

            {stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stops.length - 1;
              const hasArr = !!(stop.arrival_time as string);
              const hasDep = !!(stop.departure_time as string);

              return (
                <div key={stop.id as number} className="relative flex items-start gap-3 md:gap-5 pb-0 last:pb-0">
                  {/* Stop node */}
                  <div className="flex flex-col items-center relative z-10 pt-1">
                    <div className={`
                      ${isFirst || isLast ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5 md:w-6 md:h-6"}
                      rounded-full flex items-center justify-center shadow-sm
                      ${isFirst || isLast
                        ? "bg-railway-primary text-white"
                        : "bg-white border-[3px] border-railway-primary/60"
                      }
                    `}>
                      {(isFirst || isLast) && (
                        <span className="text-[10px] md:text-xs font-bold">
                          {isFirst ? "起" : "终"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stop info */}
                  <div className={`
                    flex-1 flex items-center justify-between py-3
                    ${!isLast ? "border-b border-dashed border-gray-200" : ""}
                  `}>
                    <div>
                      <div className={`font-semibold text-sm md:text-base ${isFirst || isLast ? "text-railway-primary" : ""}`}>
                        {stop.station_name as string}
                      </div>
                      <div className="text-[11px] md:text-xs text-gray-400">{stop.city as string}</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5">
                      {hasArr && (
                        <div className="text-xs md:text-sm text-gray-500">
                          到达 <span className="font-medium">{stop.arrival_time as string}</span>
                        </div>
                      )}
                      {hasDep && (
                        <div className="text-xs md:text-sm text-railway-primary font-medium">
                          发车 {stop.departure_time as string}
                        </div>
                      )}
                      {!hasArr && !hasDep && isFirst && (
                        <div className="text-xs text-railway-primary font-medium">始发站</div>
                      )}
                      {!hasArr && !hasDep && isLast && (
                        <div className="text-xs text-railway-primary font-medium">终到站</div>
                      )}
                      {!hasArr && !hasDep && !isFirst && !isLast && (
                        <div className="text-xs text-gray-400">途经</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm md:text-base">座位及票价信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {uniqueSeatsByType.map((seat, idx) => {
              const avail = seatAvailText(seat.available_seats as number);
              return (
                <div key={idx} className={`text-center p-3 rounded-lg border-2 ${seatAvailColor(seat.available_seats as number, seat.total_seats as number)}`}>
                  <div className="text-xs font-medium text-gray-600 mb-1">{seat.seat_type_name as string}</div>
                  <div className="font-bold text-railway-primary text-base md:text-lg">{formatPrice(seat.price as number)}</div>
                  <div className={`text-xs font-medium ${avail.cls}`}>{avail.text}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
