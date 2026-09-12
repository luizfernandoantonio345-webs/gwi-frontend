import { LogOut, Settings } from "lucide-react";
import { T } from "../styles/tokens";
import { PAPEL } from "../constants";
import { Avatar } from "../components/Avatar";
import { Logo } from "../components/Logo";

export function Sidebar({ user, nav, page, onNavigate, onLogout, onOpenPerfil }) {
  return (
    <aside className="sidebar" style={{ width:248, borderRight:`1px solid ${T.border}`, flexShrink:0 }}>

      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 18px 20px",
        borderBottom:`1px solid ${T.borderS}` }}>
        <Logo size={42} glow />
        <div>
          <div style={{ fontSize:16, fontWeight:800, letterSpacing:".08em" }}>GRAMO</div>
          <div style={{ fontSize:9.5, color:T.muted, letterSpacing:".28em" }}>ENGENHARIA</div>
        </div>
      </div>

      <p style={{ fontSize:10, fontWeight:600, color:T.muted, letterSpacing:".18em",
        textTransform:"uppercase", padding:"18px 18px 8px" }}>Navegação</p>

      <nav style={{ display:"grid", gap:3, flex:1, padding:"0 12px" }}>
        {nav.map(n => (
          <button
            key={n.id}
            className={`nav-item${page === n.id ? " active" : ""}`}
            onClick={() => onNavigate(n.id)}
          >
            <n.icon size={18} strokeWidth={1.8} />{n.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop:`1px solid ${T.borderS}`, padding:"12px 12px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onOpenPerfil} title="Editar perfil"
            style={{ display:"flex", alignItems:"center", gap:11, flex:1, minWidth:0, textAlign:"left",
              background:"none", border:"none", cursor:"pointer", padding:"6px 6px", borderRadius:9 }}
            onMouseEnter={e => e.currentTarget.style.background = "#0c1c26"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <Avatar nome={user.nome} foto={user.foto} size={38} />
              <span style={{ position:"absolute", right:-1, bottom:-1, width:11, height:11, borderRadius:"50%",
                background:T.cyan, border:`2px solid ${T.bg2}`, boxShadow:`0 0 8px ${T.cyan}` }} />
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:600, lineHeight:1.3, overflowWrap:"break-word", wordBreak:"normal" }}>{user.nome}</div>
              <div style={{ fontSize:11, color:T.muted }}>{PAPEL[user.papel]}</div>
            </div>
          </button>
          <button onClick={onOpenPerfil} title="Editar perfil"
            style={{ color:T.muted, background:"none", border:"none", cursor:"pointer", padding:6, display:"flex", flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.color = T.ink}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            <Settings size={17} />
          </button>
        </div>
        <button className="nav-item" onClick={onLogout} style={{ color: T.muted, marginTop:4 }}>
          <LogOut size={16} /> Sair da conta
        </button>
      </div>

      {/* Status */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 20px", borderTop:`1px solid ${T.borderS}`, fontSize:11, color:T.muted }}>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" /> Sistema online
        </span>
        <span>v2.1.0</span>
      </div>
    </aside>
  );
}
