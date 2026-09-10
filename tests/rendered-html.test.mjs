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

function decodeHtmlText(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (_, entity) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()];
    const hex = entity.slice(0, 2).toLowerCase() === "#x";
    return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}

test("serves unique crawlable pages, metadata, canonicals, and working internal links", async () => {
  const titles = new Set();
  const descriptions = new Set();
  const renderedPages = new Map();
  const knownPaths = new Set(publicPages.map(([path]) => path));

  for (const [path, heading] of publicPages) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /\bnoindex\b/i, `public page remains indexable: ${path}`);
    const html = await response.text();
    renderedPages.set(path, html);
    assert.ok(html.includes(`<h1>${heading}</h1>`) || html.includes(`>${heading}</h1>`), `server-rendered h1: ${path}`);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `one public h1: ${path}`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && description, `title and description: ${path}`);
    assert.equal([...html.matchAll(/<title>/g)].length, 1, `one title: ${path}`);
    // An editorial length budget for concise display, not a Google ranking rule.
    assert.ok([...decodeHtmlText(title)].length <= 60, `concise title: ${path}`);
    assert.equal(html.match(/<meta property="og:title" content="([^"]+)"/)?.[1], title, `Open Graph title: ${path}`);
    assert.equal(html.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1], title, `Twitter title: ${path}`);
    assert.ok(!titles.has(title), `unique title: ${path}`);
    assert.ok(!descriptions.has(description), `unique description: ${path}`);
    titles.add(title);
    descriptions.add(description);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `https://mdf-viewer.vercel.app${path === "/" ? "/" : path}`);
    assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/);
    assert.doesNotMatch(html, /https?:\/\/localhost\/og\.png/);
    assert.match(html, /<link rel="describedby" href="\/llms\.txt" type="text\/plain"/);
    const brandImage = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag).find((tag) => tag.includes('class="brand-mark"'));
    assert.ok(brandImage, `brand image: ${path}`);
    assert.match(brandImage, /src="\/brand\/mdf-icon-96\.png"/);
    assert.match(brandImage, /alt=""/);
    const largeFavicon = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag).find((tag) => tag.includes('href="/brand/mdf-icon-96.png"'));
    assert.ok(largeFavicon, `large favicon: ${path}`);
    assert.match(largeFavicon, /rel="icon"/);
    assert.match(largeFavicon, /sizes="96x96"/);
    assert.match(html, /<link rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/);
    assert.doesNotMatch(html, /href="\/favicon\.svg"/);

    const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(structuredData.length > 0, `structured data present: ${path}`);
    for (const [, json] of structuredData) {
      const data = JSON.parse(json);
      assert.equal(data["@context"], "https://schema.org");
      const graph = data["@graph"];
      assert.ok(Array.isArray(graph));
      if (path.startsWith("/guides/")) {
        assert.ok(graph.some((item) => item["@type"] === "Article"));
      }
      if (path !== "/") {
        const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList");
        assert.ok(breadcrumb, `breadcrumb schema: ${path}`);
        const items = breadcrumb.itemListElement;
        const expectedPaths = path.startsWith("/guides/") ? ["/", "/guides", path] : ["/", path];
        assert.deepEqual(items.map((item) => new URL(item.item).pathname), expectedPaths);
        items.forEach((item, index) => {
          assert.equal(item["@type"], "ListItem");
          assert.equal(item.position, index + 1);
          assert.ok(item.name);
          assert.equal(new URL(item.item).origin, "https://mdf-viewer.vercel.app");
        });
      }
      if (path === "/about" || path === "/guides") {
        const type = path === "/about" ? "AboutPage" : "CollectionPage";
        const page = graph.find((item) => item["@type"] === type);
        assert.ok(page, `${type} present`);
        assert.equal(page.url, canonical);
        assert.equal(page.description, decodeHtmlText(description));
        assert.equal(page.isPartOf["@id"], "https://mdf-viewer.vercel.app/#website");
        assert.equal(page.breadcrumb["@id"], graph.find((item) => item["@type"] === "BreadcrumbList")["@id"]);
        if (path === "/about") {
          assert.equal(page.about["@id"], "https://mdf-viewer.vercel.app/#application");
        } else {
          assert.equal(page.name, heading);
          const guidePages = publicPages.filter(([guidePath]) => guidePath.startsWith("/guides/"));
          assert.equal(page.mainEntity["@type"], "ItemList");
          assert.equal(page.mainEntity.numberOfItems, guidePages.length);
          assert.deepEqual(page.mainEntity.itemListElement, guidePages.map(([guidePath, name], index) => ({
            "@type": "ListItem", position: index + 1, name,
            url: `https://mdf-viewer.vercel.app${guidePath}`,
          })));
        }
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

test("llms.txt serves a public documentation index with valid links", async () => {
  const response = await render("/llms.txt");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain;\s*charset=utf-8$/i);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  const text = await response.text();
  assert.match(text, /^# MDF Viewer\n\n> /);
  assert.equal([...text.matchAll(/^# /gm)].length, 1);
  assert.doesNotMatch(text, /<html|localhost|document\.md/);

  const links = [...text.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\): .+$/gm)].map((match) => match[1]);
  const pageUrls = publicPages.map(([path]) => `https://mdf-viewer.vercel.app${path}`);
  const samplePaths = ["/examples/reading-notes.md", "/examples/project-readme.md", "/examples/syntax-reference.md"];
  const expectedLinks = [...pageUrls, ...samplePaths.map((path) => `https://mdf-viewer.vercel.app${path}`), "https://github.com/sonal017/MDF-Viewer"];
  assert.deepEqual(links.toSorted(), expectedLinks.toSorted());
  for (const path of samplePaths) {
    assert.match(await readFile(new URL(`../public${path}`, import.meta.url), "utf8"), /^# /);
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

test("brand assets have correct dimensions, small payloads, and packaged favicon frames", async () => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const iconSizes = [16, 32, 48, 96, 192, 512];
  const assets = [...iconSizes.map((size) => [`/brand/mdf-icon-${size}.png`, size]), ["/apple-touch-icon.png", 180]];
  const buildRoot = process.env.SEO_TEST_TARGET === "vercel" ? "../.vercel/output/static" : "../dist/client";
  for (const [path, size] of assets) {
    const png = await readFile(new URL(`../public${path}`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), pngSignature, `PNG signature: ${path}`);
    assert.equal(png.readUInt32BE(16), size, `width: ${path}`);
    assert.equal(png.readUInt32BE(20), size, `height: ${path}`);
    assert.ok(png.length < (size <= 96 ? 32_000 : 400_000), `asset weight: ${path}`);
    assert.deepEqual(await readFile(new URL(`${buildRoot}${path}`, import.meta.url)), png, `asset is deployed: ${path}`);
  }

  const ico = await readFile(new URL("../public/favicon.ico", import.meta.url));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1, "ICO type");
  assert.equal(ico.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    assert.equal(ico[entry], size);
    assert.equal(ico[entry + 1], size);
    assert.equal(ico.readUInt16LE(entry + 6), 32);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const png = await readFile(new URL(`../public/brand/mdf-icon-${size}.png`, import.meta.url));
    assert.equal(length, png.length);
    assert.deepEqual(ico.subarray(offset, offset + length), png, `ICO frame: ${size}`);
  }
  assert.deepEqual(await readFile(new URL(`${buildRoot}/favicon.ico`, import.meta.url)), ico);
});
