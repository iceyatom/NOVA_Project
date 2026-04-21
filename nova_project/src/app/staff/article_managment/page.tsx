"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";
import useImageLibraryBrowser, {
  type BrowseImageLibraryEntry,
} from "@/app/hooks/useImageLibraryBrowser";

const ARTICLE_TITLE_MAX_LENGTH = 140;
const ARTICLE_BODY_MAX_LENGTH = 10000;

type ArticleDraft = {
  type: "info" | "news";
  title: string;
  body: string;
};

type EditorViewMode = "edit" | "split" | "preview";

const INITIAL_DRAFT: ArticleDraft = {
  type: "info",
  title: "",
  body: "",
};

type PreviewBlock =
  | { kind: "title"; content: string }
  | { kind: "subtitle"; content: string }
  | { kind: "paragraph"; content: string }
  | { kind: "image"; src: string; alt: string };

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

export default function StaffArticleManagmentPage() {
  const [draft, setDraft] = useState<ArticleDraft>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EditorViewMode>("split");
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] =
    useState<boolean>(false);
  const [activeBodyFormat, setActiveBodyFormat] =
    useState<ActiveBodyFormatMode>("none");
  const [isInsertingImageKey, setIsInsertingImageKey] = useState<string | null>(
    null,
  );
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    isBrowseImagesPopupOpen,
    browseImages,
    browseItemSearchInput,
    setBrowseItemSearchInput,
    browseItemSearchQuery,
    isLoadingBrowseImages,
    browseImagesError,
    openBrowseImagesPopup,
    closeBrowseImagesPopup: closeBrowseImagesPopupBase,
    loadBrowseImages,
    handleBrowseItemSearchSubmit,
    handleClearBrowseItemSearch,
  } = useImageLibraryBrowser({
    catalogItemId: null,
    isBrowseCloseBlocked: isInsertingImageKey !== null,
  });

  const previewTitle = draft.title.trim() || "Untitled Article";
  const previewBlocks = parsePreviewBlocks(draft.body);
  const hasUnsavedChanges =
    draft.type !== INITIAL_DRAFT.type ||
    draft.title !== INITIAL_DRAFT.title || draft.body !== INITIAL_DRAFT.body;
  const sortedBrowseImages = useMemo(
    () =>
      [...browseImages].sort((a, b) => {
        const aTimestamp = a.lastLinkedAt
          ? Date.parse(a.lastLinkedAt) || 0
          : 0;
        const bTimestamp = b.lastLinkedAt
          ? Date.parse(b.lastLinkedAt) || 0
          : 0;

        if (bTimestamp !== aTimestamp) {
          return bTimestamp - aTimestamp;
        }

        if (b.usageCount !== a.usageCount) {
          return b.usageCount - a.usageCount;
        }

        return a.s3Key.localeCompare(b.s3Key);
      }),
    [browseImages],
  );

  const browseImagesBackdropHandlers = useBackdropPointerClose<HTMLDivElement>(
    () => {
      if (isInsertingImageKey !== null) {
        return;
      }
      closeBrowseImagesPopupBase();
    },
  );
  const clearConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      setIsClearConfirmationOpen(false);
    });

  function handleClear() {
    setDraft(INITIAL_DRAFT);
    setError(null);
    setSuccess(null);
    setActiveBodyFormat("none");
    setIsClearConfirmationOpen(false);
  }

  function requestClear() {
    if (!hasUnsavedChanges) {
      handleClear();
      return;
    }

    setIsClearConfirmationOpen(true);
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

  function buildImageMarkdown(entry: BrowseImageLibraryEntry): string {
    const keyLeaf = entry.s3Key.split("/").at(-1)?.trim() || "image";
    return `![${keyLeaf}](${entry.url})`;
  }

  function insertImageMarkdownAtSelection(entry: BrowseImageLibraryEntry) {
    const textarea = bodyTextareaRef.current;
    const currentBody = draft.body;
    const selectionStart = textarea ? textarea.selectionStart : currentBody.length;
    const selectionEnd = textarea ? textarea.selectionEnd : currentBody.length;
    const before = currentBody.slice(0, selectionStart);
    const after = currentBody.slice(selectionEnd);

    const marker = buildImageMarkdown(entry);
    const leadingSpacer =
      before.length === 0
        ? ""
        : before.endsWith("\n\n")
          ? ""
          : before.endsWith("\n")
            ? "\n"
            : "\n\n";
    const trailingSpacer =
      after.length === 0
        ? ""
        : after.startsWith("\n\n")
          ? ""
          : after.startsWith("\n")
            ? "\n"
            : "\n\n";

    const insertion = `${leadingSpacer}${marker}${trailingSpacer}`;
    const nextBody = `${before}${insertion}${after}`;
    const nextCaretPosition = before.length + insertion.length;

    setDraft((prev) => ({ ...prev, body: nextBody }));
    setActiveBodyFormat("none");

    requestAnimationFrame(() => {
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }

  async function handleInsertBrowseImage(entry: BrowseImageLibraryEntry) {
    setIsInsertingImageKey(entry.s3Key);
    try {
      insertImageMarkdownAtSelection(entry);
      setError(null);
      setSuccess("Image inserted into article body.");
      closeBrowseImagesPopupBase();
    } finally {
      setIsInsertingImageKey(null);
    }
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
                    <span className="ticket-create-label">Article Type</span>
                    <select
                      className="ticket-create-input"
                      value={draft.type}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          type: event.target.value as "info" | "news",
                        }))
                      }
                    >
                      <option value="info">Info</option>
                      <option value="news">News</option>
                    </select>
                  </label>

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

                  <div className="ticket-create-field article-managment__field--full">
                    <div className="account-management__notes-label-row">
                      <label
                        className="ticket-create-label"
                        htmlFor="article-body-input"
                      >
                        Body
                      </label>
                      <span className="ticket-create-label account-management__notes-count">
                        {draft.body.length}/{ARTICLE_BODY_MAX_LENGTH}
                      </span>
                    </div>
                    <div className="article-managment__format-row">
                  <button
                    type="button"
                    className="staff-dev-pill article-managment__insert-image-btn"
                    onClick={(event) => {
                      event.currentTarget.blur();
                      void openBrowseImagesPopup();
                    }}
                    disabled={isInsertingImageKey !== null}
                  >
                    Insert Image
                  </button>
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
                      id="article-body-input"
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
                  </div>
                </div>

                {error ? <div className="ticket-create-status error">{error}</div> : null}
                {success ? (
                  <div className="ticket-create-status success">{success}</div>
                ) : null}

                <div className="item-create-actions">
                  <button
                    type="button"
                    className="staff-dev-pill"
                    onClick={requestClear}
                  >
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
                        if (block.kind === "image") {
                          return (
                            <figure
                              key={`preview-image-${index}`}
                              className="article-managment__preview-image-block"
                            >
                              <Image
                                src={block.src}
                                alt={block.alt}
                                width={1400}
                                height={900}
                                className="article-managment__preview-image"
                                sizes="(max-width: 900px) 100vw, 72ch"
                              />
                            </figure>
                          );
                        }

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

      {isClearConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Clear Article Draft"
          className="item-category-modal"
          onPointerDown={clearConfirmationBackdropHandlers.onPointerDown}
          onClick={clearConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Clear</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to clear this article draft?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                This clears the current title and body and cannot be undone.
              </p>
            </div>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => {
                  setIsClearConfirmationOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={handleClear}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isBrowseImagesPopupOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse Images"
          className="item-category-modal"
          onPointerDown={browseImagesBackdropHandlers.onPointerDown}
          onClick={browseImagesBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Browse Images</div>

            <div className="item-category-form item-browse-images-form">
              <div className="item-browse-images-toolbar">
                <form
                  className="item-browse-images-search-form"
                  onSubmit={handleBrowseItemSearchSubmit}
                >
                  <div className="item-search-page__search-bar">
                    <div className="item-search-page__search-input-wrap">
                      <input
                        type="text"
                        className="item-search-page__search-input item-browse-images-search"
                        value={browseItemSearchInput}
                        onChange={(event) =>
                          setBrowseItemSearchInput(event.target.value)
                        }
                        placeholder="Search by SKU or Name"
                        disabled={
                          isLoadingBrowseImages || isInsertingImageKey !== null
                        }
                      />
                      {(browseItemSearchInput || browseItemSearchQuery) && (
                        <button
                          type="button"
                          className="item-search-page__search-clear"
                          onClick={handleClearBrowseItemSearch}
                          aria-label="Clear search"
                          disabled={
                            isLoadingBrowseImages || isInsertingImageKey !== null
                          }
                        >
                          x
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="item-search-page__search-submit"
                      aria-label="Search image library"
                      disabled={
                        isLoadingBrowseImages || isInsertingImageKey !== null
                      }
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                  </div>
                </form>

                <button
                  type="button"
                  className="staff-dev-pill"
                  onClick={() => void loadBrowseImages()}
                  disabled={
                    isLoadingBrowseImages || isInsertingImageKey !== null
                  }
                >
                  {isLoadingBrowseImages ? "Loading..." : "Refresh"}
                </button>
              </div>

              {browseImagesError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {browseImagesError}
                </div>
              ) : null}

              {!browseImagesError && isLoadingBrowseImages ? (
                <div className="item-browse-images-state">
                  Loading image library...
                </div>
              ) : null}

              {!browseImagesError &&
              !isLoadingBrowseImages &&
              sortedBrowseImages.length === 0 ? (
                <div className="item-browse-images-state">
                  {browseItemSearchQuery
                    ? "No images found for matching catalog items."
                    : "No linked images found."}
                </div>
              ) : null}

              {!browseImagesError &&
              !isLoadingBrowseImages &&
              sortedBrowseImages.length > 0 ? (
                <div className="item-browse-images-grid">
                  {sortedBrowseImages.map((entry) => {
                    const isInsertingThisImage =
                      isInsertingImageKey === entry.s3Key;

                    return (
                      <div key={entry.s3Key} className="item-browse-images-card">
                        <div className="item-browse-images-preview">
                          <Image
                            src={entry.url}
                            alt={`Image ${entry.s3Key}`}
                            width={600}
                            height={450}
                            className="item-browse-images-preview-img"
                          />
                        </div>
                        <div className="item-browse-images-meta">
                          <div
                            className="item-browse-images-key"
                            title={entry.s3Key}
                          >
                            {entry.s3Key}
                          </div>
                          <div className="item-browse-images-usage">
                            Used by {entry.usageCount} item
                            {entry.usageCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="staff-dev-pill"
                          onClick={() => void handleInsertBrowseImage(entry)}
                          disabled={isInsertingImageKey !== null}
                        >
                          {isInsertingThisImage ? "Inserting..." : "Insert"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="item-category-form__actions category-mgmt-edit-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeBrowseImagesPopupBase}
                disabled={isInsertingImageKey !== null}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
