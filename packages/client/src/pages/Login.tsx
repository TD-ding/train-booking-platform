import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "登录失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">用户登录</CardTitle>
          <CardDescription>登录您的账号以使用购票服务</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}
            <div>
              <Label>用户名</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required />
            </div>
            <div>
              <Label>密码</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required />
            </div>
            <Button type="submit" className="w-full bg-railway-primary hover:bg-railway-dark" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              还没有账号？<Link to="/register" className="text-railway-primary hover:underline">立即注册</Link>
            </div>
            <div className="border-t pt-3 text-xs text-gray-400">
              测试账号：admin / admin123（管理员）或 zhangsan / 123456（普通用户）
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
