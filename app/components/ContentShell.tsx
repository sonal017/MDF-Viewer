import Link from "next/link";
import { SOURCE_URL } from "../lib/seo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/">MDF Viewer</Link>
      <nav aria-label="Site links">
        <Link href="/guides">Markdown guides</Link>
        <Link href="/about">About & privacy</Link>
        <a href={SOURCE_URL}>Source on GitHub</a>
      </nav>
    </footer>
  );
}

export default function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="resource-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="resource-header">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">M</span>
          <strong>MDF Viewer</strong>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/guides">Guides</Link>
          <Link className="content-button" href="/#editor">Open viewer <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>
      <main id="main-content" className="resource-main" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  );
}
