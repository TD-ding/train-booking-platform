import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Star } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import type { Contact } from "@/types";

export default function Profile() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", id_card: "", phone: "", is_default: false });
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const res = await api.get("/contacts");
      setContacts(res.data);
    } catch {
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openNew = () => {
    setEditingContact(null);
    setForm({ name: "", id_card: "", phone: "", is_default: false });
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({ name: c.name, id_card: c.id_card, phone: c.phone, is_default: !!c.is_default });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.id_card) return;
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, form);
      } else {
        await api.post("/contacts", form);
      }
      setDialogOpen(false);
      loadContacts();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "保存失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此联系人？")) return;
    await api.delete(`/contacts/${id}`);
    loadContacts();
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">个人中心</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">账号信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">用户名：</span>{user.username}</div>
            <div><span className="text-gray-500">姓名：</span>{user.real_name || "-"}</div>
            <div><span className="text-gray-500">手机：</span>{user.phone || "-"}</div>
            <div><span className="text-gray-500">邮箱：</span>{user.email || "-"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">常用联系人</CardTitle>
            <Button size="sm" onClick={openNew}><UserPlus className="w-4 h-4 mr-1" />添加联系人</Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无常用联系人</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {c.is_default ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <Star className="w-4 h-4 text-gray-300" />}
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.id_card} {c.phone && `| ${c.phone}`}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "编辑联系人" : "添加联系人"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>姓名 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>身份证号 *</Label>
              <Input value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} />
            </div>
            <div>
              <Label>手机号</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              设为默认联系人
            </label>
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
