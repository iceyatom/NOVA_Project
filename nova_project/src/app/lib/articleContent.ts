export type ArticleRenderBlock =
  | { kind: "title"; content: string }
  | { kind: "subtitle"; content: string }
  | { kind: "paragraph"; content: string }
  | { kind: "image"; src: string; alt: string };

export function parseArticleBodyBlocks(body: string): ArticleRenderBlock[] {
  const blocks = body
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return blocks.map((block) => {
    const imageMatch = block.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      return {
        kind: "image",
        src,
        alt: alt.trim() || "Inserted article image",
      };
    }

    if (block.startsWith("## ")) {
      return {
        kind: "subtitle",
        content: block.replace(/^##\s+/, "").trim(),
      };
    }

    if (block.startsWith("# ")) {
      return {
        kind: "title",
        content: block.replace(/^#\s+/, "").trim(),
      };
    }

    return {
      kind: "paragraph",
      content: block,
    };
  });
}
