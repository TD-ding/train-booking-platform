import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "@/services/api";
import type { Station } from "@/types";


export default function StationManagement() {
  const [stations, setStations] = useState<Station[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState({ name: "", code: "", city: "", pinyin: "" });

  const loadStations = useCallback(async () => {
    const res = await api.get("/admin/stations");
    setStations(res.data);
  }, []);

  useEffect(() => { loadStations(); }, [loadStations]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", code: "", city: "", pinyin: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Station) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code, city: s.city, pinyin: s.pinyin });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/admin/stations/${editing.id}`, form);
    } else {
      await api.post("/admin/stations", form);
    }
    setDialogOpen(false);
    loadStations();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此车站？")) return;
    await api.delete(`/admin/stations/${id}`);
    loadStations();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">车站管理</h1>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />添加车站</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>站名</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>拼音</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.code}</TableCell>
                  <TableCell>{s.city}</TableCell>
                  <TableCell className="text-gray-500">{s.pinyin}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "编辑车站" : "添加车站"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>站名</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>编码</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>城市</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>拼音</Label><Input value={form.pinyin} onChange={(e) => setForm({ ...form, pinyin: e.target.value })} /></div>
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
