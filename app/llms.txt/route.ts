import { guides } from "../lib/guides";
import { absoluteUrl, SOURCE_URL } from "../lib/seo";

// Optional public documentation index, not a ranking or crawler-access directive.
export function GET() {
  const text = [
    "# MDF Viewer",
    "",
    "> A free browser-based Markdown reader and editor with live preview, GitHub-style formatting, and Markdown, HTML, and PDF downloads.",
    "",
    "Markdown rendering and direct exports run on the user's device. Drafts are saved in that browser's local storage, not published as pages on this site. Remote images can contact their hosts; the website itself needs network requests to load. No account is required.",
    "",
    "The pages below explain the supported workflows and their limitations. The Markdown examples are public samples, not user documents.",
    "",
    "## Website",
    "",
    `- [Markdown viewer](${absoluteUrl()}): Open the editor and read the feature overview and FAQs.`,
    `- [Markdown guides](${absoluteUrl("/guides")}): Browse practical guides and downloadable examples.`,
    `- [About and privacy](${absoluteUrl("/about")}): Local processing, autosave limitations, remote resources, and support.`,
    "",
    "## Guides",
    "",
    ...guides.map((guide) => `- [${guide.title}](${absoluteUrl(`/guides/${guide.slug}`)}): ${guide.description}`),
    "",
    "## Markdown examples",
    "",
    `- [Reading notes](${absoluteUrl("/examples/reading-notes.md")}): A small Markdown file for reading and export practice.`,
    `- [Project README](${absoluteUrl("/examples/project-readme.md")}): A README example with GitHub-style formatting.`,
    `- [Syntax reference](${absoluteUrl("/examples/syntax-reference.md")}): Markdown syntax examples to open in the viewer.`,
    "",
    "## Optional",
    "",
    `- [Source code and issue tracker](${SOURCE_URL}): The public project repository.`,
    "",
  ].join("\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      // Keep this support file out of search results; its linked pages stay indexable.
      "X-Robots-Tag": "noindex",
    },
  });
}
