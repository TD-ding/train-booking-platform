export interface User {
  id: number;
  username: string;
  real_name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Station {
  id: number;
  name: string;
  code: string;
  city: string;
  pinyin: string;
}

export interface Train {
  id: number;
  train_number: string;
  train_type: string;
  departure_station_id: number;
  arrival_station_id: number;
  departure_time: string;
  arrival_time: string;
  duration: string;
  status: string;
  created_at: string;
}

export interface TrainStop {
  id: number;
  train_id: number;
  station_id: number;
  stop_order: number;
  arrival_time: string;
  departure_time: string;
  stop_duration: number;
  station_name?: string;
  city?: string;
}

export interface SeatType {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface TrainSeat {
  id: number;
  train_id: number;
  seat_type_id: number;
  from_stop_order: number;
  to_stop_order: number;
  total_seats: number;
  available_seats: number;
  price: number;
  seat_type_name?: string;
  seat_type_code?: string;
}

export interface TrainSearchResult {
  train: Train;
  from_stop: { train_id: number; from_order: number; from_dep_time: string };
  to_stop: { to_order: number; to_arr_time: string };
  seats: TrainSeat[];
  from_station: Station;
  to_station: Station;
}

export interface Booking {
  id: number;
  user_id: number;
  train_id: number;
  seat_type_id: number;
  from_station_id: number;
  to_station_id: number;
  passenger_name: string;
  passenger_id_card: string;
  passenger_phone: string;
  seat_number: string;
  price: number;
  status: "pending" | "paid" | "cancelled" | "completed" | "refunded";
  order_number: string;
  created_at: string;
  updated_at: string;
  train_number?: string;
  train_type?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  seat_type_name?: string;
  from_station_name?: string;
  to_station_name?: string;
  payment_method?: string;
  payment_status?: string;
  paid_at?: string;
  username?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  id_card: string;
  phone: string;
  is_default: number;
}

export interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  pendingOrders: number;
  todayOrders: number;
  popularRoutes: { from_station: string; to_station: string; count: number }[];
  recentOrders: Booking[];
  salesTrend: { date: string; count: number; revenue: number }[];
  routeDistribution: { from_station: string; to_station: string; count: number }[];
}
