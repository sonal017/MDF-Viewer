import type { Element, Parent, Root, Text } from "hast";
import type { Schema } from "hast-util-sanitize";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const alertKinds = new Set([
  "NOTE",
  "TIP",
  "IMPORTANT",
  "WARNING",
  "CAUTION",
]);

const mathTags = [
  "math",
  "annotation",
  "semantics",
  "mrow",
  "mi",
  "mo",
  "mn",
  "msup",
  "msub",
  "mfrac",
  "mspace",
  "mtext",
  "mover",
  "munder",
  "munderover",
  "mtable",
  "mtr",
  "mtd",
  "mroot",
  "msqrt",
  "mpadded",
  "mphantom",
  "menclose",
  "mstyle",
  "mmultiscripts",
  "mprescripts",
  "none",
];

const schema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...mathTags],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      "className",
      "id",
      "ariaLabel",
      "ariaHidden",
      "ariaDescribedBy",
      "role",
      "dataFootnoteRef",
      "dataFootnoteBackref",
    ],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "target",
      "rel",
      "ariaLabel",
    ],
    blockquote: [
      ...(defaultSchema.attributes?.blockquote ?? []),
      "className",
      "dataAlert",
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-[\w-]+$/, /^math-/],
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      "className",
      "dataAlert",
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ["type", "checkbox"],
      "checked",
      "disabled",
    ],
    li: [...(defaultSchema.attributes?.li ?? []), "className"],
    ol: [...(defaultSchema.attributes?.ol ?? []), "className", "start"],
    section: [
      ...(defaultSchema.attributes?.section ?? []),
      "className",
      "dataFootnotes",
    ],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    table: [...(defaultSchema.attributes?.table ?? []), "className"],
    td: [...(defaultSchema.attributes?.td ?? []), "align"],
    th: [...(defaultSchema.attributes?.th ?? []), "align"],
    ul: [...(defaultSchema.attributes?.ul ?? []), "className"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "mailto"],
    src: [...(defaultSchema.protocols?.src ?? []), "data"],
  },
};

function nodeText(node: Element | Text): string {
  if (node.type === "text") return node.value;
  return node.children
    .filter(
      (child): child is Element | Text =>
        child.type === "element" || child.type === "text",
    )
    .map(nodeText)
    .join("");
}

function rehypeHeadingIds() {
  return (tree: Root) => {
    const used = new Map<string, number>();

    visit(tree, "element", (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      const base =
        nodeText(node)
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-") || "section";
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      node.properties.id = count ? `${base}-${count}` : base;
    });
  };
}

function rehypeAlerts() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "blockquote") return;
      const first = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "p",
      );
      if (!first || first.type !== "element" || first.tagName !== "p") return;
      const markerNode = first.children[0];
      if (!markerNode || markerNode.type !== "text") return;

      const match = markerNode.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
      if (!match || !alertKinds.has(match[1])) return;

      const kind = match[1].toLowerCase();
      markerNode.value = markerNode.value.slice(match[0].length);
      node.properties.className = ["markdown-alert", `markdown-alert-${kind}`];
      node.properties.dataAlert = kind;
      node.children.unshift({
        type: "element",
        tagName: "div",
        properties: {
          className: ["markdown-alert-title"],
          ariaLabel: `${match[1]} alert`,
        },
        children: [{ type: "text", value: match[1] }],
      });
    });
  };
}

function rehypeMentions() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (index === undefined || !parent || parent.type !== "element") return;
      const elementParent = parent as Element;
      if (["code", "pre", "a"].includes(elementParent.tagName)) return;
      if (!/@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?/g.test(node.value)) {
        return;
      }

      const parts = node.value.split(
        /(@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)/g,
      );
      elementParent.children.splice(
        index,
        1,
        ...parts
          .filter(Boolean)
          .map((part) =>
            part.startsWith("@")
              ? ({
                  type: "element",
                  tagName: "span",
                  properties: { className: ["mention"] },
                  children: [{ type: "text", value: part }],
                } satisfies Element)
              : ({ type: "text", value: part } satisfies Text),
          ),
      );
      return index + parts.length;
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath)
  .use(remarkEmoji)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHeadingIds)
  .use(rehypeAlerts)
  .use(rehypeMentions)
  .use(rehypeKatex)
  .use(rehypePrism, { ignoreMissing: true })
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string) {
  const file = await processor.process(markdown);
  return String(file);
}
