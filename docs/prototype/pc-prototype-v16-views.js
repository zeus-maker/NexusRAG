// v1.6 增补视图：GraphRAG Hub · 融合策略 · 多通道检索 · KB 日志
const VIEWS_HTML_V16 = `
<!-- §11.9 GraphRAG / LazyGraphRAG Hub -->
<section class="view" id="view-kb-graphrag">
  <div class="kb-layout">
    <nav class="kb-sidenav" data-kb-nav="kb-graphrag"></nav>
    <div class="kb-content">
      <div class="page-hd compact">
        <div><div class="breadcrumb">法务合同知识库 / GraphRAG Hub</div><h2>GraphRAG &amp; LazyGraphRAG</h2><p>库内图谱管理 · 对齐 §11.9</p></div>
        <div class="toolbar" style="margin:0"><button class="btn btn-sm">批量重建</button><button class="btn btn-sm btn-primary">进入可视化</button></div>
      </div>
      <div class="hub-tabs" data-hub="graphrag">
        <button class="hub-tab active" data-hub-panel="gr-overview">概览</button>
        <button class="hub-tab" data-hub-panel="gr-visualize">可视化</button>
        <button class="hub-tab" data-hub-panel="gr-communities">社区 <span class="hub-badge">12</span></button>
        <button class="hub-tab" data-hub-panel="gr-build">建索引 <span class="hub-badge warn">3</span></button>
        <button class="hub-tab" data-hub-panel="gr-entities">实体复核 <span class="hub-badge warn">5</span></button>
        <button class="hub-tab" data-hub-panel="gr-settings">设置</button>
      </div>
      <div class="hub-panel active" id="gr-overview">
        <div class="mode-switch">
          <label class="mode-opt active"><input type="radio" name="gr-mode" checked> LazyGraphRAG</label>
          <label class="mode-opt"><input type="radio" name="gr-mode"> GraphRAG 全量</label>
          <label class="mode-opt"><input type="radio" name="gr-mode"> LightRAG</label>
        </div>
        <div class="stat-row">
          <div class="stat-card"><div class="stat-icon blue">⬡</div><div><div class="stat-val">1,240</div><div class="stat-lbl">实体</div></div></div>
          <div class="stat-card"><div class="stat-icon purple">↔</div><div><div class="stat-val">3,860</div><div class="stat-lbl">关系</div></div></div>
          <div class="stat-card"><div class="stat-icon green">◎</div><div><div class="stat-val">48</div><div class="stat-lbl">社区</div></div></div>
          <div class="stat-card"><div class="stat-icon amber">📄</div><div><div class="stat-val">42/156</div><div class="stat-lbl">已索引</div></div></div>
          <div class="stat-card"><div class="stat-icon red">!</div><div><div class="stat-val">14</div><div class="stat-lbl">失败</div></div></div>
        </div>
        <div class="card" style="margin-top:16px"><div class="card-bd" style="font-size:13px">
          <p>索引成本估算: <strong>Lazy ¥12</strong> vs 全量 GraphRAG <span style="color:var(--muted)">¥1,200</span> · <a href="#">切换说明</a></p>
          <p style="margin-top:8px">最近查询: Local 68% · Global 22% · Hybrid 10%</p>
        </div></div>
      </div>
      <div class="hub-panel" id="gr-visualize">
        <div class="graph-split">
          <div class="graph-filters card"><div class="card-bd" style="font-size:13px">
            <div class="form-item"><label>实体类型</label><select class="select" style="width:100%"><option>ORG</option><option>PERSON</option></select></div>
            <div class="form-item"><label>关系类型</label><select class="select" style="width:100%"><option>全部</option></select></div>
            <div class="form-item"><label>社区</label><select class="select" style="width:100%"><option>半导体</option></select></div>
            <div class="form-item"><label>深度</label><select class="select" style="width:100%"><option>2-hop</option></select></div>
            <button class="btn btn-sm btn-primary" style="width:100%">高亮检索路径</button>
          </div></div>
          <div class="graph-canvas bolt">
            <div class="graph-node" style="top:38%;left:42%">供应商<br><small>ORG</small></div>
            <div class="graph-node highlight" style="top:22%;left:22%">违约金<br><small>CLAUSE</small></div>
            <div class="graph-node" style="top:22%;left:62%">采购方<br><small>ORG</small></div>
            <div class="graph-node" style="top:58%;left:28%">合同V5<br><small>DOC</small></div>
            <div class="graph-node" style="top:58%;left:58%">保密义务<br><small>CLAUSE</small></div>
            <svg class="graph-edges" viewBox="0 0 400 200"><line x1="180" y1="90" x2="100" y2="55" stroke="#f97316" stroke-width="2"/><line x1="180" y1="90" x2="280" y2="55" stroke="#e5e7eb" stroke-width="1.5"/></svg>
          </div>
        </div>
        <div class="card" style="margin-top:12px"><div class="card-bd" style="font-size:13px;display:flex;justify-content:space-between;align-items:center">
          <span>选中: <strong>违约金条款</strong> · 置信 0.94 · 来源 Chunk P3</span>
          <span><button class="btn btn-sm">查看原文</button> <button class="btn btn-sm">编辑</button></span>
        </div></div>
        <div class="debug-bar">
          <input class="field" style="flex:1;height:32px" value="X公司收购Y的影响">
          <span>模式:</span>
          <label class="mode-opt active"><input type="radio" checked> Local</label>
          <label class="mode-opt"><input type="radio"> Global</label>
          <label class="mode-opt"><input type="radio"> Dual</label>
        </div>
      </div>
      <div class="hub-panel" id="gr-communities">
        <p class="hint-bar">LazyGraphRAG: 社区摘要在查询时按需生成；全量模式见预计算列表</p>
        <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>ID</th><th>社区主题</th><th>实体数</th><th>摘要状态</th><th>操作</th></tr></thead><tbody>
          <tr><td>C3</td><td>合同违约条款</td><td>86</td><td><span class="tag tag-green">已生成</span></td><td><button class="btn btn-sm">查看</button> <button class="btn btn-sm">重新生成</button></td></tr>
          <tr><td>C7</td><td>供应链风险</td><td>42</td><td><span class="tag tag-amber">查询时</span></td><td><button class="btn btn-sm">预生成</button></td></tr>
          <tr><td>C9</td><td>保密与合规</td><td>31</td><td><span class="tag tag-red">失败</span></td><td><button class="btn btn-sm">重试</button></td></tr>
        </tbody></table></div></div>
        <div class="card" style="margin-top:12px"><div class="card-hd"><h3>社区 C3 摘要预览</h3></div><div class="card-bd" style="font-size:13px">
          <p>本社区围绕采购合同违约金、解除条件… Leiden level=1</p>
        </div></div>
      </div>
      <div class="hub-panel" id="gr-build">
        <p class="hint-bar">流水线: 切块 → 实体抽取 → 关系抽取 → 图谱写入 → <em>[社区检测 → 社区摘要]</em>（Lazy 模式跳过方括号步骤）</p>
        <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>文档</th><th>阶段</th><th>进度</th><th>模式</th><th>操作</th></tr></thead><tbody>
          <tr><td>合同V6.pdf</td><td>关系抽取</td><td><div class="progress"><span style="width:75%"></span></div></td><td>LazyGraph</td><td><button class="btn btn-sm">暂停</button></td></tr>
          <tr><td>合规政策.docx</td><td>等待</td><td>—</td><td>GraphRAG全量</td><td><button class="btn btn-sm">优先</button></td></tr>
          <tr><td>财报Q2.pdf</td><td>失败</td><td><span class="tag tag-red">实体慢</span></td><td>LazyGraph</td><td><button class="btn btn-sm">重试</button></td></tr>
        </tbody></table></div></div>
      </div>
      <div class="hub-panel" id="gr-entities">
        <p class="hint-bar">低置信实体/关系人工确认</p>
        <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>类型</th><th>内容</th><th>置信</th><th>来源</th><th>操作</th></tr></thead><tbody>
          <tr><td>关系</td><td>供应商 ─违约→ 采购方</td><td>0.62</td><td>合同V5 P8</td><td><button class="btn btn-sm">确认</button> <button class="btn btn-sm btn-danger">删</button></td></tr>
          <tr><td>实体</td><td>「华东办事处」（ORG?）</td><td>0.58</td><td>邮件 EML</td><td><button class="btn btn-sm">改类型</button></td></tr>
        </tbody></table></div></div>
      </div>
      <div class="hub-panel" id="gr-settings">
        <div class="config-section"><h4>索引模式</h4>
          <label class="mode-card active"><input type="radio" checked><div><strong>LazyGraphRAG</strong><p>索引成本低（~0.1%），查询时生成社区摘要 +2~8s</p></div></label>
          <label class="mode-card"><input type="radio"><div><strong>GraphRAG 全量</strong><p>预计算 Leiden 社区 + LLM 摘要，查询快成本高</p></div></label>
          <label class="mode-card"><input type="radio"><div><strong>LightRAG</strong><p>双层检索 hybrid/local/global，支持增量更新</p></div></label>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="form-item"><label>实体类型</label><input class="field" style="width:100%;height:32px" value="ORG,PERSON,CLAUSE,EVENT"></div>
          <div class="form-item"><label>关系抽取 LLM</label><select class="select" style="width:100%"><option>DeepSeek-v4</option></select></div>
          <div class="form-item"><label>社区算法</label><select class="select" style="width:100%"><option>Leiden</option></select></div>
          <div class="form-item"><label>图数据库</label><select class="select" style="width:100%"><option>Neo4j</option><option>内嵌存储</option></select></div>
        </div>
        <div class="toolbar" style="margin-top:16px"><button class="btn">重置</button><button class="btn">估算成本</button><button class="btn btn-primary">保存</button></div>
      </div>
    </div>
  </div>
</section>

<!-- §11.8.1 融合与精排配置 -->
<section class="view" id="view-sys-fusion">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 融合与精排</div><h2>融合与精排配置</h2><p>Weighted RRF · 通道权重 · Cross-Encoder 精排（§11.8.1）</p></div>
    <div class="toolbar" style="margin:0"><button class="btn">测试</button><button class="btn btn-primary">保存</button></div>
  </div>
  <div class="config-section"><h4>召回阶段 Top-K</h4>
    <div class="form-row">
      <div class="form-item"><label>向量</label><input class="field" style="width:100%;height:32px" value="100"></div>
      <div class="form-item"><label>BM25</label><input class="field" style="width:100%;height:32px" value="100"></div>
      <div class="form-item"><label>PageIndex</label><input class="field" style="width:100%;height:32px" value="10"></div>
      <div class="form-item"><label>GraphRAG Local</label><input class="field" style="width:100%;height:32px" value="20"></div>
      <div class="form-item"><label>Wiki</label><input class="field" style="width:100%;height:32px" value="5"></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>Weighted RRF 通道权重</h3><span class="tag tag-blue">k=60</span></div><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>通道</th><th>信任权重</th><th>说明</th></tr></thead><tbody>
    <tr><td>Wiki</td><td><input class="field" style="width:60px;height:28px" value="1.5"></td><td>已编译稳定知识</td></tr>
    <tr><td>PageIndex</td><td><input class="field" style="width:60px;height:28px" value="1.3"></td><td>长专业文档推理</td></tr>
    <tr><td>GraphRAG</td><td><input class="field" style="width:60px;height:28px" value="1.1"></td><td>实体关系查询</td></tr>
    <tr><td>向量</td><td><input class="field" style="width:60px;height:28px" value="1.0"></td><td>通用语义</td></tr>
    <tr><td>BM25</td><td><input class="field" style="width:60px;height:28px" value="1.0"></td><td>精确关键词</td></tr>
  </tbody></table></div></div>
  <div class="config-section"><h4>精排阶段</h4>
    <div class="form-row">
      <div class="form-item"><label>精排模型</label><select class="select" style="width:100%"><option>BGE-Reranker-v2-m3</option></select></div>
      <div class="form-item"><label>精排 Top-N</label><input class="field" style="width:100%;height:32px" value="5"></div>
    </div>
    <label style="font-size:13px"><input type="checkbox" checked> 冲突标注（答案侧高亮矛盾片段）</label>
    <button class="btn btn-sm" style="margin-top:10px" data-view="kb-retrieval">预览融合效果 →</button>
  </div>
</section>

<!-- §11.8.2 检索策略路由 -->
<section class="view" id="view-sys-retrieval-strategy">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 检索策略</div><h2>检索策略路由</h2><p>LLM-as-Router · 决策树（§11.8.2）</p></div>
    <div class="toolbar" style="margin:0"><button class="btn">测试</button><button class="btn btn-primary">保存</button></div>
  </div>
  <div class="mode-switch" style="margin-bottom:16px">
    <label class="mode-opt active"><input type="radio" checked> 跟随分类器矩阵</label>
    <label class="mode-opt"><input type="radio"> 独立 LLM Router</label>
    <label class="mode-opt"><input type="radio"> 规则决策树</label>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-hd"><h3>决策树预览</h3></div><div class="card-bd decision-tree">
    <div>查询 → 精确关键词? → <span class="tag tag-blue">BM25</span></div>
    <div>　　 → 语义理解? → <span class="tag tag-blue">向量</span></div>
    <div>　　 → 跨章节推理? → <span class="tag tag-blue">PageIndex</span></div>
    <div>　　 → 实体关系? → <span class="tag tag-blue">GraphRAG</span></div>
    <div>　　 → 稳定事实? → <span class="tag tag-blue">Wiki</span></div>
  </div></div>
  <div class="form-row">
    <div class="form-item"><label>Primary</label><select class="select" style="width:100%"><option>pageindex</option><option>graphrag</option></select></div>
    <div class="form-item"><label>Secondary</label><select class="select" style="width:100%"><option>vector</option></select></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-bd" style="font-size:13px">
    <div class="form-item"><label>测试查询</label><input class="field" style="width:100%;height:36px" value="AMD收购Xilinx的影响"></div>
    <p>结果: <span class="tag tag-green">primary=graphrag</span> 置信 0.91</p>
  </div></div>
</section>

<!-- §11.8.3 生成策略路由 -->
<section class="view" id="view-sys-generation-strategy">
  <div class="page-hd">
    <div><div class="breadcrumb">系统管理 / 生成策略</div><h2>生成策略路由</h2><p>Tier 默认 · max_iter · 工具调用（§11.8.3）</p></div>
    <button class="btn btn-primary">保存</button>
  </div>
  <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>策略类型</th><th>Tier</th><th>max_iter</th><th>工具</th><th>多 Agent</th></tr></thead><tbody>
    <tr><td>直接回答</td><td>Tier1</td><td>0</td><td>✗</td><td>✗</td></tr>
    <tr><td>单次 RAG</td><td>Tier1-2</td><td>1</td><td>✗</td><td>✗</td></tr>
    <tr><td>多跳推理</td><td>Tier3</td><td>3</td><td>✗</td><td>✗</td></tr>
    <tr><td>Agentic</td><td>Tier3-4</td><td>5</td><td>✓</td><td>✗</td></tr>
    <tr><td>多 Agent 协作</td><td>Tier4</td><td>8</td><td>✓</td><td>✓</td></tr>
  </tbody></table></div></div>
</section>

<!-- §10.5 多通道检索测试（v1.6 扩展） -->
<section class="view" id="view-kb-retrieval-v16">
  <div class="kb-layout">
    <nav class="kb-sidenav" data-kb-nav="kb-retrieval"></nav>
    <div class="kb-content">
      <div class="page-hd compact">
        <div><div class="breadcrumb">法务合同知识库 / 检索测试</div><h2>多通道检索测试台</h2><p>五通道分路 + 融合对比（§10.5）</p></div>
      </div>
      <div class="channel-grid">
        <label class="channel-card on"><input type="checkbox" checked> 向量 <span class="ch-lat">320ms</span></label>
        <label class="channel-card on"><input type="checkbox" checked> BM25 <span class="ch-lat">45ms</span></label>
        <label class="channel-card on"><input type="checkbox" checked> PageIndex <span class="ch-lat">1.4s</span></label>
        <label class="channel-card on"><input type="checkbox" checked> GraphRAG <span class="ch-lat">820ms</span></label>
        <label class="channel-card on"><input type="checkbox" checked> Wiki <span class="ch-lat">180ms</span></label>
      </div>
      <div class="form-item"><label>测试问题</label><textarea class="field">供应商延迟交货违约金如何计算？</textarea></div>
      <button class="btn btn-primary">执行五通道检索 + 融合对比</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
        <div class="card"><div class="card-hd"><h3>分路结果</h3></div><div class="card-bd" style="font-size:13px">
          <p><strong>向量</strong> Top-3 · 0.956 合同V5 P3</p>
          <p><strong>BM25</strong> Top-3 · 违约金 第五条</p>
          <p><strong>PageIndex</strong> Top-1 · 5.1 延迟交货</p>
          <p><strong>GraphRAG</strong> Local · 供应商→违约金</p>
          <p><strong>Wiki</strong> Top-1 · [[供应商违约金]]</p>
        </div></div>
        <div class="card"><div class="card-hd"><h3>融合后 Top-5</h3><span class="tag tag-green">RRF</span></div><div class="card-bd">
          <div class="result-item"><span class="score">0.956</span><strong>#1</strong> Wiki · 供应商违约金</div>
          <div class="result-item"><span class="score">0.912</span><strong>#2</strong> PageIndex · 5.1 延迟交货</div>
          <div class="result-item"><span class="score">0.887</span><strong>#3</strong> 向量 · 合同V5 P3</div>
        </div></div>
      </div>
    </div>
  </div>
</section>

<!-- KB 日志 -->
<section class="view" id="view-kb-logs">
  <div class="kb-layout">
    <nav class="kb-sidenav" data-kb-nav="kb-logs"></nav>
    <div class="kb-content">
      <div class="page-hd compact"><div><div class="breadcrumb">法务合同知识库 / 日志</div><h2>知识库日志</h2></div></div>
      <div class="toolbar"><select class="select"><option>全部级别</option></select><select class="select"><option>GraphRAG</option><option>Wiki</option><option>解析</option></select></div>
      <div class="card"><div class="card-bd" style="padding:0"><table class="table"><thead><tr><th>时间</th><th>级别</th><th>类型</th><th>文档</th><th>消息</th></tr></thead><tbody>
        <tr><td>6/6 10:03</td><td><span class="tag tag-amber">WARN</span></td><td>GraphRAG</td><td>合同V6.pdf</td><td>实体抽取慢</td></tr>
        <tr><td>6/6 09:15</td><td><span class="tag tag-green">INFO</span></td><td>Wiki</td><td>—</td><td>编译队列完成 12 页</td></tr>
      </tbody></table></div></div>
    </div>
  </div>
</section>
`;
