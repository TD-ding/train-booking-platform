import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Train, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Header() {
  const { user, logout, initialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="block px-3 py-2 rounded-md text-sm hover:bg-railway-700 transition-colors"
      onClick={() => setMobileMenuOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-railway-primary text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-base md:text-lg hover:opacity-90 shrink-0">
            <Train className="w-5 h-5 md:w-6 md:h-6" />
            <span className="hidden xs:inline">火车票订购平台</span>
            <span className="xs:hidden">购票平台</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {isAdmin ? (
              <>
                {navLink("/admin", "仪表盘")}
                {navLink("/admin/trains", "车次管理")}
                {navLink("/admin/stations", "车站管理")}
                {navLink("/admin/orders", "订单管理")}
                {navLink("/admin/users", "用户管理")}
              </>
            ) : (
              <>
                {navLink("/", "首页")}
                {navLink("/search", "查询车次")}
                {navLink("/orders", "我的订单")}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {!initialized ? (
              <div className="w-20 h-8" /> /* placeholder to prevent layout shift */
            ) : user ? (
              <>
                {user.role === "admin" && (
                  <Button variant="ghost" size="sm" className="text-white hover:bg-railway-700 hidden sm:inline-flex" asChild>
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
                <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-railway-700 hidden sm:inline-flex" asChild>
                  <Link to="/register">注册</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 text-white hover:bg-railway-700 rounded"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/20 bg-railway-primary">
          <nav className="px-4 py-2 space-y-1">
            {isAdmin ? (
              <>
                {navLink("/admin", "仪表盘")}
                {navLink("/admin/trains", "车次管理")}
                {navLink("/admin/stations", "车站管理")}
                {navLink("/admin/orders", "订单管理")}
                {navLink("/admin/users", "用户管理")}
              </>
            ) : (
              <>
                {navLink("/", "首页")}
                {navLink("/search", "查询车次")}
                {navLink("/orders", "我的订单")}
              </>
            )}
            {initialized && user && user.role === "admin" && (
              navLink(isAdmin ? "/" : "/admin", isAdmin ? "切换到用户端" : "切换到管理端")
            )}
            {initialized && !user && (
              <div className="pt-2 border-t border-white/20 flex gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-railway-700 flex-1" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>登录</Link>
                </Button>
                <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-railway-700 flex-1" asChild>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>注册</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
