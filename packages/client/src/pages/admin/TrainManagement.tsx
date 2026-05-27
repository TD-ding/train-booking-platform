import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import api from "@/services/api";
import type { Station } from "@/types";
import { useToast } from "@/lib/toast";

interface Stop {
  id: number;
  station_id: number;
  station_name?: string;
  stop_order: number;
  arrival_time: string;
  departure_time: string;
  stop_duration: number;
}

export default function TrainManagement() {
  const [trains, setTrains] = useState<Record<string, unknown>[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stopsDialogOpen, setStopsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<Record<string, unknown> | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopForm, setStopForm] = useState({ station_id: "", stop_order: 1, arrival_time: "", departure_time: "", stop_duration: 2 });
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [form, setForm] = useState({ train_number: "", train_type: "高铁", departure_station_id: "", arrival_station_id: "", departure_time: "", arrival_time: "", duration: "", status: "active" });
  const toast = useToast();

  const loadTrains = useCallback(async () => {
    const res = await api.get("/admin/trains");
    setTrains(res.data);
  }, []);

  useEffect(() => {
    loadTrains();
    api.get("/stations").then((res) => setStations(res.data));
  }, [loadTrains]);

  const openNew = () => {
    setEditing(null);
    setForm({ train_number: "", train_type: "高铁", departure_station_id: "", arrival_station_id: "", departure_time: "", arrival_time: "", duration: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (t: Record<string, unknown>) => {
    setEditing(t);
    setForm({
      train_number: t.train_number as string, train_type: t.train_type as string,
      departure_station_id: String(t.departure_station_id ?? ""),
      arrival_station_id: String(t.arrival_station_id ?? ""),
      departure_time: t.departure_time as string, arrival_time: t.arrival_time as string,
      duration: t.duration as string, status: t.status as string,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, departure_station_id: Number(form.departure_station_id) || null, arrival_station_id: Number(form.arrival_station_id) || null };
    try {
      if (editing) {
        await api.put(`/admin/trains/${editing.id}`, payload);
      } else {
        await api.post("/admin/trains", payload);
      }
      setDialogOpen(false);
      loadTrains();
      toast.success(editing ? "车次已更新" : "车次已添加");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此车次？相关时刻表和座位数据也会被删除。")) return;
    try {
      await api.delete(`/admin/trains/${id}`);
      loadTrains();
      toast.success("车次已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const openStopsDialog = async (t: Record<string, unknown>) => {
    setSelectedTrain(t);
    const res = await api.get(`/trains/${t.id}`);
    setStops(res.data.stops);
    setEditingStop(null);
    setStopForm({ station_id: "", stop_order: stops.length + 1, arrival_time: "", departure_time: "", stop_duration: 2 });
    setStopsDialogOpen(true);
  };

  const handleSaveStop = async () => {
    if (!selectedTrain) return;
    try {
      if (editingStop) {
        await api.put(`/admin/trains/${selectedTrain.id}/stops/${editingStop.id}`, {
          station_id: Number(stopForm.station_id),
          stop_order: stopForm.stop_order,
          arrival_time: stopForm.arrival_time,
          departure_time: stopForm.departure_time,
          stop_duration: stopForm.stop_duration,
        });
        toast.success("经停站已更新");
      } else {
        await api.post(`/admin/trains/${selectedTrain.id}/stops`, {
          station_id: Number(stopForm.station_id),
          stop_order: stopForm.stop_order,
          arrival_time: stopForm.arrival_time,
          departure_time: stopForm.departure_time,
          stop_duration: stopForm.stop_duration,
        });
        toast.success("经停站已添加");
      }
      const res = await api.get(`/trains/${selectedTrain.id}`);
      setStops(res.data.stops);
      setEditingStop(null);
      setStopForm({ station_id: "", stop_order: stops.length + 1, arrival_time: "", departure_time: "", stop_duration: 2 });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "操作失败");
    }
  };

  const handleDeleteStop = async (stopId: number) => {
    if (!selectedTrain) return;
    if (!confirm("确定删除此经停站？")) return;
    try {
      await api.delete(`/admin/trains/${selectedTrain.id}/stops/${stopId}`);
      const res = await api.get(`/trains/${selectedTrain.id}`);
      setStops(res.data.stops);
      toast.success("经停站已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const startEditStop = (stop: Stop) => {
    setEditingStop(stop);
    setStopForm({
      station_id: String(stop.station_id),
      stop_order: stop.stop_order,
      arrival_time: stop.arrival_time,
      departure_time: stop.departure_time,
      stop_duration: stop.stop_duration,
    });
  };

  const cancelEditStop = () => {
    setEditingStop(null);
    setStopForm({ station_id: "", stop_order: stops.length + 1, arrival_time: "", departure_time: "", stop_duration: 2 });
  };

  const stationName = (id: unknown) => stations.find((s) => s.id === Number(id))?.name || "-";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-bold">车次管理</h1>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />添加车次</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>车次号</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>出发站</TableHead>
                  <TableHead>到达站</TableHead>
                  <TableHead>发车</TableHead>
                  <TableHead>到达</TableHead>
                  <TableHead>历时</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trains.map((t) => (
                  <TableRow key={t.id as number}>
                    <TableCell className="font-medium">{t.train_number as string}</TableCell>
                    <TableCell>{t.train_type as string}</TableCell>
                    <TableCell>{stationName(t.departure_station_id)}</TableCell>
                    <TableCell>{stationName(t.arrival_station_id)}</TableCell>
                    <TableCell>{t.departure_time as string}</TableCell>
                    <TableCell>{t.arrival_time as string}</TableCell>
                    <TableCell>{t.duration as string}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : "secondary"} className="text-xs">
                        {t.status === "active" ? "运行中" : "停运"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="时刻表" onClick={() => openStopsDialog(t)}>
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(t.id as number)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Train edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "编辑车次" : "添加车次"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>车次号</Label><Input value={form.train_number} onChange={(e) => setForm({ ...form, train_number: e.target.value })} /></div>
            <div>
              <Label>类型</Label>
              <select className="w-full h-10 px-3 border rounded-md text-sm" value={form.train_type} onChange={(e) => setForm({ ...form, train_type: e.target.value })}>
                <option value="高铁">高铁</option><option value="动车">动车</option><option value="普快">普快</option>
              </select>
            </div>
            <div>
              <Label>出发站</Label>
              <select className="w-full h-10 px-3 border rounded-md text-sm" value={form.departure_station_id} onChange={(e) => setForm({ ...form, departure_station_id: e.target.value })}>
                <option value="">选择车站</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>到达站</Label>
              <select className="w-full h-10 px-3 border rounded-md text-sm" value={form.arrival_station_id} onChange={(e) => setForm({ ...form, arrival_station_id: e.target.value })}>
                <option value="">选择车站</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><Label>发车时间</Label><Input value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} placeholder="08:00" /></div>
            <div><Label>到达时间</Label><Input value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} placeholder="12:00" /></div>
            <div><Label>历时</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="4小时0分" /></div>
            <div>
              <Label>状态</Label>
              <select className="w-full h-10 px-3 border rounded-md text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">运行中</option><option value="inactive">停运</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleSave} className="bg-railway-primary">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stops management dialog */}
      <Dialog open={stopsDialogOpen} onOpenChange={setStopsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              时刻表管理 - {selectedTrain?.train_number as string}
            </DialogTitle>
          </DialogHeader>

          {/* Add/edit stop form */}
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <h4 className="text-sm font-medium mb-3">{editingStop ? "编辑经停站" : "添加经停站"}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">车站</Label>
                <select
                  className="w-full h-9 px-2 border rounded-md text-sm"
                  value={stopForm.station_id}
                  onChange={(e) => setStopForm({ ...stopForm, station_id: e.target.value })}
                >
                  <option value="">选择</option>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">顺序</Label>
                <Input type="number" min={1} value={stopForm.stop_order}
                  onChange={(e) => setStopForm({ ...stopForm, stop_order: Number(e.target.value) })} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">到达</Label>
                <Input value={stopForm.arrival_time} placeholder="--:--"
                  onChange={(e) => setStopForm({ ...stopForm, arrival_time: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">发车</Label>
                <Input value={stopForm.departure_time} placeholder="--:--"
                  onChange={(e) => setStopForm({ ...stopForm, departure_time: e.target.value })} className="h-9" />
              </div>
              <div className="flex items-end gap-1">
                <Button size="sm" onClick={handleSaveStop} className="bg-railway-primary h-9">
                  {editingStop ? "保存" : "添加"}
                </Button>
                {editingStop && (
                  <Button size="sm" variant="outline" onClick={cancelEditStop} className="h-9">取消</Button>
                )}
              </div>
            </div>
          </div>

          {/* Stops list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stops.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">暂无经停站</p>
            ) : (
              stops
                .sort((a, b) => a.stop_order - b.stop_order)
                .map((stop) => (
                  <div key={stop.id} className="flex items-center gap-3 px-3 py-2 border rounded-md text-sm">
                    <span className="w-6 h-6 rounded-full bg-railway-primary text-white text-xs flex items-center justify-center shrink-0">
                      {stop.stop_order}
                    </span>
                    <span className="font-medium flex-1">{stop.station_name || stationName(stop.station_id)}</span>
                    <span className="text-gray-400 text-xs">
                      {stop.arrival_time ? `到 ${stop.arrival_time}` : ""} {stop.departure_time ? `发 ${stop.departure_time}` : ""}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditStop(stop)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteStop(stop.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
