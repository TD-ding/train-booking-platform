import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import api from "@/services/api";
import type { User } from "@/types";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = useCallback(async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleRole = async (id: number, role: string) => {
    const newRole = role === "admin" ? "user" : "admin";
    await api.put(`/admin/users/${id}/role`, { role: newRole });
    loadUsers();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">用户管理</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>手机</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.real_name || "-"}</TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell>{u.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "管理员" : "用户"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleRole(u.id, u.role)}>
                      {u.role === "admin" ? "设为用户" : "设为管理员"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
