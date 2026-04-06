export const card = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 20px rgba(var(--t-accent-rgb), 0.09)",
  padding: "18px 16px",
};

export const secLbl = {
  margin: "0 0 12px",
  fontSize: 11,
  letterSpacing: 2,
  color: "var(--t-label)",
  textTransform: "uppercase",
  fontFamily: "sans-serif",
  fontWeight: 700,
};

export const btn = (bg = "var(--t-accent)", col = "#fff") => ({
  background: bg,
  color: col,
  border: bg === "transparent" ? "1px solid var(--t-border)" : "none",
  borderRadius: 9,
  padding: "10px 16px",
  fontFamily: "sans-serif",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
});

export const input = {
  border: "1px solid var(--t-border)",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: "sans-serif",
  outline: "none",
};
