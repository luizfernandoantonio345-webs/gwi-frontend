import { T } from "../styles/tokens";

export function Panel({ title, sub, right, children, noPad }) {
  return (
    <section className="panel">
      {(title || right) && (
        <div className="panel-header">
          <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
            {title && (
              <span style={{ width:3, height:20, borderRadius:3, flexShrink:0,
                background:T.cyan, boxShadow:`0 0 10px ${T.cyan}66` }} />
            )}
            <div style={{ minWidth:0 }}>
              <h3 className="t-title">{title}</h3>
              {sub && <p className="t-sm" style={{ marginTop:3 }}>{sub}</p>}
            </div>
          </div>
          {right}
        </div>
      )}
      <div style={noPad ? {} : { padding: 20 }}>{children}</div>
    </section>
  );
}
