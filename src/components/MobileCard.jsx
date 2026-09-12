import { T } from "../styles/tokens";

// Card genérico para listas em telas pequenas (substitui linhas de tabela).
// fields: [{ label, value }]. actions: JSX (botões). badge: JSX.
export function MobileCard({ title, subtitle, badge, fields = [], actions }) {
  const visiveis = fields.filter(f => f && f.value !== undefined && f.value !== null && f.value !== "");
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:12, padding:14, background:T.bg2 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14.5 }}>{title}</div>
          {subtitle && <div style={{ color:T.sub, fontSize:12, marginTop:2 }}>{subtitle}</div>}
        </div>
        {badge && <div style={{ flexShrink:0 }}>{badge}</div>}
      </div>

      {visiveis.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 20px", marginTop:12 }}>
          {visiveis.map((f, i) => (
            <div key={i}>
              <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>{f.label}</div>
              <div style={{ fontSize:13.5, marginTop:3 }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
