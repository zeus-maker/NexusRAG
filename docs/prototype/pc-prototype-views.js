// 各页面视图 HTML 片段
const VIEWS_HTML = `
<!-- 3.1 知识库列表 -->
<section class="view active" id="view-kb-list">
  <div class="page-hd">
    <div><div class="breadcrumb">首页 / 知识库管理</div><h2>知识库管理</h2></div>
    <button class="btn btn-primary" data-modal="modalCreateKB">+ 创建知识库</button>
  </div>
  <div class="toolbar">
    <input class="field" type="search" placeholder="搜索知识库..." style="width:220px">
    <select class="select"><option>全部状态</option><option>活跃</option><option>索引中</option></select>
    <select class="select"><option>最近更新</option><option>文档最多</option></select>
    <span style="margin-left:auto;color:var(--muted);font-size:13px">📊 卡片视图</span>
  </div>
  <div class="kb-grid">
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">📚</div><h4>法务合同知识库</h4><p class="desc">合同、法条、判例</p>
      <div class="stats"><span>156 文档</span><span>12,840 块</span></div>
      <div class="foot"><span class="tag tag-green"><span class="dot dot-green"></span>活跃</span><span>更新 2 小时前</span></div>
    </div>
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">📊</div><h4>财务报告知识库</h4><p class="desc">财报、预算、审计</p>
      <div class="stats"><span>89 文档</span><span>6,230 块</span></div>
      <div class="foot"><span class="tag tag-amber"><span class="dot dot-amber"></span>索引中</span><span>更新 5 分钟前</span></div>
    </div>
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">🔬</div><h4>研发文档知识库</h4><p class="desc">技术文档、SOP</p>
      <div class="stats"><span>234 文档</span><span>18,500 块</span></div>
      <div class="foot"><span class="tag tag-green"><span class="dot dot-green"></span>活跃</span><span>更新 1 天前</span></div>
    </div>
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">📋</div><h4>合规政策知识库</h4><p class="desc">制度、流程</p>
      <div class="stats"><span>45 文档</span><span>3,200 块</span></div>
      <div class="foot"><span class="tag tag-green"><span class="dot dot-green"></span>活跃</span><span>更新 3 天前</span></div>
    </div>
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">📖</div><h4>培训材料知识库</h4><p class="desc">培训课件、手册</p>
      <div class="stats"><span>78 文档</span><span>4,100 块</span></div>
      <div class="foot"><span class="tag tag-green"><span class="dot dot-green"></span>活跃</span><span>更新 1 周前</span></div>
    </div>
    <div class="kb-card" data-view="kb-detail">
      <div class="emoji">🏗️</div><h4>产品手册知识库</h4><p class="desc">产品说明、FAQ</p>
      <div class="stats"><span>112 文档</span><span>7,800 块</span></div>
      <div class="foot"><span class="tag tag-green"><span class="dot dot-green"></span>活跃</span><span>更新 2 天前</span></div>
    </div>
  </div>
  <div class="pagination"><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>›</button></div>
</section>

<!-- 3.2 知识库详情 -->
<section class="view" id="view-kb-detail">
  <div class="page-hd">
    <div>
      <div class="breadcrumb"><a href="#" data-view="kb-list">← 返回</a> / 法务合同知识库</div>
      <h2>法务合同知识库</h2>
    </div>
    <button class="btn">⋮ 更多</button>
  </div>
  <div class="kb-subnav">
    <button class="btn btn-sm active" data-view="kb-detail">概览</button>
    <button class="btn btn-sm" data-view="kb-documents">文件</button>
    <button class="btn btn-sm" data-view="kb-retrieval">检索测试</button>
    <button class="btn btn-sm" data-view="kb-config">配置</button>
    <button class="btn btn-sm" data-view="kb-graph">知识图谱</button>
    <button class="btn btn-sm" data-view="kb-wiki">Wiki</button>
    <button class="btn btn-sm" data-view="kb-pageindex">PageIndex</button>
    <button class="btn btn-sm" data-view="kb-index">索引状态</button>
    <button class="btn btn-sm" data-view="kb-permissions">权限</button>
    <button class="btn btn-sm" data-view="kb-datasource">数据源</button>
  </div>
  <div class="metrics">
    <div class="metric"><div class="label">📄 文档总数</div><div class="value">156</div></div>
    <div class="metric"><div class="label">📦 Chunk 数</div><div class="value">12,840</div></div>
    <div class="metric"><div class="label">💾 存储大小</div><div class="value">500MB</div></div>
    <div class="metric"><div class="label">⭐ 解析质量</div><div class="value">92.5</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
    <div class="card"><div class="card-hd"><h3>近 30 天查询趋势</h3></div><div class="card-bd">
      <div class="chart-bars">
        <div class="chart-bar" style="height:45%" data-m="1月"></div>
        <div class="chart-bar" style="height:60%" data-m="2月"></div>
        <div class="chart-bar" style="height:55%" data-m="3月"></div>
        <div class="chart-bar" style="height:72%" data-m="4月"></div>
        <div class="chart-bar" style="height:68%" data-m="5月"></div>
        <div class="chart-bar" style="height:85%" data-m="6月"></div>
      </div>
    </div></div>
    <div class="card"><div class="card-hd"><h3>文档类型分布</h3></div><div class="card-bd" style="font-size:13px;line-height:2">
      <div class="layer-bar"><span style="width:60px">PDF</span><div class="bar"><span style="width:85%"></span></div><span>85</span></div>
      <div class="layer-bar"><span style="width:60px">DOCX</span><div class="bar"><span style="width:42%"></span></div><span>42</span></div>
      <div class="layer-bar"><span style="width:60px">XLSX</span><div class="bar"><span style="width:18%"></span></div><span>18</span></div>
    </div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div class="card"><div class="card-hd"><h3>最近上传</h3></div><div class="card-bd" style="font-size:13px">
      <p>📄 合同模板 V5.pdf · 2 小时前</p>
      <p>📄 审查报告.pdf · 1 天前</p>
      <p>📊 财务数据.xlsx · 2 天前</p>
    </div></div>
    <div class="card"><div class="card-hd"><h3>高频查询</h3></div><div class="card-bd" style="font-size:13px">
      <p>供应商违约金条款 · 143 次</p>
      <p>知识产权归属模板 · 98 次</p>
      <p>保密协议范围 · 76 次</p>
    </div></div>
  </div>
</section>

<!-- 3.3 文档管理 -->
<section class="view" id="view-kb-documents">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 文档管理</div><h2>文档管理</h2></div>
    <div class="toolbar" style="margin:0"><button class="btn">🔗 URL 导入</button><button class="btn btn-primary">+ 上传</button></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-bd">
    <div class="upload-zone">
      <h3>📂 拖拽文件至此处，或点击选择文件</h3>
      <p>支持 PDF/DOCX/PPTX/XLSX/CSV/TXT/MD/HTML 等 16+ 格式 · 单文件上限 100MB · 批量最多 100 个</p>
      <button class="btn btn-primary">选择文件</button>
    </div>
  </div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>上传队列 (3/5)</h3><button class="btn btn-sm">清空已完成</button></div>
  <div class="card-bd"><table class="table"><thead><tr><th>文件名</th><th>大小</th><th>进度</th><th>状态</th></tr></thead><tbody>
    <tr><td>合同模板 V6.pdf</td><td>2.3MB</td><td><div class="progress"><span style="width:100%"></span></div></td><td><span class="tag tag-green">✅ 完成</span></td></tr>
    <tr><td>审计报告.pdf</td><td>5.0MB</td><td><div class="progress"><span style="width:68%"></span></div></td><td><span class="tag tag-amber">🔄 解析中</span></td></tr>
    <tr><td>数据表.xlsx</td><td>1.2MB</td><td><div class="progress"><span style="width:35%"></span></div></td><td><span class="tag tag-blue">⬆ 上传中</span></td></tr>
  </tbody></table></div></div>
  <div class="toolbar">
    <input class="field" placeholder="搜索文档..." style="width:200px">
    <select class="select"><option>全部类型</option><option>PDF</option><option>DOCX</option></select>
    <select class="select"><option>全部状态</option><option>已解析</option><option>解析中</option></select>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>☐</th><th>文档</th><th>大小</th><th>类型</th><th>状态</th><th>质量</th><th></th></tr></thead><tbody>
    <tr><td>☐</td><td>📄 供应商合同模板 V5.pdf</td><td>2.3MB</td><td>PDF</td><td><span class="tag tag-green">已解析</span></td><td>96</td><td><button class="btn btn-sm" data-view="kb-parse">预览</button></td></tr>
    <tr><td>☐</td><td>📄 2024 合规审查报告.pdf</td><td>5.0MB</td><td>PDF</td><td><span class="tag tag-green">已解析</span></td><td>94</td><td><button class="btn btn-sm" data-view="kb-parse">预览</button></td></tr>
    <tr><td>☐</td><td>📄 采购协议条款.docx</td><td>1.0MB</td><td>DOCX</td><td><span class="tag tag-amber">解析中</span></td><td>--</td><td><button class="btn btn-sm">等待</button></td></tr>
    <tr><td>☐</td><td>📊 财务数据 Q2.xlsx</td><td>0.8MB</td><td>XLSX</td><td><span class="tag tag-red">失败</span></td><td>--</td><td><button class="btn btn-sm btn-danger">重试</button></td></tr>
  </tbody></table></div></div>
</section>

<!-- 3.4 解析预览 -->
<section class="view" id="view-kb-parse">
  <div class="page-hd">
    <div><div class="breadcrumb">供应商合同模板 V5.pdf / 解析预览</div><h2>解析预览</h2></div>
    <div class="toolbar" style="margin:0">
      <span class="tag tag-green">质量 96 分</span>
      <button class="btn btn-sm" data-view="kb-chunks">分块预览</button>
      <button class="btn btn-sm">原始 ↔ 解析</button>
    </div>
  </div>
  <div class="parse-layout">
    <div class="outline">
      <div class="outline-item active">▸ 第一条 定义</div>
      <div class="outline-item">▸ 第二条 权利义务</div>
      <div class="outline-item">▸ 第五条 违约责任</div>
      <div class="outline-item" style="padding-left:20px">└ 5.1 延迟交货</div>
      <div class="outline-item" style="padding-left:20px">└ 5.2 质量违约</div>
      <div class="outline-item">▸ 第八条 保密</div>
    </div>
    <div class="doc-render"><div class="doc-page">
      <div class="layout-box box-title">Title · 第五条 违约责任</div>
      <div class="layout-box box-table">Table · 违约情形与赔付标准</div>
      <p style="margin-top:180px;font-size:13px;color:var(--muted)">5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金...</p>
    </div></div>
    <div class="json-panel"><pre>{
  "type": "h1",
  "text": "第五条 违约责任",
  "page": 3,
  "bbox": [34, 120, 526, 160]
},
{
  "type": "table",
  "rows": [
    ["延迟交货", "日 0.5%", "20%"],
    ["质量不合格", "赔偿损失", "全额"]
  ]
}</pre></div>
  </div>
</section>

<!-- 3.5 分块预览 -->
<section class="view" id="view-kb-chunks">
  <div class="page-hd">
    <div><div class="breadcrumb">供应商合同模板 V5.pdf / 分块预览</div><h2>分块预览</h2></div>
    <button class="btn btn-primary">重新分块</button>
  </div>
  <div class="toolbar">
    <span>分块策略:</span><select class="select"><option>通用</option><option>标题增强</option></select>
    <span>Chunk 大小:</span><select class="select"><option>512</option></select>
    <span>重叠:</span><select class="select"><option>128</option></select>
    <span style="color:var(--muted);font-size:13px">统计: 85 块 | 平均 487 Token | 重叠率 84%</span>
  </div>
  <div class="chunk-item">
    <div class="chunk-hd"><strong>#0 第一条 定义</strong><span>模板分块 · 512 Token</span></div>
    <div class="chunk-bd">"第一条 定义 1.1 供应商系指根据本合同约定向采购方提供货物或服务的法人或其他组织..."</div>
    <div class="chunk-ft"><span class="tag tag-blue">📄 文本</span><span class="tag tag-amber">🔒 internal</span><span>页码: 1</span><button class="btn btn-sm">拆分</button><button class="btn btn-sm">排除</button></div>
  </div>
  <div class="chunk-item">
    <div class="chunk-hd"><strong>#1 第二条 权利义务</strong><span>模板分块 · 508 Token</span></div>
    <div class="chunk-bd">"第二条 权利义务 2.1 采购方有权对供应商提供的货物进行验收..."</div>
    <div class="chunk-ft"><span class="tag tag-blue">📄 文本</span><span>页码: 1-2</span><button class="btn btn-sm">合并↓</button><button class="btn btn-sm">拆分</button></div>
  </div>
  <div class="chunk-item">
    <div class="chunk-hd"><strong>#4 违约金计算表</strong><span>表格分块 · 256 Token</span></div>
    <div class="chunk-bd"><table class="table" style="font-size:12px"><tr><th>类型</th><th>计算标准</th><th>上限</th></tr><tr><td>延迟</td><td>日 0.5%</td><td>20%</td></tr></table></div>
    <div class="chunk-ft"><span class="tag tag-green">📊 表格</span><span>页码: 3</span><button class="btn btn-sm">编辑</button></div>
  </div>
</section>

<!-- 3.6 索引状态 -->
<section class="view" id="view-kb-index">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 索引状态</div><h2>索引状态</h2></div>
    <button class="btn btn-primary">全部重建索引</button>
  </div>
  <div class="index-grid" style="margin-bottom:20px">
    <div class="index-card"><div class="icon">🔢</div><div>向量索引</div><div class="count">154/156</div><div class="progress" style="margin:8px 0"><span style="width:98.7%"></span></div><div class="pct">98.7%</div><div style="font-size:11px;color:var(--muted);margin-top:6px">健康度 98 · 2min 前</div><button class="btn btn-sm" style="margin-top:8px">重试 2</button></div>
    <div class="index-card"><div class="icon">📝</div><div>全文索引</div><div class="count">156/156</div><div class="progress" style="margin:8px 0"><span style="width:100%"></span></div><div class="pct">100%</div><div style="font-size:11px;color:var(--muted);margin-top:6px">健康度 100 · 5min 前</div></div>
    <div class="index-card"><div class="icon">🌳</div><div>PageIdx</div><div class="count">85/156</div><div class="progress" style="margin:8px 0"><span style="width:54.5%"></span></div><div class="pct">54.5%</div><div style="font-size:11px;color:var(--muted);margin-top:6px">健康度 85 · 1h 前</div><button class="btn btn-sm" style="margin-top:8px">重试 12</button></div>
    <div class="index-card"><div class="icon">🔗</div><div>图谱索引</div><div class="count">42/156</div><div class="progress" style="margin:8px 0"><span style="width:26.9%"></span></div><div class="pct">26.9%</div><div style="font-size:11px;color:var(--muted);margin-top:6px">健康度 72 · 3h 前</div><button class="btn btn-sm" style="margin-top:8px">暂停</button></div>
    <div class="index-card"><div class="icon">📖</div><div>Wiki 编译</div><div class="count">12/42</div><div class="progress" style="margin:8px 0"><span style="width:28.6%"></span></div><div class="pct">28.6%</div><div style="font-size:11px;color:var(--muted);margin-top:6px">健康度 60 · 1d 前</div><button class="btn btn-sm" style="margin-top:8px">编译</button></div>
  </div>
  <div class="card"><div class="card-hd"><h3>失败文档列表</h3></div><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>文档</th><th>索引类型</th><th>原因</th><th>操作</th></tr></thead><tbody>
    <tr><td>📄 复杂表格报告.pdf</td><td>向量索引</td><td>嵌入超时</td><td><button class="btn btn-sm">重试</button> <button class="btn btn-sm">跳过</button></td></tr>
    <tr><td>📄 扫描件合同.pdf</td><td>PageIndex</td><td>LLM 超时</td><td><button class="btn btn-sm">重试</button> <button class="btn btn-sm">跳过</button></td></tr>
  </tbody></table></div></div>
</section>

<!-- 4.1 智能对话 -->
<section class="view" id="view-chat">
  <div class="chat-layout">
    <div class="conv-list">
      <button class="btn btn-primary">+ 新对话</button>
      <input class="field" placeholder="🔍 搜索..." style="width:100%;margin-bottom:12px">
      <div class="conv-group">今天</div>
      <button class="conv-item active">📌 合同违约条款查询</button>
      <button class="conv-item">📌 保密协议范围确认</button>
      <div class="conv-group">昨天</div>
      <button class="conv-item">📌 2024 年度合规审查</button>
      <button class="conv-item">📌 数据保护条款</button>
      <div class="conv-group">更早</div>
      <button class="conv-item">📌 知识产权归属</button>
    </div>
    <div class="chat-main">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-weight:500">法务合同知识库</div>
      <div class="chat-msgs">
        <div class="msg msg-user">
          <div class="msg-hd"><span class="msg-title">👤 用户</span><span>09:41</span></div>
          供应商延迟交货的违约金如何计算？
        </div>
        <div class="msg msg-bot">
          <div class="msg-hd">
            <span><span class="msg-title">🤖 RAG 3.0</span> <span class="tag tag-green">置信度 0.92</span> <span class="tag tag-blue">Tier2 · PageIndex</span></span>
            <span>2.1s</span>
          </div>
          根据公司标准采购合同模板（V5）第五条，供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五<span class="citation">[1]</span>向采购方支付违约金。迟延超过 30 日的，采购方有权解除合同<span class="citation">[2]</span>。
          <div class="cite-card"><strong>[1]</strong> 📄 供应商合同模板 V5.pdf P3 · 相关度 95.6% · <a href="#" data-view="kb-parse">查看原文</a></div>
          <div class="cite-card"><strong>[2]</strong> 📄 供应商合同模板 V5.pdf P4 · 相关度 91.2%</div>
          <div class="msg-actions">
            <button class="btn btn-sm">👍</button><button class="btn btn-sm">👎</button>
            <button class="btn btn-sm" data-modal="modalCorrection">✏️ 纠错</button>
          </div>
          <div class="trace-timeline">
            <span class="trace-step">L1 分类器 120ms</span><span class="trace-arrow">→</span>
            <span class="trace-step">L2 路由 45ms</span><span class="trace-arrow">→</span>
            <span class="trace-step">L3 PageIndex+向量 1.4s</span><span class="trace-arrow">→</span>
            <span class="trace-step">L4 RRF精排 360ms</span><span class="trace-arrow">→</span>
            <span class="trace-step">L5 生成 1.1s</span>
          </div>
        </div>
        <div class="msg msg-bot" style="background:#fffbe6;border-color:#ffe58f">
          <div class="msg-hd"><span class="msg-title">💡 试试这样问</span></div>
          <button class="btn btn-sm" style="margin:2px">供应商违约金上限是多少？</button>
          <button class="btn btn-sm" style="margin:2px">对比不同合同的违约条款</button>
        </div>
      </div>
      <div class="chat-input">
        <textarea placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"></textarea>
        <div class="chat-input-ft"><span>⚙️ 📎 · 已选: 法务合同知识库</span><button class="btn btn-primary">发送</button></div>
      </div>
    </div>
  </div>
  <div class="enhance-panel">
    <div class="card-hd"><h3>🔍 查询增强面板</h3><button class="btn btn-sm">收起</button></div>
    <div class="card-bd">
      <p style="font-size:13px;margin-bottom:12px"><strong>📝 查询重写</strong><br>原始: "那个违约的事情怎么赔" → 精确化: "供应商合同模板中违约金的条款有哪些？"</p>
      <div class="enhance-grid">
        <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">复杂度</div><div class="val">Tier 2</div><div class="sub">中等推理</div></div>
        <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">文档类型</div><div class="val">合同/PDF</div></div>
        <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">用户意图</div><div class="val">精确答案</div></div>
        <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">安全分级</div><div class="val">内部</div></div>
      </div>
      <p style="font-size:13px"><strong>🔀 多通道检索</strong><br>通道1: PageIndex (主) Top-5 延迟 520ms · 通道2: 向量检索 (辅) Top-5 延迟 45ms · 融合: RRF + Cross-Encoder 精排</p>
    </div>
  </div>
</section>

<!-- 5.1 评测仪表盘 -->
<section class="view" id="view-eval-dashboard">
  <div class="page-hd">
    <div><div class="breadcrumb">首页 / 评测中心</div><h2>评测中心</h2></div>
    <div class="toolbar" style="margin:0">
      <select class="select"><option>近 30 天</option></select>
      <select class="select"><option>全部知识库</option></select>
    </div>
  </div>
  <div class="metrics">
    <div class="metric"><div class="label">🎯 Faithfulness</div><div class="value">0.92</div><div class="trend">↑ +0.03</div></div>
    <div class="metric"><div class="label">📐 Context Precision</div><div class="value">0.88</div><div class="trend">↑ +0.01</div></div>
    <div class="metric"><div class="label">📊 Answer Relevancy</div><div class="value">0.91</div><div class="trend" style="color:var(--amber)">↓ -0.02</div></div>
    <div class="metric"><div class="label">⚠️ Hallucination</div><div class="value">0.04</div><div class="trend">↓ -0.01</div></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>核心指标趋势</h3><div><button class="btn btn-sm">日</button><button class="btn btn-sm">周</button><button class="btn btn-sm btn-primary">月</button></div></div>
  <div class="card-bd"><div class="chart-bars" style="height:160px">
    <div class="chart-bar" style="height:82%" data-m="1月"></div><div class="chart-bar" style="height:85%" data-m="2月"></div>
    <div class="chart-bar" style="height:88%" data-m="3月"></div><div class="chart-bar" style="height:86%" data-m="4月"></div>
    <div class="chart-bar" style="height:90%" data-m="5月"></div><div class="chart-bar" style="height:92%" data-m="6月"></div>
  </div></div></div>
  <div class="card"><div class="card-hd"><h3>分层评测</h3></div><div class="card-bd">
    <div class="layer-bar"><span style="width:80px">文档级</span><div class="bar"><span style="width:92%"></span></div><span>92% 解析质量</span></div>
    <div class="layer-bar"><span style="width:80px">块级</span><div class="bar"><span style="width:88%"></span></div><span>88% 分块合理性</span></div>
    <div class="layer-bar"><span style="width:80px">检索级</span><div class="bar"><span style="width:82%"></span></div><span>82% Recall@10</span></div>
    <div class="layer-bar"><span style="width:80px">生成级</span><div class="bar"><span style="width:92%"></span></div><span>92% Faithfulness</span></div>
    <div class="layer-bar"><span style="width:80px">端到端</span><div class="bar"><span style="width:86%"></span></div><span>86% 综合评分</span></div>
  </div></div>
</section>

<!-- 5.2 评测任务 -->
<section class="view" id="view-eval-tasks">
  <div class="page-hd">
    <div><div class="breadcrumb">评测中心 / 评测任务</div><h2>评测任务管理</h2></div>
    <button class="btn btn-primary" data-modal="modalCreateEval">+ 创建评测任务</button>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>评测名称</th><th>知识库</th><th>状态</th><th>综合评分</th><th>耗时</th><th>时间</th><th></th></tr></thead><tbody>
    <tr><td>6月 Faithfulness 回归评测</td><td>法务合同</td><td><span class="tag tag-green">✅ 完成</span></td><td>0.92</td><td>12min</td><td>2026-06-05</td><td><button class="btn btn-sm">详情</button></td></tr>
    <tr><td>Q2 检索质量评测</td><td>研发文档</td><td><span class="tag tag-amber">🔄 运行中</span></td><td>--</td><td>--</td><td>2026-06-06</td><td><button class="btn btn-sm">查看</button></td></tr>
    <tr><td>跨库查询评测</td><td>全部</td><td><span class="tag tag-blue">排队中</span></td><td>--</td><td>--</td><td>2026-06-06</td><td><button class="btn btn-sm">取消</button></td></tr>
  </tbody></table></div></div>
  <div class="card" style="margin-top:16px"><div class="card-hd"><h3>评测结果: 6月 Faithfulness 回归评测</h3><span class="tag tag-green">✅ 完成 · 500 条 · 12min</span></div><div class="card-bd" style="font-size:13px">
    <p>Faithfulness: 0.92 ↑0.03 ✅ · Context Precision: 0.88 ↑0.01 ✅ · Answer Relevancy: 0.91 ↓0.02 ⚠️</p>
    <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
    <p><strong>失败案例 #1</strong> 查询: "供应商保密义务范围" · 期望: 第 8.1-8.5 条 · 实际: 引用 V4 过期条款 · Faithfulness: 0.45</p>
    <p><strong>失败案例 #2</strong> 查询: "延迟交货违约金上限" · 期望: 合同金额 20% · 实际: "不超过 30%" · Faithfulness: 0.52</p>
  </div></div>
</section>

<!-- 5.3 A/B 测试 -->
<section class="view" id="view-eval-ab">
  <div class="page-hd">
    <div><div class="breadcrumb">评测中心 / A/B 测试</div><h2>A/B 测试</h2></div>
    <button class="btn btn-primary">+ 创建测试</button>
  </div>
  <div class="ab-card">
    <h3>🧪 BGE-M3 vs BCE-Embedding 嵌入模型对比</h3>
    <p style="color:var(--muted);font-size:13px;margin:8px 0">状态: <span class="tag tag-green">🟢 运行中</span> · 流量 50/50 · 已运行 3 天</p>
    <div class="ab-variants">
      <div class="ab-variant"><h4>Variant A (BGE-M3)</h4>
        <p>Faithfulness: 0.92</p><p>Recall@10: 0.85</p><p>P95 延迟: 1.8s</p><p>样本量: 1,250</p>
      </div>
      <div class="ab-variant"><h4>Variant B (BCE-Embedding)</h4>
        <p>Faithfulness: 0.89</p><p>Recall@10: 0.83</p><p>P95 延迟: 1.5s</p><p>样本量: 1,248</p>
      </div>
    </div>
    <p style="font-size:13px">统计显著性: p=0.032 ✅ 达到 95% 置信度</p>
    <div class="toolbar" style="margin:12px 0 0"><button class="btn btn-sm">查看详情</button><button class="btn btn-sm">停止测试</button><button class="btn btn-sm btn-primary">全量切换到 A</button></div>
  </div>
  <div class="card"><div class="card-hd"><h3>历史测试</h3></div><div class="card-bd" style="font-size:13px">
    <p>DeepDoc vs MinerU 解析引擎对比 · ✅ 已完成 · 6月1日-6月3日 · 胜出: DeepDoc (Faithfulness +0.04) <button class="btn btn-sm">查看报告</button></p>
  </div></div>
</section>

<!-- 6.1 用户管理 -->
<section class="view" id="view-sys-users">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 用户管理</div><h2>用户管理</h2></div>
    <button class="btn btn-primary">+ 添加用户</button>
  </div>
  <div class="toolbar">
    <input class="field" placeholder="搜索用户..." style="width:200px">
    <select class="select"><option>全部角色</option></select>
    <select class="select"><option>全部部门</option></select>
    <select class="select"><option>全部状态</option></select>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>☐</th><th>姓名</th><th>邮箱</th><th>部门</th><th>角色</th><th>状态</th><th></th></tr></thead><tbody>
    <tr><td>☐</td><td>张伟</td><td>zhang.wei@</td><td>法务部</td><td>知识库管理员</td><td><span class="tag tag-green">活跃</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
    <tr><td>☐</td><td>李婷</td><td>li.ting@</td><td>AI 平台</td><td>平台管理员</td><td><span class="tag tag-green">活跃</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
    <tr><td>☐</td><td>陈工</td><td>chen.gong@</td><td>算法组</td><td>开发者</td><td><span class="tag tag-green">活跃</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
    <tr><td>☐</td><td>王芳</td><td>wang.fang@</td><td>知识管理</td><td>知识库管理员</td><td><span class="tag tag-green">活跃</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
  </tbody></table></div></div>
  <p style="margin-top:12px;font-size:13px;color:var(--muted)">批量操作: <button class="btn btn-sm">分配角色</button> <button class="btn btn-sm">修改密级</button> <button class="btn btn-sm btn-danger">禁用</button></p>
</section>

<!-- 6.1 角色管理 -->
<section class="view" id="view-sys-roles">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 角色管理</div><h2>角色管理</h2></div>
    <button class="btn btn-primary">+ 创建角色</button>
  </div>
  <p style="font-size:13px;color:var(--muted);margin-bottom:12px">系统角色</p>
  <div class="role-grid" style="margin-bottom:20px">
    <div class="role-card"><div>超级管理员</div><div class="count">3</div><div style="font-size:12px;color:var(--muted)">人</div></div>
    <div class="role-card"><div>平台管理员</div><div class="count">2</div><div style="font-size:12px;color:var(--muted)">人</div></div>
    <div class="role-card"><div>知识库管理员</div><div class="count">5</div><div style="font-size:12px;color:var(--muted)">人</div></div>
    <div class="role-card"><div>开发者</div><div class="count">8</div><div style="font-size:12px;color:var(--muted)">人</div></div>
  </div>
  <p style="font-size:13px;color:var(--muted);margin-bottom:12px">自定义角色</p>
  <div class="role-grid" style="grid-template-columns:repeat(2,1fr);max-width:400px">
    <div class="role-card"><div>法务主管</div><div class="count">2</div></div>
    <div class="role-card"><div>日志审计</div><div class="count">1</div></div>
  </div>
  <div class="card" style="margin-top:20px"><div class="card-hd"><h3>ACL 规则配置 — 法务合同知识库</h3><button class="btn btn-sm">+ 添加规则</button></div><div class="card-bd" style="font-size:13px;line-height:1.8">
    <p><strong>#1 高管可看全部</strong> · 角色=executive · read · confidentiality IN (public, internal, confidential, restricted) · <span class="tag tag-green">启用</span></p>
    <p><strong>#2 财务分析师可看内部及以下</strong> · 角色=finance_analyst · confidentiality != restricted · <span class="tag tag-green">启用</span></p>
    <p><strong>#3 实习生仅可看公开</strong> · 角色=intern · confidentiality == public · <span class="tag tag-green">启用</span></p>
  </div></div>
</section>

<!-- 6.2 流水线配置 -->
<section class="view" id="view-sys-pipeline">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 流水线配置</div><h2>流水线配置 — 法务合同知识库</h2></div>
    <button class="btn btn-primary">保存配置</button>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>五大流水线开关</h3></div><div class="card-bd">
    <div class="pipeline-item"><span class="name">P1 向量检索流水线</span><div class="switch"></div><button class="btn btn-sm">配置</button></div>
    <div class="pipeline-item"><span class="name">P2 PageIndex 流水线</span><div class="switch"></div><button class="btn btn-sm">配置</button></div>
    <div class="pipeline-item"><span class="name">P3 GraphRAG 流水线</span><div class="switch" style="background:var(--amber)"></div><span class="tag tag-amber">仅索引</span><button class="btn btn-sm">配置</button></div>
    <div class="pipeline-item"><span class="name">P4 LLM Wiki 流水线</span><div class="switch off"></div><button class="btn btn-sm">配置</button></div>
    <div class="pipeline-item"><span class="name">P5 Agent 工具流水线</span><div class="switch off"></div><button class="btn btn-sm">配置</button></div>
  </div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>模型配置</h3></div><div class="card-bd">
    <div class="form-row" style="margin-bottom:12px"><div class="form-item"><label>嵌入模型</label><select class="select" style="width:100%"><option>BAAI/bge-m3</option></select></div>
    <div class="form-item"><label>LLM 模型</label><select class="select" style="width:100%"><option>deepseek-v4</option></select></div></div>
    <div class="form-row"><div class="form-item"><label>Reranker</label><select class="select" style="width:100%"><option>BAAI/bge-reranker-v2-m3</option></select></div>
    <div class="form-item"><label>分类器</label><select class="select" style="width:100%"><option>gpt-4o-mini</option></select></div></div>
  </div></div>
  <div class="card"><div class="card-hd"><h3>路由规则</h3><button class="btn btn-sm">+ 添加规则</button></div><div class="card-bd" style="font-size:13px;line-height:2">
    <p>Tier1 + 财报 + 精确答案 → Wiki + 向量</p>
    <p>Tier2 + 财报 + 数据分析 → PageIndex + 向量</p>
    <p>Tier3 + 合同 + 综合分析 → PageIndex + 图谱</p>
    <p>Tier4 + 全部 + 策略建议 → Agent + 向量 + 图谱</p>
  </div></div>
</section>

<!-- 6.3 审计日志 -->
<section class="view" id="view-sys-audit">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 审计日志</div><h2>审计日志</h2></div>
    <button class="btn btn-primary">导出 CSV</button>
  </div>
  <div class="toolbar">
    <span>时间范围:</span><input class="field" type="date" value="2026-06-01"><span>~</span><input class="field" type="date" value="2026-06-06">
    <select class="select"><option>全部操作者</option></select>
    <select class="select"><option>全部操作类型</option></select>
    <select class="select"><option>全部资源</option></select>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>时间</th><th>用户</th><th>操作</th><th>资源</th><th>IP</th></tr></thead><tbody>
    <tr><td>2026-06-06 10:30</td><td>张伟</td><td>查询</td><td>kb_法务合同</td><td>10.0.1.5</td></tr>
    <tr><td>2026-06-06 10:28</td><td>王芳</td><td>上传文档</td><td>doc_合同 V6</td><td>10.0.2.3</td></tr>
    <tr><td>2026-06-06 10:15</td><td>李婷</td><td>修改配置</td><td>pipeline_P1</td><td>10.0.1.8</td></tr>
    <tr><td>2026-06-06 09:55</td><td>陈工</td><td>API 调用</td><td>kb_研发文档</td><td>10.0.3.12</td></tr>
    <tr><td>2026-06-06 09:30</td><td>张伟</td><td>删除文档</td><td>doc_旧合同</td><td>10.0.1.5</td></tr>
  </tbody></table></div></div>
  <div class="pagination"><button>‹</button><button class="active">1</button><button>2</button><button>›</button></div>
</section>

<!-- 6.4 系统监控 -->
<section class="view" id="view-sys-monitor">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 系统监控</div><h2>系统监控</h2></div>
    <select class="select"><option>近 24 小时</option><option>近 7 天</option></select>
  </div>
  <div class="metrics">
    <div class="metric"><div class="label">QPS</div><div class="value">1,250/s</div><div class="trend">↑ +15%</div></div>
    <div class="metric"><div class="label">P95 延迟</div><div class="value">1.8s</div><div class="trend">↓ -0.2s</div></div>
    <div class="metric"><div class="label">错误率</div><div class="value">0.3%</div><div class="trend">稳定</div></div>
    <div class="metric"><div class="label">GPU 利用率</div><div class="value">78%</div><div class="trend">↑ +5%</div></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>流水线延迟分布</h3></div><div class="card-bd">
    <div class="layer-bar"><span style="width:100px">P1 向量</span><div class="bar"><span style="width:45%"></span></div><span>平均 450ms</span></div>
    <div class="layer-bar"><span style="width:100px">P2 PageIdx</span><div class="bar"><span style="width:52%"></span></div><span>平均 520ms</span></div>
    <div class="layer-bar"><span style="width:100px">P3 GraphRAG</span><div class="bar"><span style="width:72%"></span></div><span>平均 1.2s</span></div>
    <div class="layer-bar"><span style="width:100px">P4 Wiki</span><div class="bar"><span style="width:18%"></span></div><span>平均 180ms</span></div>
    <div class="layer-bar"><span style="width:100px">P5 Agent</span><div class="bar"><span style="width:95%"></span></div><span>平均 3.5s</span></div>
  </div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>LLM Token 消耗 & 成本</h3></div><div class="card-bd" style="font-size:13px">
    <p>今日: 2.5M tokens · ¥38.5 · 本月: 45M tokens · ¥680</p>
    <p>模型分布: DeepSeek 68% | Qwen3 22% | Claude 10%</p>
  </div></div>
  <div class="card"><div class="card-hd"><h3>告警规则</h3><button class="btn btn-sm">+ 添加</button></div><div class="card-bd" style="font-size:13px;line-height:2.2">
    <p><span class="tag tag-red">P0</span> Faithfulness 突降 30%+ → 电话+企微 <button class="btn btn-sm">编辑</button></p>
    <p><span class="tag tag-amber">P1</span> P95 延迟 &gt; 10s → 企微 <button class="btn btn-sm">编辑</button></p>
    <p><span class="tag tag-blue">P2</span> 日成本 &gt; ¥500 → 邮件+Jira <button class="btn btn-sm">编辑</button></p>
  </div></div>
</section>
`;
