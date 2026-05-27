# 火车票订购平台 (Train Ticket Booking Platform)

一个全栈火车票订购系统，模拟中国铁路 12306 购票平台，包含用户购票界面和管理员管理界面。

## 功能特性

### 用户端
- 首页搜索车次（出发站/到达站/日期，支持站名/城市/拼音匹配下拉提示）
- 热门路线快捷卡片
- 搜索结果展示（车次/时间/价格/座位类型/余票三色标识，支持排序）
- 车次详情（经停站时间线、各座位类型余票和票价）
- 购票流程（选择乘客 → 确认订单 → 模拟支付）
- 用户注册/登录（JWT 认证）
- 我的订单（按状态筛选：待支付/已支付/已取消/已完成/已退票）
- 个人中心（修改密码、常用联系人 CRUD + 批量导入）
- 全局 Toast 通知系统

### 管理员端 (/admin)
- 仪表盘（总订单/收入/用户数/7天售票趋势图/热门路线环形图/最近订单）
- 车次管理（增删改查 + 时刻表编辑）
- 车站管理（增删改查）
- 订单管理（按状态筛选、退票处理）
- 用户管理（角色切换）

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken + bcryptjs)
- **测试**: Jest + Supertest（79个测试用例）
- **容器**: Docker multi-stage build + docker-compose
- **CI/CD**: GitHub Actions（CI: PR触发 + CD: push master触发）
- **工程化**: npm workspaces (monorepo) + ESLint v9 flat config

## 项目结构

```
train-booking-platform/
├── packages/
│   ├── client/          # React 前端
│   │   └── src/
│   │       ├── components/   # UI 组件 + 布局组件
│   │       ├── pages/        # 页面（含 admin/ 子目录）
│   │       ├── services/     # API 服务
│   │       ├── store/        # Zustand 状态管理
│   │       ├── lib/          # 工具函数 + Toast 通知
│   │       └── types/        # TypeScript 类型定义
│   └── server/          # Express 后端
│       └── src/
│           ├── __tests__/    # Jest 测试（79个用例）
│           ├── config/       # 配置
│           ├── db/           # 数据库（迁移 + 种子数据）
│           ├── lib/          # 验证工具
│           ├── middleware/    # 认证 + 错误处理中间件
│           ├── routes/       # API 路由（auth/trains/stations/bookings/contacts/admin）
│           └── types/        # TypeScript 类型定义
├── docs/                # 项目文档
├── .github/workflows/   # CI/CD
├── Dockerfile           # Docker multi-stage build
├── docker-compose.yml   # 容器编排
└── package.json         # 根 monorepo 配置
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发环境（前后端同时启动）
npm run dev

# 仅启动后端
npm run dev:server

# 仅启动前端
npm run dev:client

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 运行测试
npm test

# Docker 启动
docker compose up --build
```

前端运行在 http://localhost:5173，后端运行在 http://localhost:3001。

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| zhangsan | 123456 | 普通用户 |
| lisi | 123456 | 普通用户 |

## 数据库表

- `users` - 用户
- `stations` - 车站（预置 25 个主要城市站点）
- `trains` - 车次（预置 10 条 G/D 车次）
- `train_stops` - 经停站时刻表
- `seat_types` - 座位类型（硬座/软座/硬卧/软卧/商务座）
- `train_seats` - 车次座位库存和票价
- `contacts` - 常用联系人
- `bookings` - 订单
- `payments` - 支付记录

## 座位类型

硬座、软座、硬卧、软卧、商务座

## 开发迭代记录

| 轮次 | 类型 | 描述 | PR |
|------|------|------|----|
| 1 | feat | 初始版本（59个文件，13278行） | 直接推送 |
| 2 | refactor | 代码质量与安全优化（并发控制/验证/数据补全） | #1 |
| 3 | feat | 用户体验优化（搜索提示/移动端/时间线） | #2 |
| 4 | feat | 功能增强（图表/排序/密码/批量导入/Toast） | #3 |
| 5 | fix | Bug修复（去重/日期/删除保护/导入详情） | #4 |
| - | feat | 单元测试 + Docker + CI/CD（79个测试） | #5 |
| - | docs | 项目文档（前端/后端/管理端/部署） | #6 |

## 文档

- [前端文档](docs/frontend.md)
- [后端文档](docs/backend.md)
- [管理端文档](docs/admin.md)
- [部署文档](docs/deployment.md)
- [协作开发日志](collab-log.md)
