export function Btn({ children, onClick, kind = "primary", size = "", disabled, style, type, className = "" }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`btn btn-${kind}${size ? ` btn-${size}` : ""} ${className}`}
    >
      {children}
    </button>
  );
}
