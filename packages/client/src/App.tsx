import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import TrainDetail from "@/pages/TrainDetail";
import BookingPage from "@/pages/Booking";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/admin/Dashboard";
import TrainManagement from "@/pages/admin/TrainManagement";
import StationManagement from "@/pages/admin/StationManagement";
import OrderManagement from "@/pages/admin/OrderManagement";
import UserManagement from "@/pages/admin/UserManagement";
import { useAuthStore } from "@/store/authStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-screen" />;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-screen" />;
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/train/:id" element={<TrainDetail />} />
          <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/trains" element={<AdminRoute><TrainManagement /></AdminRoute>} />
          <Route path="/admin/stations" element={<AdminRoute><StationManagement /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><OrderManagement /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
