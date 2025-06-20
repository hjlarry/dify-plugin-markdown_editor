from typing import Mapping
import pathlib
import html
import json

from werkzeug import Request, Response
from dify_plugin import Endpoint


class MarkdownEditorEndpoint(Endpoint):
    def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
        """
        Invokes the endpoint with the given request.
        """
        # Get the path of the directory containing this file
        current_dir = pathlib.Path(__file__).parent

        # Read the HTML, CSS, and JS files
        try:
            with open(current_dir / "index.html", "r", encoding="utf-8") as f:
                index_html = f.read()
            with open(current_dir / "style.css", "r", encoding="utf-8") as f:
                style = f.read()
            with open(current_dir / "script.js", "r", encoding="utf-8") as f:
                script = f.read()
        except FileNotFoundError as e:
            return Response(f"Error: Missing file - {e.filename}", status=500, content_type="text/plain")
        
        if self.session.storage.exist("initial_markdown"):
            initial_markdown = self.session.storage.get("initial_markdown").decode()
        else:
            initial_markdown = '# Welcome!\n\nThis is your markdown editor.'
        
        # Escape the markdown content to safely embed it within the HTML structure
        escaped_markdown = html.escape(initial_markdown)

        default_operation = '[{"operationTitle":"Summarize", "operationPrompt":"Summarize the content follow"}, {"operationTitle":"Improve Writing", "operationPrompt":"Try to find a good way to express the following content"}]'

        operation = settings.get("operation", default_operation)
        operation_string = ""
        try:
            operations = json.loads(operation)
            for item in operations:
                operationTitle = item.get("operationTitle")
                operationPrompt = item.get("operationPrompt")
                operation_string += f'<button data-prompt="{operationPrompt}">{operationTitle}</button>'

        except json.JSONDecodeError:
            operations = json.loads(default_operation)

        # Inject CSS, JS, and the initial markdown content into the HTML
        result = (
            index_html.replace("/* style */", style)
            .replace("/* script */", script)
            .replace("/* initial_markdown_content */", escaped_markdown)
            .replace("/* operation_string */", operation_string)
        )

        return Response(result, status=200, content_type="text/html")
