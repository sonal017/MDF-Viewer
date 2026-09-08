import MarkdownViewer from "./MarkdownViewer";
import HomeContent from "./components/HomeContent";
import { SiteFooter } from "./components/ContentShell";
import StructuredData from "./components/StructuredData";
import { absoluteUrl, pageMetadata } from "./lib/seo";

const description = "Open and preview MD files in your browser. Free Markdown viewer with GitHub-style formatting, live editing, diagrams, and PDF export. No sign-up required.";

export const metadata = pageMetadata(
  "Markdown Viewer – Free Online MD Reader & Editor | MDF Viewer", description, "/",
);

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#about-viewer">Skip to Markdown viewer guide</a>
      <main>
        <MarkdownViewer />
        <HomeContent />
      </main>
      <SiteFooter />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: "MDF Viewer", url: absoluteUrl() },
          { "@type": "WebApplication", "@id": absoluteUrl("/#application"),
            name: "MDF Viewer", url: absoluteUrl(), description,
            applicationCategory: "ProductivityApplication", operatingSystem: "Any",
            browserRequirements: "Requires JavaScript and a modern web browser",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: ["Local Markdown file preview", "GitHub Flavored Markdown", "PDF and HTML export", "Mermaid diagrams", "KaTeX math"],
          },
        ],
      }} />
    </>
  );
}
