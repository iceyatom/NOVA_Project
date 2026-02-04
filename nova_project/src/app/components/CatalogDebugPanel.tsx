"use client";

import { useState } from "react";

type DebugResult = {
  ok: boolean;
  status: number;
  count?: number;
  totalCount?: number;
  limit?: number;
  offset?: number;
  error?: string;
};

async function fetchCatalog(path: string): Promise<DebugResult> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    const json = (await response.json()) as {
      count?: number;
      totalCount?: number;
      limit?: number;
      offset?: number;
      error?: string;
    };

    return {
      ok: response.ok,
      status: response.status,
      count: json.count,
      totalCount: json.totalCount,
      limit: json.limit,
      offset: json.offset,
      error: json.error,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { ok: false, status: 0, error: message };
  }
}

export default function CatalogDebugPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  async function run(path: string) {
    setLoading(true);
    setLastUrl(path);
    const data = await fetchCatalog(path);
    setResult(data);
    setLoading(false);
  }

  async function runWithParams(nextLimit = limit, nextOffset = offset) {
    const safeOffset = Math.max(0, nextOffset);
    setLimit(nextLimit);
    setOffset(safeOffset);
    await run(`/api/catalog?limit=${nextLimit}&offset=${safeOffset}`);
  }

  return (
    <section aria-label="Catalog debug panel">
      <h2 className="pane-title">API Debug</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <button type="button" onClick={() => run("/api/catalog")}>
          Default (20)
        </button>
        <button type="button" onClick={() => runWithParams(20, offset)}>
          Limit 20
        </button>
        <button type="button" onClick={() => runWithParams(50, offset)}>
          Limit 50
        </button>
        <button type="button" onClick={() => runWithParams(100, offset)}>
          Limit 100
        </button>
        <button
          type="button"
          onClick={() => run("/api/catalog?limit=100&offset=100")}
        >
          100 + offset 100
        </button>
        <button type="button" onClick={() => run("/api/catalog?limit=999")}>
          Invalid limit
        </button>
      </div>
      <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
        <div style={{ display: "grid", gap: "0.5rem", gridAutoFlow: "column" }}>
          <button type="button" onClick={() => runWithParams(limit, 0)}>
            Offset 0
          </button>
          <button
            type="button"
            onClick={() => runWithParams(limit, offset - limit)}
          >
            Offset -{limit}
          </button>
          <button
            type="button"
            onClick={() => runWithParams(limit, offset + limit)}
          >
            Offset +{limit}
          </button>
        </div>
        <button type="button" onClick={() => runWithParams(limit, 100)}>
          Offset 100
        </button>
      </div>
      <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        {loading && <p style={{ margin: 0 }}>Loading...</p>}
        {!loading && !result && (
          <p style={{ margin: 0, opacity: 0.7 }}>
            Run a request to see results.
          </p>
        )}
        {!loading && result && (
          <div>
            <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>
              {result.ok ? "OK" : "Error"} ({result.status})
            </p>
            {lastUrl && (
              <p style={{ margin: "0 0 0.5rem 0", opacity: 0.7 }}>{lastUrl}</p>
            )}
            <p style={{ margin: 0 }}>
              count: {result.count ?? "n/a"} | totalCount:{" "}
              {result.totalCount ?? "n/a"}
            </p>
            <p style={{ margin: 0 }}>
              limit: {result.limit ?? "n/a"} | offset: {result.offset ?? "n/a"}
            </p>
            {result.error && (
              <p style={{ margin: "0.5rem 0 0 0", color: "#b91c1c" }}>
                {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
