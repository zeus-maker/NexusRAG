#!/usr/bin/env python3
"""RAG 3.0 前端功能清单 Excel 生成脚本"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = Workbook()

# ── Sheet 1: 功能清单总览 ──
ws = wb.active
ws.title = "功能清单总览"

# 颜色定义
header_fill = PatternFill("solid", fgColor="1a1a2e")
header_font = Font(name="Arial", bold=True, color="FFFFFF", size=11)
cat_fill_1 = PatternFill("solid", fgColor="E8F4FD")
cat_fill_2 = PatternFill("solid", fgColor="F5F5F5")
l1_fill = PatternFill("solid", fgColor="D4E6F1")
l1_font = Font(name="Arial", bold=True, color="1a5276", size=11)
l2_font = Font(name="Arial", bold=True, color="2c3e50", size=10)
l3_font = Font(name="Arial", color="555555", size=10)
thin_border = Border(
    left=Side(style="thin", color="CCCCCC"),
    right=Side(style="thin", color="CCCCCC"),
    top=Side(style="thin", color="CCCCCC"),
    bottom=Side(style="thin", color="CCCCCC"),
)
center = Alignment(horizontal="center", vertical="center", wrap_text=True)
left_wrap = Alignment(horizontal="left", vertical="center", wrap_text=True)

# 表头
headers = ["序号", "功能大类", "一级功能(页面)", "状态路由键", "二级功能(模块)", "三级功能(详情)", "功能作用", "可操作项", "组件文件"]
col_widths = [6, 14, 22, 22, 28, 32, 42, 36, 42]

for c, (h, w) in enumerate(zip(headers, col_widths), 1):
    cell = ws.cell(row=1, column=c, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center
    cell.border = thin_border
    ws.column_dimensions[get_column_letter(c)].width = w

ws.row_dimensions[1].height = 28
ws.freeze_panes = "A2"

# ── 数据结构 ──
data = [
    # (大类, 大类序号, 一级功能, 路由键, 二级, 三级, 作用, 操作, 文件)
    # ====== 身份认证 ======
    ("身份认证", 1, "登录页", "login",
     "登录表单", "企业邮箱输入框",
     "提供用户名（邮箱）输入，支持预填和粘贴", "输入邮箱", "src/pages/Login.tsx"),
    ("身份认证", 1, "登录页", "login",
     "登录表单", "密码输入框",
     "提供密码输入，支持显示/隐藏切换", "输入密码、切换可见性", "src/pages/Login.tsx"),
    ("身份认证", 1, "登录页", "login",
     "登录表单", "记住我复选框",
     "勾选后浏览器记住登录态", "勾选/取消", "src/pages/Login.tsx"),
    ("身份认证", 1, "登录页", "login",
     "登录表单", "忘记密码链接",
     "跳转密码重置流程", "点击跳转", "src/pages/Login.tsx"),
    ("身份认证", 1, "登录页", "login",
     "登录表单", "登录按钮",
     "提交登录请求，触发身份验证", "点击登录", "src/pages/Login.tsx"),

    # ====== 工作台 ======
    ("工作台", 2, "工作台", "home",
     "欢迎横幅", "用户问候与日期",
     "显示用户名问候语、当天日期；提供快捷创建知识库入口", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "欢迎横幅", "创建知识库(CTA按钮)",
     "一键跳转到知识库列表页面创建新知识库", "点击：创建知识库", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "统计概览(4卡片)", "文档总数",
     "展示系统内所有知识库的文档总量", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "统计概览(4卡片)", "Chunk总数",
     "展示所有文档分块后的Chunk总量", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "统计概览(4卡片)", "本月查询",
     "展示本月累计查询次数", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "统计概览(4卡片)", "命中率(7天均值)",
     "展示最近7天检索命中率的平均值", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最近知识库(左侧2/3)", "知识库快捷入口卡片(最多5个)",
     "展示最近访问的知识库，每个卡片含名称、状态、文档数/Chunk数", "点击：进入知识库详情", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最近知识库(左侧2/3)", "查看全部链接",
     "跳转到知识库列表页", "点击：查看全部", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最近知识库(左侧2/3)", "+ 更多入口",
     "展开更多知识库", "点击", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "应用快捷入口(4按钮)", "新建对话",
     "快捷进入智能对话页面", "点击：进入chat页", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "应用快捷入口(4按钮)", "新建搜索",
     "快捷进入搜索应用页面", "点击：进入search页", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "应用快捷入口(4按钮)", "新建Agent",
     "快捷进入Agent编排页面", "点击：进入agent页", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "应用快捷入口(4按钮)", "新建评测",
     "快捷进入评测任务页面", "点击：进入eval-tasks页", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "系统健康度(4指标)", "Faithfulness 忠实度",
     "展示系统当前忠实度得分及趋势箭头", "点击：详情→sys-monitor", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "系统健康度(4指标)", "平均延迟",
     "展示系统当前平均查询延迟及趋势箭头", "点击：详情→sys-monitor", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "系统健康度(4指标)", "命中率",
     "展示系统当前检索命中率及趋势箭头", "点击：详情→sys-monitor", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "系统健康度(4指标)", "错误率",
     "展示系统当前错误率及趋势箭头", "点击：详情→sys-monitor", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最近对话(右侧栏)", "最近会话列表(4条)",
     "显示最近的对话记录，含标题和时间", "点击：进入chat页(带会话上下文)", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最近动态(feed)", "活动时间线(5条)",
     "按时间线展示最近系统动态：解析完成/评测完成/上传文档/流水线进度/创建用户", "查看", "src/pages/Home.tsx"),
    ("工作台", 2, "工作台", "home",
     "最新评测卡片", "评测分数展示(Faithfulness/Hallucination)",
     "展示最新一次评测的核心分数结果", "点击：查看完整报告→eval-dashboard", "src/pages/Home.tsx"),

    # ====== 知识库管理 ======
    ("知识库管理", 3, "知识库列表", "kb-list",
     "页面标题栏", "标题与副标题",
     '显示「知识库管理」页面标题和功能描述', "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "创建操作", "创建知识库按钮",
     "打开创建知识库表单Modal", "点击：打开创建弹窗", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "统计行(4卡片)", "知识库总数/文档总数/Chunk总数/存储总量",
     "全局统计概览，展示系统知识资产总量", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "筛选栏", "搜索框(按名称/描述过滤)",
     "支持按知识库名称或描述关键词实时搜索过滤", "输入搜索", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "筛选栏", "状态过滤按钮组(全部/活跃/索引中/已归档)",
     "按知识库状态分类过滤展示", "点击切换状态", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "知识库卡片网格", "知识库卡片(响应式1-4列)",
     "每个卡片展示：图标、名称、状态标签、描述、文档数/Chunk数、存储大小、更新时间", "点击：进入知识库详情", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "知识库卡片网格", "操作菜单(悬停弹出)",
     "每个卡片悬停显示更多操作", "编辑设置/查看文档/重建索引/删除", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "知识库卡片网格", "创建新知识库占位卡片",
     "虚线边框的新建占位卡", "点击：打开创建弹窗", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 3, "知识库列表", "kb-list",
     "创建知识库Modal", "名称/描述/语言/分块策略/嵌入模型/LLM模型",
     "创建新知识库时填写基础配置项", "填写表单/提交创建", "src/pages/KnowledgeBase.tsx"),

    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "面包屑导航", "← 返回 + 知识库名称 + 状态标签",
     "显示当前位置层级，支持返回上一级", "点击返回", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "Tab导航(4项)", "概览/文档/索引状态/设置",
     "知识库4个子页面的Tab切换导航", "点击切换Tab", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "统计卡片(4项)", "文档总数/Chunk数/存储大小/解析质量",
     "展示该知识库的核心数据指标", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "趋势图", "近30天查询趋势柱状图",
     "可视化展示该知识库近30天的查询量变化", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "文档类型分布", "PDF/DOCX/XLSX/其他类型占比(水平进度条)",
     "展示该知识库中文档类型的分布比例", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "最近上传列表", "文件列表(含类型和时间)",
     "展示该知识库最近上传的文档清单", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "高频查询排行", "Top-4排名列表(含查询次数)",
     "展示该知识库中最常见的Top 4查询", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 4, "知识库详情(概览Tab)", "kb-detail",
     "快捷操作", "管理文档按钮",
     "跳转到该知识库的文档管理页", "点击：进入文档管理", "src/pages/KnowledgeBase.tsx"),

    ("知识库管理", 5, "文档管理", "kb-documents",
     "面包屑", "← 返回 + 知识库名 + 文档管理",
     "显示所在位置，支持返回", "点击返回", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "上传操作", "URL导入按钮",
     "通过输入URL导入文档", "点击：打开URL导入", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "上传操作", "上传文档按钮",
     "打开本地文件选择器上传文档", "点击：选择文件上传", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "上传操作", "拖拽上传区域(16+格式,单文件≤100MB,批量≤100)",
     "支持拖拽文件到指定区域直接上传", "拖拽文件/点击选择", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "上传队列面板", "文件上传/解析进度展示",
     "实时显示上传中/解析中/完成等状态及进度条", "查看进度/清空已完成", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "筛选栏", "搜索框 + 批量删除按钮(选中时出现)",
     "搜索过滤文档；选中文档后可批量删除", "输入搜索/批量删除", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 5, "文档管理", "kb-documents",
     "文档表格", "表格(复选框/文件名/类型/大小/解析状态/质量评分/时间/操作)",
     "展示该知识库下所有文档的详细列表，支持排序和多选", "勾选/排序/点击文件名→分块预览/操作菜单", "src/pages/KnowledgeBase.tsx"),

    ("知识库管理", 6, "分块预览", "kb-chunks",
     "面包屑", "← 返回 + 文档名称 + 分块预览",
     "显示位置层级", "点击返回", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "分块操作", "重新分块按钮",
     "触发文档重新执行分块流程", "点击：重新分块", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "配置栏", "分块策略选择(通用/模板/表格优先/代码感知)",
     "切换不同的分块算法", "下拉选择", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "配置栏", "Chunk大小选择(256/512/1024)",
     "设置每个Chunk的Token上限", "下拉选择", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "配置栏", "统计信息(块数/平均Token/最大最小Token)",
     "展示当前分块配置下的统计信息", "查看", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "分块列表", "Chunk卡片列表(编号/标题/内容类型/ACL级别/Token数/页码)",
     "展示每个Chunk的详细信息", "查看内容", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "分块列表", "Chunk内容渲染(文本/表格自适应)",
     "根据内容类型渲染不同格式的内容", "查看文本/表格", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 6, "分块预览", "kb-chunks",
     "分块列表", "Chunk操作(拆分/合并↓/排除)",
     "对单个Chunk进行拆分、向下合并或排除操作", "点击：拆分/合并/排除", "src/pages/KnowledgeBase.tsx"),

    ("知识库管理", 7, "索引状态", "kb-index-status",
     "面包屑", "← 返回 + 知识库名 + 索引状态",
     "显示位置层级", "点击返回", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "全局操作", "全部重建索引按钮",
     "一键触发该知识库全部5个索引的重新构建", "点击：全部重建", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "索引状态卡片(5个)", "向量索引状态卡",
     "展示向量索引的构建进度、已索引/总计、健康度、更新时间、失败计数", "点击：重试N失败", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "索引状态卡片(5个)", "全文索引状态卡",
     "展示全文检索索引的状态数据", "点击：重试N失败", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "索引状态卡片(5个)", "PageIndex状态卡",
     "展示树索引构建状态", "点击：重试N失败", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "索引状态卡片(5个)", "图谱索引状态卡",
     "展示知识图谱索引构建状态", "点击：重试N失败", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "索引状态卡片(5个)", "Wiki编译状态卡",
     "展示LLM Wiki编译状态", "点击：重试N失败", "src/pages/KnowledgeBase.tsx"),
    ("知识库管理", 7, "索引状态", "kb-index-status",
     "失败列表", "失败文档表格(文件名/流水线/原因/操作)",
     "列出所有索引失败的文档及其失败原因", "点击：重试/跳过", "src/pages/KnowledgeBase.tsx"),

    ("知识库管理", 8, "知识库设置", "kb-settings",
     "面包屑", "← 返回 + 知识库名 + 配置",
     "显示位置层级", "点击返回", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "全局操作", "保存配置按钮(含保存成功动画)",
     "保存当前配置页所有修改", "点击：保存", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:基础信息", "知识库名称/描述编辑",
     "编辑知识库的名称和描述信息", "输入编辑", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:基础信息", "默认语言选择",
     "设置知识库的默认处理语言", "下拉选择", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:基础信息", "可见性权限(仅我/团队)",
     "控制知识库对其他用户的可见范围", "选择切换", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "解析类型选择(内置引擎/外部管道)",
     "切换文档解析的后端引擎选项", "切换选择", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "分块方法选择(15种:General/QA/Paper/Laws等)",
     "选择适合该知识库文档类型的15种分块方法之一", "下拉选择", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "布局识别引擎(DeepDOC/MinerU/PyMuPDF)",
     "选择文档布局识别的渲染引擎", "下拉选择", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "嵌入模型选择(BAAI/bge-m3/BCE/OpenAI)",
     "选择用于向量化的嵌入模型", "下拉选择", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "Chunk Token上限滑块(128-2048)",
     "拖动滑块调整Chunk的最大Token限制", "拖动滑块", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "重叠Token滑块(0-512)",
     "调整相邻Chunk之间的Token重叠量", "拖动滑块", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "GraphRAG面板(可折叠)",
     "知识图谱的开关、实体类型配置、提取方法、LLM模型选择", "开启/关闭/生成图谱/查看日志/查看图谱", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:解析分块", "RAPTOR面板(可折叠)",
     "RAPTOR分层摘要的开关、max_token/threshold/max_cluster参数", "开启/关闭/调参", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:全局索引", "5个索引开关(向量[必选]/全文/PageIndex/图谱/Wiki)",
     "控制启用哪些索引子系统，向量索引默认必选不可关闭", "开启/关闭", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:数据源", "外部数据源列表(S3/SharePoint/WebCrawl)",
     "展示已接入的外部数据源，含同步状态和时间", "查看/删除", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:数据源", "添加数据源按钮",
     "接入新的外部数据源", "点击：添加数据源", "src/pages/KBExtra.tsx"),
    ("知识库管理", 8, "知识库设置", "kb-settings",
     "Tab:标签元数据", "标签管理(合同/供应商/法律/财务/合规等)",
     "管理该知识库的标签分类", "添加标签/删除标签", "src/pages/KBExtra.tsx"),

    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "左右分栏布局", "左侧：测试配置面板(256px)",
     "提供检索测试的参数配置入口", "查看/配置", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "测试问题输入框",
     "输入用于检索测试的查询文本", "输入查询", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "相似度阈值滑块(0-1)",
     "调整检索的相似度阈值", "拖动滑块", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "向量权重滑块(0-1)+全文匹配/纯向量标签",
     "调整向量检索与全文匹配的权重比例", "拖动滑块", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "Rerank精排开关+模型选择",
     "是否启用重排序及选择Reranker模型", "开启/关闭/选择模型", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "知识图谱增强开关/跨语言复选框",
     "控制是否启用图谱增强和多语言检索", "开启/关闭/勾选", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "配置面板", "元数据过滤+执行检索按钮",
     "添加元数据条件限制检索范围；点击执行检索", "添加过滤/点击执行", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "右侧结果面板", "检索结果列表(排名/文档/页码/索引类型/相关性评分/片段引用)",
     "展示每一条检索结果的详细信息", "查看原文/复制片段", "src/pages/KBExtra.tsx"),
    ("知识库管理", 9, "检索测试", "kb-retrieval-test",
     "右侧结果面板", "结果统计(按索引类型分类计数)",
     "统计各类索引通道返回的结果数量", "查看", "src/pages/KBExtra.tsx"),

    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "顶部操作栏", "← 返回/KB名/编译队列按钮/触发编译按钮",
     "导航返回、查看编译队列、手动触发Wiki编译", "点击返回/查看编译队列/触发编译", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "左侧目录树(208px)", "Layer切换(原始/实体/综合)",
     "切换显示不同层级的Wiki内容", "点击切换Layer", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "左侧目录树(208px)", "分组树形列表(实体/综合/原始资料)",
     "按类别分组展示所有Wiki页面，含状态标签", "点击选择页面", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "中间主内容区", "Wiki标题+状态标签+更新日期",
     "展示当前选中Wiki页面的标题和元信息", "查看", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "中间主内容区", "Markdown渲染正文",
     "渲染Wiki页面的内容(支持h2/列表/粗体)", "查看/阅读", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "中间主内容区", "操作按钮(编辑/版本历史/审核通过)",
     "对Wiki页面进行编辑、查看历史版本、审核操作", "编辑/查看历史/审核通过", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "中间主内容区", "引用来源卡片(文档链接+页码)",
     "展示当前Wiki内容的知识来源文档", "点击：查看来源文档", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "中间主内容区", "相关页面链接",
     "展示关联的其他Wiki页面链接", "点击跳转", "src/pages/KBExtra.tsx"),
    ("知识库管理", 10, "Wiki浏览器", "kb-wiki",
     "右侧编译队列抽屉(288px)", "编译队列列表(页面/引用/状态)",
     "展示当前待编译和编译中的Wiki页面队列", "查看", "src/pages/KBExtra.tsx"),

    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "左右分栏布局", "左侧：树面板(256px)",
     "展示某文档的PageIndex目录树结构", "展开/折叠节点", "src/pages/KBExtra.tsx"),
    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "左侧树面板", "文档信息(页数/节点数)",
     "展示当前文档的基本信息", "查看", "src/pages/KBExtra.tsx"),
    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "左侧树面板", "递归树形结构(可展开/折叠/高亮选中)",
     "目录树交互：展开折叠节点、选中高亮", "点击展开/折叠/选中", "src/pages/KBExtra.tsx"),
    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "右侧详情面板", "选中节点信息(类型/页码/Token/子节点/摘要)",
     "展示当前选中节点的详细属性", "查看", "src/pages/KBExtra.tsx"),
    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "右侧详情面板", "树搜索调试面板(搜索输入/测试按钮)",
     "输入查询测试PageIndex树的检索能力", "输入查询/点击测试", "src/pages/KBExtra.tsx"),
    ("知识库管理", 11, "PageIndex树", "kb-pageindex-tree",
     "右侧详情面板", "推理路径展示(扫描目录→定位节点→返回结果+耗时ms)",
     "展示PageIndex树检索的3步推理过程和各步耗时", "查看推理路径/在树中高亮", "src/pages/KBExtra.tsx"),

    # ====== 高级功能管理 ======
    ("高级功能管理", 12, "LLM Wiki管理(全局)", "kb-wiki-manage",
     "标题与操作", "标题/副标题/全量重编译按钮/新建Wiki页按钮",
     "跨知识库管理所有Wiki页面与编译任务", "全量重编译/新建页面", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 12, "LLM Wiki管理(全局)", "kb-wiki-manage",
     "统计卡片(4)", "Wiki页面总数/已发布数/待审核数/总引用次数",
     "全局Wiki数据统计概览", "查看", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 12, "LLM Wiki管理(全局)", "kb-wiki-manage",
     "Tab:Wiki页面", "表格(标题/所属KB/Layer/状态/引用/来源/时间/操作)",
     "浏览和管理所有Wiki页面", "查看/编辑/通过审核", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 12, "LLM Wiki管理(全局)", "kb-wiki-manage",
     "Tab:编译任务", "任务卡片列表(状态/KB/触发方式/页面数/模型/进度/操作)",
     "管理所有Wiki编译任务的状态和进度", "重试/取消", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 12, "LLM Wiki管理(全局)", "kb-wiki-manage",
     "Tab:统计分析", "按KB分布(水平进度条)+引用排行Top5",
     "分析各KB的Wiki覆盖情况和热门引用页面", "查看", "src/pages/KBExtra.tsx"),

    ("高级功能管理", 13, "PageIndex管理(全局)", "kb-pageindex-manage",
     "标题与操作", "标题/副标题/查看树结构按钮/全量重建按钮",
     "跨知识库管理所有PageIndex索引", "查看树结构/全量重建", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 13, "PageIndex管理(全局)", "kb-pageindex-manage",
     "统计卡片(4)", "节点总数/已索引比例/平均覆盖率/运行中任务数",
     "全局PageIndex数据统计", "查看", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 13, "PageIndex管理(全局)", "kb-pageindex-manage",
     "Tab:构建任务", "表格(文档/KB/节点数/状态/耗时/时间/操作)",
     "管理PageIndex构建任务", "查看树/重试/重建", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 13, "PageIndex管理(全局)", "kb-pageindex-manage",
     "Tab:KB覆盖率", "每个KB覆盖率进度条+补充索引按钮",
     "查看各KB的PageIndex覆盖情况", "补充索引", "src/pages/KBExtra.tsx"),
    ("高级功能管理", 13, "PageIndex管理(全局)", "kb-pageindex-manage",
     "Tab:全局配置", "配置项(深度/Token上限/摘要模型/并发数)+自动触发规则",
     "全局PageIndex构建参数和自动化规则配置", "保存配置/开启自动规则", "src/pages/KBExtra.tsx"),

    # ====== 智能应用 ======
    ("智能应用", 14, "智能对话", "chat",
     "三栏布局(左224/中/右288)", "整体三栏UI结构",
     "左侧会话列表 + 中间主聊天区 + 右侧查询增强面板(可切换)", "查看", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "左侧：会话列表", "新对话按钮",
     "创建新的对话会话", "点击：新建对话", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "左侧：会话列表", "搜索对话输入框",
     "按关键词搜索历史对话", "输入搜索", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "左侧：会话列表", "按时间分组(今天/昨天/更早)的会话列表",
     "按时间分组展示所有历史会话，含标题、预览、Pin图标", "点击选择会话", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "左侧：会话列表", "查询增强面板切换按钮",
     "控制右侧查询增强面板的显示/隐藏", "点击切换", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "KB选择器栏(多选+清除对话)",
     "多选切换知识库，限定对话的检索范围；清除当前会话", "选择KB/清除对话", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "欢迎页(图标+文案+4个建议问题)",
     "新对话时展示欢迎界面和快捷提问入口", "点击：快捷提问", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "用户消息(蓝色气泡右对齐)",
     "展示用户发送的查询消息", "查看", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "AI回复卡片(路由信息/Markdown正文/流式光标/引用来源/置信度/延迟/操作按钮行)",
     "展示AI生成的完整回复，含路由信息、正文渲染、引用溯源、操作交互", "查看正文/点赞/点踩/编辑/复制", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "引用编号按钮+引用详情弹窗(文档名/页码/章节/片段/评分/查看原文)",
     "点击引用编号弹出详细引用信息窗口", "点击引用编号→查看弹窗/查看原文", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "建议追问条(3个问题胶囊)",
     "对话完成后展示3个相关问题供继续追问", "点击：追问", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "中间：主聊天区", "输入区(textarea+发送按钮+免责声明)",
     "提供消息输入和发送功能", "输入文本/点击发送", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "右侧：查询增强面板(可切换288px)", "查询重写(原始→精确/泛化/跨文档3种)",
     "展示查询的自动重写结果", "查看", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "右侧：查询增强面板(可切换288px)", "分类器路由(复杂度/文档类型/意图/安全分级4标签)",
     "展示当前查询经过分类器路由后的4维判定结果", "查看", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "右侧：查询增强面板(可切换288px)", "检索通道(PageIndex/向量检索的延迟/召回/融合策略)",
     "展示各检索通道的详细运行指标", "查看", "src/pages/Chat.tsx"),
    ("智能应用", 14, "智能对话", "chat",
     "右侧：查询增强面板(可切换288px)", "知识来源(文档卡片+页码范围)",
     "展示回答所引用的具体知识来源文档", "查看", "src/pages/Chat.tsx"),

    ("智能应用", 15, "搜索应用", "search",
     "列表视图", "标题/副标题/新建搜索按钮",
     "搜索应用的入口页面", "点击：新建搜索", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "列表视图", "应用卡片网格(3预定义+新建占位)",
     "展示所有已创建的搜索应用，含图标/名称/描述/KB标签/查询次数", "点击：进入应用", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "新建搜索Modal", "应用名称/关联KB多选/阈值/结果数/开关选项",
     "创建新的搜索应用配置", "填写表单/提交创建", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "面包屑/搜索栏(输入框+搜索按钮)",
     "搜索应用内的检索入口", "输入查询/点击搜索", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "建议搜索词胶囊",
     "展示建议的搜索提示词", "点击：快速搜索", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "AI智能摘要(蓝色渐变卡片)",
     "展示搜索结果的AI摘要生成内容", "查看", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "搜索结果列表(标题链接/摘要/文档/标签/相关性/操作)",
     "展示搜索返回的文档结果列表", "点击标题/查看原文/引用", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "思维导图面板(可切换,根节点+子节点树)",
     "将搜索结果可视化为思维导图", "点击切换显示", "src/pages/SearchAgent.tsx"),
    ("智能应用", 15, "搜索应用", "search",
     "详情视图", "相关搜索(4个建议词)",
     "展示相关搜索推荐词", "点击：快速搜索", "src/pages/SearchAgent.tsx"),

    ("智能应用", 16, "Agent编排", "agent",
     "列表视图", "标题/副标题/新建Agent按钮",
     "Agent应用的入口页面", "点击：新建Agent", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "列表视图", "Agent卡片网格(3预定义+新建占位)",
     "展示所有Agent，含图标/名称/状态/Pipeline模式/运行次数", "点击：进入编排画布", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "画布视图-工具栏", "返回/名称/撤销/复制/分享/设置/停止/运行",
     "Agent编排画布的全局操作栏", "撤销/复制/分享/设置/停止/运行", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "画布视图-左侧", "节点库浮窗(7种可拖拽节点)",
     "提供7种可拖拽到画布的节点：检索/分类路由/LLM/Wiki读取/PageIndex树/工具/解析器", "拖拽节点到画布", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "画布视图-中央", "点阵背景画布(6个Agent节点+SVG连线)",
     "可视化编排Agent的节点流程，支持节点选中", "点击选中节点/拖拽布局", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "画布视图-右侧面板(256px)", "节点配置详情(检索:KB+Top-K;LLM:模型+温度)",
     "编辑选中节点的详细配置参数", "编辑配置", "src/pages/SearchAgent.tsx"),
    ("智能应用", 16, "Agent编排", "agent",
     "画布视图-右侧面板(256px)", "测试运行区域(输入框+运行测试+结果+流水线模式节点)",
     "在编排中即时测试Agent效果", "输入测试内容/运行测试", "src/pages/SearchAgent.tsx"),

    # ====== 评测中心 ======
    ("评测中心", 17, "评测仪表盘", "eval-dashboard",
     "标题与操作", "标题/副标题/评测任务按钮/A/B测试按钮",
     "评测中心的入口仪表盘", "点击：进入评测任务/A/B测试", "src/pages/Evaluation.tsx"),
    ("评测中心", 17, "评测仪表盘", "eval-dashboard",
     "核心指标卡片(4)", "Faithfulness/ContextPrecision/AnswerRelevancy/HallucinationRate",
     "展示评测的4项核心指标得分、对比基线、进度条", "查看", "src/pages/Evaluation.tsx"),
    ("评测中心", 17, "评测仪表盘", "eval-dashboard",
     "趋势图", "6个月柱状对比图(Faithfulness+Relevancy/日周月切换/图例)",
     "可视化展示核心指标半年内的变化趋势", "切换时间粒度", "src/pages/Evaluation.tsx"),
    ("评测中心", 17, "评测仪表盘", "eval-dashboard",
     "分层评测结果", "5层级(文档→块→检索→生成→端到端)水平进度条",
     "按RAG的5个层级分别展示评测得分", "查看", "src/pages/Evaluation.tsx"),
    ("评测中心", 17, "评测仪表盘", "eval-dashboard",
     "最近评测列表", "评测运行卡片(名称/KB/样本量/日期/状态/分数标签)",
     "展示最近的评测运行记录", "查看", "src/pages/Evaluation.tsx"),

    ("评测中心", 18, "评测任务", "eval-tasks",
     "标题与操作", "标题/副标题/创建评测任务按钮",
     "评测任务管理入口", "点击：创建评测任务", "src/pages/Evaluation.tsx"),
    ("评测中心", 18, "评测任务", "eval-tasks",
     "评测任务列表", "任务卡片(状态/名称/KB/样本量/耗时/日期/分数对比)",
     "展示所有评测任务的状态和结果", "查看详情", "src/pages/Evaluation.tsx"),
    ("评测中心", 18, "评测任务", "eval-tasks",
     "评测任务列表", "失败案例Top3(查询/预期/实际/分数,红色背景)",
     "展示每个任务中的Top3失败案例详情", "查看", "src/pages/Evaluation.tsx"),
    ("评测中心", 18, "评测任务", "eval-tasks",
     "创建任务Modal", "名称/KB/评测集来源(默认/CSV/JSON/历史)/指标多选(6项)/对比选项",
     "配置和创建新的评测任务", "填写配置/提交", "src/pages/Evaluation.tsx"),

    ("评测中心", 19, "A/B测试", "eval-ab-test",
     "标题与操作", "标题/副标题/创建A/B测试按钮",
     "A/B测试管理入口", "点击：创建A/B测试", "src/pages/Evaluation.tsx"),
    ("评测中心", 19, "A/B测试", "eval-ab-test",
     "测试列表", "测试卡片(名称/状态/流量分配/天数/胜出提示)",
     "展示所有A/B测试的概览信息", "查看详情", "src/pages/Evaluation.tsx"),
    ("评测中心", 19, "A/B测试", "eval-ab-test",
     "测试列表", "Variant A vs B对比面板(指标/样本量/p值/置信度/操作)",
     "对比两个变体的核心指标差异和统计显著性", "查看详情/停止/全量切换/查看报告", "src/pages/Evaluation.tsx"),
    ("评测中心", 19, "A/B测试", "eval-ab-test",
     "创建Modal", "测试名称/Variant A/B选择(嵌入模型)/流量分配滑块",
     "配置和创建新的A/B测试", "填写配置/提交", "src/pages/Evaluation.tsx"),

    ("评测中心", 20, "成本中心", "eval-cost",
     "标题与时间选择", "标题/时间切换(本月/上月/7天)/导出按钮",
     "成本分析页面入口和时间范围控制", "切换时间/点击导出", "src/pages/EvalExtra.tsx"),
    ("评测中心", 20, "成本中心", "eval-cost",
     "统计卡片(4)", "Token消耗/预估费用/查询数/平均每查询成本",
     "成本核心数据概览", "查看", "src/pages/EvalExtra.tsx"),
    ("评测中心", 20, "成本中心", "eval-cost",
     "4个Tab", "按知识库/按用户/按模型/趋势(日柱状14天)",
     "多维度分析Token消耗与费用", "切换Tab/查看", "src/pages/EvalExtra.tsx"),

    ("评测中心", 21, "回放评测", "eval-replay",
     "标题与操作", "标题/副标题/新建回放按钮",
     "回放评测入口", "点击：新建回放", "src/pages/EvalExtra.tsx"),
    ("评测中心", 21, "回放评测", "eval-replay",
     "4步向导(Step1-4)", "步骤1:选择查询样本(卡片列表+全选/清空)",
     "从历史查询中选择回放样本", "勾选/全选/清空", "src/pages/EvalExtra.tsx"),
    ("评测中心", 21, "回放评测", "eval-replay",
     "4步向导(Step1-4)", "步骤2:配置版本(Version A当前 vs B对比,并排表单)",
     "配置回放对比的两个版本参数", "配置管道/Rerank/Top-K/LLM/开始回放", "src/pages/EvalExtra.tsx"),
    ("评测中心", 21, "回放评测", "eval-replay",
     "4步向导(Step1-4)", "步骤3:执行回放(进度动画+百分比+处理数)",
     "展示回放执行的实时进度", "查看进度", "src/pages/EvalExtra.tsx"),
    ("评测中心", 21, "回放评测", "eval-replay",
     "4步向导(Step1-4)", "步骤4:查看结果(汇总卡片+逐条对比表格+变化/胜出)",
     "展示回放评测的详细对比结果", "查看/分析", "src/pages/EvalExtra.tsx"),

    # ====== 系统管理 ======
    ("系统管理", 22, "用户管理", "sys-users",
     "标题与操作", "标题/副标题/添加用户按钮",
     "系统用户管理入口", "点击：添加用户", "src/pages/System.tsx"),
    ("系统管理", 22, "用户管理", "sys-users",
     "统计卡片(4)", "总用户数/活跃用户/已禁用/角色类型",
     "用户数据统计概览", "查看", "src/pages/System.tsx"),
    ("系统管理", 22, "用户管理", "sys-users",
     "筛选栏", "搜索框+角色过滤按钮组(全部/管理员/KB管理员/开发者)",
     "按角色筛选用户列表", "输入搜索/点击角色过滤", "src/pages/System.tsx"),
    ("系统管理", 22, "用户管理", "sys-users",
     "用户表格", "表格(头像/姓名/邮箱/部门/角色/状态/登录日期/操作菜单)",
     "管理所有系统用户的信息和状态", "查看/更多操作", "src/pages/System.tsx"),
    ("系统管理", 22, "用户管理", "sys-users",
     "添加用户Modal", "姓名/邮箱/部门/角色选择(普通用户/KB管理员/开发者/平台管理员)",
     "添加新用户的表单", "填写/提交", "src/pages/System.tsx"),

    ("系统管理", 23, "角色权限", "sys-roles",
     "标题与操作", "标题/副标题/创建角色按钮",
     "RBAC角色权限管理入口", "点击：创建角色", "src/pages/System.tsx"),
    ("系统管理", 23, "角色权限", "sys-roles",
     "系统角色网格", "6个角色卡片(超管/平台管理/KB管理/开发者/普通用户/法务主管)",
     "展示所有系统角色及人数", "查看/编辑", "src/pages/System.tsx"),
    ("系统管理", 23, "角色权限", "sys-roles",
     "Chunk级ACL规则", "规则列表(编号/规则名/被授权者/条件表达式/启用/设置)",
     "管理文档块级别的访问控制规则", "添加规则/编辑/启用/禁用", "src/pages/System.tsx"),

    ("系统管理", 24, "流水线配置", "sys-pipeline",
     "标题与操作", "标题/副标题/保存配置按钮",
     "系统级流水线配置入口", "点击：保存配置", "src/pages/System.tsx"),
    ("系统管理", 24, "流水线配置", "sys-pipeline",
     "五大流水线卡片(P1-P5)", "P1向量检索/P2PageIndex/P3GraphRAG/P4Wiki/P5Agent工具",
     "展示和配置5条核心检索流水线，含启用状态", "启用/禁用/配置", "src/pages/System.tsx"),
    ("系统管理", 24, "流水线配置", "sys-pipeline",
     "模型配置", "嵌入模型/LLM模型/Reranker模型/分类器模型选择",
     "全局模型的提供者和具体模型选择", "下拉选择", "src/pages/System.tsx"),
    ("系统管理", 24, "流水线配置", "sys-pipeline",
     "路由规则", "路由规则列表(条件代码标签→通道名称+编辑/删除)",
     "管理系统级路由分发规则", "添加规则/编辑/删除", "src/pages/System.tsx"),

    ("系统管理", 25, "审计日志", "sys-audit",
     "标题与操作", "标题/副标题/导出CSV按钮",
     "系统审计日志查询和导出", "点击：导出CSV", "src/pages/System.tsx"),
    ("系统管理", 25, "审计日志", "sys-audit",
     "筛选栏", "日期范围选择器+搜索框",
     "按时间范围和关键词筛选审计记录", "选择日期/输入搜索", "src/pages/System.tsx"),
    ("系统管理", 25, "审计日志", "sys-audit",
     "日志表格", "表格(时间/用户/操作/资源/IP/结果)",
     "展示系统所有操作审计记录，支持响应式隐藏列", "查看", "src/pages/System.tsx"),

    ("系统管理", 26, "系统监控", "sys-monitor",
     "标题与操作", "标题/副标题",
     "系统运行状态监控面板", "查看", "src/pages/System.tsx"),
    ("系统管理", 26, "系统监控", "sys-monitor",
     "核心指标卡片(4)", "QPS(1,250/s,+15%)/P95延迟(1.8s)/错误率(0.3%)/GPU利用率(78%)",
     "展示系统实时运行指标及变化趋势", "查看", "src/pages/System.tsx"),
    ("系统管理", 26, "系统监控", "sys-monitor",
     "流水线延迟分布", "5条流水线延迟水平进度条(P1-P5)+时间范围切换(1h/6h/24h/7d)",
     "查看各流水线的延迟分布情况", "切换时间范围", "src/pages/System.tsx"),
    ("系统管理", 26, "系统监控", "sys-monitor",
     "LLM Token消耗", "今日 vs 本月消耗对比+模型分布(DeepSeek/Qwen/Claude占比)",
     "监控LLM调用消耗和成本", "查看", "src/pages/System.tsx"),
    ("系统管理", 26, "系统监控", "sys-monitor",
     "告警规则", "告警规则列表(P0/P1/P2等级,条件,通知渠道,启用,编辑,添加)",
     "管理系统的告警规则", "添加/编辑/启用/禁用", "src/pages/System.tsx"),

    ("系统管理", 27, "分类器路由", "sys-classifier",
     "标题与操作", "标题/副标题/新建分类器按钮",
     "分类器路由配置入口", "点击：新建分类器", "src/pages/SystemExtra.tsx"),
    ("系统管理", 27, "分类器路由", "sys-classifier",
     "左侧:分类器列表(1/3)", "4个分类器卡片(意图/复杂度/KB路由/安全)",
     "展示所有分类器及其核心指标", "点击：选择分类器", "src/pages/SystemExtra.tsx"),
    ("系统管理", 27, "分类器路由", "sys-classifier",
     "右侧:配置详情(2/3)", "选中分类器详情(描述/标签/统计/编辑/停用/测试面板)",
     "编辑选中分类器的配置和测试", "编辑规则/停用/输入测试查询", "src/pages/SystemExtra.tsx"),
    ("系统管理", 27, "分类器路由", "sys-classifier",
     "路由决策矩阵", "决策矩阵表格(意图×复杂度×KB×管道×Rerank×图谱×Wiki,8条规则)",
     "展示完整的路由决策规则映射", "查看", "src/pages/SystemExtra.tsx"),

    ("系统管理", 28, "安全合规", "sys-security",
     "标题与状态", "标题/副标题/安全状态标签",
     "安全合规管理中心", "查看", "src/pages/SystemExtra.tsx"),
    ("系统管理", 28, "安全合规", "sys-security",
     "统计卡片(4)", "本月拦截(23)/PII处理(1204)/ACL拒绝(89)/合规得分(98.2)",
     "安全核心数据概览", "查看", "src/pages/SystemExtra.tsx"),
    ("系统管理", 28, "安全合规", "sys-security",
     "Tab:投毒检测", "安全事件队列(事件卡片:等级/文档/类型/详情/时间/状态/放行/删除)",
     "管理提示注入和投毒攻击检测", "放行/删除", "src/pages/SystemExtra.tsx"),
    ("系统管理", 28, "安全合规", "sys-security",
     "Tab:PII脱敏规则", "规则表格(规则名/正则/处理方式/开关/编辑/删除)+添加按钮",
     "管理个人信息脱敏规则", "添加/编辑/删除/启用/禁用", "src/pages/SystemExtra.tsx"),
    ("系统管理", 28, "安全合规", "sys-security",
     "Tab:ACL模拟器", "模拟表单(用户+查询+模拟检查)+检查结果(允许/拒绝+原因)+ACL总览矩阵",
     "模拟ACL权限检查的结果", "选择用户/输入查询/模拟检查", "src/pages/SystemExtra.tsx"),
    ("系统管理", 28, "安全合规", "sys-security",
     "Tab:合规报告", "3个合规维度+5条检查项(pass/warn)+导出PDF按钮",
     "查看系统合规状态报告", "导出PDF", "src/pages/SystemExtra.tsx"),

    ("系统管理", 29, "模型管理", "sys-models",
     "标题与操作", "标题/副标题/添加提供商按钮",
     "AI模型提供商管理入口", "点击：添加提供商", "src/pages/SystemExtra.tsx"),
    ("系统管理", 29, "模型管理", "sys-models",
     "左侧:提供商列表(1/3)", "4个提供商卡片(OpenAI/Anthropic/Azure/本地Ollama)",
     "展示所有AI模型提供商", "点击：选择提供商", "src/pages/SystemExtra.tsx"),
    ("系统管理", 29, "模型管理", "sys-models",
     "右侧:提供商详情(2/3)", "名称/状态/测试连接/APIKey/可用模型/统计(本月Token/费用/延迟)",
     "管理和查看单个提供商的详细信息", "查看/隐藏APIKey/测试连接", "src/pages/SystemExtra.tsx"),
    ("系统管理", 29, "模型管理", "sys-models",
     "模型角色分配表", "6个角色→模型→提供商映射表(含更改按钮)",
     "分配各系统角色使用的具体模型", "点击：更改角色模型", "src/pages/SystemExtra.tsx"),

    ("系统管理", 30, "Traces链路追踪", "sys-traces",
     "标题与操作", "标题/副标题/刷新按钮/时间范围下拉",
     "分布式链路追踪面板", "刷新/切换时间范围", "src/pages/SystemExtra.tsx"),
    ("系统管理", 30, "Traces链路追踪", "sys-traces",
     "左侧:Trace列表(2/5)", "3条Trace卡片(查询摘要/耗时/Token/时间/Tier/Pipeline)",
     "展示最近的查询链路记录", "点击：选中查看", "src/pages/SystemExtra.tsx"),
    ("系统管理", 30, "Traces链路追踪", "sys-traces",
     "右侧:Span详情(3/5)", "统计条(总耗时/Token/Span数)+Span瀑布图+类型着色图例",
     "展示选中Trace的详细Span瀑布图", "查看", "src/pages/SystemExtra.tsx"),
]

row = 2
prev_cat = ""
for idx, (cat, cat_num, l1, route, l2, l3, desc, ops, fname) in enumerate(data, 1):
    is_new_cat = cat != prev_cat
    prev_cat = cat

    r = row
    ws.cell(row=r, column=1, value=idx).font = Font(name="Arial", size=10, color="888888")
    ws.cell(row=r, column=1).alignment = center
    ws.cell(row=r, column=1).border = thin_border

    if is_new_cat:
        ws.cell(row=r, column=2, value=f"{cat}({cat_num})").font = Font(name="Arial", bold=True, size=10, color="1a5276")
        ws.cell(row=r, column=2).fill = cat_fill_1
    else:
        ws.cell(row=r, column=2, value="").fill = cat_fill_1
    ws.cell(row=r, column=2).alignment = center
    ws.cell(row=r, column=2).border = thin_border

    ws.cell(row=r, column=3, value=l1).font = l1_font
    ws.cell(row=r, column=3).alignment = center
    ws.cell(row=r, column=3).border = thin_border

    ws.cell(row=r, column=4, value=route).font = Font(name="Arial", size=10, color="888888")
    ws.cell(row=r, column=4).alignment = center
    ws.cell(row=r, column=4).border = thin_border

    ws.cell(row=r, column=5, value=l2).font = l2_font
    ws.cell(row=r, column=5).alignment = left_wrap
    ws.cell(row=r, column=5).border = thin_border

    ws.cell(row=r, column=6, value=l3).font = l3_font
    ws.cell(row=r, column=6).alignment = left_wrap
    ws.cell(row=r, column=6).border = thin_border

    ws.cell(row=r, column=7, value=desc).font = Font(name="Arial", size=10, color="444444")
    ws.cell(row=r, column=7).alignment = left_wrap
    ws.cell(row=r, column=7).border = thin_border

    ops_cell = ws.cell(row=r, column=8, value=ops)
    ops_cell.font = Font(name="Arial", size=10, color="2980b9")
    ops_cell.alignment = left_wrap
    ops_cell.border = thin_border

    ws.cell(row=r, column=9, value=fname).font = Font(name="Arial", size=9, color="aaaaaa")
    ws.cell(row=r, column=9).alignment = left_wrap
    ws.cell(row=r, column=9).border = thin_border

    row += 1

ws.row_dimensions[1].height = 28
for r in range(2, row):
    ws.row_dimensions[r].height = 32

# ── Sheet 2: 页面路由索引 ──
ws2 = wb.create_sheet("页面路由索引")
route_headers = ["序号", "页面名称", "状态路由键", "功能分类", "主要模块数", "组件文件", "说明"]
route_widths = [6, 22, 22, 16, 12, 40, 40]

for c, (h, w) in enumerate(zip(route_headers, route_widths), 1):
    cell = ws2.cell(row=1, column=c, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center
    cell.border = thin_border
    ws2.column_dimensions[get_column_letter(c)].width = w

ws2.freeze_panes = "A2"

routes = [
    (1, "登录页", "login", "身份认证", 1, "src/pages/Login.tsx", "用户登录认证"),
    (2, "工作台", "home", "工作台", 8, "src/pages/Home.tsx", "系统总览、统计、快捷入口"),
    (3, "知识库列表", "kb-list", "知识库管理", 6, "src/pages/KnowledgeBase.tsx", "所有知识库的列表管理"),
    (4, "知识库详情(概览Tab)", "kb-detail", "知识库管理", 7, "src/pages/KnowledgeBase.tsx", "知识库概览、统计、趋势"),
    (5, "文档管理", "kb-documents", "知识库管理", 6, "src/pages/KnowledgeBase.tsx", "文档上传、导入、列表管理"),
    (6, "分块预览", "kb-chunks", "知识库管理", 5, "src/pages/KnowledgeBase.tsx", "文档Chunk预览与操作"),
    (7, "索引状态", "kb-index-status", "知识库管理", 4, "src/pages/KnowledgeBase.tsx", "5大索引的状态监控"),
    (8, "知识库设置", "kb-settings", "知识库管理", 9, "src/pages/KBExtra.tsx", "知识库配置(解析/分块/索引/数据源/标签)"),
    (9, "检索测试", "kb-retrieval-test", "知识库管理", 3, "src/pages/KBExtra.tsx", "检索效果调试测试"),
    (10, "Wiki浏览器", "kb-wiki", "知识库管理", 5, "src/pages/KBExtra.tsx", "LLM Wiki页面浏览与编译管理"),
    (11, "PageIndex树", "kb-pageindex-tree", "知识库管理", 4, "src/pages/KBExtra.tsx", "PageIndex树结构与搜索调试"),
    (12, "LLM Wiki管理(全局)", "kb-wiki-manage", "高级功能管理", 5, "src/pages/KBExtra.tsx", "跨KB的Wiki全局管理"),
    (13, "PageIndex管理(全局)", "kb-pageindex-manage", "高级功能管理", 5, "src/pages/KBExtra.tsx", "跨KB的PageIndex全局管理"),
    (14, "智能对话", "chat", "智能应用", 11, "src/pages/Chat.tsx", "RAG对话、流式输出、引用溯源"),
    (15, "搜索应用", "search", "智能应用", 7, "src/pages/SearchAgent.tsx", "搜索工具、AI摘要、思维导图"),
    (16, "Agent编排", "agent", "智能应用", 6, "src/pages/SearchAgent.tsx", "可视化Agent流程编排"),
    (17, "评测仪表盘", "eval-dashboard", "评测中心", 5, "src/pages/Evaluation.tsx", "评测指标总览和趋势"),
    (18, "评测任务", "eval-tasks", "评测中心", 4, "src/pages/Evaluation.tsx", "评测任务创建与管理"),
    (19, "A/B测试", "eval-ab-test", "评测中心", 4, "src/pages/Evaluation.tsx", "A/B对比测试管理"),
    (20, "成本中心", "eval-cost", "评测中心", 4, "src/pages/EvalExtra.tsx", "Token消耗与费用分析"),
    (21, "回放评测", "eval-replay", "评测中心", 5, "src/pages/EvalExtra.tsx", "历史查询回放对比评测"),
    (22, "用户管理", "sys-users", "系统管理", 5, "src/pages/System.tsx", "系统用户管理"),
    (23, "角色权限", "sys-roles", "系统管理", 3, "src/pages/System.tsx", "RBAC角色权限配置"),
    (24, "流水线配置", "sys-pipeline", "系统管理", 4, "src/pages/System.tsx", "全局流水线与路由规则"),
    (25, "审计日志", "sys-audit", "系统管理", 3, "src/pages/System.tsx", "审计日志查询与导出"),
    (26, "系统监控", "sys-monitor", "系统管理", 5, "src/pages/System.tsx", "系统运行监控与告警"),
    (27, "分类器路由", "sys-classifier", "系统管理", 4, "src/pages/SystemExtra.tsx", "分类器配置与测试"),
    (28, "安全合规", "sys-security", "系统管理", 6, "src/pages/SystemExtra.tsx", "投毒检测/PII脱敏/ACL/合规"),
    (29, "模型管理", "sys-models", "系统管理", 4, "src/pages/SystemExtra.tsx", "AI模型提供商管理"),
    (30, "Traces链路追踪", "sys-traces", "系统管理", 3, "src/pages/SystemExtra.tsx", "分布式链路追踪"),
]

for i, (no, name, route, cat, mod_count, fname, desc) in enumerate(routes):
    r = i + 2
    ws2.cell(row=r, column=1, value=no).font = Font(name="Arial", size=10)
    ws2.cell(row=r, column=1).alignment = center
    ws2.cell(row=r, column=1).border = thin_border
    ws2.cell(row=r, column=2, value=name).font = Font(name="Arial", bold=True, size=10)
    ws2.cell(row=r, column=2).alignment = left_wrap
    ws2.cell(row=r, column=2).border = thin_border
    ws2.cell(row=r, column=3, value=route).font = Font(name="Arial", size=10, color="00888888")
    ws2.cell(row=r, column=3).alignment = center
    ws2.cell(row=r, column=3).border = thin_border
    ws2.cell(row=r, column=4, value=cat).font = Font(name="Arial", size=10)
    ws2.cell(row=r, column=4).alignment = center
    ws2.cell(row=r, column=4).border = thin_border
    ws2.cell(row=r, column=5, value=mod_count).font = Font(name="Arial", size=10)
    ws2.cell(row=r, column=5).alignment = center
    ws2.cell(row=r, column=5).border = thin_border
    ws2.cell(row=r, column=6, value=fname).font = Font(name="Arial", size=9, color="00aaaaaa")
    ws2.cell(row=r, column=6).alignment = left_wrap
    ws2.cell(row=r, column=6).border = thin_border
    ws2.cell(row=r, column=7, value=desc).font = Font(name="Arial", size=10)
    ws2.cell(row=r, column=7).alignment = left_wrap
    ws2.cell(row=r, column=7).border = thin_border
    ws2.row_dimensions[r].height = 24

# ── Sheet 3: 功能大类统计 ──
ws3 = wb.create_sheet("功能大类统计")
stat_headers = ["功能大类", "页面数量", "模块总数", "三级功能总数", "覆盖的页面"]
stat_widths = [18, 12, 12, 14, 60]

for c, (h, w) in enumerate(zip(stat_headers, stat_widths), 1):
    cell = ws3.cell(row=1, column=c, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center
    cell.border = thin_border
    ws3.column_dimensions[get_column_letter(c)].width = w

from collections import Counter
cat_counter = Counter()
cat_modules = Counter()
cat_items = Counter()
cat_pages = {}
for cat, _, l1, _, l2, l3, _, _, _ in data:
    cat_counter[cat] += 1
    cat_pages.setdefault(cat, set()).add(l1)

stat_row = 2
for cat in ["身份认证", "工作台", "知识库管理", "高级功能管理", "智能应用", "评测中心", "系统管理"]:
    pages_list = sorted(cat_pages.get(cat, set()))
    ws3.cell(row=stat_row, column=1, value=cat).font = Font(name="Arial", bold=True, size=10, color="1a5276")
    ws3.cell(row=stat_row, column=1).fill = cat_fill_1
    ws3.cell(row=stat_row, column=1).border = thin_border
    # count unique pages
    page_count = len(pages_list)
    ws3.cell(row=stat_row, column=2, value=page_count).font = Font(name="Arial", size=10)
    ws3.cell(row=stat_row, column=2).alignment = center
    ws3.cell(row=stat_row, column=2).border = thin_border
    # count unique l2 modules
    l2_set = set()
    l3_count = 0
    for cat2, _, l1_p, _, l2, l3, _, _, _ in data:
        if cat2 == cat:
            l2_set.add(f"{l1_p}|{l2}")
            l3_count += 1
    ws3.cell(row=stat_row, column=3, value=len(l2_set)).font = Font(name="Arial", size=10)
    ws3.cell(row=stat_row, column=3).alignment = center
    ws3.cell(row=stat_row, column=3).border = thin_border
    ws3.cell(row=stat_row, column=4, value=l3_count).font = Font(name="Arial", size=10)
    ws3.cell(row=stat_row, column=4).alignment = center
    ws3.cell(row=stat_row, column=4).border = thin_border
    ws3.cell(row=stat_row, column=5, value=", ".join(pages_list)).font = Font(name="Arial", size=10)
    ws3.cell(row=stat_row, column=5).alignment = left_wrap
    ws3.cell(row=stat_row, column=5).border = thin_border
    ws3.row_dimensions[stat_row].height = 24
    stat_row += 1

# 合计行
total_pages = len(set(l1 for _, _, l1, _, _, _, _, _, _ in data))
total_l2 = len(set(f"{l1}|{l2}" for _, _, l1, _, l2, _, _, _, _ in data))
total_l3 = len(data)
ws3.cell(row=stat_row, column=1, value="合计").font = Font(name="Arial", bold=True, size=10)
ws3.cell(row=stat_row, column=2, value=30).font = Font(name="Arial", bold=True, size=10)
ws3.cell(row=stat_row, column=2).alignment = center
ws3.cell(row=stat_row, column=3, value=total_l2).font = Font(name="Arial", bold=True, size=10)
ws3.cell(row=stat_row, column=3).alignment = center
ws3.cell(row=stat_row, column=4, value=total_l3).font = Font(name="Arial", bold=True, size=10)
ws3.cell(row=stat_row, column=4).alignment = center
ws3.cell(row=stat_row, column=5, value="全30个页面").font = Font(name="Arial", bold=True, size=10)
for c in range(1, 6):
    ws3.cell(row=stat_row, column=c).border = thin_border
    ws3.cell(row=stat_row, column=c).font = Font(name="Arial", bold=True, size=10)
ws3.row_dimensions[stat_row].height = 28

output = "/opt/www/github/agentic-rag/docs/RAG3.0_前端功能清单.xlsx"
wb.save(output)
print(f"OK: {output}")
print(f"总行数: {len(data)}, 页面: 30, 功能大类: 7")
