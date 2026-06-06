# PageIndex 与 LLM Wiki 技术行业深度报告 — PowerPoint 逐页演示大纲

> **编排原则**：每页 **5～9 条**精炼要点，每条承载独特信息，杜绝冗余重复。对标 RAG技术全景 的密度标准。
> **页码**：下列「第 N 页」即 PPT 页序，可直接逐页建片。
> **来源**：PageIndex与LLM Wiki技术行业深度报告.md（21 章 / 167 H3 / 11.5 万字）
> **页数概览**：全文共 **39 页**（封面 1 + 导航 1 + 摘要 1 + 内容 35 + 结尾 1）

---

## 第 1 页｜封面

- **主标题**：PageIndex 与 LLM Wiki 技术行业深度报告
- **副标题**：Vectorless Reasoning-based RAG 与 LLM 知识库范式全景（2025-2026）
- **核心问题**：当向量 RAG 在长文档、多跳推理、跨引用中暴露结构性缺陷时，无向量推理式 RAG 与 LLM 持续编译型知识库如何重塑文档智能？
- **覆盖周期**：2025-04 至 2026-06 · 目标读者：AI 工程师 / RAG 架构师 / 技术决策者
- **关键数字**：24,900+ GitHub Stars · 98.7% FinanceBench 准确率 · 20+ LLM Wiki 开源实现

---

## 第 2 页｜汇报结构

- **第一篇 破局篇**：报告导览 + 三座大山 + 行业拐点（P4-6）
- **第二篇 PageIndex 全景篇**：总览(三大No/Yes) → 对比 → 树索引原理 → 树生成 → OCR → 搜索算法 → MCP → SDK（P7-17）
- **第三篇 LLM Wiki 全景篇**：Karpathy 愿景 → 三层架构 → 三工作流 → 工具生态（P18-23）
- **第四篇 合流与范式之争**：OpenKB → PageIndex vs LLM Wiki → Vector/GraphRAG/Vectorless 三分天下（P24-29）
- **第五篇 落地与展望篇**：四大行业 → 性能成本 → 局限性 → 结论（P30-37）
- **附录**：场景速查矩阵 + 参考文献（P38-39）

---

## 第 3 页｜报告导览与核心结论（TL;DR）

- **定位**：聚焦 2025-2026 年两大新兴范式——PageIndex(长文档精读) + LLM Wiki(知识累积)
- **合流标志**：2026 年 VectifyAI OpenKB = PageIndex 树检索 + LLM Wiki 编译 = RAG 3.0 参考实现
- **性能跃迁**：PageIndex 在 FinanceBench 金融问答 98.7% vs Vector RAG ~50%——50pp 范式级跃迁
- **生态成熟度**：PageIndex 24,900+ stars / MIT 协议 / MCP+SDK+API 完整 / VectifyAI 伦敦注册融资 £1.1M
- **核心共识**：2026 明确趋势 = Hybrid + Adaptive RAG：Vector(海量) + GraphRAG(关系) + Vectorless(长文档) + LLM Wiki(累积)
- **企业落地**：金融(SEC 10-K/10-Q)、法律(合同/监管)、医疗(临床试验)、工业(技术手册) 已有公开案例
- **使用导向**：架构师→3-8章+17章 / 工程师→5-9章 / 研究员→11-15章 / 决策者→18-21章

---

## 第 4 页｜第一章 报告导览：两个范式一条主线

- **PageIndex**（VectifyAI/2025-04 开源）：面向长文档的 Vectorless Reasoning-based RAG——把 PDF 转为 JSON 目录树，让 LLM 看着目录做推理式检索，彻底抛弃向量数据库与人工分块
- **LLM Wiki**（Karpathy/2026-04 Gist）：让 LLM 持续编译并维护 Markdown Wiki——raw/ 只读不动，LLM 合成为带交叉引用的 wiki/，查询时不再重读全文
- **两条主线的合流**：2026-05 OpenKB = PageIndex 树检索(单文档精读) + LLM Wiki 编译(跨文档综合)
- **核心问题**：向量数据库与相似度检索在长文档、多跳推理、跨引用中暴露的结构性缺陷，如何被新范式重塑？
- **为什么关注这两个范式**：PageIndex 解"RAG 最难最有商业价值的子问题"、LLM Wiki 解"知识应累积而非重检索"的根本架构问题、二者已在 OpenKB 合流 = RAG 3.0 主干
- **组织逻辑**：背景→原理→实现→应用→对比→展望，六段递进

---

## 第 5 页｜第二章 传统 Vector RAG 的"三座大山"（上）

- **第一座山：相似度 ≠ 相关性（Similarity ≠ Relevance）**
- 向量检索找"长得像"的文字，不是"能回答问题的信息"（FY2023 net income vs adjusted net income 混淆）
- 金融/法律/医疗术语 embedding 距离与日常语义极近，但与真正相关的内容可能很远
- 核心语录："Vector-based RAG searches for similar text, whereas reasoning-based RAG thinks about where to look and why."
- **第二座山：硬分块摧毁语义完整性（Hard Chunking Destroys Meaning）**
- 跨段引用截断："see Note 14 for details" 与 Note 14 被分到不同 chunk，向量检索无法 follow in-text 引用
- 表格与注释分离：财报主表数字与脚注会计政策说明被切到不同 chunk，只看到数字看不到背景
- 章节结构被抹平：SEC 的 Part I/Item 1A/Item 7、论文的 Abstract/Methods/Results、合同的 Definition/Term/Condition——这些结构本身是答案定位的关键信号，被分块算法全部抹平
- Microsoft 称向量检索为"vibe retrieval"——玄学、说不清道不明

---

## 第 6 页｜第二章 第三座大山与行业拐点（下）

