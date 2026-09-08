import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentShell from "../../components/ContentShell";
import GuideCards from "../../components/GuideCards";
import StructuredData from "../../components/StructuredData";
import { findGuide, guides } from "../../lib/guides";
import { absoluteUrl, pageMetadata } from "../../lib/seo";
import { guideSections } from "../GuideContent";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: "Guide not found | MDF Viewer", robots: { index: false } };
  return pageMetadata(guide.metaTitle, guide.description, `/guides/${guide.slug}`);
}

export default async function GuidePage({ params }: Props) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const sections = guideSections[guide.slug];
  const url = absoluteUrl(`/guides/${guide.slug}`);
  const displayDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(guide.updated));

  return (
    <ContentShell>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/guides">Guides</Link><span aria-hidden="true">/</span>
        <span>{guide.label}</span>
      </nav>
      <article className="guide-article">
        <header>
          <p className="content-eyebrow">{guide.label}</p>
          <h1>{guide.title}</h1>
          <p className="content-lead">{guide.summary}</p>
          <p className="guide-date">By <Link href="/about">MDF Viewer</Link> · Updated <time dateTime={guide.updated}>{displayDate}</time></p>
          <div className="content-actions">
            <Link className="content-button" href="/#editor">Open the viewer ↗</Link>
            <a href={guide.sample} download>Download example .md</a>
          </div>
        </header>
        <nav className="guide-toc" aria-label="In this guide">
          {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </nav>
        <div className="guide-body">
          {sections.map((section) => <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>{section.body}
          </section>)}
        </div>
      </article>
      <section className="related-guides" aria-labelledby="related-guides">
        <h2 id="related-guides">Keep working with Markdown</h2>
        <GuideCards exclude={guide.slug} />
      </section>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Article", headline: guide.title, description: guide.description,
            mainEntityOfPage: url, datePublished: guide.updated, dateModified: guide.updated,
            author: { "@type": "Organization", name: "MDF Viewer", url: absoluteUrl("/about") },
          },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
            { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
            { "@type": "ListItem", position: 3, name: guide.title, item: url },
          ] },
        ],
      }} />
    </ContentShell>
  );
}
