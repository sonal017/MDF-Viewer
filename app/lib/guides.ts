import { CONTENT_UPDATED } from "./seo";

export const guides = [
  {
    slug: "open-markdown-file",
    title: "How to open and read a Markdown file",
    metaTitle: "How to Open an MD File in Your Browser | MDF Viewer",
    description: "Open local .md, .markdown, and .txt files in your browser. Learn how to preview Markdown, read long documents, and keep a backup of your work.",
    summary: "Open a local .md file, read the formatted result, and understand what stays in your browser.",
    label: "Read local files", sample: "/examples/reading-notes.md", updated: CONTENT_UPDATED,
  },
  {
    slug: "github-readme-preview",
    title: "Preview a GitHub README before you publish",
    metaTitle: "GitHub README Preview: GFM Guide | MDF Viewer",
    description: "Preview README.md with GitHub Flavored Markdown. Try a downloadable example and check tables, task lists, code blocks, links, and images before publishing.",
    summary: "Check a README with tables, task lists, and code, including the details a local preview cannot verify.",
    label: "Check a README", sample: "/examples/project-readme.md", updated: CONTENT_UPDATED,
  },
  {
    slug: "markdown-to-pdf",
    title: "Turn Markdown into a readable PDF",
    metaTitle: "Markdown to PDF: Export & Print Guide | MDF Viewer",
    description: "Convert Markdown to PDF with a light page background. Compare Export PDF with Print to PDF, and troubleshoot large files, diagrams, and wide tables.",
    summary: "Choose between PDF export and browser printing, with practical fixes for large files and awkward page breaks.",
    label: "Export a document", sample: "/examples/reading-notes.md", updated: CONTENT_UPDATED,
  },
  {
    slug: "markdown-cheat-sheet",
    title: "Markdown cheat sheet with examples you can try",
    metaTitle: "Markdown Cheat Sheet: Syntax & GFM Examples | MDF Viewer",
    description: "A practical Markdown syntax reference for headings, links, images, tables, task lists, fenced code, and footnotes. Download an example and preview it.",
    summary: "Keep the syntax for everyday Markdown in one place, with examples and fixes for common formatting mistakes.",
    label: "Learn the syntax", sample: "/examples/syntax-reference.md", updated: CONTENT_UPDATED,
  },
] as const;

export function findGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
