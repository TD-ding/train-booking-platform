import { getDb } from "../index.js";
import bcrypt from "bcryptjs";

export function seedData(): void {
  const db = getDb();

  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  if (userCount > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)"
  );

  insertUser.run("admin", bcrypt.hashSync("admin123", 10), "系统管理员", "13800000000", "admin@train.com", "admin");
  insertUser.run("zhangsan", bcrypt.hashSync("123456", 10), "张三", "13912345678", "zhangsan@example.com", "user");
  insertUser.run("lisi", bcrypt.hashSync("123456", 10), "李四", "13887654321", "lisi@example.com", "user");

  const insertStation = db.prepare(
    "INSERT INTO stations (name, code, city, pinyin) VALUES (?, ?, ?, ?)"
  );

  const stations = [
    ["北京南", "BJN", "北京", "beijingnan"],
    ["北京西", "BJX", "北京", "beijingxi"],
    ["上海虹桥", "SHH", "上海", "shanghaihongqiao"],
    ["上海", "SHH2", "上海", "shanghai"],
    ["广州南", "GZN", "广州", "guangzhounan"],
    ["深圳北", "SNB", "深圳", "shenzhenbei"],
    ["成都东", "CDD", "成都", "chengdudong"],
    ["武汉", "WH", "武汉", "wuhan"],
    ["西安北", "XAB", "西安", "xianbei"],
    ["南京南", "NJN", "南京", "nanjingnan"],
    ["杭州东", "HZD", "杭州", "hangzhoudong"],
    ["长沙南", "CSN", "长沙", "changshanan"],
    ["重庆北", "CQB", "重庆", "chongqingbei"],
    ["郑州东", "ZZD", "郑州", "zhengzhoudong"],
    ["天津南", "TJN", "天津", "tianjinnan"],
    ["济南西", "JX", "济南", "jinanxi"],
    ["合肥南", "HFN", "合肥", "hefeinan"],
    ["昆明南", "KMN", "昆明", "kunnanning"],
    ["贵阳北", "GYB", "贵阳", "guiyangbei"],
    ["南昌西", "NCX", "南昌", "nanchangxi"],
    ["徐州东", "XZD", "徐州", "xuzhoudong"],
    ["洛阳龙门", "LYLM", "洛阳", "luoyanglongmen"],
    ["宁波", "NB", "宁波", "ningbo"],
    ["福州南", "FZN", "福州", "fuzhounan"],
    ["厦门北", "XMB", "厦门", "xiaenbei"],
  ];

  const stationIds: Record<string, number> = {};
  for (const [name, code, city, pinyin] of stations) {
    const result = insertStation.run(name, code, city, pinyin);
    stationIds[name] = Number(result.lastInsertRowid);
  }

  const insertSeatType = db.prepare(
    "INSERT INTO seat_types (name, code, description) VALUES (?, ?, ?)"
  );

  const seatTypeIds: Record<string, number> = {};
  const seatTypes = [
    ["硬座", "YZ", "硬座座椅"],
    ["软座", "RZ", "软座座椅"],
    ["硬卧", "YW", "硬卧铺位（上/中/下铺）"],
    ["软卧", "RW", "软卧铺位（上/下铺）"],
    ["商务座", "SW", "商务座豪华座椅"],
  ];
  for (const [name, code, desc] of seatTypes) {
    const result = insertSeatType.run(name, code, desc);
    seatTypeIds[name] = Number(result.lastInsertRowid);
  }

  interface TrainDef {
    number: string;
    type: string;
    from: string;
    to: string;
    depTime: string;
    arrTime: string;
    duration: string;
    stops: { station: string; arr: string; dep: string; order: number }[];
    prices: Record<string, number>;
  }

  const trainDefs: TrainDef[] = [
    {
      number: "G1", type: "高铁", from: "北京南", to: "上海虹桥",
      depTime: "06:30", arrTime: "12:18", duration: "5小时48分",
      stops: [
        { station: "北京南", arr: "", dep: "06:30", order: 1 },
        { station: "济南西", arr: "08:12", dep: "08:15", order: 2 },
        { station: "南京南", arr: "10:08", dep: "10:11", order: 3 },
        { station: "上海虹桥", arr: "12:18", dep: "", order: 4 },
      ],
      prices: { "商务座": 1748, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 553 },
    },
    {
      number: "G2", type: "高铁", from: "上海虹桥", to: "北京南",
      depTime: "07:00", arrTime: "12:52", duration: "5小时52分",
      stops: [
        { station: "上海虹桥", arr: "", dep: "07:00", order: 1 },
        { station: "南京南", arr: "08:20", dep: "08:23", order: 2 },
        { station: "济南西", arr: "10:18", dep: "10:21", order: 3 },
        { station: "北京南", arr: "12:52", dep: "", order: 4 },
      ],
      prices: { "商务座": 1748, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 553 },
    },
    {
      number: "G7541", type: "高铁", from: "上海虹桥", to: "广州南",
      depTime: "08:00", arrTime: "16:32", duration: "8小时32分",
      stops: [
        { station: "上海虹桥", arr: "", dep: "08:00", order: 1 },
        { station: "杭州东", arr: "08:55", dep: "08:58", order: 2 },
        { station: "南昌西", arr: "11:20", dep: "11:25", order: 3 },
        { station: "长沙南", arr: "13:15", dep: "13:20", order: 4 },
        { station: "广州南", arr: "16:32", dep: "", order: 5 },
      ],
      prices: { "商务座": 2648, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 793 },
    },
    {
      number: "G1001", type: "高铁", from: "广州南", to: "深圳北",
      depTime: "07:30", arrTime: "08:16", duration: "46分",
      stops: [
        { station: "广州南", arr: "", dep: "07:30", order: 1 },
        { station: "深圳北", arr: "08:16", dep: "", order: 2 },
      ],
      prices: { "商务座": 199, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 75 },
    },
    {
      number: "G302", type: "高铁", from: "北京南", to: "南京南",
      depTime: "07:45", arrTime: "11:30", duration: "3小时45分",
      stops: [
        { station: "北京南", arr: "", dep: "07:45", order: 1 },
        { station: "济南西", arr: "09:25", dep: "09:28", order: 2 },
        { station: "徐州东", arr: "10:15", dep: "10:18", order: 3 },
        { station: "南京南", arr: "11:30", dep: "", order: 4 },
      ],
      prices: { "商务座": 1248, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 443 },
    },
    {
      number: "G8501", type: "高铁", from: "成都东", to: "重庆北",
      depTime: "09:00", arrTime: "10:55", duration: "1小时55分",
      stops: [
        { station: "成都东", arr: "", dep: "09:00", order: 1 },
        { station: "重庆北", arr: "10:55", dep: "", order: 2 },
      ],
      prices: { "商务座": 468, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 154 },
    },
    {
      number: "G2056", type: "高铁", from: "郑州东", to: "西安北",
      depTime: "08:30", arrTime: "11:08", duration: "2小时38分",
      stops: [
        { station: "郑州东", arr: "", dep: "08:30", order: 1 },
        { station: "洛阳龙门", arr: "09:20", dep: "09:23", order: 2 },
        { station: "西安北", arr: "11:08", dep: "", order: 3 },
      ],
      prices: { "商务座": 978, "软卧": 0, "硬卧": 0, "软座": 0, "硬座": 269 },
    },
    {
      number: "D3108", type: "动车", from: "上海虹桥", to: "深圳北",
      depTime: "06:50", arrTime: "15:30", duration: "8小时40分",
      stops: [
        { station: "上海虹桥", arr: "", dep: "06:50", order: 1 },
        { station: "杭州东", arr: "07:50", dep: "07:53", order: 2 },
        { station: "宁波", arr: "09:05", dep: "09:10", order: 3 },
        { station: "福州南", arr: "11:20", dep: "11:25", order: 4 },
        { station: "厦门北", arr: "13:10", dep: "13:15", order: 5 },
        { station: "深圳北", arr: "15:30", dep: "", order: 6 },
      ],
      prices: { "商务座": 0, "软卧": 856, "硬卧": 564, "软座": 0, "硬座": 354 },
    },
    {
      number: "D2202", type: "动车", from: "成都东", to: "上海虹桥",
      depTime: "07:05", arrTime: "20:30", duration: "13小时25分",
      stops: [
        { station: "成都东", arr: "", dep: "07:05", order: 1 },
        { station: "重庆北", arr: "09:10", dep: "09:15", order: 2 },
        { station: "武汉", arr: "14:20", dep: "14:25", order: 3 },
        { station: "合肥南", arr: "17:00", dep: "17:05", order: 4 },
        { station: "南京南", arr: "18:10", dep: "18:15", order: 5 },
        { station: "上海虹桥", arr: "20:30", dep: "", order: 6 },
      ],
      prices: { "商务座": 0, "软卧": 1056, "硬卧": 684, "软座": 0, "硬座": 453 },
    },
    {
      number: "D940", type: "动车", from: "北京西", to: "广州南",
      depTime: "19:30", arrTime: "06:55", duration: "11小时25分",
      stops: [
        { station: "北京西", arr: "", dep: "19:30", order: 1 },
        { station: "郑州东", arr: "23:10", dep: "23:15", order: 2 },
        { station: "武汉", arr: "02:20", dep: "02:25", order: 3 },
        { station: "长沙南", arr: "04:30", dep: "04:35", order: 4 },
        { station: "广州南", arr: "06:55", dep: "", order: 5 },
      ],
      prices: { "商务座": 0, "软卧": 985, "硬卧": 632, "软座": 0, "硬座": 408 },
    },
  ];

  const insertTrain = db.prepare(
    `INSERT INTO trains (train_number, train_type, departure_station_id, arrival_station_id,
     departure_time, arrival_time, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
  );
  const insertStop = db.prepare(
    `INSERT INTO train_stops (train_id, station_id, stop_order, arrival_time, departure_time, stop_duration)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertSeat = db.prepare(
    `INSERT INTO train_seats (train_id, seat_type_id, from_stop_order, to_stop_order, total_seats, available_seats, price)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const t of trainDefs) {
    const trainId = Number(
      insertTrain.run(
        t.number, t.type,
        stationIds[t.from], stationIds[t.to],
        t.depTime, t.arrTime, t.duration
      ).lastInsertRowid
    );

    for (const s of t.stops) {
      if (!(s.station in stationIds)) {
        console.warn(`Warning: station "${s.station}" referenced by train ${t.number} not found, skipping stop`);
        continue;
      }
      insertStop.run(trainId, stationIds[s.station], s.order, s.arr, s.dep, 2);
    }

    const maxOrder = Math.max(...t.stops.map((s) => s.order));
    for (let from = 1; from <= maxOrder; from++) {
      for (let to = from + 1; to <= maxOrder; to++) {
        for (const [seatName, basePrice] of Object.entries(t.prices)) {
          if (basePrice === 0) continue;
          const seatTypeId = seatTypeIds[seatName];
          const total = seatName === "商务座" ? 20 : seatName.includes("卧") ? 60 : 150;
          const factor = (to - from) / (maxOrder - 1);
          const price = Math.round(basePrice * factor);
          if (price > 0) {
            insertSeat.run(trainId, seatTypeId, from, to, total, total, price);
          }
        }
      }
    }
  }
}
