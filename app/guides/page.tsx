import Link from "next/link";
import ContentShell from "../components/ContentShell";
import GuideCards from "../components/GuideCards";
import { pageMetadata } from "../lib/seo";

export const metadata = pageMetadata(
  "Markdown Guides: MD Files, README Previews & PDF | MDF Viewer",
  "Practical Markdown guides with downloadable examples. Open local MD files, preview GitHub READMEs, choose a PDF export method, and learn Markdown syntax.",
  "/guides",
);

export default function GuidesPage() {
  return (
    <ContentShell>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Guides</span></nav>
      <p className="content-eyebrow">The Markdown field guide</p>
      <h1>Markdown guides for better documents</h1>
      <p className="content-lead">Start with the task in front of you. These guides explain the viewer’s controls, include small files you can try, and point out the details to check before sharing a document.</p>
      <section aria-labelledby="choose-guide">
        <h2 id="choose-guide" className="guide-index-heading">Choose a guide</h2>
        <GuideCards />
      </section>
      <section className="content-section">
        <h2>Try each example in the viewer</h2>
        <p>Download the sample linked in a guide, open the viewer, and choose Upload. Save your current work with Download MD first: opening another file replaces the active draft.</p>
        <p>Use the preview to check formatting, then keep the .md source so you can edit it again. The viewer is free and does not require an account.</p>
        <Link className="content-button" href="/#editor">Open Markdown viewer ↗</Link>
      </section>
    </ContentShell>
  );
}
