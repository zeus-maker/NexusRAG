# RAG 3.0 前端原型 - 快速上手指南

## 🎬 5分钟快速开始

### 1. 环境准备
```bash
# 进入项目目录
cd project

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可看到运行中的应用。

## 📱 核心交互体验

### 主界面结构
```
┌─────────────────────────────────────────┐
│ TopBar (全局搜索 + 用户菜单)           │
├──────────┬──────────────────────────────┤
│ Sidebar  │ MainContent                  │
│ 7大菜单  │ (动态页面内容)               │
│          │                              │
└──────────┴──────────────────────────────┘
```

### 核心页面导览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 工作台 + 最近知识库 |
| 知识库列表 | `/kb-list` | 卡片网格布局 |
| 知识库详情 | `/kb-detail` | Tab容器 (概览/文件/设置) |
| 智能对话 | `/chat` | 消息流 + 输入框 |
| 搜索应用 | `/search-list` | 应用列表 |
| 搜索结果 | `/search` | 结果展示 |
| Agent列表 | `/agent-list` | 表格列表 |
| 评测中心 | `/evaluation` | 仪表板 + Tab |
| 系统管理 | `/system` | 卡片导航 |

## 🎨 设计亮点

### 色彩方案
- **主色**: 蓝色 (blue-600 #2563eb) - 专业、可信
- **中性**: 灰色系 - 文字、背景、边框
- **功能**: 绿色(成功) / 黄色(警告) / 红色(错误)

### 布局特点
- **三栏布局**: Sidebar (可折叠) + Content (自适应) + 可选详情栏
- **卡片风格**: 圆角 + 边框 + 悬停阴影
- **栅格响应**: grid-cols-2/3/4 根据内容自适应

### 交互体验
- 导航菜单高亮当前页面
- Tab切换平滑过渡
- 按钮hover态视觉反馈
- 模态对话框信息收集

## 📋 常见操作

### 创建知识库
1. 点击侧栏「知识库」
2. 点击「创建知识库」按钮
3. 填写表单（名称必填）
4. 点击「创建」

### 查看知识库详情
1. 知识库列表中点击卡片
2. 切换Tab查看不同内容：
   - **概览**: 统计 + Hub快捷入口
   - **文件**: 上传与管理
   - **检索测试**: 多通道测试台
   - **索引状态**: 进度追踪
   - **设置**: 配置项

### 发送对话
1. 点击侧栏「智能对话」
2. 在底部输入框输入问题
3. 点击发送或按Enter
4. 查看AI回复 + 引用来源

### 搜索文档
1. 点击侧栏「搜索应用」
2. 选择搜索应用
3. 输入查询词
4. 查看搜索结果（排序 + 相关度）

## 🏗️ 文件结构速览

```
src/
├── App.tsx                # 路由分发
├── components/Layout/     # 全局布局
├── pages/                 # 页面组件
│   ├── Home/             # 首页
│   ├── KnowledgeBase/    # KB模块
│   ├── Chat/             # 对话模块
│   ├── Search/           # 搜索模块
│   ├── Agent/            # Agent模块
│   ├── Evaluation/       # 评测模块
│   └── System/           # 系统管理
├── index.css             # 全局样式
└── main.tsx              # 入口

dist/                      # 构建输出
```

## 🔧 常用开发命令

```bash
# 开发服务器
npm run dev

# 类型检查
npm run typecheck

# 代码规范检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 💻 开发技巧

### 添加新页面
1. 在 `src/pages/` 创建文件夹
2. 添加 `PageName.tsx` 组件
3. 在 `App.tsx` 中导入并添加路由
4. 在 `Sidebar.tsx` 中添加导航项

### 修改颜色主题
编辑 `src/index.css` 或使用Tailwind class：
```tsx
// 主色改为绿色
<button className="bg-green-600 hover:bg-green-700">
  按钮
</button>
```

### 调整布局宽度
```tsx
// 容器宽度控制
<div className="max-w-7xl mx-auto">内容</div>

// Padding控制
<div className="px-4 md:px-6 lg:px-8">内容</div>
```

## 🎯 关键概念

### 组件通信
```typescript
// 父组件通过props传递回调
<ChildComponent onNavigate={(page) => setCurrentPage(page)} />

// 子组件调用回调
onClick={() => onNavigate('kb-detail', kbId)}
```

### 条件渲染
```typescript
{isActive && <div>活跃内容</div>}
{status === 'loading' && <Spinner />}
{items.map(item => <Item key={item.id} {...item} />)}
```

### 样式应用
```typescript
// 条件类
<div className={`base-styles ${isActive ? 'active-styles' : ''}`}>

// Tailwind响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

## 📊 UI组件参考

### 按钮
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  主按钮
</button>
```

### 卡片
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg">
  卡片内容
</div>
```

### 输入框
```tsx
<input
  type="text"
  placeholder="输入内容..."
  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
/>
```

### 表格
```tsx
<table className="w-full">
  <thead className="bg-gray-50">
    <tr><th className="px-6 py-3">列标题</th></tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-3">单元格</td>
    </tr>
  </tbody>
</table>
```

### 弹窗
```tsx
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6">
      内容
    </div>
  </div>
)}
```

## 🚀 性能建议

### 虚拟滚动 (大列表)
对于 >100 项的列表，使用虚拟滚动组件减少DOM节点

### 代码分割
页面级组件已配置 lazy loading，自动分割

### 缓存策略
使用 React.memo 缓存不变组件

## ❓ 常见问题

### Q: 如何修改侧栏菜单？
A: 编辑 `src/components/Layout/Sidebar.tsx` 中的 `navItems` 数组

### Q: 如何添加新的Tab标签？
A: 在详情页的 `tabs` 数组中添加新项，然后在下方添加对应的Tab内容组件

### Q: 如何连接真实API？
A: 在对应页面中用真实API调用替换模拟数据，例如：
```typescript
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(setData);
}, []);
```

### Q: 怎样添加确认对话框？
A: 使用 window.confirm() 或创建自定义ConfirmModal组件

## 📚 相关资源

- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
- React文档: https://react.dev
- TypeScript: https://www.typescriptlang.org

## 🎓 学习路径

1. **基础**: 理解React组件 + Tailwind CSS
2. **进阶**: TypeScript类型系统 + 组件通信
3. **高级**: 性能优化 + 状态管理 + API集成

## 📞 支持

遇到问题？检查以下文件：
- `README.md` - 项目总览
- `DESIGN_SYSTEM.md` - 设计规范
- 源代码注释 - 具体实现细节

---

**最后更新**: 2026-06-06  
**项目版本**: RAG 3.0 v1.6  
**开发环境**: Node.js 18+ | npm 9+
