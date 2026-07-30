import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Markdown Viewer product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Markdown Viewer/);
  assert.match(html, /Markdown Viewer/);
  assert.match(html, /Private by default/);
  assert.match(html, /document\.md/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps sanitization as the final HTML-transforming pipeline step", async () => {
  const renderer = await readFile(
    new URL("../app/lib/markdown.ts", import.meta.url),
    "utf8",
  );
  const sanitizeIndex = renderer.indexOf(".use(rehypeSanitize");
  const stringifyIndex = renderer.indexOf(".use(rehypeStringify");

  assert.ok(sanitizeIndex > 0, "rehype-sanitize must be configured");
  assert.ok(
    stringifyIndex > sanitizeIndex,
    "sanitization must happen immediately before HTML serialization",
  );
});
