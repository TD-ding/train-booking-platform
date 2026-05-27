# 后端文档

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20+ | 运行时 |
| Express | 4 | Web 框架 |
| TypeScript | 5.6 | 类型安全 |
| better-sqlite3 | 11 | SQLite 数据库（同步 API） |
| bcryptjs | 2.4 | 密码哈希 |
| jsonwebtoken | 9 | JWT 认证 |
| uuid | 10 | 生成唯一事务 ID |

## 目录结构

```
packages/server/src/
├── index.ts                 # 入口：启动 HTTP 服务器
├── app.ts                   # Express 应用工厂（路由注册、静态文件服务）
├── config/
│   └── index.ts             # 配置管理（端口、JWT 密钥、DB 路径、CORS）
├── db/
│   ├── index.ts             # 数据库连接（单例、WAL 模式）
│   ├── migrations/
│   │   └── init.ts          # 建表语句 + 索引
│   └── seed/
│       └── index.ts         # 种子数据（用户、车站、座位类型、车次）
├── middleware/
│   ├── auth.ts              # JWT 鉴权 + 管理员权限中间件
│   └── errorHandler.ts      # 全局错误处理
├── lib/
│   └── validate.ts          # 输入校验（身份证 18 位含校验位、手机号）
├── routes/
│   ├── auth.ts              # 认证路由
│   ├── bookings.ts          # 订票路由
│   ├── contacts.ts          # 联系人路由
│   ├── trains.ts            # 车次/搜索路由
│   ├── stations.ts          # 车站路由
│   └── admin.ts             # 管理员路由
└── types/
    └── index.ts             # TypeScript 类型定义
```

## 配置项

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `JWT_SECRET` | 自动生成存 `.secret` | JWT 签名密钥，**生产环境务必设置** |
| `DB_PATH` | `packages/server/data/trains.db` | SQLite 数据库文件路径 |
| `CORS_ORIGIN` | `http://localhost:5173` | CORS 允许的来源 |

## 数据库 Schema

共 8 张表：

### users — 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| username | TEXT UNIQUE | 用户名（2-20 字符） |
| password | TEXT | bcrypt 哈希密码 |
| real_name | TEXT | 真实姓名 |
| phone | TEXT | 手机号 |
| email | TEXT | 邮箱 |
| role | TEXT | 角色：`user` / `admin` |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### stations — 车站表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| name | TEXT | 车站名称 |
| code | TEXT UNIQUE | 车站编码 |
| city | TEXT | 所属城市 |
| pinyin | TEXT | 拼音（用于搜索） |

### seat_types — 座位类型表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| name | TEXT | 类型名称（硬座/软座/硬卧/软卧/商务座） |
| code | TEXT UNIQUE | 类型编码 |
| description | TEXT | 描述 |

### trains — 车次表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| train_number | TEXT UNIQUE | 车次号（如 G1、D3108） |
| train_type | TEXT | 类型（高铁/动车/普快） |
| departure_station_id | INTEGER FK | 始发站 |
| arrival_station_id | INTEGER FK | 终到站 |
| departure_time | TEXT | 发车时间 |
| arrival_time | TEXT | 到达时间 |
| duration | TEXT | 历时（如 "5小时48分"） |
| status | TEXT | 状态：`active` / `inactive` |

### train_stops — 经停站表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| train_id | INTEGER FK | 所属车次 |
| station_id | INTEGER FK | 车站 |
| stop_order | INTEGER | 顺序号（1=始发） |
| arrival_time | TEXT | 到达时间 |
| departure_time | TEXT | 发车时间 |
| stop_duration | INTEGER | 停靠时长（分钟） |

### train_seats — 座位库存表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| train_id | INTEGER FK | 所属车次 |
| seat_type_id | INTEGER FK | 座位类型 |
| from_stop_order | INTEGER | 适用起始站序 |
| to_stop_order | INTEGER | 适用终止站序 |
| total_seats | INTEGER | 总座位数 |
| available_seats | INTEGER | 可用座位数 |
| price | REAL | 票价 |

按区间存储：一条记录表示某车次某座位类型在 `[from_stop_order, to_stop_order]` 区间的库存。

### contacts — 常用联系人表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| user_id | INTEGER FK | 所属用户 |
| name | TEXT | 姓名 |
| id_card | TEXT | 身份证号（18 位） |
| phone | TEXT | 手机号 |
| is_default | INTEGER | 是否默认联系人（0/1） |

