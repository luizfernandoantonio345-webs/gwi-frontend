export function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      {label && <span className="lbl">{label}</span>}
      {children}
    </label>
  );
}
