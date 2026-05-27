import { getDb } from "../index.js";

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      city TEXT NOT NULL,
      pinyin TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS seat_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS trains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_number TEXT UNIQUE NOT NULL,
      train_type TEXT NOT NULL,
      departure_station_id INTEGER REFERENCES stations(id),
      arrival_station_id INTEGER REFERENCES stations(id),
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS train_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_id INTEGER NOT NULL REFERENCES trains(id),
      station_id INTEGER NOT NULL REFERENCES stations(id),
      stop_order INTEGER NOT NULL,
      arrival_time TEXT,
      departure_time TEXT,
      stop_duration INTEGER DEFAULT 2
    );

    CREATE TABLE IF NOT EXISTS train_seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_id INTEGER NOT NULL REFERENCES trains(id),
      seat_type_id INTEGER NOT NULL REFERENCES seat_types(id),
      from_stop_order INTEGER NOT NULL,
      to_stop_order INTEGER NOT NULL,
      total_seats INTEGER NOT NULL,
      available_seats INTEGER NOT NULL,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      phone TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      train_id INTEGER NOT NULL REFERENCES trains(id),
      seat_type_id INTEGER NOT NULL REFERENCES seat_types(id),
      from_station_id INTEGER NOT NULL REFERENCES stations(id),
      to_station_id INTEGER NOT NULL REFERENCES stations(id),
      passenger_name TEXT NOT NULL,
      passenger_id_card TEXT NOT NULL,
      passenger_phone TEXT DEFAULT '',
      seat_number TEXT DEFAULT '',
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'completed', 'refunded')),
      order_number TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'wechat' CHECK(payment_method IN ('wechat', 'alipay', 'bank_card')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'success', 'failed', 'refunded')),
      transaction_id TEXT DEFAULT '',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(train_number);
    CREATE INDEX IF NOT EXISTS idx_train_stops_train ON train_stops(train_id);
    CREATE INDEX IF NOT EXISTS idx_train_stops_station ON train_stops(station_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_order ON bookings(order_number);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
  `);
}
