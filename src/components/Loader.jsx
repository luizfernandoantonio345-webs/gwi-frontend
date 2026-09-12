import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { T } from "../styles/tokens";
import { Btn } from "./Btn";

export const Spin = () => <Loader2 size={15} className="spin" />;

export function Loader({ text = "Carregando" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"64px 20px", color:T.sub }}>
      <Spin />
      <span style={{ fontSize: 14 }}>{text}…</span>
    </div>
  );
}

export function ErrBox({ err, onRetry }) {
  const txt = String(err || "");
  const rede = /failed to fetch|networkerror|load failed|fetch|não autenticado|not authenticated/i.test(txt);
  const msg = rede
    ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente em alguns segundos."
    : (txt || "Ocorreu um erro inesperado. Tente novamente.");
  return (
    <div className="panel" style={{ padding:16, borderColor:`${T.red}44`, display:"flex", alignItems:"center", gap:12 }}>
      <AlertTriangle size={17} color={T.red} style={{ flexShrink:0 }} />
      <span style={{ fontSize:13.5, flex:1 }}>{msg}</span>
      {onRetry && (
        <Btn kind="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={13} /> Tentar novamente
        </Btn>
      )}
    </div>
  );
}
