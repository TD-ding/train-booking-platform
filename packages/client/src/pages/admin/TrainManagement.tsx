import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "@/services/api";
import type { Station } from "@/types";

export default function TrainManagement() {
  const [trains, setTrains] = useState<Record<string, unknown>[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ train_number: "", train_type: "高铁", departure_station_id: "", arrival_station_id: "", departure_time: "", arrival_time: "", duration: "", status: "active" });

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
    if (editing) {
      await api.put(`/admin/trains/${editing.id}`, payload);
    } else {
      await api.post("/admin/trains", payload);
    }
    setDialogOpen(false);
    loadTrains();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此车次？相关时刻表和座位数据也会被删除。")) return;
    await api.delete(`/admin/trains/${id}`);
    loadTrains();
  };

  const stationName = (id: unknown) => stations.find((s) => s.id === Number(id))?.name || "-";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">车次管理</h1>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />添加车次</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>车次号</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>出发站</TableHead>
                <TableHead>到达站</TableHead>
                <TableHead>发车时间</TableHead>
                <TableHead>到达时间</TableHead>
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
                      <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(t.id as number)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
}
