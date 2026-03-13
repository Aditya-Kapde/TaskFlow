const Spinner = ({ size = "medium", fullscreen = false }) => {
  const cls = size === "large" ? "spinner-lg" : size === "small" ? "spinner-sm" : "spinner-md";

  if (fullscreen) {
    return (
      <div className="spinner-fullscreen">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className={`spinner ${cls}`} />
          <p style={{ color: "var(--text-3)", fontSize: "0.875rem" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className={`spinner ${cls}`} />
    </div>
  );
};

export default Spinner;