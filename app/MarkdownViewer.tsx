"use client";

import {
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  MoreHorizontal,
  PanelLeft,
  Printer,
  Search,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useReactToPrint } from "react-to-print";

const STORAGE_KEY = "markdown-viewer:document";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_MARGIN_X_MM = 14;
const PDF_MARGIN_TOP_MM = 14;
const PDF_MARGIN_BOTTOM_MM = 18;
const PDF_EXPORT_WIDTH_PX = 720;
const PDF_RENDER_SCALE = 1.35;
const PDF_JPEG_QUALITY = 0.86;

type PdfTools = {
  html2canvas: (typeof import("html2canvas-pro"))["default"];
  jsPDF: (typeof import("jspdf"))["jsPDF"];
};

let pdfToolsPromise: Promise<PdfTools> | null = null;

function loadPdfTools() {
  if (!pdfToolsPromise) {
    pdfToolsPromise = Promise.all([
      import("html2canvas-pro"),
      import("jspdf"),
    ])
      .then(([html2canvasModule, jsPdfModule]) => ({
        html2canvas: html2canvasModule.default,
        jsPDF: jsPdfModule.jsPDF,
      }))
      .catch((error) => {
        pdfToolsPromise = null;
        throw error;
      });
  }
  return pdfToolsPromise;
}

const STARTER_MARKDOWN = `# Markdown Viewer

Write Markdown on the left. See a clean, GitHub-style preview on the right.

> [!NOTE]
> Your document stays in this browser. Nothing is uploaded.

## Built for real README files

- [x] GitHub Flavored Markdown
- [x] Syntax highlighting
- [x] Tables, footnotes, math, and diagrams
- [ ] Your next great document

| Feature | Status |
| :--- | :---: |
| Live preview | **Ready** |
| Local autosave | **Private** |
| HTML & PDF export | **Included** |

\`\`\`typescript
type Document = {
  title: string;
  ready: boolean;
};

const readme: Document = {
  title: "Hello, Markdown!",
  ready: true,
};
\`\`\`

Math works inline, like $E = mc^2$, and as a block:

$$
\\int_0^1 x^2\\,dx = \\frac{1}{3}
$$

\`\`\`mermaid
flowchart LR
  A[Write] --> B[Preview]
  B --> C[Ship]
\`\`\`

Try an emoji :rocket:, a mention like @octocat, or a footnote.[^1]

[^1]: Footnotes are rendered at the end of the document.
`;

type RenderMessage = {
  id: number;
  html?: string;
  error?: string;
};

type Heading = {
  depth: number;
  label: string;
  id: string;
};

