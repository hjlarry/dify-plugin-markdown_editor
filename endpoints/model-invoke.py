from typing import Mapping
import json

from werkzeug import Request, Response
from dify_plugin import Endpoint
from dify_plugin.entities.model.message import UserPromptMessage


class ModelInvokeEndpoint(Endpoint):
    def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
        """
        Invokes the endpoint with the given request.
        """
        # Get the path of the directory containing this file
        model = settings.get("model")
        data = r.get_json()
        prompt = data.get("prompt")
        selectedText = data.get("selectedText")
        if not model:
            return Response("Model is required", status=400)
        if not prompt:
            return Response("prompt is required", status=400)
        if not selectedText:
            return Response("selectedText is required", status=400)
        
        prompt_messages = [UserPromptMessage(content=f"{prompt}:{selectedText}")]
        
        def generator():
            response = self.session.model.llm.invoke(
                model_config=model,
                prompt_messages=prompt_messages,
                stream=True,
            )

            for chunk in response:
                yield chunk.delta.message.content + "\n\n"

        return Response(generator(), status=200, content_type="text/event-stream")
