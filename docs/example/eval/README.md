# 评测数据集示例

本目录提供与 `docs/example/` 下五份示例 PDF **一一对应**的黄金问答集，可直接在 **评测中心 → 数据集 → 导入** 中使用。

## 文件对照

| 评测 CSV | 对应知识库文档 | 建议数据集名称 | 样本数 | 标签建议 |
|----------|----------------|----------------|--------|----------|
| `采购合同_2026年度IT设备采购.csv` | `采购合同_2026年度IT设备采购.pdf` | IT设备采购合同问答集 | 12 | 合同、采购 |
| `财务报告_创新科技2026年Q1季度财务报告.csv` | `财务报告_创新科技2026年Q1季度财务报告.pdf` | Q1财务指标基准集 | 12 | 财务、基准 |
| `公司制度_员工手册与行为规范v3.0.csv` | `公司制度_员工手册与行为规范v3.0.pdf` | 员工制度合规抽检集 | 12 | 合规、制度 |
| `技术文档_RAGFlow企业级RAG引擎部署指南v2.5.csv` | `技术文档_RAGFlow企业级RAG引擎部署指南v2.5.pdf` | RAGFlow部署问答集 | 12 | 技术、部署 |
| `研究报告_2026年中国企业级AI知识管理市场分析.csv` | `研究报告_2026年中国企业级AI知识管理市场分析.pdf` | AI知识管理市场问答集 | 12 | 市场、研究 |
| `全量回归集.csv` | 上述五份 PDF 合并入库后的知识库 | 示例文档全量回归集 | 60 | 回归、默认 |

## 导入步骤

1. **上传并解析文档**：在知识库中将 `docs/example/*.pdf` 上传至同一知识库（或按主题拆成多个知识库），等待解析完成。
2. **新建评测数据集**：评测中心 → 数据集 → 新建，选择关联的知识库。
3. **导入样本**：点击「导入」，选择本目录下对应的 `.csv` 文件。
4. **创建评测任务**：评测中心 → 任务 → 新建，选择数据集与同一知识库，运行 RAGAS / 检索指标评测。

## CSV 格式

后端 `POST /api/v1/eval/datasets/{id}/import`（multipart）使用 `csv.DictReader` 解析，**表头必须为**：

```csv
question,expected_answer
用户问题,黄金标准答案
```

可选列（用于人工标注相关 chunk，导入时写入 `relevant_chunk_ids`）：

```csv
question,expected_answer,relevant_chunk_ids
违约金如何计算？,每逾期一日按合同总金额0.05%,chunk-id-1,chunk-id-2
```

> `relevant_chunk_ids` 为逗号分隔的 chunk ID 列表；示例集未预填，可在解析完成后自行补充以启用 Recall@K 等检索指标。

编码：**UTF-8**（无 BOM）。字段含逗号或换行时请用双引号包裹。

## JSON 批量导入（API）

若通过 API 而非页面上传，可对已创建的数据集发送 JSON：

```bash
curl -X POST "$BASE/api/v1/eval/datasets/$DATASET_ID/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"samples":[{"question":"...","expected_answer":"..."}]}'
```

## 答案编写原则

- 期望答案摘自对应 PDF 正文，尽量**可核对、可自动评分**（含数字、比例、时限等关键事实）。
- 问题覆盖：事实抽取、条款理解、指标计算、流程规定等多类型，便于观察 Faithfulness / Answer Relevancy 差异。
- 运行评测前请确认知识库已索引完成；否则检索为空会导致指标偏低，属环境未就绪而非样本错误。
