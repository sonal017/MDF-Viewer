import type { ReactNode } from "react";
import Link from "next/link";

type Section = { id: string; title: string; body: ReactNode };
function Code({ children }: { children: string }) {
  return <pre tabIndex={0} aria-label="Markdown example"><code>{children}</code></pre>;
}

export const guideSections: Record<string, Section[]> = {
  "open-markdown-file": [
    {
      id: "what-is-md", title: "What is a Markdown file?", body: <>
        <p>A Markdown file stores text with a small set of formatting symbols. A line starting with <code>#</code> becomes a heading; a line starting with a dash becomes a list item. The common extension is <code>.md</code>, although some documents use <code>.markdown</code>. You can read the source in a text editor or use a Markdown viewer to see the formatted document.</p>
        <p>A README downloaded from a repository is one common example. Meeting notes, release notes, and technical instructions often use the same format. Renaming a Word document to .md does not convert it: the file must contain plain text.</p>
      </>,
    },
    {
      id: "open-file", title: "Open a local MD file in your browser", body: <>
        <ol>
          <li><Link href="/#editor">Open MDF Viewer</Link>. If you already have an active draft, select <strong>Download MD</strong> to save it before loading another file.</li>
          <li>Select <strong>Upload</strong> and choose a .md, .markdown, or .txt file. The file limit is 10 MB. On desktop, you can also drag the file onto the workspace.</li>
          <li>Read the formatted result in the right-hand pane. On a phone, tap <strong>Preview</strong>; tap <strong>Editor</strong> to return to the source.</li>
          <li>Make a small edit and watch the preview update. Select <strong>Download MD</strong> when you want to keep an edited copy.</li>
        </ol>
        <p>The viewer reads the file you selected; it does not overwrite the original file on your device. A downloaded copy may receive a numbered filename from your browser if a file with that name already exists.</p>
      </>,
    },
    {
      id: "read-long-files", title: "Read long notes without losing your place", body: <>
        <p>Scroll inside the preview to read the rest of the document. <strong>Contents</strong> opens the list of recognized headings, and selecting a heading jumps to that section. A document with clear headings is easier to navigate than one large block of text.</p>
        <p><strong>Fullscreen</strong> expands the preview. Choose <strong>Exit preview</strong> or press Escape to return to editing. On smaller screens, the fullscreen action is in the three-dot menu. The search field finds text in the Markdown source; press Enter to move to the next match.</p>
        <p>For example, these notes produce a heading, a short checklist, and a second section you can find in Contents:</p>
        <Code>{"# Release notes\n\n- [x] Review installation steps\n- [ ] Update screenshots\n\n## Questions for the next release\n\nWhich examples need a clearer explanation?"}</Code>
      </>,
    },
    {
      id: "local-storage", title: "Local preview and local storage are different", body: <>
        <p>Local preview means the document is processed in your browser. Autosave keeps the current draft in that browser’s local storage, which helps when you return to the same site in the same browser profile. It does not create a cloud account, sync to another computer, or replace a file backup.</p>
        <p>Clearing site data can remove the saved draft. Private browsing may remove it when the session ends, and browser restrictions can prevent autosave. Keep important work as a downloaded .md file. See <Link href="/about#privacy">the storage and privacy explanation</Link> for the limits, including requests made by remote images.</p>
      </>,
    },
    {
      id: "file-troubleshooting", title: "If the file does not look right", body: <>
        <p><strong>Everything looks like code:</strong> check for an opening triple-backtick fence without a closing fence. <strong>The image is missing:</strong> a relative path such as <code>./images/chart.png</code> refers to a neighboring file that the viewer has not been given. Use an accessible absolute image URL when appropriate.</p>
        <p><strong>You need a shareable document:</strong> Download HTML keeps formatting for a web browser, while <Link href="/guides/markdown-to-pdf">PDF export or printing</Link> creates pages. Download MD keeps the editable source. This web viewer does not provide a terminal command, and a new offline visit is not guaranteed to work.</p>
      </>,
    },
  ],
  "github-readme-preview": [
    {
      id: "readme-workflow", title: "Preview the source before making a commit", body: <>
        <p>A README is often the first explanation someone sees in a repository. Before publishing, check whether the page answers three questions: what does the project do, how does someone start, and where can they find more help? Formatting should make those answers easy to locate.</p>
        <p>Download README.md from your repository, or copy its raw Markdown text. <Link href="/#editor">Open the viewer</Link> and use Upload or paste into the source pane. Copy from the raw file rather than the formatted GitHub page, which may lose Markdown syntax when pasted. Save your existing draft before replacing it.</p>
        <p>This workflow does not connect to your GitHub account, import a repository URL, or commit edits. When your draft is ready, download the Markdown and update your repository using your usual editor or GitHub workflow.</p>
      </>,
    },
    {
      id: "gfm-example", title: "A small GitHub Flavored Markdown example", body: <>
        <p>GitHub Flavored Markdown, usually shortened to GFM, adds conventions such as tables and task lists to Markdown. MDF Viewer supports these features, so you can inspect the structure while writing. Try this example and change one of the checklist items:</p>
        <Code>{"# Trail Notes\n\nA small app for keeping field notes.\n\n## Getting started\n\n```bash\nnpm install\nnpm run dev\n```\n\n## Release checklist\n\n- [x] Document setup\n- [ ] Test the mobile layout\n\n| Command | Purpose |\n| --- | --- |\n| `npm run dev` | Start locally |\n| `npm run build` | Build the app |"}</Code>
        <p>Keep a blank line before a table and include its separator row. The language after the opening code fence tells the highlighter how to display the block; it does not execute the commands. A task is checked in the source by changing <code>[ ]</code> to <code>[x]</code>.</p>
      </>,
    },
    {
      id: "review-checklist", title: "A practical README review checklist", body: <>
        <ul>
          <li><strong>Heading order:</strong> use a clear project title, then sections for installation, usage, and contribution. Check that Contents provides useful navigation.</li>
          <li><strong>Commands:</strong> include required versions and prerequisites in your explanation. A preview verifies formatting; it cannot prove a command works.</li>
          <li><strong>Tables:</strong> keep cells short. A narrow screen should not force readers to hunt across a large comparison table.</li>
          <li><strong>Images:</strong> include useful alt text, check permissions, and avoid embedding private URLs or credentials.</li>
          <li><strong>Links:</strong> open documentation and issue links yourself. A link that looks right may still point at an old branch or moved page.</li>
        </ul>
        <p>GitHub documents its <a href="https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables">table syntax and alignment rules</a>. For a compact reference inside this site, use the <Link href="/guides/markdown-cheat-sheet">Markdown cheat sheet</Link>.</p>
      </>,
    },
    {
      id: "github-differences", title: "What still needs a check on GitHub", body: <>
        <p>A GitHub-style preview is useful for drafting, but the final GitHub page has repository context that a standalone file does not. An image path such as <code>./docs/screenshot.png</code> can work in the repository and fail here. Uploading README.md does not also upload the docs folder.</p>
        <p>The same applies to relative links. Do not replace all repository paths just to make a local preview work. Keep the paths your repository needs, and verify them in GitHub’s own preview before merging. If you temporarily use an absolute image URL for a layout check, remember to restore the intended source.</p>
        <p>GitHub’s heading anchors, allowed HTML, diagram renderer, and special features can differ. This viewer sanitizes HTML and does not run embedded scripts. Math and Mermaid support here should not be taken as a promise that every other Markdown platform supports the same syntax.</p>
      </>,
    },
    {
      id: "save-readme", title: "Keep the source alongside any exports", body: <>
        <p>Use Download MD for the version you plan to commit. A <Link href="/guides/markdown-to-pdf">PDF copy</Link> can be useful for a review or meeting, but the Markdown remains the easiest version to edit and compare in Git. If a paragraph is hard to scan in the preview, simplify it before adding more formatting.</p>
      </>,
    },
  ],
  "markdown-to-pdf": [
    {
      id: "export-steps", title: "Export a Markdown document to PDF", body: <>
        <ol>
          <li><Link href="/#editor">Open the viewer</Link> and upload a Markdown file or paste its text. Save any previous draft first.</li>
          <li>Review the preview and wait for diagrams or images to finish rendering. On a phone, select the Preview tab so you can check the result.</li>
          <li>Select <strong>Export PDF</strong>. On a small screen, this action is in the three-dot menu. The button shows progress while the document is prepared.</li>
          <li>Open the downloaded PDF and check the first and last pages, wide tables, and diagrams before sharing it.</li>
        </ol>
        <p>The download uses A4 pages with margins and page numbers. Its background stays light even when you use the viewer’s dark theme. The downloaded file is separate from your editable Markdown, so keep the source as well.</p>
      </>,
    },
    {
      id: "export-vs-print", title: "Export PDF or Print to PDF?", body: <>
        <p>There are two useful routes. Choose based on how the recipient needs to use the document, then inspect a short sample before exporting a long file.</p>
        <div className="content-table-wrap" tabIndex={0} role="region" aria-label="PDF export methods comparison"><table>
          <thead><tr><th scope="col">Method</th><th scope="col">Useful when</th><th scope="col">What to check</th></tr></thead>
          <tbody>
            <tr><th scope="row">Export PDF</th><td>You want the viewer’s paginated download with a consistent light page style.</td><td>Pages contain rendered images of the document. Text is not normally selectable or searchable; long or image-heavy files can be larger.</td></tr>
            <tr><th scope="row">Print → Save as PDF</th><td>You want browser print controls and generally selectable text in a text-heavy document.</td><td>The result depends on your browser. Review paper size, margins, page breaks, and browser headers and footers in the print dialog.</td></tr>
          </tbody>
        </table></div>
        <p>Print to PDF is often the better starting point for compact, mostly textual documents. It can retain text rather than making a picture of every page. It does not automatically guarantee a fully accessible or correctly tagged PDF; check the output against your recipient’s needs.</p>
      </>,
    },
    {
      id: "file-size", title: "Reduce file size without making text hard to read", body: <>
        <p>Start with the content. A multi-megapixel screenshot displayed as a small illustration can dominate a document’s size. Resize or compress your original images appropriately and keep the details people actually need to read. Replacing screenshots of text with real Markdown text also helps when using browser printing.</p>
        <p>The Export PDF route captures pages as compressed images. More pages mean more image data even if the source .md file is only a few kilobytes. That is why comparing an MD file’s size directly to its PDF size can be misleading. For text-heavy reports, try Print to PDF and compare both files at normal reading zoom.</p>
        <p>The exporter already balances resolution and image compression. It does not currently offer a quality slider. If the result is slow, try a short section to see whether one very large image, a diagram, or simply the page count explains the delay.</p>
      </>,
    },
    {
      id: "pdf-troubleshooting", title: "Fix common export problems", body: <>
        <ul>
          <li><strong>Wide table or long code line:</strong> shorten cell content, split the table, or break long code examples into readable lines. Browser printing may offer landscape paper orientation.</li>
          <li><strong>Missing remote image:</strong> confirm the URL loads and the host permits cross-origin access. An image that appears in a browser preview may still be restricted during capture.</li>
          <li><strong>Diagram is missing:</strong> wait until it appears in the Preview pane before exporting. Check Mermaid syntax if an error is displayed.</li>
          <li><strong>Math looks different:</strong> the direct PDF exporter uses readable TeX text for formulas where capture fidelity is unreliable. Try browser printing if you need the typeset formula from the preview.</li>
          <li><strong>Dark content is difficult to read:</strong> the export uses light page colors, but a source image with white text and a transparent background can still need a suitable background of its own.</li>
        </ul>
        <p>Long blocks can span page boundaries. Check headings near the bottom of pages and avoid extremely tall single images. If the final document will be printed, inspect the actual print preview as well as the downloaded file.</p>
      </>,
    },
    {
      id: "export-checklist", title: "Before sending the document", body: <>
        <p>Check page count, text size, image readability, and whether the reader needs to select or search the text. Verify that confidential notes were removed from the source before creating the final export. Give the downloaded file a descriptive name and keep the editable .md file separately.</p>
        <p>If the source needs cleanup, the <Link href="/guides/markdown-cheat-sheet">syntax reference</Link> covers tables, lists, and code fences. For a README, use the <Link href="/guides/github-readme-preview">README checklist</Link> before making your shareable copy.</p>
      </>,
    },
  ],
  "markdown-cheat-sheet": [
    {
      id: "headings-paragraphs", title: "Headings and paragraphs", body: <>
        <p>Put a space after the heading marker and use more <code>#</code> symbols for deeper sections. Use blank lines to separate paragraphs. A clear heading hierarchy helps both readers and the viewer’s Contents navigation.</p>
        <Code>{"# Project notes\n\nA short introduction to the project.\n\n## Installation\n\nExplain the prerequisites first.\n\n### Windows\n\nAdd platform-specific instructions here."}</Code>
        <p>A single newline inside a paragraph may still appear as part of the same paragraph. If you intended a new paragraph, add an empty line rather than a run of spaces.</p>
      </>,
    },
    {
      id: "emphasis-links", title: "Emphasis, links, and images", body: <>
        <Code>{"Use **bold** for a key point and *italics* for emphasis.\n\nMark old text with ~~strikethrough~~.\n\n[Project documentation](https://example.com/docs)\n\n![A chart showing weekly signups](https://example.com/chart.png)\n\nUse `npm install` for a short inline command."}</Code>
        <p>The URLs above are placeholders: replace them with your own accessible destinations. Link text belongs in square brackets and the destination goes in parentheses. An image starts with <code>!</code>, and its bracketed text describes the image for readers who cannot see it.</p>
        <p>A local image path is not automatically available just because you opened a Markdown file. See the <Link href="/guides/github-readme-preview#github-differences">README guide’s relative-path explanation</Link> before changing links that already work in a repository.</p>
      </>,
    },
    {
      id: "lists-quotes", title: "Lists, tasks, and block quotes", body: <>
        <Code>{"- Download the example\n- Open it in the viewer\n\n1. Read the introduction\n2. Check the examples\n\n- [x] Draft written\n- [ ] Review complete\n\n> Keep the explanation close to the example."}</Code>
        <p>Task lists are a GFM feature. Use a space inside the brackets for an unchecked task and an <code>x</code> for a checked task. Indent nested list items consistently. Keep a blank line around a block quote when it should be separate from the surrounding text.</p>
      </>,
    },
    {
      id: "tables", title: "Tables and column alignment", body: <>
        <Code>{"| Item | Quantity | Status |\n| :--- | ---: | :---: |\n| Notebook | 2 | Ready |\n| Pen | 4 | Ready |"}</Code>
        <p>The separator row is required. A colon on the left aligns a column left; a colon on the right aligns it right; colons on both ends center it. The example keeps item names left-aligned, quantities right-aligned, and status values centered.</p>
        <p>Use <code>{"\\|"}</code> to include a literal pipe inside a cell. Keep tables for short comparisons; paragraphs inside many wide columns are difficult to read on phones and may be awkward to <Link href="/guides/markdown-to-pdf">export to PDF</Link>.</p>
      </>,
    },
    {
      id: "code-blocks", title: "Fenced code blocks", body: <>
        <Code>{"```javascript\nconst title = 'Release notes';\nconsole.log(title);\n```"}</Code>
        <p>Open and close a code block with three backticks. Add a language name after the opening fence for syntax highlighting. The viewer displays code as text; it does not execute it. If the rest of a document suddenly looks like code, look for a missing closing fence.</p>
      </>,
    },
    {
      id: "extensions", title: "Footnotes, math, and diagrams", body: <>
        <Code>{"A detail worth keeping out of the main paragraph.[^note]\n\n[^note]: The explanation appears in a footnote.\n\nInline math: $E = mc^2$\n\n```mermaid\nflowchart LR\n  Draft --> Review\n  Review --> Publish\n```"}</Code>
        <p>MDF Viewer supports footnotes, LaTeX math through KaTeX, and Mermaid diagram fences. These are extensions beyond basic Markdown, and other apps can interpret them differently. Preview in the destination app before publishing.</p>
        <p>For tables and task lists, the <a href="https://github.github.com/gfm/">GFM specification</a> describes the format. GitHub also provides <a href="https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams">diagram documentation</a> for repository content.</p>
      </>,
    },
    {
      id: "try-syntax", title: "Check one change at a time", body: <>
        <p>Download the sample at the top of this guide and <Link href="/#editor">open it in the viewer</Link>. Change a heading, align a table column, or check a task in the source. Comparing a small edit with its preview is often faster than debugging a whole document at once.</p>
        <p>If a section looks wrong, check blank lines, matching brackets, and closing fences first. Keep the .md source when you export: a PDF is useful for reading, while the source is what you will want for your next edit.</p>
      </>,
    },
  ],
};
