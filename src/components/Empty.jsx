import { T } from "../styles/tokens";

export function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="empty-state">
      <div style={{ padding:16, borderRadius:12, background:T.bg2, border:`1px solid ${T.border}`, marginBottom:14 }}>
        <Icon size={24} color={T.muted} />
      </div>
      <p style={{ fontSize:14, fontWeight:500, color:T.sub }}>{title}</p>
      {sub && <p style={{ fontSize:12.5, color:T.muted, marginTop:5, maxWidth:280 }}>{sub}</p>}
    </div>
  );
}