### bookings — 订单表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| user_id | INTEGER FK | 下单用户 |
| train_id | INTEGER FK | 车次 |
| seat_type_id | INTEGER FK | 座位类型 |
| from_station_id | INTEGER FK | 出发站 |
| to_station_id | INTEGER FK | 到达站 |
| passenger_name | TEXT | 乘客姓名 |
| passenger_id_card | TEXT | 乘客身份证号 |
| passenger_phone | TEXT | 乘客手机号 |
| seat_number | TEXT | 分配的座位号（如 "3车42号"） |
| price | REAL | 票价 |
| status | TEXT | 状态：`pending`/`paid`/`cancelled`/`completed`/`refunded` |
| order_number | TEXT UNIQUE | 订单号（如 TB1700000000ABCD） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### payments — 支付记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 ID |
| booking_id | INTEGER FK | 关联订单 |
| amount | REAL | 金额 |
| payment_method | TEXT | 支付方式：`wechat`/`alipay`/`bank_card` |
| payment_status | TEXT | 支付状态：`pending`/`success`/`failed`/`refunded` |
| transaction_id | TEXT | 交易流水号（UUID） |
| paid_at | DATETIME | 支付完成时间 |

## API 接口

所有接口前缀 `/api`，响应格式统一为 JSON。错误响应：`{ "error": "错误描述" }`。

认证接口在 `Authorization: Bearer <token>` 头中传递 JWT。

---

### 认证 `/api/auth`

#### POST /register

注册新用户。

**请求体：**
```json
{
  "username": "zhangsan",
  "password": "123456",
  "real_name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}
```