- **第三座山：缺乏多跳推理与对话上下文**
- 向量 RAG 是单跳（单次 query→retrieve→generate），无法知道"还要再去哪里看"
- "对比 FY2023 和 FY2024 收入并解释变化原因"：需要 MD&A 两数字 + Risk Factors 政策变化 + Results of Operations 同比说明——向量 RAG 只返回 top-k chunks，不知道该跨节跨页
- 不感知对话上下文（"What about the liabilities?" 需结合前轮检索在"同一份文档的另一段"继续查）
- **2025-2026 行业拐点：四股力量同时爆发**
- ①Vector RAG 内部增强（混合检索/HyDE/self-RAG/corrective-RAG/Rerank）——仍困在相似度范式内
- ②GraphRAG 体系化（Microsoft LazyGraphRAG 成本降到 0.1%）——Diffbot benchmark 显示纯向量多实体查询准确率 0%
- ③Vectorless RAG 横空出世（PageIndex 50%→98.7%）——不是渐进改进，是范式跃迁
- ④LLM Wiki 范式提出（Karpathy Gist → 一个月 20+ 开源实现）——从根源质疑"每次查询从 raw 重新检索"
- **结论**："The market is not heading toward one universal retrieval stack. It is splitting into three patterns."

---

## 第 7 页｜第三章 PageIndex 总览：三大 No + 三大 Yes

- **一句话定位**："把长文档转成 LLM-friendly 的目录树，让 LLM 像人类专家一样看着目录去推理、去定位答案"
- **三大 No**：①No Vector DB（不需要向量库/embedding/ANN/rerank，基础设施极简）②No Chunking（不切成小块，按自然章节组织，保留语义完整性）③No Top-K（检索数量由 LLM 推理决定，不是拍脑袋的固定阈值）
- **三大 Yes**：①Reasoning-based Retrieval（LLM 在树上多跳推理，动态决定下一步看哪里）②In-Context Tree Index（JSON 树直接进入 LLM context，模型能直接读、推理、修改）③Human-like Navigation（模仿人类先看 ToC→找章节→读相关页）
- **三大支柱的工程意义**：无向量→冷启动零成本+运维极简 / 无分块→保留自然语义边界+表格注释完整+跨段引用可 follow / 推理驱动→能跨页跨节整合+处理多跳问题+可审计
- **不是什么**：不是搜索引擎(不做跨文档)/不是聊天机器人框架(只负责检索+组装上下文)/不是完全零延迟(3-10秒)/不是 OCR 工具(扫描件走云服务)

---

## 第 8 页｜第三章 PageIndex vs Vector RAG 完整横比 + 生态全景

- **Index 方式**：JSON 树(Title+Summary+页码+子节点) vs 高维向量+BM25
- **检索方式**：LLM 推理/MCTS/混合树搜索 vs 余弦相似度/ANN top-k
- **多跳推理**：✅ vs ❌ / **跨引用 follow**：✅(node_id 直接跳) vs ❌
- **可解释性**：✅(每步 reasoning trace+page refs 可审计) vs ❌(黑盒 vibe retrieval)
- **延迟**：1-10秒(多次 LLM 调用) vs <100ms(向量库)
- **基础设施**：仅 LLM API vs 向量库+Embedding 服务+rerank 服务
- **FinanceBench**：**98.7%** vs ~50%
- **VectifyAI 生态布局**：PageIndex Framework(开源MIT) + Chat(SaaS) + API/MCP(开发者) + Mafin 2.5(金融产品) + OCR(长上下文视觉) + ChatIndex(对话树) + ConDB(KV-cache 树检索) + OpenKB(合流 LLM Wiki)
- **团队**：Mingtian Zhang(UCL博士/顶会多篇 oral) + Yu Tang(牛津数据库博士/ACM 金奖)，公司伦敦注册，融资约 £1.1M

---

## 第 9 页｜第三章 社区评价与争议

- **支持方**（Hacker News Show HN 多数认可）："非向量方式在很多场景更有用"(@kakhkAt) / "Agentic RAG 质量更高但成本也高，复杂场景值得" / "树表示比列表表示好在可以分层搜索，像 AlphaGo 在大树上搜索"(@throwaway17-2)
- **质疑方**（也有道理）："它同样是 vibe-ish，也需要切分文档喂给 indexer"(@mbrt) / "引入两个 LLM 组件导致输出高度可变"(@sgammon) / "改进的检索时间声称可疑"
- **创始人亲自回复**（Mingtian Zhang）："现在是 good-but-not-great 像 GPT-2 阶段，不能找工作但已经在复杂任务上超过 SOTA，2026年底有望达到商业可用水平"——事后回看：2026年4月 OpenKB 上线、PyPI 0.3.x、API 全面商用，真的在 12 个月内从模型幼儿长成可商业部署
- **开源 vs 商业关键差异**：agent-cookbook.com 2026-05 评测尖锐指出——开源版只包含 LLM Prompt 树搜索，**MCTS 检索层只存在于云服务中**
- **PageIndex 不擅长的场景**：跨文档检索(需 OpenKB File System) / 极低延迟(<100ms实时) / 通用聊天 / 海量短文档匹配

---

## 第 10 页｜第四章 PageIndex 核心原理：In-Context Index

- **PageIndex 灵魂三件套**：In-Context Index(上下文内索引) + Reasoning Trace(推理轨迹) + Tree Search(树搜索)
- **与向量库的根本区别**：向量库设计哲学="索引外置，查询只返回匹配项"→ LLM 看不到索引本身，只能看被检索系统筛选过的已丢失上下文的 chunks；PageIndex 反向操作="整个索引变成 LLM 能直接读、推理、操作的内部结构"
- **In-Context Index 的物理形态**：一棵 JSON 树直接序列化进 LLM prompt → LLM 推理时"看得到"整棵树的结构
- **树节点 5 要素设计**：①title(简短可读)→LLM 扫一眼就懂 / ②summary(1-3句话浓缩描述)→快速判断要不要深入 / ③start_index+end_index(物理页码)→精确取对应范围 / ④node_id(稳定引用)→MCP 工具+跨引用地址 / ⑤nodes(递归)→任意深度层次化
- **典型树规模**：Apple 10-K 127页 → 200-300节点 / 最大深度4-5层 / JSON 仅 10-50KB → 可完整塞进 LLM context
- **类比**：把整本书的目录+摘要塞进 LLM 的 working memory → LLM 像人类专家一样"翻目录→找章节→钻进去→读原文"→每一步都有理由

---

## 第 11 页｜第四章 Reasoning Trace 与 Tree Search 三种模式

