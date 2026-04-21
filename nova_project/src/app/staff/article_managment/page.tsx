"use client";

import { useState } from "react";

const ARTICLE_TITLE_MAX_LENGTH = 140;
const ARTICLE_BODY_MAX_LENGTH = 10000;

type ArticleDraft = {
  title: string;
  body: string;
};

const INITIAL_DRAFT: ArticleDraft = {
  title: "",
  body: "",
};

export default function StaffArticleManagmentPage() {
  const [draft, setDraft] = useState<ArticleDraft>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClear() {
    setDraft(INITIAL_DRAFT);
    setError(null);
    setSuccess(null);
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

  return (
    <div>
      <div className="staffTitle">Article Managment</div>
      <div className="staffSubtitle">
        Create article content with a title and long-form body.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
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
                <textarea
                  className="ticket-create-textarea article-managment__body"
                  rows={14}
                  maxLength={ARTICLE_BODY_MAX_LENGTH}
                  value={draft.body}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, body: event.target.value }))
                  }
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
        </div>
      </div>
    </div>
  );
}
