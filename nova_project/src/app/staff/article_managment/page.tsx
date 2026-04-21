"use client";

import { useRef, useState } from "react";

const ARTICLE_TITLE_MAX_LENGTH = 140;
const ARTICLE_BODY_MAX_LENGTH = 10000;

type ArticleDraft = {
  title: string;
  body: string;
};

type EditorViewMode = "edit" | "split" | "preview";

const INITIAL_DRAFT: ArticleDraft = {
  title: "",
  body: "",
};

type PreviewBlock =
  | { kind: "title"; content: string }
  | { kind: "subtitle"; content: string }
  | { kind: "paragraph"; content: string };

type BodyFormatMode = "title" | "subtitle" | "normal";
type ActiveBodyFormatMode = BodyFormatMode | "mixed" | "none";

function formatSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  mode: BodyFormatMode,
) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndBreak === -1 ? value.length : lineEndBreak;
  const target = value.slice(lineStart, lineEnd);

  const formatted = target
    .split("\n")
    .map((line) => {
      const withoutPrefix = line.replace(/^#{1,2}\s+/, "");
      if (!withoutPrefix.trim()) {
        return line;
      }

      if (mode === "title") {
        return `# ${withoutPrefix}`;
      }

      if (mode === "subtitle") {
        return `## ${withoutPrefix}`;
      }

      return withoutPrefix;
    })
    .join("\n");

  const nextValue = `${value.slice(0, lineStart)}${formatted}${value.slice(lineEnd)}`;
  const nextSelectionStart = lineStart;
  const nextSelectionEnd = lineStart + formatted.length;

  return { nextValue, nextSelectionStart, nextSelectionEnd };
}

function detectSelectionFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): BodyFormatMode | "mixed" {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndBreak === -1 ? value.length : lineEndBreak;
  const target = value.slice(lineStart, lineEnd);

  let detected: BodyFormatMode | null = null;

  for (const line of target.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const current: BodyFormatMode = line.startsWith("## ")
      ? "subtitle"
      : line.startsWith("# ")
        ? "title"
        : "normal";

    if (!detected) {
      detected = current;
      continue;
    }

    if (detected !== current) {
      return "mixed";
    }
  }

  return detected ?? "normal";
}

