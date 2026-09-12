import { useState, useEffect, useRef } from "react";
import { Bell, ShoppingCart, ClipboardCheck, PackageSearch, RefreshCw, X } from "lucide-react";
import { T } from "../styles/tokens";

const DUR = 6000;

// Título + ícone por tipo de evento (recebido do backend via WebSocket).
function meta(tipo) {
  switch (tipo) {
    case "pedido_novo":       return { titulo: "Novo pedido",          Icon: ClipboardCheck };
    case "pedido_compra":     return { titulo: "Pedido para compra",    Icon: ShoppingCart };
    case "pedido_status":     return { titulo: "Pedido atualizado",     Icon: RefreshCw };
    case "requisicao_nova":   return { titulo: "Nova solicitação",      Icon: PackageSearch };
    case "requisicao_status": return { titulo: "Solicitação atualizada", Icon: RefreshCw };
    default:                  return { titulo: "Notificação",           Icon: Bell };
  }
}

export function NotificacoesRealtime() {
  const [itens, setItens] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const h = (ev) => {
      const d = ev.detail || {};
      if (!d.msg) return;
      const id = ++idRef.current;
      setItens(prev => [{ id, msg: d.msg, tipo: d.tipo }, ...prev].slice(0, 4)); // mais recente no topo
      setTimeout(() => setItens(prev => prev.filter(x => x.id !== id)), DUR);
    };
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, []);

  const remover = (id) => setItens(prev => prev.filter(x => x.id !== id));
  if (!itens.length) return null;

  return (
    <div className="notif-stack">
      {itens.map(n => {
        const { titulo, Icon } = meta(n.tipo);
        return (
          <div key={n.id} style={{
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px 15px",
            background: "linear-gradient(180deg,#0a1a22,#07131b)",
            border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.cyan}`, borderRadius: 12,
            boxShadow: "0 18px 44px -14px #000d, 0 0 0 1px #ffffff08",
            animation: "toastRight .26s cubic-bezier(.2,.8,.2,1)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${T.cyan}18`, border: `1px solid ${T.cyan}44`,
              display: "grid", placeItems: "center", boxShadow: `0 0 16px -4px ${T.cyan}66`,
            }}>
              <Icon size={18} color={T.cyan} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{titulo}</span>
                <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>agora</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 3, color: T.sub, lineHeight: 1.45 }}>{n.msg}</div>
            </div>
            <button onClick={() => remover(n.id)} title="Fechar"
              style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}>
              <X size={15} />
            </button>
            {/* barra de progresso do auto-fechamento */}
            <div style={{
              position: "absolute", left: 0, bottom: 0, height: 3, width: "100%",
              background: T.cyan, transformOrigin: "left",
              animation: `notifBarra ${DUR}ms linear forwards`, opacity: .8,
            }} />
          </div>
        );
      })}
    </div>
  );
}
