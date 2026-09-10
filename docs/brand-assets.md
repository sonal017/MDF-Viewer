# MDF Viewer brand assets

The mark combines a bold **M** with an open document and a pale-cyan folded corner. Blue matches the existing interface; the white silhouette keeps the icon legible at browser-tab sizes. The header pairs this icon with live “MDF Viewer” text, so the name remains sharp and accessible.

## Files and integration

- `assets/brand/mdf-icon-master.png`: full-resolution generated master, kept outside the public bundle.
- `public/brand/mdf-icon-{16,32,48,96,192,512}.png`: optimized square PNG derivatives.
- `public/favicon.ico`: packaged 16, 32, and 48px PNG frames for browser compatibility.
- `public/apple-touch-icon.png`: opaque 180px icon for iOS bookmarks.
- `app/components/BrandMark.tsx`: shared decorative icon beside the visible brand name.
- `app/layout.tsx`: favicon links shared by all public pages, including a 96px search favicon. Root-relative URLs keep local and preview deployments independent of production assets.

The final icon intentionally has an opaque, full-bleed blue background. Rounded corners in the site header are applied in CSS; mobile operating systems apply their own bookmark masks. The earlier generated concepts had unwanted background/shadow artifacts and are not shipped. The former `public/favicon.svg` is retained but is no longer referenced.

To regenerate size/format derivatives from the checked-in master:

```sh
node scripts/prepare-brand-assets.mjs assets/brand/mdf-icon-master.png
```

Sharp only resizes and packages the final artwork; it does not redraw the design. No additional browser library, external font, tracker, or network image service is used for the branding.

## Generation record

Created with Codex's **built-in image-generation tool**, not the Python CLI fallback. The generator produced the artwork; the following prompts document the concept and refinements. Generated logos are not a trademark-clearance guarantee.

### Initial concept

```text
Use case: logo-brand. Create one original production app-icon logo for MDF Viewer, a free Markdown document reader and editor. Square 1024x1024 canvas. A bold white geometric M formed from two facing open-document pages, with a single small pale-cyan folded page corner incorporated into the upper-right of the mark. Use the site's existing saturated blue palette: flat royal-blue #2563EB rounded-square tile, white main symbol, pale cyan #BAE6FD fold. The tile nearly fills the entire canvas with only transparent pixels outside its rounded corners; center the symbol with balanced 18% interior padding. The M/open-pages silhouette must be strong and legible at 16 and 32 pixels: thick shapes, few elements, no thin strokes or tiny details. Crisp flat vector-like edges, solid colors, elegant balanced proportions. Deliver ONLY the single finished icon, not a presentation sheet, no wordmark or other text, no watermark, no shadows, no gradients, no texture, no 3D, no mockup. Genuinely transparent background outside the tile; no checkerboard drawn into the image.
```

### Finish refinement (referenced the first concept)

```text
Use case: logo-brand / precise-object-edit. Refine this exact MDF Viewer icon into a perfectly clean flat logo asset. Preserve the current M/open-pages silhouette, pale cyan upper-right page fold, rounded blue tile, proportions, position, and transparent outer corners exactly. Change ONLY the finish: remove EVERY shadow, gradient, mottled patch, texture, glow, stray pixel and the dark patch below the M. Blue tile must be one perfectly uniform solid royal blue #2563EB; M must be uniform pure white #FFFFFF; page fold must be uniform pale cyan #BAE6FD. Maintain crisp antialiased edges. No effects or text. No checkerboard. Genuinely transparent outside the tile. Single square icon only, same composition. This must look like pristine flat vector artwork, not a painted or 3D image.
```

### Final production prompt (referenced the refined concept)

```text
Refine the supplied MDF Viewer icon. Preserve exactly the thick white geometric open-book M and light-cyan upper-right folded corner. Replace the ENTIRE background with one flat solid royal blue #2563EB extending edge-to-edge to all four square canvas edges. Remove all gray checkerboard, all rounded outer corners, all shadows and all texture. Output a completely opaque square logo: white and cyan symbol centered on full-bleed blue. No transparent area at all, no checkerboard, no border, no presentation. Balanced generous padding around the symbol. Pristine flat vector-like graphic at 1024 by 1024. This is a single final production app icon, not a mockup.
```
