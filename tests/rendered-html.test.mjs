import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const isVercel = process.env.SEO_TEST_TARGET === "vercel";
  const workerUrl = new URL(
    isVercel ? "../.vercel/output/functions/__server.func/index.mjs" : "../dist/server/index.js",
    import.meta.url,
  );
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  if (isVercel) {
    return worker.fetch(new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }), { waitUntil() {} });
  }

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

test("keeps PDF export paginated, theme-independent, and on patched libraries", async () => {
  const [viewer, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/MarkdownViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  ]);

  assert.equal(packageJson.dependencies["html2pdf.js"], undefined);
  assert.match(packageJson.dependencies["html2canvas-pro"], /^\^2\.4\./);
  assert.match(packageJson.dependencies.jspdf, /^\^4\.2\./);
  assert.match(viewer, /import\("html2canvas-pro"\)/);
  assert.match(viewer, /import\("jspdf"\)/);
  assert.match(viewer, /PDF_PAGE_HEIGHT_MM/);
  assert.match(viewer, /PDF_RENDER_SCALE = 1\.35/);
  assert.match(viewer, /PDF_JPEG_QUALITY = 0\.86/);
  assert.match(viewer, /canvasToJpegBytes/);
  assert.match(viewer, /requestIdleCallback/);
  assert.match(viewer, /className = "pdf-export-page"/);
  assert.match(styles, /\.pdf-export-root[\s\S]*?color-scheme:\s*light/);
  assert.match(
    styles,
    /@media print[\s\S]*?\.markdown-body\s*\{[\s\S]*?background:\s*#ffffff;[\s\S]*?color-scheme:\s*light/,
  );
});

test("reruns Mermaid rendering when the active mobile pane changes", async () => {
  const viewer = await readFile(
    new URL("../app/MarkdownViewer.tsx", import.meta.url),
    "utf8",
  );

  assert.match(viewer, /\[activePane, html, resolvedTheme\]/);
});

const publicPages = [
  ["/", "Free online Markdown viewer"],
  ["/guides", "Markdown guides for better documents"],
  ["/about", "Markdown, close to your work."],
  ["/guides/open-markdown-file", "How to open and read a Markdown file"],
  ["/guides/github-readme-preview", "Preview a GitHub README before you publish"],
  ["/guides/markdown-to-pdf", "Turn Markdown into a readable PDF"],
  ["/guides/markdown-cheat-sheet", "Markdown cheat sheet with examples you can try"],
];

test("serves unique crawlable pages, metadata, canonicals, and working internal links", async () => {
  const titles = new Set();
  const descriptions = new Set();
  const renderedPages = new Map();
  const knownPaths = new Set(publicPages.map(([path]) => path));

  for (const [path, heading] of publicPages) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    renderedPages.set(path, html);
    assert.ok(html.includes(`<h1>${heading}</h1>`) || html.includes(`>${heading}</h1>`), `server-rendered h1: ${path}`);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `one public h1: ${path}`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && description, `title and description: ${path}`);
    assert.ok(!titles.has(title), `unique title: ${path}`);
    assert.ok(!descriptions.has(description), `unique description: ${path}`);
    titles.add(title);
    descriptions.add(description);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `https://mdf-viewer.vercel.app${path === "/" ? "/" : path}`);
    assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/);
    assert.doesNotMatch(html, /https?:\/\/localhost\/og\.png/);

    const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (path === "/" || path.startsWith("/guides/")) {
      assert.ok(structuredData.length > 0, `structured data present: ${path}`);
    }
    for (const [, json] of structuredData) {
      const data = JSON.parse(json);
      assert.equal(data["@context"], "https://schema.org");
      if (path.startsWith("/guides/")) {
        assert.ok(data["@graph"].some((item) => item["@type"] === "Article"));
        assert.ok(data["@graph"].some((item) => item["@type"] === "BreadcrumbList"));
      }
    }
  }

  for (const [path, html] of renderedPages) {
    for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"]*|#[^"]+)"/g)) {
      const url = new URL(href, `https://mdf-viewer.vercel.app${path}`);
      if (url.pathname.startsWith("/examples/")) {
        const sample = await readFile(new URL(`../public${url.pathname}`, import.meta.url), "utf8");
        assert.match(sample, /^# /);
        continue;
      }
      assert.ok(knownPaths.has(url.pathname), `linked page exists: ${href} on ${path}`);
      if (url.hash) {
        assert.ok(renderedPages.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `anchor exists: ${href}`);
      }
    }
  }
});

test("sitemap lists all public pages with stable dates and robots points to it", async () => {
  const first = await (await render("/sitemap.xml")).text();
  const second = await (await render("/sitemap.xml")).text();
  assert.equal(first, second, "lastmod must not change on each request");
  const urls = [...first.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls.sort(), publicPages.map(([path]) => `https://mdf-viewer.vercel.app${path === "/" ? "/" : path}`).sort());
  const robots = await (await render("/robots.txt")).text();
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/mdf-viewer\.vercel\.app\/sitemap\.xml/);
});

test("unknown guide is a real 404 instead of a duplicate landing page", async () => {
  const response = await render("/guides/does-not-exist");
  assert.equal(response.status, 404);
});
