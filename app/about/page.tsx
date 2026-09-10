import Link from "next/link";
import ContentShell from "../components/ContentShell";
import StructuredData from "../components/StructuredData";
import { absoluteUrl, pageMetadata, SOURCE_URL } from "../lib/seo";

const title = "About MDF Viewer: Local Documents, Storage & Privacy";
const description = "Learn how MDF Viewer handles Markdown files, local autosave, remote images, and exports. Read the source or report a problem through the GitHub repository.";
const url = absoluteUrl("/about");

export const metadata = pageMetadata(
  title,
  description,
  "/about",
);

export default function AboutPage() {
  return (
    <ContentShell>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>About</span></nav>
      <article className="guide-article">
        <p className="content-eyebrow">About the tool</p>
        <h1>Markdown, close to your work.</h1>
        <p className="content-lead">MDF Viewer is a free browser workspace for reading and editing Markdown. It brings the source and preview together so you can check a README, review notes, and export a document without setting up an account.</p>
        <div className="guide-body">
          <section><h2>What this project provides</h2>
            <p>The viewer supports GitHub Flavored Markdown, highlighted code, math, and Mermaid diagrams. You can open a local file, paste text, resize the desktop panes, read in fullscreen, and download Markdown, HTML, or PDF.</p>
            <p>The project’s code is available in the <a href={SOURCE_URL}>MDF Viewer GitHub repository</a>. This is an independent project, not an official GitHub product. “GitHub-style” describes the preview’s formatting and does not mean every GitHub feature will behave identically.</p>
          </section>
          <section id="privacy"><h2>Where your document goes</h2>
            <p>When you choose Upload, the browser reads the selected file for the editor. Markdown rendering and direct exports run on your device; the viewer does not submit the document body to a document-storage server. Opening the website still makes normal network requests to load the application.</p>
            <p>Markdown can refer to remote images. Rendering those images may contact their hosts, and following a link opens its destination. Those services have their own practices. A file processed locally is not a promise that all content inside it can be displayed without network access.</p>
            <p>The site is hosted on Vercel, which may process ordinary connection and request information to serve the website. The app does not require an email address or an account to use the editor.</p>
          </section>
          <section><h2>Autosave is a convenience, not a backup</h2>
            <p>The current draft is saved in local storage for this site and browser profile. Your theme preference also persists in the browser. There is no cross-device draft synchronization or document history.</p>
            <p>Opening another file replaces the active draft. Clearing site data, changing browser profiles, or ending a private browsing session may remove your saved text. Download important Markdown files before opening a new document or clearing browser data.</p>
            <p>To remove a saved draft, clear the site’s stored data in your browser settings. This also resets other preferences saved by the site.</p>
          </section>
          <section><h2>Report a problem or suggest an improvement</h2>
            <p><a href={`${SOURCE_URL}/issues`}>Open a GitHub issue</a> with the browser and device you used, the steps that caused the problem, and a small example that reproduces it. Remove private information from examples and screenshots before posting them to a public issue.</p>
            <p>The <Link href="/guides">Markdown guides</Link> explain common formatting and export problems. They describe the viewer’s current behavior and include examples you can download and inspect.</p>
          </section>
        </div>
      </article>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "AboutPage", "@id": `${url}#webpage`,
            url, name: title, description, inLanguage: "en",
            isPartOf: { "@id": absoluteUrl("/#website") },
            about: { "@id": absoluteUrl("/#application") },
            breadcrumb: { "@id": `${url}#breadcrumb` },
          },
          {
            "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
              { "@type": "ListItem", position: 2, name: "About", item: url },
            ],
          },
        ],
      }} />
    </ContentShell>
  );
}
