import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Star, Lock, Upload } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/lib/toast";
import type { Contact } from "@/types";

export default function Profile() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", id_card: "", phone: "", is_default: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [importText, setImportText] = useState("");

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
      toast.success(editingContact ? "联系人已更新" : "联系人已添加");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "保存失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此联系人？")) return;
    try {
      await api.delete(`/contacts/${id}`);
      loadContacts();
      toast.success("联系人已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.old_password || !pwForm.new_password) {
      toast.error("请填写完整密码信息");
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("两次密码输入不一致");
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error("新密码长度不能少于6位");
      return;
    }
    try {
      await api.put("/auth/change-password", {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPasswordDialogOpen(false);
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
      toast.success("密码修改成功");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "修改失败");
    }
  };

  const parseImportText = (): { name: string; id_card: string; phone: string }[] => {
    return importText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,，\t]/).map((s) => s.trim());
        return { name: parts[0] || "", id_card: parts[1] || "", phone: parts[2] || "" };
      })
      .filter((c) => c.name && c.id_card);
  };

  const handleImport = async () => {
    const parsed = parseImportText();
    if (parsed.length === 0) {
      toast.error("未解析到有效数据，请检查格式");
      return;
    }
    try {
      const res = await api.post("/contacts/batch", { contacts: parsed });
      setImportDialogOpen(false);
      setImportText("");
      loadContacts();
      const d = res.data as { imported: number; errors: { row: number; error: string }[]; total: number };
      if (d.errors.length > 0) {
        toast.info(`成功导入 ${d.imported}/${d.total} 个联系人，${d.errors.length} 条有误`);
      } else {
        toast.success(`成功导入 ${d.imported} 个联系人`);
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "导入失败");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <h1 className="text-lg md:text-xl font-bold mb-3 md:mb-4">个人中心</h1>

      <Card className="mb-4 md:mb-6">
        <CardHeader><CardTitle className="text-sm md:text-base">账号信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm mb-4">
            <div><span className="text-gray-500">用户名：</span>{user.username}</div>
            <div><span className="text-gray-500">姓名：</span>{user.real_name || "-"}</div>
            <div><span className="text-gray-500">手机：</span>{user.phone || "-"}</div>
            <div><span className="text-gray-500">邮箱：</span>{user.email || "-"}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
            <Lock className="w-4 h-4 mr-1" /> 修改密码
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">常用联系人</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-1" /> 批量导入
              </Button>
              <Button size="sm" onClick={openNew}>
                <UserPlus className="w-4 h-4 mr-1" /> 添加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无常用联系人</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.is_default ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" /> : <Star className="w-4 h-4 text-gray-300 shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400 truncate">{c.id_card} {c.phone && `| ${c.phone}`}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add contact dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingContact ? "编辑联系人" : "添加联系人"}</DialogTitle></DialogHeader>
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

      {/* Change password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>修改密码</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>旧密码</Label>
              <Input type="password" value={pwForm.old_password} onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} />
            </div>
            <div>
              <Label>新密码</Label>
              <Input type="password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="至少6位" />
            </div>
            <div>
              <Label>确认新密码</Label>
              <Input type="password" value={pwForm.confirm_password} onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleChangePassword} className="bg-railway-primary">确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch import dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>批量导入联系人</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              每行一个联系人，格式：姓名,身份证号,手机号（用逗号或制表符分隔，手机号可选）
            </p>
            <textarea
              className="w-full h-48 px-3 py-2 border rounded-md text-sm font-mono resize-none focus:ring-2 focus:ring-railway-primary focus:border-transparent outline-none"
              placeholder={"张三,110101199001011237,13800138000\n李四,110101199002022345,13900139000"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              已解析 {parseImportText().length} 条有效记录（最多50条）
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleImport} className="bg-railway-primary" disabled={parseImportText().length === 0}>
              导入 ({parseImportText().length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
