// 扩展页面视图（§10 RAGFlow兼容层 + §11 RAG3.0增强层）
const VIEWS_HTML_EXT = `
<!-- 10.2 首页工作台 -->
<section class="view active" id="view-home">
  <div class="page-hd">
    <div><h2>欢迎回来，李婷 👋</h2><p>2026年6月6日星期六 · 企业级 RAG 3.0 工作台</p></div>
    <button class="btn btn-primary" data-modal="modalCreateKB">+ 创建知识库</button>
  </div>
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="stat-card"><div class="stat-icon blue">📄</div><div><div class="stat-val">12,486</div><div class="stat-lbl">文档总数 · +18.7%</div></div></div>
    <div class="stat-card"><div class="stat-icon purple">📦</div><div><div class="stat-val">1.86M</div><div class="stat-lbl">Chunk 已向量化</div></div></div>
    <div class="stat-card"><div class="stat-icon green">📈</div><div><div class="stat-val">45,200</div><div class="stat-lbl">本月查询</div></div></div>
    <div class="stat-card"><div class="stat-icon amber">🎯</div><div><div class="stat-val">94.2%</div><div class="stat-lbl">7天命中率</div></div></div>
  </div>
  <div class="card" style="margin-bottom:20px"><div class="card-hd"><h3>RAG 3.0 索引运营</h3><button class="btn btn-sm" data-view="sys-monitor">查看全部 →</button></div><div class="card-bd" style="font-size:13px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    <div><strong>Wiki 编译中</strong><br><span style="color:var(--amber)">3 库 · 12 页</span></div>
    <div><strong>PageIndex 失败</strong><br><span style="color:var(--red)">2 文档</span> <button class="btn btn-sm" data-view="kb-pageindex">处理</button></div>
    <div><strong>GraphRAG 建索引</strong><br><span style="color:var(--amber)">3 队列</span> <button class="btn btn-sm" data-view="kb-graphrag">管理</button></div>
  </div></div>
  <p style="font-size:13px;color:var(--muted);margin-bottom:10px">最近知识库</p>
  <div class="kb-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="kb-card" data-view="kb-detail"><div class="emoji">📚</div><h4>法务合同</h4><p class="desc">156 文档</p></div>
    <div class="kb-card" data-view="kb-detail"><div class="emoji">📊</div><h4>财务报告</h4><p class="desc">89 文档</p></div>
    <div class="kb-card" data-view="kb-detail"><div class="emoji">🔬</div><h4>研发文档</h4><p class="desc">234 文档</p></div>
    <div class="kb-card" data-view="kb-list"><div class="emoji">➕</div><h4>查看全部</h4></div>
  </div>
  <p style="font-size:13px;color:var(--muted);margin-bottom:10px">应用快捷入口</p>
  <div class="home-apps">
    <div class="home-app" data-view="chat"><div class="icon">💬</div><div>新建对话</div></div>
    <div class="home-app" data-view="search"><div class="icon">🔍</div><div>新建搜索</div></div>
    <div class="home-app" data-view="agent"><div class="icon">🤖</div><div>新建 Agent</div></div>
    <div class="home-app" data-view="eval-tasks"><div class="icon">📊</div><div>启动评测</div></div>
  </div>
</section>

<!-- 10.4 知识库配置 -->
<section class="view" id="view-kb-config">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 配置</div><h2>知识库配置</h2></div>
    <button class="btn btn-primary">保存配置</button>
  </div>
  <div class="kb-subnav">
    <button class="btn btn-sm" data-view="kb-detail">概览</button>
    <button class="btn btn-sm" data-view="kb-documents">文件</button>
    <button class="btn btn-sm" data-view="kb-retrieval">检索测试</button>
    <button class="btn btn-sm active" data-view="kb-config">配置</button>
    <button class="btn btn-sm" data-view="kb-graphrag">知识图谱</button>
    <button class="btn btn-sm" data-view="kb-wiki">Wiki</button>
    <button class="btn btn-sm" data-view="kb-pageindex">PageIndex</button>
    <button class="btn btn-sm" data-view="kb-index">索引状态</button>
    <button class="btn btn-sm" data-view="kb-permissions">权限</button>
    <button class="btn btn-sm" data-view="kb-datasource">数据源</button>
  </div>
  <div class="tabs"><button class="tab active">基础信息</button><button class="tab">解析分块</button><button class="tab">全局索引</button><button class="tab">标签元数据</button></div>
  <div class="config-section"><h4>解析类型</h4>
    <label style="margin-right:16px"><input type="radio" checked> Built-in</label>
    <label><input type="radio"> Data Pipeline</label>
  </div>
  <div class="config-section"><h4>分块与嵌入</h4>
    <div class="form-row" style="margin-bottom:10px">
      <div class="form-item"><label>分块方法</label><select class="select" style="width:100%"><option>General (naive)</option><option>Q&A</option><option>Paper</option><option>Laws</option><option>Book</option><option>Table</option><option>Presentation</option><option>Knowledge Graph</option></select></div>
      <div class="form-item"><label>布局识别</label><select class="select" style="width:100%"><option>DeepDOC</option><option>Plain Text</option><option>MinerU</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-item"><label>Chunk Token</label><input class="field" style="width:100%;height:32px" value="512"></div>
      <div class="form-item"><label>重叠比例</label><input class="field" style="width:100%;height:32px" value="0.1"></div>
      <div class="form-item"><label>嵌入模型</label><select class="select" style="width:100%"><option>BGE-M3</option></select></div>
      <div class="form-item"><label>权限</label><select class="select" style="width:100%"><option>团队</option><option>仅自己</option></select></div>
    </div>
  </div>
  <div class="config-section"><h4>GraphRAG <span class="tag tag-green">LazyGraphRAG 启用</span></h4>
    <div class="form-row">
      <div class="form-item"><label>模式</label><select class="select" style="width:100%"><option>LazyGraphRAG</option><option>GraphRAG 全量</option><option>LightRAG</option></select></div>
      <div class="form-item"><label>实体类型</label><input class="field" style="width:100%;height:32px" value="ORG, PERSON, CLAUSE"></div>
      <div class="form-item"><label>LLM</label><select class="select" style="width:100%"><option>DeepSeek-v4</option></select></div>
    </div>
    <button class="btn btn-sm btn-primary" data-view="kb-graphrag">进入 GraphRAG Hub →</button> <button class="btn btn-sm" data-view="kb-logs">查看日志</button>
  </div>
  <div class="config-section"><h4>RAPTOR <span class="tag tag-red">禁用</span></h4>
    <p style="font-size:13px;color:var(--muted)">max_token / threshold / clustering_method 参数（启用后展开）</p>
  </div>
</section>

<!-- 10.5 检索测试 -->
<section class="view" id="view-kb-retrieval">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 检索测试</div><h2>检索测试</h2></div>
  </div>
  <div class="kb-subnav">
    <button class="btn btn-sm" data-view="kb-documents">文件</button>
    <button class="btn btn-sm active" data-view="kb-retrieval">检索测试</button>
    <button class="btn btn-sm" data-view="kb-config">配置</button>
    <button class="btn btn-sm" data-view="kb-graphrag">知识图谱</button>
    <button class="btn btn-sm" data-view="kb-wiki">Wiki</button>
  </div>
  <div class="retrieval-layout">
    <div class="card"><div class="card-hd"><h3>测试配置</h3></div><div class="card-bd">
      <div class="form-item"><label>测试问题</label><textarea class="field">供应商延迟交货违约金如何计算？</textarea></div>
      <div class="form-item"><label>相似度阈值</label><input class="field" style="width:100%;height:32px" value="0.2"></div>
      <div class="form-item"><label>向量权重</label><input class="field" style="width:100%;height:32px" value="0.7"></div>
      <label style="display:block;margin:8px 0"><input type="checkbox" checked> 启用 Rerank</label>
      <select class="select" style="width:100%;margin-bottom:8px"><option>BGE-Reranker-v2-m3</option></select>
      <label style="display:block;margin:8px 0"><input type="checkbox" checked> 知识图谱检索</label>
      <label style="display:block;margin:8px 0"><input type="checkbox"> 跨语言 [zh, en]</label>
      <button class="btn btn-primary" style="width:100%;margin-top:8px">执行检索</button>
    </div></div>
    <div class="card"><div class="card-hd"><h3>检索结果 Top-5</h3></div><div class="card-bd">
      <div class="result-item"><span class="score">0.956</span><strong>#1</strong> 供应商合同模板 V5.pdf · P3 · 第五条违约责任</div>
      <div class="result-item"><span class="score">0.867</span><strong>#2</strong> 采购协议条款.docx · P8</div>
      <div class="result-item"><span class="score">0.812</span><strong>#3</strong> 标准采购合同模板 V4.2.pdf · P12</div>
      <div class="result-item"><span class="score">0.745</span><strong>#4</strong> 合规审查报告.pdf · P5</div>
      <div class="result-item"><span class="score">0.698</span><strong>#5</strong> 合同条款对照表.xlsx · Sheet2</div>
    </div></div>
  </div>
</section>

<!-- 11.1 Wiki Hub -->
<section class="view" id="view-kb-wiki">
  <div class="kb-layout">
    <nav class="kb-sidenav" data-kb-nav="kb-wiki"></nav>
    <div class="kb-content">
  <div class="page-hd compact">
    <div><div class="breadcrumb">法务合同知识库 / Wiki Hub</div><h2>LLM Wiki 知识编译</h2></div>
    <div class="toolbar" style="margin:0"><button class="btn btn-sm">编译队列 3</button><button class="btn btn-primary">触发全量编译</button></div>
  </div>
  <div class="hub-tabs">
    <button class="hub-tab active">浏览器</button>
    <button class="hub-tab">编译队列</button>
    <button class="hub-tab">编译设置</button>
    <button class="hub-tab">统计</button>
  </div>
  <div class="tabs"><button class="tab">Layer1 原始资料</button><button class="tab active">Layer2 实体概念</button><button class="tab">Layer3 综合分析</button></div>
  <div class="split-layout">
    <div class="wiki-tree">
      <div style="font-weight:600;margin-bottom:8px">📁 实体</div>
      <div>▸ 供应商</div>
      <div style="padding-left:12px;color:var(--primary)">● 供应商违约金</div>
      <div style="padding-left:12px">○ 采购方</div>
      <div>▸ 合同条款</div>
      <div style="font-weight:600;margin:12px 0 8px">📁 概念</div>
      <div>○ 违约责任</div>
      <div>○ 保密义务</div>
    </div>
    <div class="wiki-content">
      <h3>[[供应商违约金]]</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">状态: <span class="tag tag-green">已发布</span> · 命中率 31% · 最后编译 2h 前</p>
      <h4>概述</h4>
      <p>供应商违约金按日 0.5% 计算，累计上限为合同总额 20%。迟延超过 30 日采购方有权解除合同。</p>
      <h4 style="margin-top:14px">关键数据</h4>
      <table class="table" style="font-size:13px"><tr><th>类型</th><th>标准</th><th>上限</th></tr><tr><td>延迟交货</td><td>日 0.5%</td><td>20%</td></tr></table>
      <p style="margin-top:14px"><strong>引用来源</strong> → 供应商合同模板 V5.pdf P3</p>
      <p><strong>相关页面</strong> → <span class="wiki-link">[[合同解除]]</span> · <span class="wiki-link">[[保密义务]]</span></p>
      <div class="toolbar" style="margin-top:16px"><button class="btn btn-sm">编辑</button><button class="btn btn-sm">版本历史</button><button class="btn btn-sm btn-primary">审核通过</button></div>
    </div>
  </div>
    </div>
  </div>
</section>

<!-- 11.2 PageIndex Hub -->
<section class="view" id="view-kb-pageindex">
  <div class="kb-layout">
    <nav class="kb-sidenav" data-kb-nav="kb-pageindex"></nav>
    <div class="kb-content">
  <div class="page-hd compact">
    <div><div class="breadcrumb">法务合同知识库 / PageIndex Hub</div><h2>PageIndex 树索引</h2></div>
    <button class="btn">批量重建</button>
  </div>
  <div class="hub-tabs">
    <button class="hub-tab active">概览</button>
    <button class="hub-tab">文档列表</button>
    <button class="hub-tab">设置</button>
  </div>
  <div class="split-layout">
    <div class="wiki-tree">
      <div style="font-weight:600">🌳 树结构</div>
      <div>▾ 文档根</div>
      <div style="padding-left:12px">├ 第一条 定义</div>
      <div style="padding-left:12px">├ 第五条 违约责任</div>
      <div style="padding-left:24px">│ ├ 5.1 延迟交货</div>
      <div style="padding-left:24px;color:var(--primary)">│ └ 5.2 质量违约 ★</div>
      <div style="padding-left:12px">└ 第八条 保密</div>
      <p style="margin-top:12px;font-size:12px;color:var(--muted)">节点数: 85 · 覆盖率 54.5%</p>
    </div>
    <div class="card"><div class="card-hd"><h3>树搜索调试</h3></div><div class="card-bd">
      <div class="form-item"><label>测试查询</label><input class="field" style="width:100%;height:36px" value="违约金如何计算"></div>
      <button class="btn btn-primary">执行树搜索</button>
      <div style="margin-top:16px;font-size:13px;line-height:1.8">
        <p><strong>推理路径:</strong></p>
        <p>1. 扫描目录 → 命中「第五条 违约责任」</p>
        <p>2. 定位子节点 5.1 → Page 3, bbox [34,120,526,160]</p>
        <p>3. 返回节点 Token: 512 · 相关度 0.98</p>
      </div>
    </div></div>
  </div>
    </div>
  </div>
</section>

<!-- 权限 Tab -->
<section class="view" id="view-kb-permissions">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 权限</div><h2>权限管理</h2></div>
    <button class="btn btn-primary">+ 添加 ACL 规则</button>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>团队权限</h3></div><div class="card-bd">
    <label style="margin-right:20px"><input type="radio"> 仅自己 (me)</label>
    <label><input type="radio" checked> 团队可见 (team)</label>
  </div></div>
  <div class="card"><div class="card-hd"><h3>Chunk 级 ACL 规则</h3><button class="btn btn-sm">ACL 模拟器</button></div><div class="card-bd" style="font-size:13px;line-height:2">
    <p><strong>#1 高管可看全部</strong> · role=executive · read · <span class="tag tag-green">启用</span></p>
    <p><strong>#2 财务分析师</strong> · role=finance_analyst · confidentiality != restricted · <span class="tag tag-green">启用</span></p>
    <p><strong>#3 实习生仅公开</strong> · role=intern · confidentiality == public · <span class="tag tag-green">启用</span></p>
  </div></div>
</section>

<!-- 数据源绑定 -->
<section class="view" id="view-kb-datasource">
  <div class="page-hd">
    <div><div class="breadcrumb">法务合同知识库 / 数据源</div><h2>外部数据源同步</h2></div>
    <button class="btn btn-primary">+ 绑定数据源</button>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>数据源</th><th>路径/空间</th><th>同步频率</th><th>上次同步</th><th>状态</th><th></th></tr></thead><tbody>
    <tr><td>📦 S3 / legal-contracts</td><td>contracts/2026/</td><td>每天</td><td>2h 前</td><td><span class="tag tag-green">成功 12 份</span></td><td><button class="btn btn-sm">同步</button></td></tr>
    <tr><td>📘 Confluence</td><td>法务空间 / 合同模板</td><td>每小时</td><td>36min 前</td><td><span class="tag tag-amber">失败 1 份</span></td><td><button class="btn btn-sm">重试</button></td></tr>
  </tbody></table></div></div>
</section>

<!-- 10.6 搜索应用 -->
<section class="view" id="view-search">
  <div class="page-hd">
    <div><div class="breadcrumb">搜索应用</div><h2>企业合同搜索</h2></div>
    <button class="btn">设置</button>
  </div>
  <div style="text-align:center;padding:40px 0">
    <h2 style="margin-bottom:20px">🔍 企业合同知识搜索</h2>
    <input class="field" style="width:60%;max-width:560px;height:44px;font-size:16px" placeholder="输入搜索关键词...">
    <p style="margin-top:12px;color:var(--muted);font-size:13px">关联知识库: 法务合同 + 合规政策 · AI 摘要已启用</p>
  </div>
  <div class="card"><div class="card-hd"><h3>最近搜索结果示例</h3></div><div class="card-bd" style="font-size:13px">
    <p><strong>供应商违约金</strong> — 3 条结果 · 含 AI 摘要 · 相关搜索: 违约金上限, 合同解除条件</p>
  </div></div>
</section>

<!-- 10.7 Agent 编辑器 -->
<section class="view" id="view-agent">
  <div class="page-hd">
    <div><div class="breadcrumb">Agent / 合同审查流水线</div><h2>Agent 编辑器</h2></div>
    <div class="toolbar" style="margin:0"><button class="btn">保存</button><button class="btn btn-primary">运行</button><button class="btn">发布</button></div>
  </div>
  <div class="agent-canvas">
    <div class="agent-node" style="top:40px;left:40px">Begin</div>
    <div class="agent-node" style="top:40px;left:200px">分类器<br>Tier2</div>
    <div class="agent-node" style="top:40px;left:360px">PageIndex<br>检索</div>
    <div class="agent-node" style="top:40px;left:520px">向量<br>检索</div>
    <div class="agent-node" style="top:140px;left:360px">RRF<br>融合</div>
    <div class="agent-node" style="top:140px;left:520px">LLM<br>生成</div>
    <div class="agent-node" style="top:240px;left:440px">引用<br>审计</div>
    <p style="position:absolute;bottom:12px;left:12px;font-size:12px;color:var(--muted)">Pipeline 模式 · 含 RAG 3.0 扩展节点: 路由决策 / Wiki 读取 / PageIndex 树搜索</p>
  </div>
</section>

<!-- 11.3 分类器路由 -->
<section class="view" id="view-sys-classifier">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 分类器路由</div><h2>复杂分类器路由配置</h2></div>
    <div class="toolbar" style="margin:0"><button class="btn">测试</button><button class="btn btn-primary">保存</button></div>
  </div>
  <div class="enhance-grid" style="margin-bottom:20px">
    <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">查询复杂度</div><div class="val">Tier 1-4</div><button class="btn btn-sm" style="margin-top:6px">配置</button></div>
    <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">文档类型</div><div class="val">12 种</div><button class="btn btn-sm" style="margin-top:6px">配置</button></div>
    <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">用户意图</div><div class="val">6 种</div><button class="btn btn-sm" style="margin-top:6px">配置</button></div>
    <div class="enhance-box"><div style="font-size:12px;color:var(--muted)">安全分级</div><div class="val">4 级</div><button class="btn btn-sm" style="margin-top:6px">配置</button></div>
  </div>
  <div class="card"><div class="card-hd"><h3>路由决策矩阵</h3><button class="btn btn-sm">+ 添加规则</button></div><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>复杂度</th><th>文档类型</th><th>意图</th><th>密级</th><th>推荐流水线</th><th></th></tr></thead><tbody>
    <tr><td>Tier1</td><td>财报</td><td>精确答案</td><td>内部</td><td>P1 向量 + P4 Wiki</td><td><button class="btn btn-sm">编辑</button></td></tr>
    <tr><td>Tier2</td><td>合同</td><td>精确答案</td><td>机密</td><td>P2 PageIndex + ACL</td><td><button class="btn btn-sm">编辑</button></td></tr>
    <tr><td>Tier3</td><td>合同</td><td>综合分析</td><td>内部</td><td>P2 PageIndex + P3 图谱</td><td><button class="btn btn-sm">编辑</button></td></tr>
    <tr><td>Tier4</td><td>全部</td><td>策略建议</td><td>内部</td><td>P5 Agent + 向量 + 图谱</td><td><button class="btn btn-sm">编辑</button></td></tr>
  </tbody></table></div></div>
</section>

<!-- 10.8 模型提供商 -->
<section class="view" id="view-sys-models">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 模型提供商</div><h2>模型提供商</h2></div>
    <button class="btn btn-primary">+ 添加模型</button>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>系统默认模型</h3></div><div class="card-bd">
    <div class="form-row"><div class="form-item"><label>Chat</label><select class="select" style="width:100%"><option>DeepSeek-v4</option></select></div>
    <div class="form-item"><label>Embedding</label><select class="select" style="width:100%"><option>BGE-M3</option></select></div>
    <div class="form-item"><label>Rerank</label><select class="select" style="width:100%"><option>BGE-Reranker-v2-m3</option></select></div>
    <div class="form-item"><label>Image2Text</label><select class="select" style="width:100%"><option>GPT-4o</option></select></div></div>
  </div></div>
  <div class="card"><div class="card-hd"><h3>已添加模型</h3></div><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>厂商</th><th>模型</th><th>类型</th><th>状态</th><th></th></tr></thead><tbody>
    <tr><td>DeepSeek</td><td>deepseek-v4</td><td>Chat</td><td><span class="tag tag-green">已验证</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
    <tr><td>BAAI</td><td>bge-m3</td><td>Embedding</td><td><span class="tag tag-green">已验证</span></td><td><button class="btn btn-sm">⋮</button></td></tr>
    <tr><td>OpenAI</td><td>gpt-4o-mini</td><td>Chat</td><td><span class="tag tag-amber">待验证</span></td><td><button class="btn btn-sm">验证</button></td></tr>
  </tbody></table></div></div>
</section>

<!-- 10.8 数据源 -->
<section class="view" id="view-sys-datasource">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 数据源</div><h2>数据源管理</h2></div>
    <button class="btn btn-primary">+ 添加数据源</button>
  </div>
  <div class="role-grid" style="margin-bottom:20px">
    <div class="role-card"><div>📦 S3/MinIO</div><div class="count" style="font-size:14px">2 个连接</div></div>
    <div class="role-card"><div>📘 Confluence</div><div class="count" style="font-size:14px">1 个连接</div></div>
    <div class="role-card"><div>📝 Notion</div><div class="count" style="font-size:14px">0</div></div>
    <div class="role-card"><div>📁 更多 30+</div><div class="count" style="font-size:14px">...</div></div>
  </div>
  <div class="card"><div class="card-bd" style="font-size:13px;line-height:2">
    <p><strong>legal-s3-prod</strong> · S3 · 已连接 · 同步频率: 每天 · <button class="btn btn-sm">配置</button> <button class="btn btn-sm">测试连接</button></p>
    <p><strong>confluence-legal</strong> · Confluence Cloud · 已连接 · 同步频率: 每小时 · <button class="btn btn-sm">同步日志</button></p>
  </div></div>
</section>

<!-- 10.8 MCP -->
<section class="view" id="view-sys-mcp">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / MCP</div><h2>MCP Server 管理</h2></div>
    <button class="btn btn-primary">+ 创建 MCP Server</button>
  </div>
  <div class="kb-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kb-card"><h4>filesystem-mcp</h4><p class="desc">3 个 Tools</p><span class="tag tag-green">运行中</span></div>
    <div class="kb-card"><h4>database-mcp</h4><p class="desc">5 个 Tools</p><span class="tag tag-green">运行中</span></div>
    <div class="kb-card"><h4>custom-legal-mcp</h4><p class="desc">2 个 Tools</p><span class="tag tag-amber">待验证</span></div>
  </div>
</section>

<!-- 11.4 安全合规 -->
<section class="view" id="view-sys-security">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 安全合规</div><h2>安全合规中心</h2></div>
    <button class="btn btn-primary">生成合规报告</button>
  </div>
  <div class="tabs"><button class="tab active">投毒检测</button><button class="tab">PII 脱敏</button><button class="tab">ACL 模拟</button><button class="tab">合规报告</button></div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>投毒检测复核队列</h3><span class="tag tag-amber">2 待复核</span></div><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>文档</th><th>检测原因</th><th>时间</th><th>操作</th></tr></thead><tbody>
    <tr><td>外部导入文档.pdf</td><td>隐藏指令检测</td><td>09:55</td><td><button class="btn btn-sm">复核</button> <button class="btn btn-sm btn-danger">隔离</button></td></tr>
    <tr><td>可疑模板.docx</td><td>Prompt 注入模式</td><td>08:30</td><td><button class="btn btn-sm">复核</button></td></tr>
  </tbody></table></div></div>
  <div class="card"><div class="card-hd"><h3>PII 脱敏规则</h3><button class="btn btn-sm">+ 添加规则</button></div><div class="card-bd" style="font-size:13px">
    <p>身份证号 → 掩码显示 · 手机号 → 中间四位隐藏 · 邮箱 → 用户名脱敏</p>
  </div></div>
</section>

<!-- 11.5 成本中心 -->
<section class="view" id="view-eval-cost">
  <div class="page-hd">
    <div><div class="breadcrumb">评测中心 / 成本中心</div><h2>成本中心</h2></div>
    <select class="select"><option>本月</option><option>本周</option></select>
  </div>
  <div class="metrics">
    <div class="metric"><div class="label">今日 Token</div><div class="value">2.5M</div><div class="trend">¥38.5</div></div>
    <div class="metric"><div class="label">本月 Token</div><div class="value">45M</div><div class="trend">¥680</div></div>
    <div class="metric"><div class="label">Wiki 节省</div><div class="value">31%</div><div class="trend">缓存命中贡献</div></div>
    <div class="metric"><div class="label">预算使用</div><div class="value">68%</div><div class="trend">月预算 ¥1000</div></div>
  </div>
  <div class="card"><div class="card-hd"><h3>按知识库成本 Top 5</h3></div><div class="card-bd">
    <div class="layer-bar"><span style="width:120px">法务合同</span><div class="bar"><span style="width:72%"></span></div><span>¥245</span></div>
    <div class="layer-bar"><span style="width:120px">研发文档</span><div class="bar"><span style="width:48%"></span></div><span>¥162</span></div>
    <div class="layer-bar"><span style="width:120px">财务报告</span><div class="bar"><span style="width:35%"></span></div><span>¥118</span></div>
  </div></div>
</section>

<!-- 11.5 回放评测 -->
<section class="view" id="view-eval-replay">
  <div class="page-hd">
    <div><div class="breadcrumb">评测中心 / 回放评测</div><h2>回放评测</h2></div>
    <button class="btn btn-primary">新建回放任务</button>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>线上查询采样</h3></div><div class="card-bd" style="font-size:13px">
    <p>采样规则: 近 7 天 · 去重 · 去 PII · 最多 500 条 · 来源: 法务合同知识库对话</p>
    <button class="btn btn-sm" style="margin-top:8px">开始采样</button>
  </div></div>
  <div class="card"><div class="card-hd"><h3>版本对比结果</h3><span class="tag tag-green">v1.2 vs v1.1</span></div><div class="card-bd" style="font-size:13px">
    <p>变好: 42 条 (8.4%) · 变差: 18 条 (3.6%) · 无变化: 440 条 (88%)</p>
    <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
    <p><strong>变差案例</strong> "供应商保密义务范围" — v1.1 Faithfulness 0.92 → v1.2 0.45 · <button class="btn btn-sm">查看详情</button></p>
  </div></div>
</section>
`;
