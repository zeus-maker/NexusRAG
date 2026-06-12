# RAG 3.0 前端设计系统

## 颜色系统

### 主色 - 蓝色系（信任、专业）
- `blue-600`: #2563eb - 主色按钮、链接、高亮
- `blue-50`: #eff6ff - 背景高亮、选中态

### 中性色 - 灰色系（文字、背景）
- `gray-900`: #111827 - 主文本
- `gray-700`: #374151 - 次文本  
- `gray-600`: #4b5563 - 辅助文本
- `gray-50`: #f9fafb - 页面背景
- `gray-100`: #f3f4f6 - 卡片背景/悬停态

### 功能色
- `green-500`: #10b981 - 成功/完成
- `yellow-500`: #eab308 - 警告/处理中
- `red-500`: #ef4444 - 错误/失败

## 排版系统

### 字体
- 系统字体栈: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'

### 大小与权重
- H1: 28px / 700 - 页面标题
- H2: 24px / 700 - 区块标题
- H3: 18px / 600 - 组件标题
- Body: 14px / 400 - 正文
- Small: 12px / 400 - 辅助信息

## 间距系统（8px基准）

- xs: 2px
- sm: 4px
- md: 8px (基准)
- lg: 16px
- xl: 24px
- 2xl: 32px

## 圆角系统

- 无: 0px
- sm: 4px
- md: 6px (默认)
- lg: 8px
- full: 9999px (完全圆形)

## 组件库

### 1. 按钮 (Button)

**主按钮**
```
bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700
```

**次按钮**
```
border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50
```

**危险按钮**
```
bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700
```

### 2. 输入框 (Input)

```
px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
```

### 3. 卡片 (Card)

```
bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow
```

### 4. 标签 (Badge)

**成功态**
```
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
  <Circle size={8} className="fill-green-500" /> 活跃
</span>
```

### 5. 表格 (Table)

```
- Header: bg-gray-50, font-semibold, text-gray-900
- Row: border-b border-gray-200, hover:bg-gray-50
- Cell: px-6 py-3, text-sm
```

## 布局模式

### 主布局（AppLayout）
```
┌─────────────────────────────────────────┐
│ TopBar (h-16)                           │
├────────────────┬────────────────────────┤
│ Sidebar (w-64) │ Content (flex-1)       │
│ (可折叠)        │ (overflow-auto)        │
├────────────────┴────────────────────────┤
│ StatusBar (h-10)                        │
└─────────────────────────────────────────┘
```

### 知识库详情布局
```
┌──────────────────────────────────────────┐
│ Header (知识库名称 + 操作按钮)            │
├──────────────────────────────────────────┤
│ Tabs (概览/文件/检索测试/设置)           │
├──────────────────────────────────────────┤
│ Content Area                             │
│ (grid/table/form/text)                   │
└──────────────────────────────────────────┘
```

## 交互模式

### 导航
- **侧栏菜单**: 点击切换页面 + 当前项高亮
- **Tab切换**: 平滑过渡，保留滚动位置
- **面包屑**: 返回上级路径

### 表单
- **实时验证**: 输入时反馈
- **焦点态**: border-blue-500 + ring-blue-500
- **错误态**: border-red-500 + 错误信息
- **禁用态**: opacity-50 + cursor-not-allowed

### 模态对话框
```
- 背景: fixed inset-0 bg-black bg-opacity-50 z-50
- 内容: bg-white rounded-lg max-w-md
- 按钮: 确认(蓝色) | 取消(灰色)
```

### 加载态
- **骨架屏**: bg-gray-200 animate-pulse
- **旋转加载**: spinner 图标
- **进度条**: height-2 bg-gray-200 overflow-hidden

## 响应式设计

### 断点
- 移动: < 768px
- 平板: 768px - 1024px  
- 桌面: > 1024px

### 主要容器宽度
- 小屏: px-4
- 中屏: px-6
- 大屏: px-8

### 栅格系统
- 2列: grid-cols-2 (平板+)
- 3列: grid-cols-3 (桌面)
- 4列: grid-cols-4 (桌面+)

## 动画与过渡

### 过渡时间
- 快: 150ms - hover, focus
- 中: 300ms - page transition
- 慢: 500ms - modal open/close

### 常用过渡
```
transition-colors         # 颜色变化
transition-all           # 全属性
transition-shadow        # 阴影变化
transition-transform     # 变换
```

## 阴影系统

- 无: 无
- sm: shadow-sm (0 1px 2px)
- md: shadow-md (0 4px 6px)  
- lg: shadow-lg (0 10px 15px)
- xl: shadow-xl (0 20px 25px)

## 可访问性 (A11y)

### 颜色对比
- 标准文本: 4.5:1 最小对比度
- 大文本: 3:1 最小对比度

### 键盘导航
- Tab: 遍历可交互元素
- Enter: 激活按钮
- Space: 切换复选框/单选框
- Esc: 关闭模态

### 语义HTML
- 使用 `<button>` 代替 `<div>` 按钮
- 使用 `<label>` 关联表单输入
- 使用 `<header>`, `<nav>`, `<main>`, `<footer>`

## 性能最佳实践

### CSS优化
- 使用Tailwind内置类
- 避免自定义CSS（除非必要）
- PurgeCSS自动优化未使用的类

### 图片优化
- SVG 用于图标 (Lucide React)
- JPG 用于照片
- WebP 用于背景（可选）
- lazy loading 延迟加载

### 渲染优化
- 虚拟列表处理大数据
- React.memo 避免不必要重渲
- 防抖和节流用户输入
- 代码分割按路由

## 深色主题（预留）

```typescript
// dark: 前缀启用深色模式
dark:bg-gray-900      // 代替 bg-white
dark:text-white       // 代替 text-gray-900
dark:border-gray-700  // 代替 border-gray-200
```

---

**设计系统版本**: v1.0  
**基于**: Tailwind CSS + Lucide Icons  
**更新日期**: 2026-06-06
