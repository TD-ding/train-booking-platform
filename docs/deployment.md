# 部署文档

## 环境要求

| 依赖 | 最低版本 |
|------|----------|
| Node.js | 20+ |
| npm | 10+ |
| Docker（可选） | 20+ |
| Docker Compose（可选） | 2.0+ |

---

## 方式一：本地开发部署

### 1. 克隆仓库

```bash
git clone https://github.com/TD-ding/train-booking-platform.git
cd train-booking-platform
```

### 2. 安装依赖

```bash
npm ci --legacy-peer-deps
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，按需修改：

```env
PORT=3001
JWT_SECRET=your-secret-key-here
DB_PATH=./packages/server/data/trains.db
CORS_ORIGIN=http://localhost:5173
```

> 首次启动时数据库会自动创建、执行迁移和导入种子数据。

### 4. 启动开发服务器

```bash
npm run dev
```

- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3001
- 前端 `/api` 请求自动代理到后端

### 5. 生产构建

```bash
npm run build
```

- 服务端编译到 `packages/server/dist/`
- 客户端构建到 `packages/client/dist/`

### 6. 运行生产版本

```bash
npm start
```

启动后端服务器（端口 3001），如果 `packages/client/dist` 目录存在，会自动托管前端静态文件，实现单端口部署。

### 7. 运行测试

```bash
npm test
```

79 个测试用例，覆盖认证、订票、联系人、管理员、搜索、输入校验。每个测试套件使用独立的内存数据库，互不干扰。

### 8. 代码检查

```bash
npm run lint
```

---

## 方式二：Docker 部署

### 1. 使用 Docker Compose（推荐）

```bash
docker compose up -d
```

启动后访问 http://localhost:3001。

### 2. 自定义配置

创建 `.env` 文件或直接修改 `docker-compose.yml` 中的环境变量：

```yaml
services:
  app:
    environment:
      - PORT=3001
      - JWT_SECRET=change-me-in-production    # 必须修改！
      - CORS_ORIGIN=http://your-domain.com
      - DB_PATH=/app/packages/server/data/trains.db
    ports:
      - "80:3001"    # 映射到 80 端口
```

### 3. 数据持久化

数据库文件通过 Docker volume 持久化。数据存储在 `app-data` 命名卷中，容器重建不丢失。

```bash
# 查看数据卷
docker volume ls

# 备份数据库
docker compose exec app sqlite3 /app/packages/server/data/trains.db ".dump" > backup.sql
```

### 4. 单独构建镜像

```bash
docker build -t train-booking-platform .
docker run -d \
  -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -v train-data:/app/packages/server/data \
  train-booking-platform
```

### Dockerfile 说明

三阶段构建：

| 阶段 | 基础镜像 | 说明 |
|------|----------|------|
| deps | node:20-slim | 安装所有依赖 |
| build | deps | 编译 TypeScript + 构建 Vite |
| production | node:20-slim | 仅复制构建产物和运行时依赖，以 non-root 用户运行 |

安全特性：
- 最终镜像使用 `appuser`（UID 1001）运行，不使用 root
- 内置 healthcheck（每 30 秒检查 `/api/health`）
- 仅安装生产依赖

---

## 方式三：手动部署（Linux 服务器）

### 1. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. 构建并运行

```bash
git clone https://github.com/TD-ding/train-booking-platform.git
cd train-booking-platform
npm ci --legacy-peer-deps
npm run build
```

### 3. 使用 systemd 管理进程

创建 `/etc/systemd/system/train-booking.service`：

```ini
[Unit]
Description=Train Booking Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/train-booking-platform
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=your-production-secret
Environment=DB_PATH=/opt/train-booking-platform/data/trains.db
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable train-booking
sudo systemctl start train-booking
```

### 4. Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## CI/CD

### CI — PR 检查

文件：`.github/workflows/ci.yml`

**触发条件：** 对 main 分支的 Pull Request

**执行步骤：**
1. Checkout 代码
2. 设置 Node.js 20
3. `npm ci` 安装依赖
4. `npm run lint` 代码检查
5. `npm run build:server` + `npm run build:client` 构建
6. `npm test` 运行测试

### CD — 持续部署

文件：`.github/workflows/cd.yml`

**触发条件：** Push 到 main 分支

**执行步骤：**
1. 构建 Docker 镜像（多阶段，带 GitHub Actions 缓存）
2. 默认不推送镜像，需自行配置 registry 后启用

---

## 环境变量参考

| 变量 | 默认值 | 必填 | 说明 |
|------|--------|------|------|
| `PORT` | `3001` | 否 | 服务监听端口 |
| `JWT_SECRET` | 自动生成 | 生产环境是 | JWT 签名密钥 |
| `DB_PATH` | `./packages/server/data/trains.db` | 否 | SQLite 数据库文件路径 |
| `CORS_ORIGIN` | `http://localhost:5173` | 否 | 允许的跨域来源 |
| `NODE_ENV` | - | 否 | `production` 时启用优化 |

完整示例见 `.env.example`。

---

## 数据库管理

### 首次启动

自动执行以下操作：
1. 创建数据库文件（如果不存在）
2. 执行迁移（建表 + 索引）
3. 导入种子数据（仅在数据库为空时）

种子数据包含：
- 3 个用户（1 个 admin + 2 个普通用户）
- 25 个车站
- 5 种座位类型
- 10 条车次（含经停站和座位库存）

### 重置数据库

删除数据库文件后重启服务即可重新初始化：

```bash
rm packages/server/data/trains.db
npm start
```

### 直接查询

```bash
sqlite3 packages/server/data/trains.db

# 常用查询
SELECT COUNT(*) FROM bookings;
SELECT * FROM users;
SELECT * FROM bookings WHERE status = 'paid' ORDER BY created_at DESC LIMIT 10;
```

---

## 健康检查

```
GET /api/health
```

响应：
```json
{ "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

Docker 容器每 30 秒自动检查此端点。

---

## 常见问题

### 端口被占用

修改 `.env` 中的 `PORT` 或 docker-compose.yml 的端口映射。

### JWT 密钥变更

修改 `JWT_SECRET` 环境变量后重启服务，所有已登录用户的 token 将失效，需要重新登录。

### 数据库锁定

SQLite 使用 WAL 模式，支持并发读写。如果出现锁定，检查是否有多个进程同时写入同一个数据库文件。

### 前端构建后无法访问 API

确认 `CORS_ORIGIN` 设置正确，Docker 部署时通常设为 `http://localhost:3001` 或实际域名。
