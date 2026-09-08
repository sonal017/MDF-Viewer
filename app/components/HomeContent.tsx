import Link from "next/link";
import GuideCards from "./GuideCards";

export default function HomeContent() {
  return (
    <div className="home-content" id="about-viewer">
      <section className="content-intro" aria-labelledby="viewer-title">
        <p className="content-eyebrow">A workspace for your next README</p>
        <h1 id="viewer-title">Free online Markdown viewer</h1>
        <p className="content-lead">
          Open an MD file, edit the source, and read the formatted result beside it.
          MDF Viewer supports GitHub Flavored Markdown, code highlighting, math, and
          Mermaid diagrams. Use it in your browser without an account or installation.
        </p>
        <div className="content-actions">
          <a className="content-button" href="#editor">Back to the viewer ↑</a>
          <Link href="/guides/open-markdown-file">Opening your first .md file?</Link>
        </div>
      </section>

      <section className="content-section" aria-labelledby="how-to-use">
        <div className="section-heading">
          <p className="content-eyebrow">From plain text to a readable document</p>
          <h2 id="how-to-use">How to use the Markdown viewer</h2>
        </div>
        <ol className="workflow-steps">
          <li><h3>Open or paste</h3><p>Choose <strong>Upload</strong> for a .md, .markdown, or .txt file up to 10 MB. You can also drop a file onto the workspace or paste into the editor.</p></li>
          <li><h3>Read and refine</h3><p>Edit on the left and check the live preview on the right. On a phone, switch between the <strong>Editor</strong> and <strong>Preview</strong> tabs. Use Contents or Fullscreen to read a long document.</p></li>
          <li><h3>Keep a copy</h3><p>Download the Markdown source, export HTML or PDF, or print your preview. On small screens, open the three-dot menu for the export actions.</p></li>
        </ol>
      </section>

      <section className="content-section feature-section" aria-labelledby="viewer-features">
        <div>
          <p className="content-eyebrow">Built for more than plain paragraphs</p>
          <h2 id="viewer-features">Read the details that matter</h2>
          <p>Review a README checklist, compare values in a table, or explain a process with a diagram. Your source remains editable plain text throughout.</p>
        </div>
        <dl className="feature-list">
          <div><dt>GitHub-style formatting</dt><dd>Tables, task lists, strikethrough, fenced code, alerts, and footnotes. <Link href="/guides/github-readme-preview">See the README preview checklist.</Link></dd></div>
          <div><dt>Math and diagrams</dt><dd>Preview LaTeX expressions with KaTeX and write Mermaid diagrams in fenced code blocks.</dd></div>
          <div><dt>Reading controls</dt><dd>Resize the desktop panes, search the source, jump to headings, or switch to a fullscreen preview. Light and dark themes are available.</dd></div>
          <div><dt>Useful exports</dt><dd>Save Markdown or HTML and create a PDF with a light background, even while editing in dark mode. <Link href="/guides/markdown-to-pdf">Compare PDF export and printing.</Link></dd></div>
        </dl>
      </section>

      <section className="content-section" aria-labelledby="practical-guides">
        <div className="section-heading">
          <p className="content-eyebrow">Examples, answers, and a next step</p>
          <h2 id="practical-guides">Practical Markdown guides</h2>
        </div>
        <GuideCards />
      </section>

      <section className="content-section faq-section" aria-labelledby="common-questions">
        <div><p className="content-eyebrow">Before you start</p><h2 id="common-questions">A few useful answers</h2></div>
        <div className="faq-list">
          <details open><summary>What is an MD file?</summary><p>An .md file is a plain-text document that uses Markdown symbols for formatting. A viewer turns headings, lists, links, and other syntax into a readable page. <Link href="/guides/markdown-cheat-sheet">See the syntax examples.</Link></p></details>
          <details><summary>Are my documents uploaded?</summary><p>The viewer reads and renders your document in your browser. It saves the current draft in local storage on this browser profile. Linked images can still make requests to their image hosts. <Link href="/about#privacy">Read how storage and privacy work.</Link></p></details>
          <details><summary>Can I preview a GitHub README?</summary><p>Yes. Upload a downloaded README.md or paste its raw text. The preview supports GFM features such as tables and task lists. Relative repository links and images need a final check on GitHub.</p></details>
          <details><summary>Is this an offline desktop app?</summary><p>It is a web app that processes local files. There is no desktop installation or terminal command. Load the site with an internet connection; a fresh offline visit is not guaranteed to work.</p></details>
          <details><summary>Will my draft be here when I return?</summary><p>Usually, if you return to the same browser profile and site address. Clearing browser data or using private browsing can remove the saved draft. Use Download MD for a durable backup before opening a different file.</p></details>
          <details><summary>Is Markdown to PDF free?</summary><p>Yes. Use Export PDF for a paginated download, or Print to open your browser’s print dialog. Exported PDF pages use a light background regardless of the editor theme.</p></details>
        </div>
      </section>
    </div>
  );
}
