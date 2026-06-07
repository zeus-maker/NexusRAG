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

启动 RAGFlow 后端后，登录页将调用 `/api/v1/auth/login`（RSA 加密密码）。API 模式已对接：

- 知识库：列表 / 创建 / 更新 / 删除
- 文档：列表 / 上传 / URL 导入 / 删除 / 解析 / 停止 / 预览 / 下载
- 分块：`GET .../documents/:id/chunks`
- 检索测试：`POST .../datasets/:id/search`
- 摄取日志：`GET .../datasets/:id/ingestions`
- 索引进度：`GET .../datasets/:id/index?type=graph|raptor`

仍为 mock 的能力：治理陈旧队列、Wiki/PageIndex/Graph Hub、权限 ACL、数据源、导出任务（无 RAGFlow 对应 API）。

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
