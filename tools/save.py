from collections.abc import Generator
from typing import Any

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage


class SaveTool(Tool):
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage]:
        content = tool_parameters.get("content")
        self.session.storage.set("initial_markdown", content.encode())
        yield self.create_text_message("SUCCESS")
