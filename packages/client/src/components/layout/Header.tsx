import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Train, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-railway-primary text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-90">
            <Train className="w-6 h-6" />
            火车票订购平台
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {isAdmin ? (
              <>
                <Link to="/admin" className="hover:text-railway-200 transition-colors">仪表盘</Link>
                <Link to="/admin/trains" className="hover:text-railway-200 transition-colors">车次管理</Link>
                <Link to="/admin/stations" className="hover:text-railway-200 transition-colors">车站管理</Link>
                <Link to="/admin/orders" className="hover:text-railway-200 transition-colors">订单管理</Link>
                <Link to="/admin/users" className="hover:text-railway-200 transition-colors">用户管理</Link>
              </>
            ) : (
              <>
                <Link to="/" className="hover:text-railway-200 transition-colors">首页</Link>
                <Link to="/search" className="hover:text-railway-200 transition-colors">查询车次</Link>
                <Link to="/orders" className="hover:text-railway-200 transition-colors">我的订单</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Button variant="ghost" size="sm" className="text-white hover:bg-railway-700" asChild>
                    <Link to={isAdmin ? "/" : "/admin"}>
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      {isAdmin ? "用户端" : "管理端"}
                    </Link>
                  </Button>
                )}
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>{user.real_name || user.username}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-railway-700" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-railway-700" asChild>
                  <Link to="/login">登录</Link>
                </Button>
                <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-railway-700" asChild>
                  <Link to="/register">注册</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