- **Reasoning Trace（推理轨迹）**：检索每一步要求 LLM 输出 reasoning（如"The user asks about debt trends. These are usually in the financial summary section or Appendix G — let me look there."）→ 持久化 → 最终用户可查看"为什么选这些节点"的完整审计日志
- **Tree Search 的数学定义**：在文档树 T 中找节点集合 S，使 S 中节点的实际文本能回答用户查询 q——传统向量 RAG 是 score(n)=cosine(embed(n),embed(q)) 取 top-k；PageIndex 是结构化搜索
- **三种搜索模式**：
  ① **LLM Prompt Search**（纯推理/开源版）：把树+query 塞进 prompt→LLM 看 summary 决定下钻→最终输出目标 node_id
  ② **Value-function MCTS**（AlphaGo 式/仅云服务）：用价值网络评估"这个节点多大可能包含答案"→仅探索高分节点→类似 AlphaGo 在博弈树上做 Monte Carlo Tree Search
  ③ **Hybrid Tree Search**（混合/仅云服务）：LLM 推理粗筛 + MCTS value function 精排 → 两个 score 加权融合 → 节点去重后送 LLM Agent 评估"是否充分"
- **开源 vs 商业核心差异**：MCTS 层只在云服务中存在——开源用户用的是纯 LLM Prompt 推理

---

## 第 12 页｜第五章 树生成：从 PDF 到 JSON 树（上）

- **两阶段流程**：PDF→阶段1(ToC发现/扫描前20页/LLM识别章-节-小节层级)→阶段2(章节递归展开/判断物理页码范围/超20页强制递归切分)→Post-processing(verify_toc 校验→错位？→fix_incorrect_toc_with_retries 最多3次重试)→最终 JSON 树
- **阶段 1 ToC 发现**：默认读取 PDF 前 20 页(`--toc-check-pages 20`)用 LLM 识别目录结构，形成初始 ToC 节点列表——依赖 PDF 本身有印刷 ToC 或可识别的标题结构
- **阶段 2 章节递归展开**：从初始 ToC 出发→对每个节点 LLM 判断 start_index/end_index→单节点超过 10 页(`--max-pages-per-node 10`)强制递归切分子节点
- **三种 ToC 生成模式**：①有页码 ToC(默认/印刷质量好/准确率最高/自愈循环有效) ②无页码 ToC(屏幕阅读PDF/不需要PDF自带目录/节点范围需LLM重新推断) ③无 ToC 从头生成(扫描件/纯图像/唯一可用方案/速度慢成本高依赖OCR质量)
- **后两种模式需要更强 LLM**：GPT-4o/Claude 3.5 Sonnet/Gemini 2.5 Pro 级别，因为需要模型自己归纳章节

---

## 第 13 页｜第五章 树生成参数调优与工程实现（下）

- **7 个核心参数**：
  | 参数 | 默认 | 作用 | 调优建议 |
  |------|------|------|---------|
  | `--model` | `gpt-4o` | 树生成 LLM | 扫描件建议 o1/Claude 3.7 |
  | `--toc-check-pages` | 20 | ToC 扫描页数 | 复杂文档调到 30-50 |
  | `--max-pages-per-node` | 10 | 单节点最大页数 | 章节密集降到 5-7 |
  | `--max-tokens-per-node` | 20000 | 单节点最大 token | GPT-4o 128K 可到 40K |
  | `--if-add-node-id` | yes | 生成 node_id | 几乎必须开（MCP 寻址） |
  | `--if-add-node-summary` | yes | 生成 summary | 必须开（否则退化为字符串匹配） |
  | `--if-add-doc-description` | yes | 全局文档描述 | 强烈建议开 |
- **工程结构**：`pageindex/`(MIT 开源/PyPI 0.2.x) → `page_index.py`(核心类：build_tree/_discover_toc/_expand_node/_verify_and_fix/to_json) + `toc_utils.py` + `verifier.py`(自愈+最多3次重试) + `llm.py`(LiteLLM 兼容)
- **Markdown 模式**：`--md_path` 参数→把 `#/##/###` 作为节点分层→适合结构化良好 md 文档；**关键警告**：PDF 转出的 markdown 必须先经 PageIndex OCR 保留结构，否则章节层次被破坏

---

## 第 14 页｜第五章 树生成成本与关键约束

- **成本构成**：单次 LLM 调用≈节点数线性相关 / 100页10-K 约 30-60 次 LLM 调用 / 每节点 1K-3K 输入+0.5K-1K 输出 token / 100页约 100K-200K 总 token
- **单文档成本**：GPT-4o 约 $0.5-$2（取决于 prompt caching 是否开启）→ 一次性投入
- **单文档时间**：GPT-4o 典型 2-5 分钟
- **为何成本可接受（TCO 视角）**：树生成完成后检索阶段成本远低于向量 RAG 持续运维成本（向量库维护+reranker 调用+embedding 模型升级重建索引）→ 长结构化文档 TCO 通常更经济
- **颗粒度设计哲学**：太粗(节点少/每个大)→LLM 拿到过多无关内容；太细(节点多/每个小)→树结构过深/推理成本升高→默认参数起步，按实际文档微调
- **0.3.x 路线图**：并发、checkpoint、增量更新——目前 0.2.8 稳定，0.3.0.dev1(2026-04-10)在开发中

---

## 第 15 页｜第六章 PageIndex OCR：长上下文视觉 OCR

