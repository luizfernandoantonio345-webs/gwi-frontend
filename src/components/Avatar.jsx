import { T } from "../styles/tokens";

function iniciais(nome) {
  return (nome || "?").trim().split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
}

// Avatar com foto (quando houver) ou iniciais. `size` em px.
export function Avatar({ nome, foto, size = 38, ativo = false, style }) {
  const borda = `1px solid ${T.cyan}${ativo ? "88" : "55"}`;
  const base = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    overflow: "hidden", display: "grid", placeItems: "center",
    border: borda, background: `${T.cyan}${ativo ? "22" : "14"}`, ...style,
  };
  if (foto) {
    return (
      <div style={base}>
        <img src={foto} alt={nome || "Foto de perfil"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={base}>
      <span style={{ fontSize: Math.round(size * 0.34), fontWeight: 700, color: T.cyan }}>
        {iniciais(nome)}
      </span>
    </div>
  );
}
