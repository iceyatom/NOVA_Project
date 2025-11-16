export default function LoadingCatalog() {
  return (
    <main style={styles.main}>
      <div role="status" aria-live="polite" style={styles.wrapper}>
        <div style={styles.spinner} aria-hidden="true" />
        <span style={styles.srOnly}>Loading…</span>
      </div>
      <style>{`
        @keyframes custom { 
          to { transform: rotate(1turn); }
        }
      `}</style>
    </main>
  );
}

const ACCENT = "#50C878";

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui, sans-serif",
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
      radial-gradient(farthest-side, ${ACCENT} 94%, #0000) top / 8px 8px no-repeat,
      conic-gradient(#0000 30%, ${ACCENT})
    `,
    WebkitMask:
      "radial-gradient(farthest-side, #0000 calc(100% - 8px), #000 0)",
    mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 0)",
    animation: "custom 1s linear infinite",
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