- **传统 OCR 的致命缺陷**：所有传统 OCR 都遵循"单页独立识别"——跨页标题丢失(PART I 在页1底+Item 1 在页2顶→OCR 不知道父子关系)、表格跨页断裂(合并 cell 变孤立数字)、页码与脚注错位("1 See Note 14"与正文引用脱离)
- **PageIndex OCR 的革命性**：第一个长上下文视觉 OCR 模型——把整本 PDF(或长上下文窗口内所有页)视为一个整体喂给 vision-language model，让模型直接输出层次化 markdown，保留章节层次+表格关系+跨页引用
- **四大设计要点**：不切分单页处理 / 生成结构化输出(带#/##/###标题、表格、列表、引用) / 保留物理页码(start_index/end_index) / 保留章节层次(模型识别 PART I→Item 1→Business 嵌套关系)
- **与其他 OCR 工具对比**：Mistral OCR 单页/无章节层次/无法跨页表格；Contextual AI OCR 单页/部分层次/无法跨页表格；PageIndex OCR 整文档/完整层次/跨页表格/原生树集成/支持多 vision 模型(Claude/GPT-4o)
- **成本**：传统 OCR $0.001/页 vs PageIndex OCR $0.01-0.05/页（10-50 倍），200 页 10-K 约 $3-10，在高 ARPU 场景可接受

---

## 第 16 页｜第六章 Vision-based Vectorless RAG

- **更激进的范式**：完全跳过 OCR——直接把 PDF 页面图像喂给 vision-language model(GPT-4o vision/Claude 3.5 Sonnet vision)，由模型直接理解页面内容(含视觉布局信息)→生成树→检索
- **为何在金融文档尤其有价值**：财务表格的视觉布局(合并单元格/对齐方式/粗体双下划线)本身就是语义的一部分——传统 OCR 丢失视觉强调，vision-LLM 直接"看到"
- **官方示例**：GitHub 仓库提供 `vision-based-vectorless-rag.ipynb`——无需 OCR 用 GPT-4o vision 构建推理式 RAG
- **适用场景**：表格密集型文档（财报/临床试验报告/技术规格书）、视觉布局有语义的文档（合同条款的缩进/编号体系）
- **成本与取舍**：Vision-LLM 比传统 OCR 贵 10-50 倍，但精度和结构保留远超传统 OCR——"贵但对"
- **OCR 生态现状**：PageIndex OCR 在 0.2.5+ 版本作为云服务上线(非 MIT 开源)，开源版 README 已预留集成接口

---

## 第 17 页｜第七章 树搜索算法：LLM Prompt + MCTS + Hybrid

- **树搜索的本质**：在数学上 = "在文档树 T 中找节点集合 S，使 S 中文本能回答查询 q"——传统方法 score(n)=cosine，PageIndex 是结构化搜索
- **LLM Tree Search**：最基础的搜索方式——把树+query 注入 LLM prompt → LLM 看每个节点的 summary 决定是否下钻 → 输出目标 node_id → 开源版采用这种方式
- **LLM Tree Search 的 Prompt 设计**：必须包含①角色设定(你是文档分析专家) ②树结构 JSON ③查询 ④推理指令(从根节点开始/看每个节点的 summary 判断相关性/只深入相关分支/输出 node_id 列表和每个选择的 reasoning)
- **Value-function MCTS（仅云服务）**：借鉴 AlphaGo 的 MCTS 算法——Selection(叶节点选择/基于UCB) → Expansion(展开子节点) → Simulation(价值网络评估) → Backpropagation(回溯更新)→ 在文档树上找最佳信息节点
- **Hybrid Tree Search（仅云服务）**：LLM 推理粗筛（速度快/覆盖面广） + MCTS value function 精排（精确/exploration） → 两 score 加权融合 → 去重后送 LLM Agent 评估"信息是否充分"→ 不足则迭代

---

## 第 18 页｜第八章 PageIndex MCP 集成：让推理式 RAG 成为 Agent 工具

- **MCP 协议定位**：Anthropic 2024 开源的"AI 即插即用标准"——Client(LLM Agent) ↔ Server(暴露工具) / 灵感来自 LSP / 跨厂商标准化
- **PageIndex MCP（2025-08 推出）**：VectifyAI/pageindex-mcp(TypeScript/289 stars)——把推理式 RAG 封装为 MCP 标准工具
- **三种部署**：①远程 HTTP(`api.pageindex.ai/mcp`+API Key/最简单) ②Claude Desktop 一键安装(双击 .mcpb/OAuth) ③本地 stdio(`npx -y @pageindex/mcp`/支持本地 PDF)
- **暴露的核心工具**：
  | 工具 | 用途 | 参数 |
  |------|------|------|
  | `process_document` | 上传+索引 PDF | url 或 file_path |
  | `get_document_structure` | 获取 PageIndex 树(不含正文) | doc_name |
  | `get_page_content` | 获取指定页/页范围正文 | doc_name, pages("15-22") |
  | `recent_documents` | 列出最近文档 | 无 |
  | `chat_with_documents` | 端到端问答 | query, doc_name(s) |
- **设计哲学**："最小完备"——5-6 个原子操作让 Agent 自由组合 + 端到端快捷方式

---

## 第 19 页｜第八章 Agentic Vectorless RAG + MCP 生态影响

- **Agentic Flow 示例**（OpenAI Agents SDK + PageIndex MCP）：Agent 被注册为 MCP Client→LLM 自主决策：是否需要先 `process_document` / 是否先看 `get_document_structure` 决定方向 / 是否多次 `get_page_content` 拉取不同章节 / 如何综合多章节检索结果
- **与传统硬编码的区别**：传统流程=树搜索→拉取→回答(固定/僵硬)；Agentic flow=LLM 自己决定每一步做什么(自适应/多跳/复杂查询)
- **MCP vs Function Call 对比**：MCP 跨厂商标准(✅)vs 各厂商格式不同(❌)/工具动态发现 vs 硬编码/多LLM支持 vs OpenAI专属/远程HTTP+stdio多种部署 vs 仅内嵌进程/一次实现多平台复用 vs 一次实现一个
- **最大价值**：任何已支持 MCP 的 Agent 平台(Claude Desktop/Cursor/VS Code Continue/OpenAI Agents SDK/LangChain/Vercel AI SDK)都能**零代码**集成 PageIndex 推理式检索
- **生态三影响**：①Claude Code/Cursor 工作流革新(基于本地 PDF 推理式问答)②Agent 框架内置 MCP Adapter(零成本接入)③企业自托管 MCP Server(内部所有 LLM Agent 共享推理式知识库)
- **工程注意事项**：stdio vs HTTP 选择(开发用 stdio/生产用 HTTP)/环境变量注入(PAGEINDEX_API_KEY)/错误处理(429/5xx/retry/fallback)/多 LLM 路由(LiteLLM 统一接口)

---

## 第 20 页｜第九章 PageIndex 实现细节与 SDK 实战

- **仓库结构**：`run_pageindex.py`(CLI入口) + `pageindex/`(核心包) + `examples/`(agentic/notebook/vLLM deployment) + `docs/` + `tests/`
- **核心模块**：`page_index.py`(PageIndex 类/build_tree/_discover_toc/_expand_node/to_json) / `utils.py`(PDF解析) / `toc_utils.py`(ToC提取修复) / `verifier.py`(verify+fix_retries 自愈循环) / `llm.py`(LiteLLM兼容) / `tree_search.py`(LLM Prompt/MCTS/Hybrid)
- **Python SDK 基础用法**：`pip install pageindex`→`pi = PageIndex()`→`tree = pi.generate_tree(pdf_path)`→`answer = pi.query(tree, "What is the revenue?")`
- **SDK 核心方法**：generate_tree/pdf→tree / query/tree+query→answer / search/tree+query→nodes / load_tree/save_tree→JSON 持久化 / merge_trees→多文档树合并
- **高级特性**：自定义 LLM(通过 LiteLLM 任意初始化)→支持 OpenAI/Anthropic/Gemini/Ollama/DeepSeek→通过 `model` 参数切换
- **自愈循环（verifier.py）**：`verify_toc()` 检查树节点页码是否连贯/是否存在空洞→`fix_incorrect_toc_with_retries()` 用 LLM 重新推断有问题的节点→最多 3 次重试→保证输出树质量

---

## 第 21 页｜第十章 Mafin 2.5 与 FinanceBench：工业级验证

- **Mafin 2.5**：VectifyAI 基于 PageIndex 的商业化金融 RAG 产品——专攻 SEC 10-K/10-Q 等结构化财报
- **FinanceBench 为何是金标准**：SEC 标准财报/每条问题需多跳推理(跨页+跨节+表格+注释+跨引用)/每条答案有 ground truth+出处页码→无法靠"语义近似蒙对"
- **98.7% 准确率的含义**：不是 50%→60% 的渐进改进，而是 50%→98.7% 的范式跃迁——几乎消除了财报问答场景的错误率
- **与 Gemini File Search 的对比**：在工业技术手册的横评中，需要多步推理的问题类别上 PageIndex 系统性地优于 Gemini File Search 等向量 RAG（Gemini File Search 约 45-50%）
- **为何 PageIndex 能在财报上碾压**：财报是多跳/跨引用/表格+注释混沌的典型——这些都是向量 RAG 的死穴，PageIndex 的生门
- **Mafin 的定价与定位**：面向投行/券商/律所/审计等金融合规场景 → 错误答案不可接受(合规风险) → 愿意为 98.7% 买单

---

## 第 22 页｜第十章 工业技术手册横评与更多真实案例

- **工业技术手册场景**：HVAC/机械设备维修手册（>1000页/密集表格+跨章节引用/需要精确页码定位）
- **横评结果**：在所有需要多步推理的问题类别上 PageIndex > Gemini File Search > 传统 Vector RAG
- **法律合同审查案例**：某律所用 PageIndex 分析收购合同 200+ 页→"第X条第Y款是如何定义实质性不利变化(MAC)条款的？"→PageIndex 能 follow 跨引用精准定位不同版本/修订
- **医疗临床试验报告案例**：复杂表格(不良反应/剂量/统计学显著性)→跨多版本报告对比→LLM Wiki syntheses 跨文档综合
- **与 Claude 3.7 的协同**：PageIndex 可用 Claude 3.7 的 200K context → 树索引+长上下文阅读形成互补——树做粗筛，长上下文做最后"精读"
- **企业采纳路径**：POC(单文档 100 页)→准确率验证→扩展到同类型文档群→引入 OpenKB 做跨文档综合→流程化部署

---

## 第 23 页｜第十一章 LLM Wiki 范式起源：Karpathy 的反 RAG 愿景

- **核心概念**（2026-04 Karpathy Gist）："让 LLM 持续编译并维护一份 Markdown Wiki"——把"检索"换成"编译"
- **三大操作**：①Ingest(吞入)→raw/只读不动，LLM 合成为带[[wikilink]]的 wiki 页面 ②Query(查询)→不再重读全文，基于已编译 wiki 直接回答 ③Lint(整理)→定期健康检查/一致性/更新过期/合并重复
- **核心理念：知识应复利式累积**——每次 ingest 让 wiki 更完整→好答案回写为新页面→知识像代码一样演化、版本化、可复利
- **与传统 RAG 的本质区别**：RAG=每次查询从 raw 重新检索(无累积)；LLM Wiki="查询"变成"导航已拥有的知识"(有累积)
- **不是改进 RAG 的某一环，而是提出与 RAG 并列的新范式**——这是根本性地质疑"每次查询都要从头检索"的架构合理性
- **一个月生态爆炸**：从一篇 Gist 出发，GitHub 涌现 20+ 不同实现→clonn(Obsidian 插件)/guanyang(python CLI)/ussumant(compiler)/green-dalii(node.js)/astro-han(自动生长 Agent)/yologdev(90+篇真实文章)/AlphaLab-USTC 等

---

## 第 24 页｜第十二章 LLM Wiki 三层架构（上）：数据结构

- **三层物理架构**：①`raw/`(原始资料)→PDF/网页/论文/笔记，只读不动，永不被修改 ②`wiki/`(编译知识)→LLM 编译的 Markdown →[[wikilink]]交叉引用 ③`schema/`(知识结构)→Concepts/Entities/Relations/定义
- **raw/ 层的设计哲学**：相当于源码仓库——"源代码"不可修改，"编译产物"(wiki/)可以更新 → 任何 wiki 页面都能通过 Source Notes 回溯到原始资料
- **Schema 层的详细内容**：
  - **Concepts(47个)**：自定义概念，每个含 definition/key thinkers/related concepts/backlinks
  - **Entities(23个)**：具名实体(人物/公司/项目)含属性和关系
  - **Relations**：实体间关系(雇佣/位于/属于/引用/版本/包含)
  - **定义**：关键术语的规范定义+上下文——注入 LLM prompt 作为"世界观"
- **Source Notes(89条)**：每条来源独立保存→保留原始引用 → Query 时通过 Source Notes 回溯原文
- **Syntheses(8个)**：跨文档综合页面 → 如"Vector RAG vs GraphRAG 的系统对比"

---

## 第 25 页｜第十二章 LLM Wiki 三层架构（下）：维护与演化

- **wiki/ 页面的标准化格式**：每个 Markdown 文件含 YAML frontmatter(title/date/type/tags/status/source_notes)+正文+[[wikilink]]+总结(Summary/Key Claims/Quotes/Connections)
- **concepts/ 的持续增长**：Ingest 新资料→LLM 判断是否引入新概念→是→添加到 concepts/+自动更新 backlinks→不是→更新已有概念页面→concepts 从 47 增长到 48、49...
- **知识图谱的隐式构建**：[[wikilink]] = 知识节点的边 → Obsidian Graph View 可以可视化整个 wiki 的知识结构
- **Schema 的价值**：不是"好看的分类"，而是**LLM 在每次 query 时的"世界观"**——inject schema definitions into prompt → 引导 LLM 按领域模型思考
- **三层协同的日常**：Ingest 新论文→raw/(存原文)→LLM 更新 concepts/+syntheses/→Query 时 LLM 先读 schema 中的相关定义再导航 wiki/→Lint 时发现"Vector RAG vs GraphRAG"页面有重复→合并→生成 lint report
- **LLM Wiki 与传统 Wiki 的关键区别**：传统 Wiki 人工维护(慢/易过时)/LLM Wiki LLM 自动编译+维护(快/始终同步)

---

## 第 26 页｜第十三章 LLM Wiki 三工作流：Ingest / Query / Lint

- **① Ingest（吞入）**：新资料(raw/)→LLM 判断是否已有足够知识→决定新建or合并or更新→生成页面+更新 index.md+记录 log→wiki 更新后 query 路线自然变强（复利效应的实现）
- **Ingest 的关键决策**：新资料是"已知主题的新文章"还是"全新领域的知识"？→前者合并到已有页面(+source note)，后者新建页面+可能引入新 concept
- **② Query（查询）**：读 index.md(全局入口)→根据[[wikilink]]跳相关页面→必要时递归展开→基于已编译 wiki 直接回答(不重读 raw)→记录 logging
- **Query 与传统 RAG 的区别**：传统 RAG=每次翻书查目录→找相关段落→读原文→回答；LLM Wiki=已有一本"百科全书"，直接查索引→跳页面→就知道答案
- **③ Lint（整理）**：定期健康检查→检测过期信息(如"最新版本是v2"变成"v3已发布")→合并重复页面(两个人都写了同一个概念)→修正不一致→生成 lint report → 人工 review/approve
- **Lint 的工程价值**：保证 wiki 不会像传统知识库一样腐烂——Lint 是 LLM Wiki 的"持续集成"

---

## 第 27 页｜第十四章 LLM Wiki 工具生态（上）

- **Obsidian 插件（最主流载体）**：clonn/obsidian_plugin_LLM-Wiki → Obsidian 是 LLM Wiki 天然载体(markdown+[[wikilink]]+图谱视图+本地存储)→插件做 ingest/query/lint 自动化
- **Obsidian 优势**：Graph View 可视化[[wikilink]]关系网 / 本地优先(数据不出本地) / 社区生态成熟 / 人类可随时手动编辑 wiki 页面("人机协作")
- **CLI 工具**：guanyang/llm-wiki(python CLI/支持批量 ingest/简单命令) / green-dalii/obsidian-llm-wiki(node.js CLI/一键 transform 已有笔记为结构化 wiki)
- **LLM-Wiki Compiler**：ussumant/llm-wiki-compiler——批量编译已有 Markdown 笔记库 → 一键 transform("/mynotes → raw/+wiki/")→ 适合已有大量笔记的用户
- **VSCode 集成**：部分实现提供 VSCode 扩展 → 开发者在工作流中直接 ingest/query/lint
- **命令行工作流示例**：`llm-wiki ingest paper.pdf`(新建或更新 wiki) → `llm-wiki query "对比方法A与方法B"`(读 index→跳页面→回答) → `llm-wiki lint`(检查一致性)→生成 lint report

---

## 第 28 页｜第十四章 LLM Wiki 自动生长 Agent 与真实案例（下）

- **astro-han "日拱一卒"模式**：Agent 每天自动 ingest 一篇新论文/文章 → 更新 concepts/ + syntheses/ → 生成每日摘要 → "零维护"的知识增长
- **核心逻辑**：定时任务 → 从 RSS/ArXiv/订阅源抓取新内容 → 自动 Ingest → 判断是否需要新 concept → 更新已有页面或新建 → 生成日/周简报
- **yologdev 实践**：90+ 篇文章级真实使用证据 → 从 Karpathy Gist 到个人产品化 → 完整路径验证
- **其他实现**：AlphaLab-USTC 的中国学者适配 / 多个 Obsidian 社区的改造方案 / GitHub 上各种语言实现(Python/TypeScript/Go/Rust)
- **关键共识**：LLM Wiki 是"慢工具"——短期冷启动成本高(需先有一批资料喂给 LLM 编译)→长期复利效应远超每次从头检索的模式
- **与 PageIndex 的互补**：PageIndex 做"单文档深度阅读" / LLM Wiki 做"跨文档长期积累" → OpenKB 把两者合流

---

## 第 29 页｜第十五章 OpenKB：PageIndex + LLM Wiki 的合流

- **OpenKB 是什么**：VectifyAI 2026-05 推出的 CLI 知识库工具——PyPI 包 `openkb`(MIT 协议)——把 PageIndex 和 LLM Wiki 两个范式正式合流
- **核心架构三模块**：①PageIndex File System(多文档树索引)→长文档走树检索 ②LLM Wiki 编译引擎(Ingest→编译 wiki→回写→[[wikilink]]交叉引用) ③Query Router(复杂度分类→选择合适路径)
- **OpenKB 使用模式**：`openkb ingest paper.pdf`(长论文→PageIndex 树检索；也生成 wiki 摘要) → `openkb query "对比方法A与方法B"`(自动路由：跨文档综合→Wiki / 单文档精读→PageIndex) → `openkb lint`(一致性检查)
- **OpenKB 的实现**：Python CLI → 底层使用 PageIndex SDK + 自定义 wiki 编译引擎 → 文件系统存储(非数据库/可 git 版本化)
- **合流的价值**：不再需要用户自己决定"这个查询该用 PageIndex 还是 LLM Wiki"——Query Router 自动判断
- **为什么是标志性事件**：两个独立范式不再"二选一"，而是在同一个系统中协同——代表 Adaptive RAG 首次出现端到端开源实现

---

## 第 30 页｜第十六章 PageIndex vs LLM Wiki：表面对比

- **一句话定位**：PageIndex="把长文档变成 LLM-friendly 目录树"(检索式/每次重新推理)；LLM Wiki="让 LLM 持续编译维护 Markdown Wiki"(累积式/知识随时间增长)
- **核心数据抽象**：JSON 树 vs Markdown+[[wikilink]]
- **知识存储**：原始文档+树索引 vs 已编译 wiki
- **检索机制**：LLM 推理/MCTS/Hybrid vs 读 index.md→[[wikilink]]→递归展开
- **多跳推理**：原生支持(迭代 LLM 推理) vs synthesis page 间接支持
- **跨引用 follow**：node_id 直接跳 vs [[wikilink]] 直接跳
- **冷启动成本**：中(树生成 $0.1-6/文档) vs 高(编译整个 wiki)
- **运行时成本**：中($0.01-0.1/查询) vs 低($0.01-0.05/查询)
- **知识累积**：弱(树是一次性产物) vs 强(每次 ingest 增强)
- **跨文档综合**：不擅长 vs 强(concepts/+syntheses/+source notes)
- **人类可读性**：中(JSON) vs 高(Markdown/人类可直接编辑)
- **审计能力**：强(reasoning trace+page refs) vs 强(source notes+log.md)

---

## 第 31 页｜第十六章 适用场景决策与共同基础

- **选 PageIndex 的四大条件**：①业务核心是"在长文档里精确定位答案" ②准确率是第一优先级(错误代价>>LLM成本) ③多跳推理常见("对比 A 与 B""follow 这个引用") ④跨页引用是核心(大量"see Appendix G")
- **选 LLM Wiki 的四大条件**：①业务核心是"积累知识库长期复用" ②跨文档综合是核心价值("之前读过的资料怎么说") ③知识要版本化+可审计 ④人类要参与维护(业务专家 review/edit)
- **选 OpenKB 的三大条件**：①同时需要长文档精读和跨文档综合 ②想要开箱即用(不想自己拼装) ③本地或私有部署(数据敏感不能用云)
- **共同基础假设 4 条**：①结构化知识比相似度更可靠("逻辑上是" vs "看起来像") ②LLM 推理优于 embedding 检索 ③可解释性是生产必需(黑盒向量检索不可接受) ④领域知识应被显式建模
- **共同局限 6 条**：冷启动成本 / 实时性 / 跨语料检索 / 延迟(秒级) / 超长文档(LLM Wiki 受 context 限制) / 依赖 LLM 质量

---

## 第 32 页｜第十七章 范式之争：Vector RAG 的现状

- **Vector RAG 的 2025-2026 增强路线**：TurboQuant 2-bit 量化(内存降 8 倍/速度不降反升) + BM25 混合检索(关键词+语义并行) + HyDE(LLM 生成假设答案→以假设答案为 query 检索) + Self-RAG/Corrective-RAG(LLM 自我评估相关性/不相关重新检索) + Rerank 精排(bge-reranker-v2-m3/Cohere/LLM-based)
- **Vector RAG 的主场**：非结构化/海量/延迟优先(<100ms) → 客服FAQ/通用问答/短文本匹配
- **核心局限**：所有增强仍然在"embedding 相似度"范式里——没有解决"相似度 ≠ 相关性"的根本问题
- **目前仍是 RAG 地基**：绝大多数生产系统仍然以 Vector RAG 为基础，但开始引入其他范式做补充

---

## 第 33 页｜第十七章 范式之争：GraphRAG 与 Vectorless RAG

- **Microsoft GraphRAG 体系化**：2024 开源→对文档做实体关系抽取→构建知识图谱→Leiden 社区检测→社区摘要→双模式查询(Local/Global)
- **LazyGraphRAG 突破**（2025）：把社区摘要延迟到查询时计算→索引成本降到全量 GraphRAG 的 **0.1%**→代价为每 query 多 2-8 秒
- **Diffbot Benchmark 关键数据**：纯 Vector RAG 在 5+ 实体查询上准确率→**0%** / GraphRAG 在 5-15M token 规模表现最佳 / >15M 后社区摘要失去区分度
- **GraphRAG 主场**：关系密集领域(DevOps/平台工程/安全/事件响应)—"答案不是一段话而是一个关系结构"
- **Vectorless RAG(PageIndex) 差异化**：长结构化文档 50%→98.7% + 可解释(reasoning trace+page refs) + 无基础设施依赖(只要 LLM API)
- **Vectorless RAG 主场**：长结构化文档(财报/合同/技术手册)/跨引用/多跳推理/准确率优先

---

## 第 34 页｜第十七章 三大范式的决策矩阵

- **Towards AI 2026-05 八场景决策矩阵**：

| Query 类型 | 结构 | 准确率需求 | 推荐 |
|-----------|------|----------|------|
| 语义查找 | 非结构化 | 普通 | **Vector RAG** |
| 多跳关系 | 任意 | 高 | **GraphRAG** |
| 结构化文档精确 | 结构化 | 非常高 | **Vectorless RAG** |
| 全局主题 | 大语料 | 普通 | **GraphRAG** |
| 简单事实 | 任意 | 普通 | **Vector RAG** |
| 高实体查询 | 任意 | 高 | GraphRAG / Vectorless |
| 跨引用导航 | 结构化 | 非常高 | **Vectorless RAG** |
| 混合复杂度 | 任意 | 不一 | **Adaptive RAG (Hybrid)** |

- **每个公式的真正主场**：Vector RAG=非结构化+海量+延迟优先 / GraphRAG=关系推理+全局主题 / Vectorless=长结构化+跨引用+准确率
- **2026 明确共识**：Hybrid + Adaptive RAG——Query Router 根据问题复杂度和类型分到不同路径 → "Simple semantic → Vector / Multi-hop → GraphRAG / Structured document → Vectorless / Cross-doc synthesis → LLM Wiki"

---

## 第 35 页｜第十八章 行业落地：金融 + 法律

- **金融（SEC 10-K/10-Q 财报问答）**：Mafin 2.5 准确率 98.7% / 多跳推理(对比FY23/FY24收入+解释变化原因) / 跨页引用(Follow Appendix G) / 表格+注释完整提取(资产负债表+脚注会计政策变更) / 审计级可追溯(every answer with page refs)
- **为何金融是 PageIndex 的最佳场景**：财报=长文档(100-300页) + 高度结构化(Part/Item/Section) + 多跳推理必需 + 跨引用密集 + 错误成本极高(合规风险)
- **法律（合同审查 / 监管文件）**：长合同条款跨引用(follow) / 精确条款定位("第X条定义了什么?") / 多个相关方合同版本对比 / 法院判决书跨案例综合(LLM Wiki syntheses) → 可解释性+引用溯源满足合规
- **法律场景的特殊需求**：不能"大概对"——必须精确到条款号+版本 → PageIndex 的树检索+页码引用天然匹配这个需求

---

## 第 36 页｜第十八章 行业落地：医疗 + 工业技术手册

- **医疗（临床试验报告/药品说明书）**：复杂表格(不良反应表格/剂量递增表/统计学显著性) / 多版本对照(Phase I/II/III 不同时期报告) / 跨文献综合(LLM Wiki "不同研究怎么说?") → 幻觉率低(树检索避免 vibe)
- **医疗场景的 LLM Wiki 价值**：不同药厂的同类药品 → 自动建立 cross-concept → Query 时能综合比较
- **工业技术手册（HVAC/机械设备>1000页）**：维修手册的快速定位 → 跨节跨页集成 → 需要精确页码("第847页的故障代码表")→ 在工业技术手册横评中，所有多步推理类别上 PageIndex 系统性地优于 Gemini File Search
- **跨行业选型规律**：结构化长文档(>50页+有清晰章节)→PageIndex / 跨文档知识合成→LLM Wiki / 通用场景→Hybrid(VR+GR+VL) / 简单FAQ→传统 Vector RAG
- **企业采纳路径**：POC(单文档验证)→扩展到同类型文档群→引入 OpenKB 做跨文档综合→流程化部署

---

## 第 37 页｜第十九章 性能、成本与工程化权衡

- **三范式延迟对比**（单次查询）：Vector RAG <100ms / Vectorless(PageIndex) 3-10秒(多次LLM调用) / GraphRAG 2-20秒 → 实时性选 Vector，准确性选 Vectorless/Graph
- **三范式成本对比**（每查询 $）：Vector RAG $0.001-0.01(已有索引) / PageIndex $0.01-0.1(每次LLM推理) / GraphRAG $0.02-0.5(Lazy后降低) / LLM Wiki $0.01-0.05(复用编译结果)
- **索引成本**（一次性投入 $）：Vector=Embedding 批量极低 / PageIndex=树生成$0.1-6/文档 / GraphRAG=传统极高/LazyGraphRAG 降到0.1% / LLM Wiki=编译$0.5-10/次(累积摊销)
- **工程化架构复杂度**：Vector→基建复杂(向量库+Embedding+rerank+分块)但运行时简单 / PageIndex→基建极简(仅LLM API)但运行时依赖LLM质量 / GraphRAG→基建+运行都复杂但关系推理无可替代
- **冷启动**（初始准备成本）：Vector=需embed所有文档 / PageIndex=需LLM生成树(2-5min/doc) / LLM Wiki=需编译wiki(成本最高但只做一次)
- **不是选"哪个更好"而"哪个更匹配业务"**：延迟敏感→Vector / 准确率敏感→PageIndex / 关系敏感→GraphRAG / 长线积累→LLM Wiki

---

## 第 38 页｜第二十章 局限性与未来发展

- **PageIndex 六大局限**：①开源版无MCTS(仅云服务有/评估时必知) ②单文档检索(不擅长跨文档) ③延迟秒级(不适合实时系统) ④依赖LLM质量(弱模型效果断崖) ⑤树生成2-5分钟(不适合实时文档更新) ⑥SDK生态远不如 LangChain/LlamaIndex
- **LLM Wiki 六大局限**：①冷启动成本高(需先有资料批量编译) ②需LLM持续维护(不是一次性搭建) ③raw/只读不动(原文错误无法修正) ④跨语料检索弱 ⑤[[wikilink]]断裂风险(页面删或重命名) ⑥受 LLM context 限制(超大 wiki 需分片)
- **OpenKB 当前局限**：①仍在快速迭代(v0.3.x/API 不稳定) ②文档不完善 ③CLI 学习成本 ④VectifyAI 商业化方向不确定(开源vs付费功能边界浮动)
- **2026 五大路线图方向**：①Hybrid检索(MCTS开源化) ②自适应路由(复杂度分类器成熟化) ③多文档PageIndex(跨文档树自动合并) ④LLM Wiki工具链专业化(Obsidian/VSCode/Notion) ⑤低成本树生成(GPT-4o mini级别模型精度提升)
- **社区争议焦点**：Vectorless是否真的"vectorless"?(树生成仍需LLM推理) / 延迟vs准确率的商业取舍 / 开源vs商业边界不断浮动

---

## 第 39 页｜第二十一章 结论与展望 + Q&A

- **RAG 已从单一工程问题演化为架构选择问题**——不是"怎么切块怎么存向量"而是"这个场景该用哪种检索范式"
- **PageIndex 三大历史贡献**：①证明"推理优于相似度"在长结构化文档上成立(98.7% vs 50%) ②树=金融RAG新精度标准 ③开创 In-Context Tree Index 新数据抽象
- **LLM Wiki 三大历史贡献**：①从根源质疑"每次从 raw 重新检索" ②提出知识应像代码一样演化和复利 ③用"持续编译"替代"一次检索"
- **OpenKB 的标志意义**：两个范式 2026 合流 → Adaptive RAG 首次端到端开源实现 = RAG 3.0 参考架构
- **2026 三大方向**：Hybrid+Adaptive(多范式路由) / LLM Wiki 工具链成熟化 / Vectorless RAG MCTS 全面开源
- **给实践者的建议**：不是"换掉 Vector RAG"而是"在合适场景引入新范式"→长结构化→PageIndex / 知识积累→LLM Wiki / 通用海量→传统 RAG / Adaptive Router 连接三者

### 使用建议

| 时长 | 建议选页 | 约页数 |
|------|---------|--------|
| **约 18 分钟** | P3, P5-8, P10-11, P17-18, P24, P29-34, P39 | **15** |
| **约 35 分钟** | P3-8, P9-13, P14-18, P20-21, P23-26, P29-34, P38-39 | **28** |
| **完整汇报** | 全文 1～39 | **39** |

原报告文件：`PageIndex与LLM Wiki技术行业深度报告.md`
