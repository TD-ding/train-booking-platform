# 前端文档

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6 | 构建工具 / 开发服务器 |
| TailwindCSS | 3.4 | 原子化 CSS |
| shadcn/ui (Radix) | - | UI 组件库 |
| React Router | 6 | 客户端路由 |
| Zustand | 5 | 状态管理 |
| Axios | 1.7 | HTTP 客户端 |
| Lucide React | - | 图标库 |

## 目录结构

```
packages/client/src/
├── App.tsx                  # 路由定义与权限守卫
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       # 全局布局（Header + Outlet + Toast）
│   │   └── Header.tsx       # 顶部导航栏（含移动端汉堡菜单）
│   └── ui/                  # shadcn/ui 基础组件
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       └── table.tsx
├── lib/
│   ├── toast.tsx            # Toast 通知系统（Zustand）
│   └── utils.ts             # 工具函数（formatPrice, validateIdCard 等）
├── services/
│   └── api.ts               # Axios 实例（JWT 自动注入、401 自动跳转登录）
├── store/
│   └── authStore.ts         # 认证状态管理（token/user/initialized）
├── pages/
│   ├── Home.tsx             # 首页（车站搜索 + 出发日期）
│   ├── SearchResults.tsx    # 搜索结果列表（排序、余票色标）
│   ├── TrainDetail.tsx      # 车次详情（时刻表时间线 + 座位）
│   ├── Booking.tsx          # 购票流程（四步向导）
│   ├── Login.tsx            # 登录页
│   ├── Register.tsx         # 注册页
│   ├── Orders.tsx           # 我的订单（状态筛选）
│   ├── Profile.tsx          # 个人中心（改密码 + 联系人管理/批量导入）
│   └── admin/
│       ├── Dashboard.tsx    # 管理仪表盘（KPI 卡片 + 图表）
│       ├── TrainManagement.tsx    # 车次管理（CRUD + 时刻表编辑）
│       ├── StationManagement.tsx  # 车站管理（CRUD）
│       ├── OrderManagement.tsx    # 订单管理（筛选 + 退票）
│       └── UserManagement.tsx     # 用户管理（角色切换）
├── types/
│   └── index.ts             # TypeScript 类型定义
└── vite-env.d.ts
```

## 页面说明

### 公开页面（无需登录）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页。出发/到达站搜索自动补全，日期选择器。 |
| `/search` | SearchResults | 搜索结果列表。支持按时间/价格/历时排序，余票量色标（绿/橙/红/灰）。 |
| `/train/:id` | TrainDetail | 车次详情。竖向时间线展示经停站，各座位类型余票与价格。 |
| `/login` | Login | 登录表单，登录成功后跳转首页。 |
| `/register` | Register | 注册表单（用户名、密码、真实姓名、手机、邮箱）。 |

### 用户页面（需登录）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/booking` | Booking | 购票四步流程：① 填写乘客 → ② 确认订单 → ③ 模拟支付 → ④ 完成。支持从常用联系人快速填入。 |
| `/orders` | Orders | 订单列表。按状态筛选（全部/待支付/已支付/已取消/已退票），每张卡片显示车次、座位、金额、操作按钮。 |
| `/profile` | Profile | 个人中心。查看账号信息、修改密码、常用联系人 CRUD、批量导入（文本粘贴，CSV 格式，每行：姓名,身份证号,手机号）。 |

### 管理员页面（需 admin 角色）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin` | Dashboard | 仪表盘。KPI 卡片（订单数/收入/用户数/待处理/今日订单）、7 天销售趋势柱状图、线路分布环形图、热门线路 Top5、最近订单。 |
| `/admin/trains` | TrainManagement | 车次 CRUD + 时刻表编辑（弹出对话框添加/编辑/删除经停站）。 |
| `/admin/stations` | StationManagement | 车站 CRUD。 |
| `/admin/orders` | OrderManagement | 全部订单列表，状态筛选，管理员退票。 |
| `/admin/users` | UserManagement | 用户列表，切换 user/admin 角色。 |

## 状态管理

### authStore（Zustand）

```typescript
interface AuthState {
  token: string | null;     // JWT token
  user: User | null;        // 当前用户信息
  initialized: boolean;     // 应用初始化完成标记（防止 Header 闪烁）
  checkAuth: () => Promise<void>;  // 检查本地 token 有效性
  login: (token: string, user: User) => void;
  logout: () => void;
}
```

Token 存储在 `localStorage`，页面刷新时 `checkAuth()` 自动恢复会话。

### Toast 通知系统

```typescript
const toast = useToast();
toast.success("操作成功");
toast.error("出错了");
toast.info("提示信息");
```

- 最多同时显示 3 条
- 3 秒后自动消失（带 300ms 退出动画）
- 支持手动关闭

## HTTP 客户端

`services/api.ts` 导出一个 Axios 实例，baseURL 为 `/api`：

- **请求拦截器**：自动从 `localStorage` 读取 token，添加 `Authorization: Bearer <token>` 头
- **响应拦截器**：401 时清除本地 token 并跳转登录页
- **开发代理**：Vite dev server 将 `/api` 代理到 `http://localhost:3001`

## 权限控制

- `ProtectedRoute`：包裹需要登录的路由，未登录跳转 `/login`
- `AdminRoute`：包裹管理员路由，非 admin 角色跳转首页
- 应用初始化时显示空 `<div>` 防止布局偏移

## 开发命令

```bash
npm run dev:client    # 启动开发服务器（端口 5173）
npm run build:client  # 生产构建（输出到 packages/client/dist）
npm run lint          # ESLint 检查
```
