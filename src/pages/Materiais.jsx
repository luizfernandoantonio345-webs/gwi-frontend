import { RefreshCw } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { TIPO } from "../constants";
import { brl, num } from "../utils/format";
import { useAsync } from "../hooks/useAsync";
import { useIsMobile } from "../hooks/useIsMobile";
import { Loader, ErrBox } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Btn } from "../components/Btn";

// Card de material para telas pequenas
function MaterialCard({ m }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:12, padding:14, background:T.bg2 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14.5 }}>{m.nome}</div>
          <div className="mono" style={{ color:T.sub, fontSize:12, marginTop:2 }}>{m.codigo}</div>
        </div>
        <span style={{ fontSize:11, color:T.sub, background:T.panel, padding:"3px 8px", borderRadius:6,
          border:`1px solid ${T.border}`, flexShrink:0 }}>{TIPO[m.tipo] || m.tipo}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:14 }}>
        <div>
          <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>Saldo</div>
          <div className="mono" style={{ marginTop:3, color:m.abaixo_do_minimo ? T.red : T.ink, fontWeight:m.abaixo_do_minimo ? 700 : 500 }}>
            {num(m.saldo_estoque)} <span style={{ color:T.muted, fontSize:11 }}>{m.unidade}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>Disponível</div>
          <div className="mono" style={{ marginTop:3 }}>{num(m.saldo_disponivel)}</div>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>Custo méd.</div>
          <div className="mono" style={{ marginTop:3, color:T.cyan }}>{brl(m.custo_medio)}</div>
        </div>
      </div>
    </div>
  );
}

export function Materiais() {
  const { data, loading, err, reload } = useAsync(() => api.catalogo.listarMateriais(), [], "materiais");
  const isMobile = useIsMobile();

  if (loading) return <Loader text="Carregando materiais" />;
  if (err)     return <ErrBox err={err} onRetry={reload} />;

  const mats = data || [];

  if (isMobile) {
    return (
      <Panel
        title="Catálogo de materiais"
        sub={`${mats.length} itens`}
        right={<Btn kind="outline" size="sm" onClick={reload}><RefreshCw size={13} /></Btn>}
      >
        <div style={{ display:"grid", gap:10 }}>
          {mats.map(m => <MaterialCard key={m.id} m={m} />)}
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Catálogo de materiais"
      sub={`${mats.length} itens`}
      right={<Btn kind="outline" size="sm" onClick={reload}><RefreshCw size={13} /> Atualizar</Btn>}
      noPad
    >
      <table className="tbl">
        <thead><tr><th>Código</th><th>Material</th><th>Tipo</th><th>Saldo</th><th>Disponível</th><th>Custo médio</th></tr></thead>
        <tbody>{mats.map(m => (
          <tr key={m.id}>
            <td className="mono" style={{ color:T.sub }}>{m.codigo}</td>
            <td style={{ fontWeight:500 }}>{m.nome}</td>
            <td><span style={{ fontSize:12, color:T.sub, background:T.bg2, padding:"2px 7px", borderRadius:4, border:`1px solid ${T.border}` }}>{TIPO[m.tipo] || m.tipo}</span></td>
            <td className="mono" style={{ color:m.abaixo_do_minimo ? T.red : T.ink, fontWeight:m.abaixo_do_minimo ? 600 : 400 }}>
              {num(m.saldo_estoque)} <span style={{ color:T.muted, fontSize:11 }}>{m.unidade}</span>
            </td>
            <td className="mono">{num(m.saldo_disponivel)}</td>
            <td className="mono" style={{ color:T.cyan }}>{brl(m.custo_medio)}</td>
          </tr>
        ))}</tbody>
      </table>
    </Panel>
  );
}
