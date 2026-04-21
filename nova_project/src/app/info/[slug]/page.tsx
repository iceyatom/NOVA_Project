import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseArticleBodyBlocks } from "@/app/lib/articleContent";

export const dynamic = "force-dynamic";

function extractArticleId(slug: string): number | null {
  const match = slug.match(/^(\d+)/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default async function InfoTopicPage({
  params,
}: {
  params: { slug: string };
}) {
  const articleId = extractArticleId(params.slug);
  if (!articleId) {
    notFound();
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      author: true,
      modifiedAt: true,
    },
  });

  if (!article || article.type !== "INFO") {
    notFound();
  }

  const blocks = parseArticleBodyBlocks(article.body);
  const modifiedLabel = article.modifiedAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <main className="info-article-page">
      <div className="info-article-shell">
        <article className="info-article-column">
          <h1>{article.title}</h1>
          <p className="info-article-meta">
            By {article.author} · Updated {modifiedLabel}
          </p>

          {blocks.map((block, index) => {
            if (block.kind === "image") {
              return (
                <figure key={`info-article-image-${index}`}>
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={1400}
                    height={900}
                    className="info-article-image"
                    sizes="(max-width: 900px) 100vw, 108ch"
                  />
                </figure>
              );
            }

            if (block.kind === "title") {
              return (
                <h2 key={`info-article-title-${index}`}>{block.content}</h2>
              );
            }

            if (block.kind === "subtitle") {
              return (
                <h3 key={`info-article-subtitle-${index}`}>{block.content}</h3>
              );
            }

            return (
              <p key={`info-article-paragraph-${index}`}>{block.content}</p>
            );
          })}
        </article>
      </div>
    </main>
  );
}
