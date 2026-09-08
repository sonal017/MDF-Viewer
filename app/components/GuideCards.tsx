import Link from "next/link";
import { guides } from "../lib/guides";

export default function GuideCards({ exclude }: { exclude?: string }) {
  return (
    <div className="guide-grid">
      {guides.filter((guide) => guide.slug !== exclude).map((guide) => (
        <Link className="guide-card" key={guide.slug} href={`/guides/${guide.slug}`}>
          <span className="content-eyebrow">{guide.label}</span>
          <h3>{guide.title}</h3>
          <p>{guide.summary}</p>
          <span className="guide-card-link">Read guide <span aria-hidden="true">→</span></span>
        </Link>
      ))}
    </div>
  );
}
