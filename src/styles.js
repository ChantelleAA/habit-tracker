export const card = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 20px rgba(200,80,120,0.09)",
  padding: "18px 16px",
};

export const secLbl = {
  margin: "0 0 12px",
  fontSize: 11,
  letterSpacing: 2,
  color: "#a03060",
  textTransform: "uppercase",
  fontFamily: "sans-serif",
  fontWeight: 700,
};

export const btn = (bg = "#e879a0", col = "#fff") => ({
  background: bg,
  color: col,
  border: bg === "transparent" ? "1px solid #f0c0d0" : "none",
  borderRadius: 9,
  padding: "10px 16px",
  fontFamily: "sans-serif",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
});

export const input = {
  border: "1px solid #f0c0d0",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: "sans-serif",
  outline: "none",
};
