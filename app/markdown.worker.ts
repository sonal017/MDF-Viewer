import { renderMarkdown } from "./lib/markdown";

self.onmessage = async (event: MessageEvent<{ id: number; markdown: string }>) => {
  try {
    const html = await renderMarkdown(event.data.markdown);
    self.postMessage({ id: event.data.id, html });
  } catch (error) {
    self.postMessage({
      id: event.data.id,
      error: error instanceof Error ? error.message : "Unable to render Markdown.",
    });
  }
};