**成功响应 (201)：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "zhangsan", "real_name": "张三", "phone": "13800138000", "email": "zhangsan@example.com", "role": "user" }
}
```

**错误：** 400（参数校验失败）、409（用户名已存在）

#### POST /login

登录。

**请求体：** `{ "username": "zhangsan", "password": "123456" }`

**成功响应 (200)：** `{ "token": "...", "user": { ... } }`

**错误：** 400（缺少字段）、401（用户名或密码错误）

#### GET /me 🔒

获取当前用户信息。

**成功响应 (200)：** 用户对象（含 role、created_at）

#### PUT /change-password 🔒

修改密码。

**请求体：** `{ "old_password": "旧密码", "new_password": "新密码" }`

**错误：** 400（旧密码错误 / 新密码少于 6 位）

---

### 车次与搜索 `/api/trains`

#### GET /search

搜索车次。不需要认证。

**查询参数：**

| 参数 | 必填 | 说明 |
|------|------|------|
| from_station_id | 是 | 出发站 ID |
| to_station_id | 是 | 到达站 ID |
| date | 否 | 出发日期（YYYY-MM-DD），过去日期会被拒绝 |

**成功响应 (200)：**
```json
[
  {
    "train": { "id": 1, "train_number": "G1", "train_type": "高铁", ... },
    "from_stop": { "from_order": 1, "from_dep_time": "06:30" },
    "to_stop": { "to_order": 4, "to_arr_time": "12:18" },
    "seats": [
      { "seat_type_id": 5, "seat_type_name": "商务座", "available_seats": 20, "price": 1748 },
      { "seat_type_id": 1, "seat_type_name": "硬座", "available_seats": 150, "price": 553 }
    ],
    "from_station": { "id": 1, "name": "北京南", ... },
    "to_station": { "id": 3, "name": "上海虹桥", ... }
  }
]
```

**错误：** 400（缺少参数 / 同站 / 过去日期）

#### GET /:id

车次详情（含经停站、座位库存）。不需要认证。

**成功响应 (200)：** `{ "train": {...}, "stops": [...], "seats": [...] }`

#### GET /

所有车次列表。不需要认证。

---

### 车站 `/api/stations`

#### GET /

全部车站列表。不需要认证。

#### GET /search?q=关键词

按名称/拼音/城市模糊搜索。不需要认证。

---

### 订票 `/api/bookings` 🔒

以下接口均需登录。

#### POST /

创建订单。在 SQLite 事务中完成：校验路线 → 扣减库存 → 分配座位号 → 创建订单和支付记录。

**请求体：**
```json
{
  "train_id": 1,
  "seat_type_id": 5,
  "from_station_id": 1,
  "to_station_id": 3,
  "passenger_name": "张三",
  "passenger_id_card": "110101199001011237",
  "passenger_phone": "13800138000",
  "payment_method": "wechat"
}
```

**成功响应 (201)：** 订单对象（含 order_number、seat_number、price）

**错误：** 400（参数缺失 / 身份证或手机号无效 / 座位已售罄 / 路线无效）

#### POST /:id/pay

模拟支付。将 pending 订单变为 paid。

**成功响应 (200)：** 更新后的订单对象

**错误：** 404（订单不存在或状态不可支付）

#### POST /:id/cancel

取消订单。pending 和 paid 状态可取消，取消后释放座位库存。

**成功响应 (200)：** 更新后的订单对象（status 为 cancelled）

**错误：** 400（状态不可取消）、404（订单不存在）

#### GET /my?status=pending

当前用户的订单列表，可按状态筛选。

#### GET /:id

当前用户的订单详情（含支付信息）。

---

### 联系人 `/api/contacts` 🔒

#### GET /

当前用户的联系人列表（默认联系人排前面）。

#### POST /

添加联系人。

**请求体：** `{ "name": "张三", "id_card": "110101199001011237", "phone": "13800138000", "is_default": true }`

#### POST /batch

批量导入联系人（最多 50 条）。

**请求体：**
```json
{
  "contacts": [
    { "name": "张三", "id_card": "110101199001011237", "phone": "13800138000" },
    { "name": "李四", "id_card": "110101199002022341" }
  ]
}
```

**响应 (201)：**
```json
{ "imported": 2, "errors": [], "total": 2 }
```

部分失败时 errors 数组包含每行的错误原因：
```json
{ "imported": 1, "errors": [{ "row": 2, "error": "身份证号格式不正确" }], "total": 2 }
```

#### PUT /:id

更新联系人。

#### DELETE /:id

删除联系人。

---

### 管理员 `/api/admin` 🔒👑

以下所有接口需要 admin 角色。权限不足返回 403。

#### GET /dashboard

仪表盘数据。

**响应字段：**

| 字段 | 说明 |
|------|------|
| totalOrders | 总订单数 |
| totalRevenue | 总收入（paid + completed） |
| totalUsers | 普通用户数 |
| pendingOrders | 待处理订单数 |
| todayOrders | 今日订单数 |
| popularRoutes | 热门线路 Top5 |
| recentOrders | 最近 10 条订单 |
| salesTrend | 7 天销售趋势（日期 + 订单数 + 收入） |
| routeDistribution | 线路分布 Top10 |

#### GET /users

全部用户列表（不含密码）。

#### PUT /users/:id/role

修改用户角色。**请求体：** `{ "role": "admin" }` 或 `{ "role": "user" }`

#### GET /trains

全部车次列表（含始发站/终到站名称）。

#### POST /trains

创建车次。**必填：** train_number, train_type。可选：departure_station_id, arrival_station_id, departure_time, arrival_time, duration。

#### PUT /trains/:id

更新车次信息。

#### DELETE /trains/:id

删除车次。如有未完成订单会拒绝（400）。

#### POST /trains/:id/stops

添加经停站。自动将后续站点的 stop_order 后移。

**请求体：** `{ "station_id": 1, "stop_order": 2, "arrival_time": "08:12", "departure_time": "08:15", "stop_duration": 2 }`

#### PUT /trains/:trainId/stops/:stopId

更新经停站。

#### DELETE /trains/:trainId/stops/:stopId

删除经停站。

#### GET /stations

全部车站列表。

#### POST /stations

创建车站。**必填：** name, code, city。

#### PUT /stations/:id

更新车站。

#### DELETE /stations/:id

删除车站。

#### GET /orders?status=paid

全部订单列表，可按状态筛选。

#### POST /orders/:id/refund

管理员退票。只能退已支付（paid）的订单，退票后释放座位库存。

---

## 认证机制

1. 用户登录 → 服务端签发 JWT（有效期 7 天，载荷为 `{ userId, role }`）
2. 客户端在 `Authorization: Bearer <token>` 头中携带 token
3. `authMiddleware` 验证 token，将解码后的 `{ userId, role }` 挂载到 `req.user`
4. `adminMiddleware` 检查 `req.user.role === 'admin'`
5. JWT 密钥：优先读 `JWT_SECRET` 环境变量，否则自动生成并保存到 `.secret` 文件

## 订票并发控制

订票操作在 `db.transaction()` 中执行：

```
BEGIN TRANSACTION
  ├─ 查询出发站/到达站的 stop_order
  ├─ 查询并校验座位库存（available_seats > 0）
  ├─ 扣减库存（available_seats - 1）
  ├─ 生成唯一座位号（查询已有座位号，顺序分配）
  ├─ 创建订单记录
  └─ 创建支付记录
COMMIT
```

SQLite 的 WAL 模式 + `db.transaction()` 保证原子性，防止超卖。

## 错误处理

全局错误处理中间件捕获未处理异常，统一返回：

```json
{ "error": "服务器内部错误，请稍后重试" }
```

路由内的业务错误直接返回对应状态码和中文错误描述。

## 开发命令

```bash
npm run dev:server    # 启动开发服务器（tsx watch 热重载，端口 3001）
npm run build:server  # TypeScript 编译（输出到 packages/server/dist）
npm run start         # 运行编译后的生产代码
npm test              # 运行单元测试（79 个测试用例）
npm run lint          # ESLint 检查
```
