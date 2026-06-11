#
# Token cost estimation (CNY per 1M tokens, approximate)
#
DEFAULT_MODEL_COSTS: dict[str, dict[str, float]] = {
    "default": {"input": 2.0, "output": 8.0},
    "qwen": {"input": 0.5, "output": 2.0},
    "gpt-4": {"input": 60.0, "output": 120.0},
    "embedding": {"input": 0.1, "output": 0.0},
    "rerank": {"input": 0.5, "output": 0.0},
}


def estimate_cost_cny(token_usage: dict | None, model: str = "") -> float:
    if not token_usage:
        return 0.0
    prompt = float(token_usage.get("prompt_tokens") or token_usage.get("input_tokens") or 0)
    completion = float(token_usage.get("completion_tokens") or token_usage.get("output_tokens") or 0)
    total = float(token_usage.get("total_tokens") or (prompt + completion))

    key = "default"
    m = (model or "").lower()
    if "embed" in m:
        key = "embedding"
    elif "rerank" in m:
        key = "rerank"
    elif "qwen" in m:
        key = "qwen"
    elif "gpt-4" in m or "gpt4" in m:
        key = "gpt-4"

    rates = DEFAULT_MODEL_COSTS.get(key, DEFAULT_MODEL_COSTS["default"])
    if prompt or completion:
        return (prompt * rates["input"] + completion * rates["output"]) / 1_000_000
    return total * rates["input"] / 1_000_000
