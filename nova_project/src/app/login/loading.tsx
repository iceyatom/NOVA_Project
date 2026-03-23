"use client";

import React from "react";

const ACCENT = "#50C878";

export default function LoginLoading() {
  return (
    <div style={styles.container}>
      <div role="status" aria-live="polite" aria-atomic="true" style={styles.wrapper}>
        <div style={styles.spinner} aria-hidden="true" />
        <span style={styles.srOnly}>Authenticating…</span>
      </div>

      <style>{`
        @keyframes login-spinner {
          to { transform: rotate(1turn); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    minHeight: "60vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  spinner: {
    width: 50,
    aspectRatio: "1",
    borderRadius: "50%",
    background: `
      radial-gradient(farthest-side, ${ACCENT} 94%, transparent) top / 8px 8px no-repeat,
      conic-gradient(transparent 30%, ${ACCENT})
    `,
    WebkitMask:
      "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 0)",
    mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 0)",
    animation: "login-spinner 1s linear infinite",
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};