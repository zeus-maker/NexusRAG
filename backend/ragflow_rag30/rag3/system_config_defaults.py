#
# RAG3 系统管理默认配置（与前端 mock 结构对齐）
#
from __future__ import annotations

PIPELINE_DEFINITIONS = [
    {"key": "P1", "name": "向量检索流水线", "shortName": "向量", "status": "active", "health": 98,
     "indexed": 0, "total": 0, "avgLatencyMs": 450, "p95LatencyMs": 890, "dailyCalls": 0, "costPer1k": 0.02,
     "stages": ["解析", "分块", "嵌入", "索引", "检索"], "accent": "text-blue-600", "icon": "🔍"},
    {"key": "P2", "name": "PageIndex 流水线", "shortName": "PageIndex", "status": "active", "health": 85,
     "indexed": 0, "total": 0, "avgLatencyMs": 520, "p95LatencyMs": 1020, "dailyCalls": 0, "costPer1k": 0.18,
     "stages": ["解析", "目录识别", "树索引", "树搜索"], "hubPage": "pageindex-hub", "accent": "text-cyan-600", "icon": "🌳"},
    {"key": "P3", "name": "GraphRAG 流水线", "shortName": "GraphRAG", "status": "index_only", "health": 72,
     "indexed": 0, "total": 0, "avgLatencyMs": 1200, "p95LatencyMs": 2400, "dailyCalls": 0, "costPer1k": 0.45,
     "stages": ["切块", "实体抽取", "入图", "社区摘要", "图检索"], "hubPage": "graphrag-hub", "accent": "text-amber-600", "icon": "🕸️"},
    {"key": "P4", "name": "LLM Wiki 流水线", "shortName": "Wiki", "status": "active", "health": 60,
     "indexed": 0, "total": 0, "avgLatencyMs": 180, "p95LatencyMs": 380, "dailyCalls": 0, "costPer1k": 0.08,
     "stages": ["Ingest", "实体提取", "Wiki 编译", "Git 版本"], "hubPage": "wiki-hub", "accent": "text-violet-600", "icon": "📖"},
    {"key": "P5", "name": "Agent 工具流水线", "shortName": "Agent", "status": "disabled", "health": 0,
     "indexed": 0, "total": 0, "avgLatencyMs": 3500, "p95LatencyMs": 6000, "dailyCalls": 0, "costPer1k": 1.2,
     "stages": ["规划", "工具选择", "执行", "汇总"], "hubPage": "agent", "accent": "text-purple-600", "icon": "🤖"},
]

DEFAULT_ROUTING_RULES = [
    {"id": "r1", "tier": "Tier1", "docType": "财报", "intent": "精确答案", "security": "内部",
     "primary": ["P4 Wiki", "P1 向量"], "secondary": [], "fusion": "cascade", "enabled": True, "hitCount7d": 0},
    {"id": "r2", "tier": "Tier2", "docType": "财报", "intent": "数据分析", "security": "内部",
     "primary": ["P2 PageIndex"], "secondary": ["P1 向量"], "fusion": "rrf", "enabled": True, "hitCount7d": 0},
    {"id": "r5", "tier": "Tier2", "docType": "制度", "intent": "问答", "security": "内部",
     "primary": ["P1 向量"], "secondary": ["P4 Wiki"], "fusion": "rrf", "enabled": True, "hitCount7d": 0},
]

DEFAULT_MODEL_CONFIG = {
    "embedding": "",
    "llm": "",
    "reranker": "",
    "classifier": "",
    "classifierTemperature": 0.1,
    "fallbackLlm": "",
}

PIPELINE_GLOBAL_SETTINGS = {
    "maxConcurrency": 32,
    "routeTimeoutMs": 12000,
    "retryCount": 2,
    "softRoutingGap": 0.2,
    "grayReleasePercent": 10,
    "grayReleasePipeline": "P3 GraphRAG",
    "enableRouteCache": True,
    "cacheTtlSec": 300,
}

DEFAULT_FUSION_CONFIG = {
    "topK": {"vector": 100, "bm25": 100, "pageindex": 10, "graphrag_local": 20, "wiki": 5},
    "rrfK": 60,
    "conflictPolicy": "soft_merge",
    "dedupStrategy": "doc_id",
    "channelWeights": [
        {"channel": "vector", "weight": 1.0, "desc": "向量检索"},
        {"channel": "pageindex", "weight": 1.3, "desc": "PageIndex"},
        {"channel": "wiki", "weight": 1.5, "desc": "Wiki"},
        {"channel": "graph", "weight": 1.0, "desc": "GraphRAG"},
    ],
    "rerankModel": "",
    "rerankTopN": 5,
    "conflictAnnotate": True,
}

DEFAULT_RETRIEVAL_STRATEGY = {
    "mode": "classifier_matrix",
    "primary": "vector",
    "secondary": "pageindex",
    "decisionTree": ["Tier1→wiki+vector", "Tier2→pageindex", "Tier3→graph+vector", "Tier4→agent"],
}

