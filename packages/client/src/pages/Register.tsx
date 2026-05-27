import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "", real_name: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    if (form.password.length < 6) {
      setError("密码长度不能少于6位");
      return;
    }
    setLoading(true);
    try {
      await register({ username: form.username, password: form.password, real_name: form.real_name, phone: form.phone, email: form.email });
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "注册失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">用户注册</CardTitle>
          <CardDescription>创建账号以使用购票服务</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}
            <div>
              <Label>用户名 *</Label>
              <Input value={form.username} onChange={(e) => update("username", e.target.value)} required />
            </div>
            <div>
              <Label>真实姓名</Label>
              <Input value={form.real_name} onChange={(e) => update("real_name", e.target.value)} placeholder="请输入真实姓名" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>手机号</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div>
                <Label>邮箱</Label>
                <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>密码 *</Label>
              <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
            </div>
            <div>
              <Label>确认密码 *</Label>
              <Input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-railway-primary hover:bg-railway-dark" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              已有账号？<Link to="/login" className="text-railway-primary hover:underline">立即登录</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
