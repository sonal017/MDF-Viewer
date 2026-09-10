# Search visibility: September 2026 update

## Starting point

The supplied Search Console screenshots show one indexed page, 72 impressions,
3 clicks, 4.2% CTR, and average position 70.9 for the selected period. Queries
include README previews, GitHub Flavored Markdown viewers, and local MD viewers.
This is a small sample, not evidence of a lasting ranking trend.

The competitor's public site, https://markdownviewer.org/, has descriptive
homepage content, links to specific workflows, and educational resources. Public
pages do not reveal its Search Console data or establish why it ranks. This
project uses original explanations of its own supported workflows.

## What changed

- The editor remains at `/`, with public server-rendered content below it.
- Four original guides cover opening files, README previews, PDF export, and syntax.
- Each guide has examples, internal links, and a path back to the working viewer.
- An about page explains local storage, remote resources, and how to report bugs.
- All public pages have unique titles, descriptions, and public canonical URLs.
- The sitemap lists seven public pages with actual content update dates.
- Website/application and article/breadcrumb structured data describe visible content.
- Draft content is marked `data-nosnippet`; it is not a public document publishing feature.

## September 10 audit follow-up

- Shortened the homepage, guides hub, README guide, and PDF guide titles. Tests
  enforce an editorial budget of 60 decoded characters and matching social titles.
  This is a display preference, not a Google title-length limit or ranking guarantee.
- Added `CollectionPage` and an `ItemList` generated from the visible guide records
  on `/guides`, `AboutPage` on `/about`, and breadcrumb markup on both pages.
  Every public page now has JSON-LD; tests check page types, links, and breadcrumbs.
- Added `/llms.txt` as an optional plain-text index of the public pages and Markdown
  examples, generated from the configured production origin and guide records.
  Pages link to it with `rel="describedby"`. It contains no saved user drafts.
  Its `X-Robots-Tag: noindex` applies only to the support file, not its linked pages;
  it is intentionally absent from the sitemap. This file is not required by Google.
- Did not install Google Analytics or Tag Manager. These are optional tracking/tag
  management tools, not indexing requirements. Enabling them needs a real account
  ID and a decision about tracking, consent, and the published privacy information.
- Kept existing article update dates: metadata-only edits are not a reason to make
  unchanged articles appear newly written. No new dependencies were added.

After deployment, rerun the third-party audit on fresh responses. Its tracking
notices may remain while tracking is disabled, and its own scoring rules are not
Google ranking signals. Verify indexing and performance in Search Console instead
of interpreting a higher audit score as a promised traffic increase.

## Deployment and Search Console

1. Commit and push the reviewed changes through the project's normal GitHub workflow.
2. Once Vercel deploys `main`, check `/`, `/guides`, `/about`, and each guide URL.
3. Confirm `/sitemap.xml` lists seven URLs on `https://mdf-viewer.vercel.app`.
4. Keep the existing Search Console sitemap submission. If it reports a fetch error,
   inspect the error and deployed response before submitting again.
5. Use URL Inspection for the new guide URLs and request indexing once if needed.
6. Compare clicks, impressions, and queries after several weeks, ideally using full
   comparable periods. Filter by each guide URL to see which topics attract readers.

Deployment is separate from these local edits. Indexing and traffic are not guaranteed.
Avoid interpreting an average position from a handful of impressions as a stable rank.

## Maintaining the pages

`app/lib/seo.ts` holds the public origin and shared content date. Set
`NEXT_PUBLIC_SITE_URL` to the production origin if moving to a custom domain;
never use a per-deployment preview URL. Guide records in `app/lib/guides.ts` may
use individual update dates as they change. The visible guide date is formatted
from that record. Change dates only for meaningful content changes, not every build.

Keep new pages useful on their own. Do not create multiple near-identical pages
for spelling variations such as "md viewer" and "markdown viewer", claim unsupported
URL imports or terminal features, invent review ratings, or copy competitor prose.
Downloadable examples should contain no private data.

Useful next input is a Search Console query export for a complete 28-day period.
Use actual queries to improve the relevant guide or answer a missing question.
Share the tool where it helps people, such as its repository README and relevant
project documentation; avoid automated link spam.

## References

- Google SEO starter guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Sitemap practices: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- GFM specification: https://github.github.com/gfm/
- Google title guidance: https://developers.google.com/search/docs/appearance/title-link
- Google AI feature guidance: https://developers.google.com/search/docs/appearance/ai-features
- Structured data types: https://schema.org/CollectionPage and https://schema.org/AboutPage
- Optional llms.txt proposal: https://llmstxt.org/

## Verification

`npm test` builds the application and checks server-rendered content, unique metadata,
canonical URLs, local links and anchors, downloadable sample sources, sitemap consistency,
robots, and an unknown guide's 404 response. Existing regression checks remain included.
The same response suite also verifies `/llms.txt`, its content type, and public links.
Run `npx tsc --noEmit` and `npm run lint` as well. Verify the Vercel build with
`NITRO_PRESET=vercel` in the environment, then run `npm run build`.
Set `SEO_TEST_TARGET=vercel` and run `node --test tests/rendered-html.test.mjs`
to run the same response checks against the generated Vercel function.
