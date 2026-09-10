import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/prepare-brand-assets.mjs <generated-icon.png>");

const source = resolve(input);
const info = await sharp(source).metadata();
if (info.width !== info.height) throw new Error("The generated icon must be square.");
const brandDirectory = new URL("../public/brand/", import.meta.url);
const masterDirectory = new URL("../assets/brand/", import.meta.url);
await mkdir(brandDirectory, { recursive: true });
await mkdir(masterDirectory, { recursive: true });
const master = new URL("mdf-icon-master.png", masterDirectory);
if (source !== fileURLToPath(master)) await copyFile(source, master);

// Format/size derivatives only: keep the generated design and alpha unchanged.
const sizes = [16, 32, 48, 96, 192, 512];
const pngs = new Map();
for (const size of sizes) {
  const png = await sharp(source).resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 }).toBuffer();
  pngs.set(size, png);
  await writeFile(new URL(`mdf-icon-${size}.png`, brandDirectory), png);
  console.log(`mdf-icon-${size}.png: ${png.length} bytes`);
}

// ICO supports PNG payloads; package actual 16, 32, and 48px versions.
const icoSizes = [16, 32, 48];
const header = Buffer.alloc(6 + icoSizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs.get(size).length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs.get(size).length;
});
await writeFile(new URL("../public/favicon.ico", import.meta.url),
  Buffer.concat([header, ...icoSizes.map((size) => pngs.get(size))]));

// iOS masks the touch icon itself, so give it an opaque blue background.
await sharp(source).flatten({ background: "#2563eb" }).resize(180, 180)
  .png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL("../public/apple-touch-icon.png", import.meta.url)));
