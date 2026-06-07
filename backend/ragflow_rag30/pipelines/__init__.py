"""
RAG 3.0 多通道流水线注册表
"""
from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult
from pipelines.graph_pipeline import GraphPipeline
from pipelines.pageindex_pipeline import PageIndexPipeline
from pipelines.tool_pipeline import ToolPipeline
from pipelines.vector_pipeline import VectorPipeline
from pipelines.wiki_pipeline import WikiPipeline

PIPELINE_REGISTRY: dict[str, BasePipeline] = {
    "vector": VectorPipeline(),
    "pageindex": PageIndexPipeline(),
    "graph": GraphPipeline(),
    "wiki": WikiPipeline(),
    "tool": ToolPipeline(),
}


def run_pipelines(pipeline_ids: list[str], query: str, kb_id: str, top_k: int = 10) -> list[PipelineResult]:
    results: list[PipelineResult] = []
    for pid in pipeline_ids:
        pipe = PIPELINE_REGISTRY.get(pid)
        if pipe:
            results.append(pipe.run(query, kb_id, top_k=top_k))
    return results
