"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";
import useImageLibraryBrowser, {
  type BrowseImageLibraryEntry,
} from "@/app/hooks/useImageLibraryBrowser";
import { parseArticleBodyBlocks } from "@/app/lib/articleContent";

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

type BodyFormatMode = "title" | "subtitle" | "normal";
type ActiveBodyFormatMode = BodyFormatMode | "mixed" | "none";

type ArticleType = "info" | "news";
type BrowseArticleTypeFilter = "all" | ArticleType;

type ArticleSummary = {
  id: number;
  type: ArticleType;
  title: string;
  author: string;
  createdAt: string | null;
  modifiedAt: string | null;
};

type ArticleDetails = ArticleSummary & {
  body: string;
};

type ArticleMutationApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    id?: number;
    title?: string;
    type?: string;
    body?: string;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
  };
};

type ArticleBrowseApiResponse = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

type ArticleLoadApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    id?: number;
    title?: string;
    type?: string;
    body?: string;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
  };
};

type ArticleDeleteApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    id?: number;
    title?: string;
  };
};

function normalizeArticleType(value: unknown): ArticleType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "info") {
    return "info";
  }
  if (normalized === "news") {
    return "news";
  }

  return null;
}

function parseArticleSummary(value: unknown): ArticleSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.id;
  const id =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? Number(rawId)
        : NaN;
  const type = normalizeArticleType(record.type);
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const author = typeof record.author === "string" ? record.author.trim() : "";

  if (!Number.isInteger(id) || id <= 0 || !type || !title || !author) {
    return null;
  }

  return {
    id,
    type,
    title,
    author,
    createdAt:
      typeof record.createdAt === "string" && record.createdAt.trim()
        ? record.createdAt
        : null,
    modifiedAt:
      typeof record.modifiedAt === "string" && record.modifiedAt.trim()
        ? record.modifiedAt
        : null,
  };
}

function parseArticleDetails(value: unknown): ArticleDetails | null {
  const summary = parseArticleSummary(value);
  if (!summary) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const body = typeof record.body === "string" ? record.body : "";
  return {
    ...summary,
    body,
  };
}

function getDraftValidationError(draft: ArticleDraft): string | null {
  if (!draft.title.trim()) {
    return "Article title is required.";
  }

  if (!draft.body.trim()) {
    return "Article body is required.";
  }

  return null;
}

function formatSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  mode: BodyFormatMode,
) {
  const lineStart =
    value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
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
  const lineStart =
    value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
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

export default function StaffArticleManagmentPage() {
  const [draft, setDraft] = useState<ArticleDraft>(INITIAL_DRAFT);
  const [loadedArticleId, setLoadedArticleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeletingArticle, setIsDeletingArticle] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("split");
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] =
    useState<boolean>(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] =
    useState<boolean>(false);
  const [activeBodyFormat, setActiveBodyFormat] =
    useState<ActiveBodyFormatMode>("none");
  const [isInsertingImageKey, setIsInsertingImageKey] = useState<string | null>(
    null,
  );
  const [isBrowseArticlesPopupOpen, setIsBrowseArticlesPopupOpen] =
    useState<boolean>(false);
  const [browseArticles, setBrowseArticles] = useState<ArticleSummary[]>([]);
  const [browseArticlesSearchInput, setBrowseArticlesSearchInput] =
    useState<string>("");
  const [browseArticlesSearchQuery, setBrowseArticlesSearchQuery] =
    useState<string>("");
  const [browseArticlesTypeFilter, setBrowseArticlesTypeFilter] =
    useState<BrowseArticleTypeFilter>("all");
  const [isLoadingBrowseArticles, setIsLoadingBrowseArticles] =
    useState<boolean>(false);
  const [browseArticlesError, setBrowseArticlesError] = useState<string | null>(
    null,
  );
  const [isLoadingArticleId, setIsLoadingArticleId] = useState<number | null>(
    null,
  );
  const originalRef = useRef<ArticleDraft>(INITIAL_DRAFT);
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
  const previewBlocks = parseArticleBodyBlocks(draft.body);
  const isEditMode = loadedArticleId !== null;
  const hasUnsavedChanges =
    draft.type !== originalRef.current.type ||
    draft.title !== originalRef.current.title ||
    draft.body !== originalRef.current.body;
  const isFieldDirty = (field: keyof ArticleDraft) =>
    draft[field] !== originalRef.current[field];
  const fieldLabelClass = (dirty: boolean) =>
    `ticket-create-label${dirty ? " category-mgmt-edit-modal__label--dirty" : ""}`;
  const currentValidationError = useMemo(
    () => getDraftValidationError(draft),
    [draft],
  );
  const sortedBrowseImages = useMemo(
    () =>
      [...browseImages].sort((a, b) => {
        const aTimestamp = a.lastLinkedAt ? Date.parse(a.lastLinkedAt) || 0 : 0;
        const bTimestamp = b.lastLinkedAt ? Date.parse(b.lastLinkedAt) || 0 : 0;

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
  const sortedBrowseArticles = useMemo(
    () =>
      [...browseArticles].sort((a, b) => {
        const aTimestamp = a.modifiedAt ? Date.parse(a.modifiedAt) || 0 : 0;
        const bTimestamp = b.modifiedAt ? Date.parse(b.modifiedAt) || 0 : 0;

        if (bTimestamp !== aTimestamp) {
          return bTimestamp - aTimestamp;
        }

        return b.id - a.id;
      }),
    [browseArticles],
  );

  const browseImagesBackdropHandlers = useBackdropPointerClose<HTMLDivElement>(
    () => {
      if (isInsertingImageKey !== null) {
        return;
      }
      closeBrowseImagesPopupBase();
    },
  );
  const browseArticlesBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      if (isLoadingArticleId != null) {
        return;
      }

      setIsBrowseArticlesPopupOpen(false);
      setBrowseArticlesError(null);
    });
  const deleteConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      if (isDeletingArticle) {
        return;
      }

      setIsDeleteConfirmationOpen(false);
      setDeleteConfirmChecked(false);
    });
  const clearConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      setIsClearConfirmationOpen(false);
    });

  async function loadBrowseArticles(
    nextQuery?: string,
    nextTypeFilter?: BrowseArticleTypeFilter,
  ) {
    const normalizedQuery = (nextQuery ?? browseArticlesSearchQuery)
      .trim()
      .replace(/\s+/g, " ");
    const typeFilter = nextTypeFilter ?? browseArticlesTypeFilter;

    setIsLoadingBrowseArticles(true);
    setBrowseArticlesError(null);

    try {
      const params = new URLSearchParams({
        limit: "180",
      });
      if (normalizedQuery) {
        params.set("query", normalizedQuery);
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const response = await fetch(`/api/articles/staff?${params}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ArticleBrowseApiResponse;
      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to load articles (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const entries = Array.isArray(payload.data)
        ? payload.data
            .map((entry) => parseArticleSummary(entry))
            .filter((entry): entry is ArticleSummary => entry !== null)
        : [];
      setBrowseArticles(entries);
    } catch (loadError) {
      setBrowseArticles([]);
      setBrowseArticlesError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load articles.",
      );
    } finally {
      setIsLoadingBrowseArticles(false);
    }
  }

  async function openBrowseArticlesPopup() {
    if (
      isSaving ||
      isDeletingArticle ||
      isInsertingImageKey !== null ||
      isLoadingArticleId != null
    ) {
      return;
    }

    setBrowseArticlesSearchInput("");
    setBrowseArticlesSearchQuery("");
    setBrowseArticlesTypeFilter("all");
    setBrowseArticlesError(null);
    setIsBrowseArticlesPopupOpen(true);
    await loadBrowseArticles("", "all");
  }

  function closeBrowseArticlesPopup() {
    if (isLoadingArticleId != null) {
      return;
    }

    setIsBrowseArticlesPopupOpen(false);
    setBrowseArticlesError(null);
  }

  function openDeleteConfirmation() {
    if (!isEditMode || isDeletingArticle || isSaving || !loadedArticleId) {
      return;
    }

    setIsDeleteConfirmationOpen(true);
    setDeleteConfirmChecked(false);
  }

  function closeDeleteConfirmation() {
    if (isDeletingArticle) {
      return;
    }

    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  function handleBrowseArticlesSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = browseArticlesSearchInput
      .trim()
      .replace(/\s+/g, " ");
    setBrowseArticlesSearchQuery(normalizedQuery);
    void loadBrowseArticles(normalizedQuery, browseArticlesTypeFilter);
  }

  function handleClearBrowseArticlesSearch() {
    setBrowseArticlesSearchInput("");
    setBrowseArticlesSearchQuery("");
    void loadBrowseArticles("", browseArticlesTypeFilter);
  }

  function handleBrowseArticlesTypeFilterChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextType = event.target.value as BrowseArticleTypeFilter;
    setBrowseArticlesTypeFilter(nextType);
    void loadBrowseArticles(browseArticlesSearchQuery, nextType);
  }

  async function handleLoadArticle(articleId: number) {
    if (articleId <= 0) {
      return;
    }

    setIsLoadingArticleId(articleId);
    setBrowseArticlesError(null);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/articles/staff?id=${articleId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ArticleLoadApiResponse;
      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to load article (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const parsed = parseArticleDetails(payload.data);
      if (!parsed) {
        throw new Error("Article response was missing required fields.");
      }

      const nextDraft: ArticleDraft = {
        type: parsed.type,
        title: parsed.title,
        body: parsed.body,
      };

      setDraft(nextDraft);
      originalRef.current = nextDraft;
      setLoadedArticleId(parsed.id);
      setActiveBodyFormat("none");
      setIsClearConfirmationOpen(false);
      setIsBrowseArticlesPopupOpen(false);
      setSuccess(`"${parsed.title}" loaded. Save changes to update it.`);
    } catch (loadError) {
      setBrowseArticlesError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load article details.",
      );
    } finally {
      setIsLoadingArticleId(null);
    }
  }

  function handleClear() {
    setDraft(INITIAL_DRAFT);
    originalRef.current = INITIAL_DRAFT;
    setLoadedArticleId(null);
    setError(null);
    setSuccess(null);
    setActiveBodyFormat("none");
    setIsClearConfirmationOpen(false);
    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  async function deleteArticle() {
    if (!isEditMode || !loadedArticleId || isDeletingArticle || isSaving) {
      return;
    }

    setIsDeletingArticle(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/articles/staff?id=${loadedArticleId}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await response.json()) as ArticleDeleteApiResponse;
      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to delete article (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const deletedTitle =
        (typeof payload.data?.title === "string" &&
          payload.data.title.trim()) ||
        draft.title.trim();

      handleClear();
      setBrowseArticles((prev) =>
        prev.filter((entry) => entry.id !== loadedArticleId),
      );
      setSuccess(
        deletedTitle
          ? `"${deletedTitle}" deleted successfully.`
          : "Article deleted successfully.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete article.",
      );
    } finally {
      setIsDeletingArticle(false);
    }
  }

  function requestClear() {
    if (!hasUnsavedChanges) {
      handleClear();
      return;
    }

    setIsClearConfirmationOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (isDeletingArticle) {
      return;
    }

    if (isEditMode && !hasUnsavedChanges) {
      return;
    }

    if (currentValidationError) {
      setError(currentValidationError);
      return;
    }

    setIsSaving(true);

    try {
      const endpoint =
        isEditMode && loadedArticleId
          ? `/api/articles/staff?id=${loadedArticleId}`
          : "/api/articles/staff";
      const method = isEditMode ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: draft.type,
          title: draft.title,
          body: draft.body,
        }),
      });

      const payload = (await response.json()) as ArticleMutationApiResponse;
      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to ${isEditMode ? "save article" : "create article"} (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const parsedSaved =
        payload.data != null ? parseArticleDetails(payload.data) : null;

      if (isEditMode) {
        const nextDraft: ArticleDraft = parsedSaved
          ? {
              type: parsedSaved.type,
              title: parsedSaved.title,
              body: parsedSaved.body,
            }
          : {
              ...draft,
              title: draft.title.trim(),
              body: draft.body.trim(),
            };
        setDraft(nextDraft);
        originalRef.current = nextDraft;
        if (parsedSaved) {
          setLoadedArticleId(parsedSaved.id);
          setSuccess(`Article #${parsedSaved.id} saved successfully.`);
        } else {
          setSuccess("Article changes saved.");
        }
      } else {
        const createdTitle =
          (typeof payload.data?.title === "string" &&
            payload.data.title.trim()) ||
          draft.title.trim();
        const successMessage = createdTitle
          ? `"${createdTitle}" created successfully.`
          : "Article created successfully.";
        setDraft(INITIAL_DRAFT);
        originalRef.current = INITIAL_DRAFT;
        setLoadedArticleId(null);
        setSuccess(successMessage);
      }
      setActiveBodyFormat("none");
      setIsClearConfirmationOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEditMode
            ? "Failed to save article changes."
            : "Failed to create article.",
      );
    } finally {
      setIsSaving(false);
    }
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
    const selectionStart = textarea
      ? textarea.selectionStart
      : currentBody.length;
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
          <div className="article-managment__panel-header">
            <div
              className="article-managment__mode-row"
              role="group"
              aria-label="Editor view mode"
            >
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
            <button
              type="button"
              className="staff-dev-pill"
              onClick={() => void openBrowseArticlesPopup()}
              disabled={
                isSaving ||
                isDeletingArticle ||
                isInsertingImageKey !== null ||
                isLoadingArticleId != null
              }
            >
              Load Article
            </button>
          </div>

          <div
            className={`article-managment__workspace article-managment__workspace--${viewMode}`}
          >
            {viewMode !== "preview" ? (
              <form className="ticket-create-form" onSubmit={handleSubmit}>
                <div className="ticket-create-grid">
                  <label className="ticket-create-field article-managment__field--full">
                    <span className={fieldLabelClass(isFieldDirty("type"))}>
                      Article Type
                    </span>
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
                      <span className={fieldLabelClass(isFieldDirty("title"))}>
                        Title
                      </span>
                      <span
                        className={`${fieldLabelClass(isFieldDirty("title"))} account-management__notes-count`}
                      >
                        {draft.title.length}/{ARTICLE_TITLE_MAX_LENGTH}
                      </span>
                    </div>
                    <input
                      className="ticket-create-input"
                      type="text"
                      value={draft.title}
                      maxLength={ARTICLE_TITLE_MAX_LENGTH}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Enter article title"
                    />
                  </label>

                  <div className="ticket-create-field article-managment__field--full">
                    <div className="account-management__notes-label-row">
                      <label
                        className={fieldLabelClass(isFieldDirty("body"))}
                        htmlFor="article-body-input"
                      >
                        Body
                      </label>
                      <span
                        className={`${fieldLabelClass(isFieldDirty("body"))} account-management__notes-count`}
                      >
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
                        disabled={
                          isInsertingImageKey !== null ||
                          isSaving ||
                          isDeletingArticle
                        }
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
                        setDraft((prev) => ({
                          ...prev,
                          body: event.target.value,
                        }))
                      }
                      onClick={syncActiveBodyFormatFromSelection}
                      onKeyUp={syncActiveBodyFormatFromSelection}
                      onSelect={syncActiveBodyFormatFromSelection}
                      placeholder="Write article content here..."
                    />
                  </div>
                </div>

                {error ? (
                  <div className="ticket-create-status error">{error}</div>
                ) : null}
                {success ? (
                  <div className="ticket-create-status success">{success}</div>
                ) : null}

                <div className="item-create-actions">
                  <button
                    type="button"
                    className="staff-dev-pill"
                    onClick={requestClear}
                    disabled={isSaving || isDeletingArticle}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className={`staff-dev-pill${
                      isEditMode
                        ? hasUnsavedChanges
                          ? " staff-dev-pill--ready"
                          : ""
                        : " staff-dev-pill--ready"
                    }`}
                    disabled={
                      isSaving ||
                      isDeletingArticle ||
                      (isEditMode && !hasUnsavedChanges)
                    }
                    title={
                      isEditMode
                        ? hasUnsavedChanges
                          ? "Save changes"
                          : "No new changes to save"
                        : "Create article"
                    }
                  >
                    {isSaving
                      ? "Saving..."
                      : isEditMode
                        ? "Save Changes"
                        : "Create Article"}
                  </button>
                  {isEditMode ? (
                    <button
                      type="button"
                      className="staff-dev-pill staff-dev-pill--danger"
                      onClick={openDeleteConfirmation}
                      disabled={isSaving || isDeletingArticle}
                    >
                      {isDeletingArticle ? "Deleting..." : "Delete Article"}
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}

            {viewMode !== "edit" ? (
              <section
                className="article-managment__preview-shell"
                aria-label="Live article preview"
              >
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
                            <h2 key={`preview-title-${index}`}>
                              {block.content}
                            </h2>
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
                          <p key={`preview-paragraph-${index}`}>
                            {block.content}
                          </p>
                        );
                      })
                    ) : (
                      <p className="article-managment__preview-placeholder">
                        Start writing the article body to preview the final
                        reading layout.
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

      {isDeleteConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Article"
          className="item-category-modal"
          onPointerDown={deleteConfirmationBackdropHandlers.onPointerDown}
          onClick={deleteConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to delete this article?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                This permanently deletes{" "}
                <strong>{draft.title.trim() || "this article"}</strong> and
                cannot be undone.
              </p>
            </div>
            <label className="category-mgmt-delete-confirm">
              <input
                type="checkbox"
                checked={deleteConfirmChecked}
                onChange={(event) =>
                  setDeleteConfirmChecked(event.target.checked)
                }
                disabled={isDeletingArticle}
              />
              I understand this deletion impact.
            </label>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingArticle}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void deleteArticle()}
                disabled={isDeletingArticle || !deleteConfirmChecked}
              >
                {isDeletingArticle ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isBrowseArticlesPopupOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse Articles"
          className="item-category-modal"
          onPointerDown={browseArticlesBackdropHandlers.onPointerDown}
          onClick={browseArticlesBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Browse Articles</div>

            <div className="item-category-form item-browse-images-form">
              <div className="item-browse-images-toolbar article-managment__browse-articles-toolbar">
                <form
                  className="item-browse-images-search-form"
                  onSubmit={handleBrowseArticlesSearchSubmit}
                >
                  <div className="item-search-page__search-bar">
                    <div className="item-search-page__search-input-wrap">
                      <input
                        type="text"
                        className="item-search-page__search-input item-browse-images-search"
                        value={browseArticlesSearchInput}
                        onChange={(event) =>
                          setBrowseArticlesSearchInput(event.target.value)
                        }
                        placeholder="Search by Article Title"
                        disabled={
                          isLoadingBrowseArticles || isLoadingArticleId != null
                        }
                      />
                      {(browseArticlesSearchInput ||
                        browseArticlesSearchQuery) && (
                        <button
                          type="button"
                          className="item-search-page__search-clear"
                          onClick={handleClearBrowseArticlesSearch}
                          aria-label="Clear search"
                          disabled={
                            isLoadingBrowseArticles ||
                            isLoadingArticleId != null
                          }
                        >
                          x
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="item-search-page__search-submit"
                      aria-label="Search articles"
                      disabled={
                        isLoadingBrowseArticles || isLoadingArticleId != null
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

                <select
                  className="item-search-page__select article-managment__browse-articles-select"
                  value={browseArticlesTypeFilter}
                  onChange={handleBrowseArticlesTypeFilterChange}
                  disabled={
                    isLoadingBrowseArticles || isLoadingArticleId != null
                  }
                  aria-label="Filter by article type"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="news">News</option>
                </select>

                <button
                  type="button"
                  className="staff-dev-pill"
                  onClick={() =>
                    void loadBrowseArticles(
                      browseArticlesSearchQuery,
                      browseArticlesTypeFilter,
                    )
                  }
                  disabled={
                    isLoadingBrowseArticles || isLoadingArticleId != null
                  }
                >
                  {isLoadingBrowseArticles ? "Loading..." : "Refresh"}
                </button>
              </div>

              {browseArticlesError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {browseArticlesError}
                </div>
              ) : null}

              {!browseArticlesError && isLoadingBrowseArticles ? (
                <div className="item-browse-images-state">
                  Loading articles...
                </div>
              ) : null}

              {!browseArticlesError &&
              !isLoadingBrowseArticles &&
              sortedBrowseArticles.length === 0 ? (
                <div className="item-browse-images-state">
                  {browseArticlesSearchQuery ||
                  browseArticlesTypeFilter !== "all"
                    ? "No matching articles found."
                    : "No articles found."}
                </div>
              ) : null}

              {!browseArticlesError &&
              !isLoadingBrowseArticles &&
              sortedBrowseArticles.length > 0 ? (
                <div className="item-browse-images-grid article-managment__browse-articles-grid">
                  {sortedBrowseArticles.map((entry) => {
                    const isLoadingThis = isLoadingArticleId === entry.id;
                    const updatedLabel = entry.modifiedAt
                      ? new Date(entry.modifiedAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Unknown";
                    const typeLabel = entry.type === "info" ? "Info" : "News";
                    const isLoadedArticle = loadedArticleId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className={`item-browse-images-card article-managment__browse-articles-card${isLoadedArticle ? " article-managment__browse-articles-card--active" : ""}`}
                      >
                        <div className="item-browse-images-meta">
                          <div
                            className="item-browse-images-key article-managment__browse-articles-title"
                            title={entry.title}
                          >
                            {entry.title}
                          </div>
                          <div className="item-browse-images-usage">
                            #{entry.id} · {typeLabel} · {entry.author}
                          </div>
                          <div className="item-browse-images-usage">
                            Updated {updatedLabel}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`staff-dev-pill${isLoadedArticle ? " staff-dev-pill--ready" : ""}`}
                          onClick={() => void handleLoadArticle(entry.id)}
                          disabled={isLoadingArticleId != null}
                        >
                          {isLoadingThis
                            ? "Loading..."
                            : isLoadedArticle
                              ? "Reload"
                              : "Load"}
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
                onClick={closeBrowseArticlesPopup}
                disabled={isLoadingArticleId != null}
              >
                Close
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
                          isLoadingBrowseImages ||
                          isInsertingImageKey !== null ||
                          isSaving ||
                          isDeletingArticle
                        }
                      />
                      {(browseItemSearchInput || browseItemSearchQuery) && (
                        <button
                          type="button"
                          className="item-search-page__search-clear"
                          onClick={handleClearBrowseItemSearch}
                          aria-label="Clear search"
                          disabled={
                            isLoadingBrowseImages ||
                            isInsertingImageKey !== null ||
                            isSaving ||
                            isDeletingArticle
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
                        isLoadingBrowseImages ||
                        isInsertingImageKey !== null ||
                        isSaving ||
                        isDeletingArticle
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
                    isLoadingBrowseImages ||
                    isInsertingImageKey !== null ||
                    isSaving ||
                    isDeletingArticle
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
                      <div
                        key={entry.s3Key}
                        className="item-browse-images-card"
                      >
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
                          disabled={
                            isInsertingImageKey !== null ||
                            isSaving ||
                            isDeletingArticle
                          }
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
                disabled={
                  isInsertingImageKey !== null || isSaving || isDeletingArticle
                }
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
