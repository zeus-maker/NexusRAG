#
# RAGFlow LLMBundle → RAGAS BaseRagasLLM 适配
#
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from langchain_core.outputs import Generation, LLMResult
from ragas.llms.base import BaseRagasLLM
from ragas.run_config import RunConfig

if TYPE_CHECKING:
    from langchain_core.callbacks import Callbacks
    from ragas.llms.prompt import PromptValue

logger = logging.getLogger(__name__)


def _prompt_to_text(prompt: PromptValue) -> str:
    if hasattr(prompt, "to_string"):
        return prompt.to_string()
    return str(prompt)


def _normalize_chat_result(raw) -> str:
    if isinstance(raw, tuple):
        return str(raw[0] or "")
    return str(raw or "")


class RagflowRagasLLM(BaseRagasLLM):
    """将租户 LLMBundle 包装为 RAGAS 可消费的 judge LLM。"""

    def __init__(self, bundle: object, run_config: RunConfig | None = None):
        super().__init__(run_config=run_config or RunConfig())
        self.bundle = bundle

    def _chat(self, prompt_text: str, *, temperature: float) -> str:
        history = [{"role": "user", "content": prompt_text}]
        gen_conf = {"temperature": temperature, "max_tokens": 2048}
        raw = self.bundle._run_coroutine_sync(
            self.bundle.async_chat("", history, gen_conf)
        )
        return _normalize_chat_result(raw)

    def generate_text(
        self,
        prompt: PromptValue,
        n: int = 1,
        temperature: float = 1e-8,
        stop=None,
        callbacks: Callbacks = None,
    ) -> LLMResult:
        del stop, callbacks
        temp = temperature if temperature is not None else self.get_temperature(n)
        generations: list[list[Generation]] = []
        for _ in range(max(1, n)):
            text = self._chat(_prompt_to_text(prompt), temperature=temp)
            generations.append([Generation(text=text)])
        return LLMResult(generations=generations)

    async def agenerate_text(
        self,
        prompt: PromptValue,
        n: int = 1,
        temperature: float | None = None,
        stop=None,
        callbacks: Callbacks = None,
    ) -> LLMResult:
        del stop, callbacks
        temp = temperature if temperature is not None else self.get_temperature(n)
        generations: list[list[Generation]] = []
        history = [{"role": "user", "content": _prompt_to_text(prompt)}]
        gen_conf = {"temperature": temp, "max_tokens": 2048}
        for _ in range(max(1, n)):
            raw = await self.bundle.async_chat("", history, gen_conf)
            generations.append([Generation(text=_normalize_chat_result(raw))])
        return LLMResult(generations=generations)
