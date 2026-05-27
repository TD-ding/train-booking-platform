export interface User {
  id: number;
  username: string;
  password: string;
  real_name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
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
  status: "active" | "inactive";
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
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  payment_status: "pending" | "success" | "failed" | "refunded";
  transaction_id: string;
  paid_at: string;
  created_at: string;
}

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  id_card: string;
  phone: string;
  is_default: number;
}

export interface TrainSearchResult {
  train: Train;
  from_stop: TrainStop;
  to_stop: TrainStop;
  seats: (TrainSeat & { seat_type_name: string; seat_type_code: string })[];
  from_station: Station;
  to_station: Station;
}