function parsePreviewBlocks(body: string): PreviewBlock[] {
  const blocks = body
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return blocks.map((block) => {
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

export default function StaffArticleManagmentPage() {
  const [draft, setDraft] = useState<ArticleDraft>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EditorViewMode>("split");
  const [activeBodyFormat, setActiveBodyFormat] =
    useState<ActiveBodyFormatMode>("none");
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const previewTitle = draft.title.trim() || "Untitled Article";
  const previewBlocks = parsePreviewBlocks(draft.body);

  function handleClear() {
    setDraft(INITIAL_DRAFT);
    setError(null);
    setSuccess(null);
    setActiveBodyFormat("none");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!draft.title.trim()) {
      setError("Article title is required.");
      return;
    }

    if (!draft.body.trim()) {
      setError("Article body is required.");
      return;
    }

    setSuccess("Article draft is ready. Save endpoint can be connected next.");
  }

  function syncActiveBodyFormatFromSelection() {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      return;
    }

    if (textarea.selectionStart === textarea.selectionEnd) {
      setActiveBodyFormat("none");
      return;
    }

    const detected = detectSelectionFormat(
      draft.body,
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    setActiveBodyFormat(detected);
  }

  function applyBodyFormat(mode: BodyFormatMode) {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      return;
    }

    const result = formatSelectedLines(
      draft.body,
      textarea.selectionStart,
      textarea.selectionEnd,
      mode,
    );

    setDraft((prev) => ({ ...prev, body: result.nextValue }));
    setActiveBodyFormat(mode);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        result.nextSelectionStart,
        result.nextSelectionEnd,
      );
    });
  }

  return (
    <div>
      <div className="staffTitle">Article Managment</div>
      <div className="staffSubtitle">
        Create article content with a title and long-form body.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <div className="article-managment__mode-row" role="group" aria-label="Editor view mode">
            <button
              type="button"
              className={`staff-dev-pill ${viewMode === "edit" ? "staff-dev-pill--ready" : ""}`}
              onClick={() => setViewMode("edit")}
            >
              Edit only
            </button>
            <button
              type="button"
              className={`staff-dev-pill ${viewMode === "split" ? "staff-dev-pill--ready" : ""}`}
              onClick={() => setViewMode("split")}
            >
              Edit + Preview
            </button>
            <button
              type="button"
              className={`staff-dev-pill ${viewMode === "preview" ? "staff-dev-pill--ready" : ""}`}
              onClick={() => setViewMode("preview")}
            >
              Preview only
            </button>
          </div>

          <div className={`article-managment__workspace article-managment__workspace--${viewMode}`}>
            {viewMode !== "preview" ? (
              <form className="ticket-create-form" onSubmit={handleSubmit}>
                <div className="ticket-create-grid">
                  <label className="ticket-create-field article-managment__field--full">
                    <div className="account-management__notes-label-row">
                      <span className="ticket-create-label">Title</span>
                      <span className="ticket-create-label account-management__notes-count">
                        {draft.title.length}/{ARTICLE_TITLE_MAX_LENGTH}
                      </span>
                    </div>
                    <input
                      className="ticket-create-input"
                      type="text"
                      value={draft.title}
                      maxLength={ARTICLE_TITLE_MAX_LENGTH}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Enter article title"
                    />
                  </label>

                  <label className="ticket-create-field article-managment__field--full">
                    <div className="account-management__notes-label-row">
                      <span className="ticket-create-label">Body</span>
                      <span className="ticket-create-label account-management__notes-count">
                        {draft.body.length}/{ARTICLE_BODY_MAX_LENGTH}
                      </span>
                    </div>
                    <div className="article-managment__format-row">
                      <button
                        type="button"
                        className={`staff-dev-pill ${
                          activeBodyFormat === "title"
                            ? "staff-dev-pill--ready"
                            : ""
                        }`}
                        onClick={() => applyBodyFormat("title")}
                      >
                        Title
                      </button>
                      <button
                        type="button"
                        className={`staff-dev-pill ${
                          activeBodyFormat === "subtitle"
                            ? "staff-dev-pill--ready"
                            : ""
                        }`}
                        onClick={() => applyBodyFormat("subtitle")}
                      >
                        Subtitle
                      </button>
                      <button
                        type="button"
                        className={`staff-dev-pill ${
                          activeBodyFormat === "normal"
                            ? "staff-dev-pill--ready"
                            : ""
                        }`}
                        onClick={() => applyBodyFormat("normal")}
                      >
                        Normal
                      </button>
                    </div>
                    <textarea
                      ref={bodyTextareaRef}
                      className="ticket-create-textarea article-managment__body"
                      rows={14}
                      maxLength={ARTICLE_BODY_MAX_LENGTH}
                      value={draft.body}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, body: event.target.value }))
                      }
                      onClick={syncActiveBodyFormatFromSelection}
                      onKeyUp={syncActiveBodyFormatFromSelection}
                      onSelect={syncActiveBodyFormatFromSelection}
                      placeholder="Write article content here..."
                    />
                  </label>
                </div>

                {error ? <div className="ticket-create-status error">{error}</div> : null}
                {success ? (
                  <div className="ticket-create-status success">{success}</div>
                ) : null}

                <div className="item-create-actions">
                  <button type="button" className="staff-dev-pill" onClick={handleClear}>
                    Clear
                  </button>
                  <button type="submit" className="staff-dev-pill staff-dev-pill--ready">
                    Create Article
                  </button>
                </div>
              </form>
            ) : null}

            {viewMode !== "edit" ? (
              <section className="article-managment__preview-shell" aria-label="Live article preview">
                <div className="article-managment__preview-canvas">
                  <article className="article-managment__preview-column">
                    <h1>{previewTitle}</h1>
                    {previewBlocks.length > 0 ? (
                      previewBlocks.map((block, index) => {
                        if (block.kind === "title") {
                          return (
                            <h2 key={`preview-title-${index}`}>{block.content}</h2>
                          );
                        }

                        if (block.kind === "subtitle") {
                          return (
                            <h3 key={`preview-subtitle-${index}`}>
                              {block.content}
                            </h3>
                          );
                        }

                        return (
                          <p key={`preview-paragraph-${index}`}>{block.content}</p>
                        );
                      })
                    ) : (
                      <p className="article-managment__preview-placeholder">
                        Start writing the article body to preview the final reading layout.
                      </p>
                    )}
                  </article>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
