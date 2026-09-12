import { useState, useEffect } from "react";
import { QrCode, Menu, CalendarDays, Clock } from "lucide-react";
import { T } from "../styles/tokens";
import { PAPEL, PAGE_TITLES } from "../constants";
import { Btn } from "../components/Btn";
import { Avatar } from "../components/Avatar";

function useRelogio() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TopBar({ user, page, onNavigate, isMobile, onOpenMenu, onOpenPerfil }) {
  const now = useRelogio();
  const data = now.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" });
  const hora = now.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });

  return (
    <header style={{
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
      padding: isMobile ? "10px 14px" : "0 28px", height: isMobile ? "auto" : 68, minHeight: isMobile ? 56 : 68,
      borderBottom:`1px solid ${T.border}`,
      background:`${T.bg}e6`, backdropFilter:"blur(14px)",
      position:"sticky", top:0, zIndex:10,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
        {isMobile && (
          <button onClick={onOpenMenu} aria-label="Abrir menu"
            style={{ color:T.ink, background:"transparent", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
            <Menu size={22} />
          </button>
        )}
        <h1 style={{ fontSize:"var(--fs-h2)", fontWeight:700, letterSpacing:"-0.01em", minWidth:0, lineHeight:1.2,
          ...(isMobile ? {} : { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }) }}>
          {PAGE_TITLES[page] || page}
        </h1>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:isMobile ? 10 : 18, flexShrink:0 }}>
        {!isMobile && (
          <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.sub }}>
            <span className="live-dot pulse-dot" /> Conectado · {PAPEL[user.papel]}
          </span>
        )}
        {!isMobile && (
          <span style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:T.sub, textTransform:"capitalize" }}>
            <CalendarDays size={14} /> {data}
          </span>
        )}
        {!isMobile && (
          <span style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:T.sub }}>
            <Clock size={14} color={T.cyan} /> {hora}
          </span>
        )}
        {user.papel === "ALMOXARIFE" && (
          <Btn kind="primary" size="sm" onClick={() => onNavigate("baixaqr")}>
            <QrCode size={13} /> {isMobile ? "Baixa" : "Baixa rápida"}
          </Btn>
        )}
        {!isMobile && (
          <button onClick={onOpenPerfil} title="Editar perfil"
            style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexShrink:0 }}>
            <Avatar nome={user.nome} foto={user.foto} size={36} />
          </button>
        )}
      </div>
    </header>
  );
}