function slugifyHeadings(markdown: string): Heading[] {
  const used = new Map<string, number>();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const label = match[2].replace(/[*_~`[\]]/g, "").trim();
    const base =
      label
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || "section";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    headings.push({
      depth: match[1].length,
      label,
      id: `user-content-${count ? `${base}-${count}` : base}`,
    });
    if (headings.length >= 100) break;
  }

  return headings;
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

async function waitForPdfAssets(root: HTMLElement) {
  await document.fonts?.ready;
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          const finish = () => resolve();
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 4000);
        }),
    ),
  );
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("PDF image encoding failed.")),
      "image/jpeg",
      PDF_JPEG_QUALITY,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function isHeadingElement(element: Element) {
  return /^H[1-6]$/.test(element.tagName);
}

function ToolbarButton({
  icon,
  label,
  onClick,
  className = "",
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`toolbar-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function MarkdownViewer() {
  const [markdown, setMarkdown] = useState(STARTER_MARKDOWN);
  const [html, setHtml] = useState("");
  const [renderError, setRenderError] = useState("");
  const [isRendering, setIsRendering] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [split, setSplit] = useState(50);
  const [activePane, setActivePane] = useState<"editor" | "preview">("editor");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [matchIndex, setMatchIndex] = useState(-1);
  const [status, setStatus] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [counts, setCounts] = useState({
    words: 0,
    characters: 0,
    minutes: 1,
    lines: 1,
  });
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = isThemeReady && resolvedTheme === "dark";

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const renderIdRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setStatus(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setStatus(""), 2600);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setMarkdown(saved);
      setIsHydrated(true);
      setIsThemeReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, markdown);
      } catch {
        notify("Autosave is unavailable for this document.");
      }
    }, markdown.length > 1_000_000 ? 1200 : 450);
    return () => clearTimeout(timer);
  }, [isHydrated, markdown, notify]);

  useEffect(() => {
    const prepare = () => {
      void loadPdfTools().catch(() => undefined);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prepare, { timeout: 4000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = globalThis.setTimeout(prepare, 2500);
    return () => globalThis.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      let words = 0;
      let lines = 1;
      let inWord = false;
      for (let index = 0; index < markdown.length; index += 1) {
        const code = markdown.charCodeAt(index);
        const whitespace =
          code === 9 ||
          code === 10 ||
          code === 13 ||
          code === 32 ||
          code === 160;
        if (code === 10) lines += 1;
        if (whitespace) {
          inWord = false;
        } else if (!inWord) {
          words += 1;
          inWord = true;
        }
      }
      setCounts({
        words,
        characters: markdown.length,
        minutes: Math.max(1, Math.ceil(words / 220)),
        lines,
      });
    }, markdown.length > 1_000_000 ? 700 : 80);
    return () => clearTimeout(timer);
  }, [markdown]);

  useEffect(() => {
    const timer = setTimeout(
      () => setHeadings(slugifyHeadings(markdown.slice(0, 1_000_000))),
      markdown.length > 1_000_000 ? 800 : 80,
    );
    return () => clearTimeout(timer);
  }, [markdown]);

  useEffect(() => {
    try {
      const worker = new Worker(new URL("./markdown.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent<RenderMessage>) => {
        if (event.data.id !== renderIdRef.current) return;
        setIsRendering(false);
        if (event.data.error) {
          setRenderError(event.data.error);
          return;
        }
        setRenderError("");
        setHtml(event.data.html ?? "");
      };
      worker.onerror = () => {
        setRenderError("The preview worker stopped. Refresh to restart it.");
        setIsRendering(false);
      };
      workerRef.current = worker;
      return () => worker.terminate();
    } catch {
      queueMicrotask(() => {
        setRenderError("Live preview is unavailable in this browser.");
        setIsRendering(false);
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        const id = ++renderIdRef.current;
        setIsRendering(true);
        workerRef.current?.postMessage({ id, markdown });
      },
      markdown.length > 1_000_000 ? 500 : 45,
    );
    return () => clearTimeout(timer);
  }, [markdown]);

  useEffect(() => {
    if (!html || !previewRef.current) return;
    let cancelled = false;

    const renderDiagrams = async () => {
      const codeBlocks = Array.from(
        previewRef.current?.querySelectorAll("pre > code.language-mermaid") ?? [],
      );
      if (!codeBlocks.length) return;

      const { default: mermaid } = await import("mermaid");
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: resolvedTheme === "dark" ? "dark" : "default",
        fontFamily: "var(--font-geist-sans)",
      });

      const diagrams = codeBlocks.map((code) => {
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid";
        const source = code.textContent ?? "";
        wrapper.dataset.mermaidSource = source;
        wrapper.textContent = source;
        code.parentElement?.replaceWith(wrapper);
        return wrapper;
      });

      try {
        await mermaid.run({ nodes: diagrams, suppressErrors: true });
      } catch {
        diagrams.forEach((diagram) => diagram.classList.add("mermaid-error"));
      }
    };

    void renderDiagrams();
    return () => {
      cancelled = true;
    };
  }, [activePane, html, resolvedTheme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setIsFullscreen(false);
        setIsMenuOpen(false);
        setIsTocOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const printPreview = useReactToPrint({
    contentRef: previewRef,
    documentTitle: "markdown-preview",
  });

  const handleFile = useCallback(
    (file?: File) => {
      if (!file) return;
      if (!/\.(md|markdown|txt)$/i.test(file.name)) {
        notify("Choose a .md, .markdown, or .txt file.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        notify("That file is larger than the 10 MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setMarkdown(String(reader.result ?? ""));
        setActivePane("editor");
        notify(`${file.name} loaded.`);
      };
      reader.onerror = () => notify("The file could not be read.");
      reader.readAsText(file);
    },
    [notify],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const copyText = async (value: string, message: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Copy command failed");
      }
      notify(message);
    } catch {
      notify("Clipboard access was blocked.");
    }
  };

  const standaloneHtml = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Markdown document</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
  <style>
    :root{color-scheme:light dark}body{margin:0;background:#f6f8fa;color:#1f2328;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.markdown-body{box-sizing:border-box;max-width:980px;margin:40px auto;padding:48px;background:#fff;border:1px solid #d0d7de;border-radius:12px}.markdown-body h1,.markdown-body h2{padding-bottom:.3em;border-bottom:1px solid #d8dee4}.markdown-body pre{overflow:auto;padding:16px;background:#f6f8fa;border-radius:8px}.markdown-body code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.markdown-body table{border-collapse:collapse;width:100%}.markdown-body th,.markdown-body td{padding:8px 12px;border:1px solid #d0d7de}.markdown-body blockquote{margin-left:0;padding-left:1em;color:#59636e;border-left:4px solid #d0d7de}.markdown-alert{padding:12px 16px;border-left:4px solid #2f81f7;background:#f6f8fa}.markdown-alert-title{font-weight:700;color:#0969da}@media(max-width:700px){.markdown-body{margin:0;padding:24px;border:0;border-radius:0}}@media print{body{background:#fff}.markdown-body{margin:0;max-width:none;border:0}}
  </style>
</head>
<body><main class="markdown-body">${html}</main></body>
</html>`;

  const exportPdf = async () => {
    if (!previewRef.current || isExportingPdf) return;

    setIsExportingPdf(true);
    setStatus("Preparing PDF…");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    const exportRoot = document.createElement("article");
    exportRoot.className = "markdown-body pdf-export-root";
    exportRoot.setAttribute("aria-hidden", "true");
    exportRoot.inert = true;

    let mermaidModule: (typeof import("mermaid"))["default"] | null = null;

    try {
      const { html2canvas, jsPDF } = await loadPdfTools();

      const contentWidthMm = PDF_PAGE_WIDTH_MM - PDF_MARGIN_X_MM * 2;
      const contentHeightMm =
        PDF_PAGE_HEIGHT_MM - PDF_MARGIN_TOP_MM - PDF_MARGIN_BOTTOM_MM;
      const pageHeightPx = Math.floor(
        (PDF_EXPORT_WIDTH_PX * contentHeightMm) / contentWidthMm,
      );

      document.body.appendChild(exportRoot);
      const sourceChildren = Array.from(previewRef.current.children);
      const exportBlocks: HTMLDivElement[] = [];
      let currentBlock: HTMLDivElement | null = null;

      for (const sourceChild of sourceChildren) {
        if (!currentBlock || isHeadingElement(sourceChild)) {
          currentBlock = document.createElement("div");
          currentBlock.className = "pdf-export-block";
          exportBlocks.push(currentBlock);
        }
        currentBlock.appendChild(sourceChild.cloneNode(true));
      }

      let page = document.createElement("section");
      page.className = "pdf-export-page";
      exportRoot.appendChild(page);

      for (const block of exportBlocks) {
        page.appendChild(block);

        if (page.scrollHeight > pageHeightPx && page.children.length > 1) {
          page.removeChild(block);
          const nextPage = document.createElement("section");
          nextPage.className = "pdf-export-page";
          nextPage.appendChild(block);
          exportRoot.appendChild(nextPage);
          page = nextPage;
        }
      }

      const pendingDiagramCodes = Array.from(
        exportRoot.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
      );
      for (const code of pendingDiagramCodes) {
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid";
        wrapper.dataset.mermaidSource = code.textContent ?? "";
        code.parentElement?.replaceWith(wrapper);
      }

      const displayMath = Array.from(
        exportRoot.querySelectorAll<HTMLElement>(".katex-display"),
      );
      for (const formula of displayMath) {
        const source = formula.querySelector("annotation")?.textContent;
        if (!source) continue;
        const fallback = document.createElement("div");
        fallback.className = "pdf-math-fallback pdf-math-fallback-display";
        fallback.textContent = source;
        formula.replaceWith(fallback);
      }

      const inlineMath = Array.from(
        exportRoot.querySelectorAll<HTMLElement>(".katex"),
      );
      for (const formula of inlineMath) {
        const source = formula.querySelector("annotation")?.textContent;
        if (!source) continue;
        const fallback = document.createElement("span");
        fallback.className = "pdf-math-fallback";
        fallback.textContent = source;
        formula.replaceWith(fallback);
      }

      const exportDiagrams = Array.from(
        exportRoot.querySelectorAll<HTMLElement>("[data-mermaid-source]"),
      );
      if (exportDiagrams.length) {
        const { default: mermaid } = await import("mermaid");
        mermaidModule = mermaid;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
          fontFamily: "Arial, sans-serif",
        });
        for (const [index, diagram] of exportDiagrams.entries()) {
          const source = diagram.dataset.mermaidSource ?? "";
          const rendered = await mermaid.render(
            `pdf-mermaid-${Date.now()}-${index}`,
            source,
          );
          diagram.innerHTML = rendered.svg;
        }
      }

      await waitForPdfAssets(exportRoot);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });
      pdf.setProperties({
        title: "Markdown preview",
        subject: "Exported from Markdown Viewer",
        creator: "Markdown Viewer",
      });

      const pages = Array.from(
        exportRoot.querySelectorAll<HTMLElement>(".pdf-export-page"),
      );
      let outputPageCount = 0;

      for (const [pageIndex, pdfPage] of pages.entries()) {
        setStatus(`Preparing PDF… ${pageIndex + 1}/${pages.length}`);
        const canvas = await html2canvas(pdfPage, {
          backgroundColor: "#ffffff",
          scale: PDF_RENDER_SCALE,
          useCORS: true,
          logging: false,
          width: PDF_EXPORT_WIDTH_PX,
          windowWidth: PDF_EXPORT_WIDTH_PX,
        });

        const maxSliceHeight = Math.max(
          1,
          Math.floor((canvas.width * contentHeightMm) / contentWidthMm),
        );

        for (let sourceY = 0; sourceY < canvas.height; sourceY += maxSliceHeight) {
          const sliceHeight = Math.min(maxSliceHeight, canvas.height - sourceY);
          let outputCanvas = canvas;

          if (sourceY > 0 || sliceHeight < canvas.height) {
            outputCanvas = document.createElement("canvas");
            outputCanvas.width = canvas.width;
            outputCanvas.height = sliceHeight;
            const context = outputCanvas.getContext("2d");
            if (!context) throw new Error("PDF canvas is unavailable.");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
            context.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight,
            );
          }

          if (outputPageCount > 0) pdf.addPage();
          outputPageCount += 1;
          const renderedHeightMm =
            (sliceHeight * contentWidthMm) / outputCanvas.width;
          const jpegBytes = await canvasToJpegBytes(outputCanvas);
          pdf.addImage(
            jpegBytes,
            "JPEG",
            PDF_MARGIN_X_MM,
            PDF_MARGIN_TOP_MM,
            contentWidthMm,
            renderedHeightMm,
            undefined,
            "FAST",
          );
        }
      }

      for (let pageNumber = 1; pageNumber <= outputPageCount; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 118, 129);
        pdf.text(
          `${pageNumber} / ${outputPageCount}`,
          PDF_PAGE_WIDTH_MM / 2,
          PDF_PAGE_HEIGHT_MM - 7,
          { align: "center" },
        );
      }

      pdf.save("markdown-preview.pdf");
      notify("PDF downloaded.");
    } catch (error) {
      console.error("PDF export failed", error);
      notify("PDF export failed. Please try again.");
    } finally {
      exportRoot.remove();
      if (mermaidModule) {
        mermaidModule.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "default",
          fontFamily: "var(--font-geist-sans)",
        });
      }
      setIsExportingPdf(false);
    }
  };

  const findNext = useCallback(() => {
    const textarea = editorRef.current;
    if (!textarea || !search) return;
    const haystack = markdown.toLocaleLowerCase();
    const needle = search.toLocaleLowerCase();
    const matches: number[] = [];
    let cursor = 0;
    while (matches.length < 1000) {
      const found = haystack.indexOf(needle, cursor);
      if (found === -1) break;
      matches.push(found);
      cursor = found + Math.max(needle.length, 1);
    }
    if (!matches.length) {
      setMatchIndex(-1);
      notify("No matches found.");
      return;
    }
    const next = (matchIndex + 1) % matches.length;
    setMatchIndex(next);
    textarea.focus();
    textarea.setSelectionRange(matches[next], matches[next] + search.length);
    const line = markdown.slice(0, matches[next]).split("\n").length;
    textarea.scrollTop = Math.max(0, (line - 4) * 21);
    notify(`${next + 1} of ${matches.length}`);
  }, [markdown, matchIndex, notify, search]);

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      const rect = splitRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.min(75, Math.max(25, next)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <main
      className={`app-shell ${isFullscreen ? "is-fullscreen" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <header className="navbar">
        <Link className="brand" href="/" aria-label="Markdown Viewer home">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span className="brand-copy">
            <strong>Markdown Viewer</strong>
            <small>Local-first preview</small>
          </span>
        </Link>
        <div className="nav-actions">
          <span className="privacy-pill">
            <span className="privacy-dot" aria-hidden="true" />
            Private by default
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
            aria-label={`Switch to ${isDarkTheme ? "light" : "dark"} mode`}
            title="Toggle color theme"
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <section className="toolbar" aria-label="Document actions">
        <div className="toolbar-group">
          <ToolbarButton
            icon={<Upload size={16} />}
            label="Upload"
            onClick={() => uploadRef.current?.click()}
          />
          <input
            ref={uploadRef}
            className="visually-hidden"
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <ToolbarButton
            icon={<Download size={16} />}
            label="Download MD"
            onClick={() =>
              downloadBlob(markdown, "document.md", "text/markdown;charset=utf-8")
            }
          />
          <ToolbarButton
            icon={<Code2 size={16} />}
            label="Download HTML"
            onClick={() =>
              downloadBlob(
                standaloneHtml(),
                "markdown-preview.html",
                "text/html;charset=utf-8",
              )
            }
            className="toolbar-secondary"
          />
          <ToolbarButton
            icon={
              isExportingPdf ? (
                <span className="mini-spinner" aria-hidden="true" />
              ) : (
                <FileDown size={16} />
              )
            }
            label={isExportingPdf ? "Exporting PDF…" : "Export PDF"}
            onClick={() => void exportPdf()}
            className="toolbar-secondary"
            disabled={isExportingPdf}
          />
        </div>

        <div className="toolbar-group toolbar-center">
          <label className="search-field">
            <Search size={15} aria-hidden="true" />
            <span className="visually-hidden">Search Markdown</span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setMatchIndex(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") findNext();
              }}
              placeholder="Find in document"
            />
            <button type="button" onClick={findNext} aria-label="Find next match">
              <ChevronDown size={15} />
            </button>
          </label>
        </div>

        <div className="toolbar-group toolbar-end">
          <ToolbarButton
            icon={<Copy size={16} />}
            label="Copy Markdown"
            onClick={() => void copyText(markdown, "Markdown copied.")}
            className="toolbar-secondary"
          />
          <ToolbarButton
            icon={<Clipboard size={16} />}
            label="Copy HTML"
            onClick={() =>
              void copyText(
                previewRef.current?.innerHTML ?? html,
                "Rendered HTML copied.",
              )
            }
            className="toolbar-secondary"
          />
          <ToolbarButton
            icon={<Printer size={16} />}
            label="Print"
            onClick={() => printPreview()}
            className="toolbar-secondary"
          />
          <ToolbarButton
            icon={<Maximize2 size={16} />}
            label="Fullscreen"
            onClick={() => {
              setIsFullscreen(true);
              setActivePane("preview");
            }}
          />
          <div className="overflow-wrap">
            <button
              type="button"
              className="icon-button overflow-button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="More document actions"
              aria-expanded={isMenuOpen}
            >
              <MoreHorizontal size={18} />
            </button>
            {isMenuOpen && (
              <div className="overflow-menu">
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(
                      markdown,
                      "document.md",
                      "text/markdown;charset=utf-8",
                    );
                    setIsMenuOpen(false);
                  }}
                >
                  <Download size={16} /> Download MD
                </button>
                <button
                  type="button"
                  onClick={() => void exportPdf()}
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? (
                    <span className="mini-spinner" aria-hidden="true" />
                  ) : (
                    <FileDown size={16} />
                  )}{" "}
                  {isExportingPdf ? "Exporting PDF…" : "Export PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => void copyText(markdown, "Markdown copied.")}
                >
                  <Copy size={16} /> Copy Markdown
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      previewRef.current?.innerHTML ?? html,
                      "Rendered HTML copied.",
                    )
                  }
                >
                  <Clipboard size={16} /> Copy HTML
                </button>
                <button type="button" onClick={() => printPreview()}>
                  <Printer size={16} /> Print preview
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      standaloneHtml(),
                      "markdown-preview.html",
                      "text/html;charset=utf-8",
                    )
                  }
                >
                  <Code2 size={16} /> Download HTML
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreen(true);
                    setActivePane("preview");
                    setIsMenuOpen(false);
                  }}
                >
                  <Maximize2 size={16} /> Fullscreen preview
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mobile-tabs" role="tablist" aria-label="Workspace pane">
        <button
          type="button"
          role="tab"
          aria-selected={activePane === "editor"}
          onClick={() => setActivePane("editor")}
        >
          <PanelLeft size={16} /> Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activePane === "preview"}
          onClick={() => setActivePane("preview")}
        >
          <FileText size={16} /> Preview
          {isRendering && <span className="mini-spinner" aria-label="Rendering" />}
        </button>
      </div>

      <section
        ref={splitRef}
        className="workspace"
        aria-label="Markdown editor and preview"
      >
        <section
          className={`pane editor-pane ${activePane === "editor" ? "mobile-active" : ""}`}
          style={{ width: `${split}%` }}
          aria-label="Markdown editor"
        >
          <div className="pane-header">
            <div className="pane-title">
              <FileText size={15} />
              <strong>document.md</strong>
              <span>Markdown</span>
            </div>
            <span className="autosave-status">
              <Check size={13} /> Saved locally
            </span>
          </div>
          <div className="editor-wrap">
            <div className="line-rail" aria-hidden="true">
              <span>1</span>
              <span>{counts.lines}</span>
            </div>
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              spellCheck={false}
              aria-label="Markdown source"
              placeholder="Start writing Markdown…"
            />
          </div>
        </section>

        <button
          type="button"
          className="split-handle"
          onPointerDown={startResize}
          aria-label="Resize editor and preview panes"
          title="Drag to resize panes"
        >
          <span />
        </button>

        <section
          className={`pane preview-pane ${activePane === "preview" ? "mobile-active" : ""}`}
          style={{ width: `${100 - split}%` }}
          aria-label="Rendered preview"
        >
          <div className="pane-header preview-header">
            <div className="pane-title">
              <FileText size={15} />
              <strong>Preview</strong>
              {isRendering ? (
                <span className="rendering-label">Rendering…</span>
              ) : (
                <span className="live-label">Live</span>
              )}
            </div>
            <div className="preview-controls">
              {headings.length > 0 && (
                <button
                  type="button"
                  className="toc-button"
                  onClick={() => setIsTocOpen((open) => !open)}
                  aria-expanded={isTocOpen}
                >
                  <Menu size={15} /> Contents
                </button>
              )}
              {isFullscreen && (
                <button
                  type="button"
                  className="fullscreen-exit-button"
                  onClick={() => setIsFullscreen(false)}
                >
                  <Minimize2 size={15} /> Exit preview
                </button>
              )}
            </div>
          </div>
          {isTocOpen && (
            <nav className="toc-panel" aria-label="Table of contents">
              <div className="toc-heading">
                <strong>On this page</strong>
                <button
                  type="button"
                  onClick={() => setIsTocOpen(false)}
                  aria-label="Close table of contents"
                >
                  <X size={15} />
                </button>
              </div>
              {headings.map((heading) => (
                <button
                  type="button"
                  key={`${heading.id}-${heading.depth}`}
                  style={{ paddingLeft: `${12 + (heading.depth - 1) * 12}px` }}
                  onClick={() => {
                    previewRef.current
                      ?.querySelector(`#${CSS.escape(heading.id)}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setIsTocOpen(false);
                  }}
                >
                  {heading.label}
                </button>
              ))}
            </nav>
          )}
          <div
            className="preview-scroll"
            tabIndex={0}
            aria-label="Scrollable Markdown preview"
          >
            {renderError ? (
              <div className="error-state" role="alert">
                <strong>Preview unavailable</strong>
                <p>{renderError}</p>
              </div>
            ) : (
              <article
                ref={previewRef}
                className="markdown-body"
                aria-live="polite"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>
        </section>
      </section>

      <div className="statusbar">
        <div>
          <span>{counts.words.toLocaleString()} words</span>
          <span>{counts.characters.toLocaleString()} characters</span>
          <span>{counts.minutes} min read</span>
        </div>
        <div>
          <span>UTF-8</span>
          <span>Client-side only</span>
        </div>
      </div>

      <footer>
        <span>Markdown Viewer · v1.0</span>
        <nav aria-label="Footer links">
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            <Code2 size={14} /> GitHub
          </a>
          <a
            href="https://www.markdownguide.org/basic-syntax/"
            target="_blank"
            rel="noreferrer"
          >
            Markdown docs <ExternalLink size={13} />
          </a>
        </nav>
      </footer>

      {isDragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div>
            <Upload size={34} />
            <strong>Drop your Markdown file</strong>
            <span>.md, .markdown, or .txt · up to 10 MB</span>
          </div>
        </div>
      )}

      {status && (
        <div className="toast" role="status">
          {status}
        </div>
      )}
    </main>
  );
}
