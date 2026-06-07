# rag3-web — RAG 3.0 生产前端

从 `rag3-bolt-v1.5` 复制，逐步将 `src/data/*Mock.ts` 替换为 `src/services/api.ts` 真实调用。

## 开发

```bash
npm install
cp .env.example .env.local   # 可选
npm run dev                    # http://localhost:5173
```

Vite 将 `/api/*` 代理到 RAGFlow（默认 `http://localhost:9380`）。

### 对接真实 API

```bash
# .env.local
VITE_USE_REAL_API=true
```

启动 RAGFlow 后端后，登录页将调用 `/v1/auth/login`（RSA 加密密码），知识库列表/创建/删除/文档列表/上传走 `/v1/datasets/*`。

也可设置 `VITE_RAGFLOW_AUTH_TOKEN` 跳过登录（开发调试）。

## 构建

```bash
npm run build
```

## 与原型关系

| 原型 `rag3-bolt-v1.5` | 本目录 |
|----------------------|--------|
| mock 数据驱动 | API + mock 双模式 |
| 无路由 URL | 后续迁 React Router |
| 只读参考 | 唯一前端开发入口 |

页面契约见 `docs/prd/前端界面实现方案.md`。
