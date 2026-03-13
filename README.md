# OpenClaw Relay

OpenAI API 中继服务，支持多模型、智能路由、用量统计、积分计费。

## 特性

- ✅ **61+ 模型支持** - OpenAI、Anthropic、Google、DeepSeek、Qwen 等
- ✅ **智能路由** - 根据任务类型自动选择最优模型，节省成本 30-50%
- ✅ **多上游支持** - 负载均衡、自动故障切换
- ✅ **用量统计** - 详细的用量记录和成本分析
- ✅ **充值系统** - 充值码 + 虚拟货币充值（USDT/ETH/BNB/TRX）
- ✅ **管理后台** - 用户管理、模型管理、路由配置
- ✅ **完整文档** - API 文档、接入指南、部署指南

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/openclaw_relay"
JWT_SECRET="your-jwt-secret"
UPSTREAM_API_URL="https://hone.vvvv.ee/v1"
UPSTREAM_API_KEY="your-api-key"
```

### 3. 初始化数据库

```bash
npx prisma migrate deploy
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3003

## 部署

详细部署指南请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 快速部署

```bash
# 上传代码到服务器
scp -r openclaw-relay root@your-server:/var/www/

# 运行部署脚本
ssh root@your-server
cd /var/www/openclaw-relay
chmod +x deploy.sh
sudo ./deploy.sh
```

## 文档

- [API 文档](./API_DOCUMENTATION.md) - 完整的 API 接口文档
- [接入指南](./INTEGRATION_GUIDE.md) - 第三方接入指南
- [部署指南](./DEPLOYMENT_GUIDE.md) - 服务器部署指南
- [智能路由设计](./SMART_ROUTER_DESIGN.md) - 智能路由系统设计方案
- [测试账号](./TEST_ACCOUNTS.md) - 测试账号信息

## 技术栈

- **前端**: Next.js 16 + React + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma
- **数据库**: PostgreSQL
- **部署**: PM2 + Nginx

## 项目结构

```
openclaw-relay/
├── src/
│   ├── app/              # Next.js 页面和 API 路由
│   ├── components/       # React 组件
│   ├── lib/              # 工具函数和核心逻辑
│   └── hooks/            # React Hooks
├── prisma/               # 数据库 Schema 和迁移
├── nginx/                # Nginx 配置
├── public/               # 静态资源
└── docs/                 # 文档
```

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### API Key
- `GET /api/keys` - 获取 API Keys
- `POST /api/keys` - 创建 API Key
- `DELETE /api/keys` - 删除 API Key

### 中继
- `GET /api/relay/v1/models` - 模型列表
- `POST /api/relay/v1/chat/completions` - 聊天补全（支持流式）

### 管理员
- `GET /api/admin/stats` - 统计数据
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/models` - 模型管理
- `GET /api/admin/router/rules` - 路由规则

完整 API 文档请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 开发

### 运行测试

```bash
pnpm test
```

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

## 常见问题

### 如何添加新模型？

1. 登录管理后台 `/admin`
2. 进入「模型管理」Tab
3. 点击「添加模型」
4. 填写模型信息（名称、厂商、定价）

### 如何配置智能路由？

1. 登录管理后台 `/admin`
2. 进入「路由配置」Tab
3. 切换路由模式为「智能路由」
4. 添加路由规则或使用预设模板

### 如何查看用量统计？

1. 登录用户中心 `/dashboard`
2. 查看「用量统计」区域
3. 可按时间范围筛选

## 许可证

MIT License

## 联系方式

- 技术支持: @shodan1q
- 文档: https://relay.agentopc.xyz/docs
- GitHub: https://github.com/agentopc/openclaw-relay

---

**OpenClaw Relay** - 智能 AI API 中继服务 🚀