DEFAULT_GENERATION_STRATEGY = {
    "strategies": [
        {"type": "direct", "label": "直接回答", "tierDefault": "Tier1", "maxIter": 1, "toolCall": False, "multiAgent": False},
        {"type": "single_rag", "label": "单轮 RAG", "tierDefault": "Tier2", "maxIter": 1, "toolCall": False, "multiAgent": False},
        {"type": "multi_hop", "label": "多跳推理", "tierDefault": "Tier3", "maxIter": 3, "toolCall": False, "multiAgent": False},
        {"type": "agentic", "label": "Agent 工具", "tierDefault": "Tier4", "maxIter": 5, "toolCall": True, "multiAgent": False},
    ],
    "activeType": "single_rag",
}

DEFAULT_CLASSIFIER_CONFIG = {
    "classifiers": [
        {"id": "complexity", "name": "查询复杂度", "active": True, "model": "", "accuracy": 0.92, "latencyMs": 120, "dailyCalls": 0},
        {"id": "document_type", "name": "文档类型", "active": True, "model": "", "accuracy": 0.88, "latencyMs": 95, "dailyCalls": 0},
        {"id": "intent", "name": "用户意图", "active": True, "model": "", "accuracy": 0.85, "latencyMs": 110, "dailyCalls": 0},
        {"id": "security", "name": "安全分级", "active": True, "model": "", "accuracy": 0.96, "latencyMs": 80, "dailyCalls": 0},
    ],
    "routingMatrix": DEFAULT_ROUTING_RULES,
    "tiers": [],
    "keywordRules": [],
    "docTypeMappings": [],
    "intentMappings": [],
    "securityTiers": [],
}

DEFAULT_PROMPT_TEMPLATES = [
    {"id": "pt-1", "name": "RAG 回答生成", "scene": "chat", "version": "v1.0", "uses": 0,
     "status": "published", "updated": "", "body": "你是企业知识助手。基于以下上下文回答：\n\n{{context}}\n\n用户问题：{{query}}"},
]

DEFAULT_GRAY_RELEASES: list = []

DEFAULT_BACKUP_POLICY = {
    "enabled": True,
    "schedule": "每日 02:00",
    "retentionDays": 30,
    "encrypt": True,
}

DEFAULT_VECTOR_DB = {
    "current": "milvus",
    "target": "milvus",
    "options": [
        {"id": "milvus", "label": "Milvus", "status": "supported", "current": True},
        {"id": "elasticsearch", "label": "Elasticsearch", "status": "supported"},
    ],
}

DEFAULT_SECURITY_RULES = {
    "piiRules": [
        {"name": "身份证号", "pattern": r"[1-9]\d{16}[xX\d]", "action": "脱敏", "enabled": True},
        {"name": "手机号", "pattern": r"1[3-9]\d{9}", "action": "脱敏", "enabled": True},
    ],
    "poisonQueue": [],
}

DEFAULT_ROLES = [
    {"id": "admin", "name": "平台管理员", "permissions": ["*"], "userCount": 0},
    {"id": "kb_admin", "name": "知识库管理员", "permissions": ["kb:*", "eval:read"], "userCount": 0},
    {"id": "developer", "name": "开发者", "permissions": ["eval:*", "debug:full"], "userCount": 0},
    {"id": "user", "name": "普通用户", "permissions": ["chat:read", "search:read"], "userCount": 0},
]

CONFIG_DEFAULTS: dict[str, dict | list] = {
    "pipeline": {
        "definitions": PIPELINE_DEFINITIONS,
        "routingRules": DEFAULT_ROUTING_RULES,
        "modelConfig": DEFAULT_MODEL_CONFIG,
        "globalSettings": PIPELINE_GLOBAL_SETTINGS,
        "stats": {"activeCount": 3, "indexOnlyCount": 1, "disabledCount": 1, "todayRoutes": 0,
                  "routeSuccessRate": 99.0, "avgFusionMs": 85, "weeklyRoutes": []},
    },
    "routing_rules": {"rules": DEFAULT_ROUTING_RULES},
    "classifier_config": DEFAULT_CLASSIFIER_CONFIG,
    "fusion": DEFAULT_FUSION_CONFIG,
    "retrieval_strategy": DEFAULT_RETRIEVAL_STRATEGY,
    "generation_strategy": DEFAULT_GENERATION_STRATEGY,
    "prompt_templates": {"items": DEFAULT_PROMPT_TEMPLATES},
    "gray_releases": {"items": DEFAULT_GRAY_RELEASES},
    "backup_policy": DEFAULT_BACKUP_POLICY,
    "vector_db": DEFAULT_VECTOR_DB,
    "security_rules": DEFAULT_SECURITY_RULES,
    "roles": {"items": DEFAULT_ROLES},
}

VALID_CONFIG_KEYS = frozenset(CONFIG_DEFAULTS.keys())
