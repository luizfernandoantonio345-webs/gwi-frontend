import { useEffect } from "react";
import { AlertTriangle, Boxes, BarChart3, TrendingUp, CheckCircle2, RefreshCw, Clock, Activity } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { TIPO } from "../constants";
import { brl, num } from "../utils/format";
import { useAsync } from "../hooks/useAsync";
import { Loader, ErrBox } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";

// ── Banner de destaque do topo ───────────────────────────────
function Hero({ itens, valor }) {
  return (
    <div className="blueprint hero-card" style={{ position:"relative", overflow:"hidden",
      borderRadius:16, border:`1px solid ${T.cyan}44`,
      background:`linear-gradient(120deg, #06171d 0%, #061219 60%, #05121a 100%)`,
      padding:"26px 28px", minHeight:150 }}>
      {/* glow */}
      <div style={{ position:"absolute", right:-160, top:-220, width:560, height:560, borderRadius:"50%",
        background:`${T.cyan}18`, filter:"blur(120px)", pointerEvents:"none" }} />
      {/* faixas diagonais */}
      <div style={{ position:"absolute", right:"9%", top:0, bottom:0, width:70, background:`${T.cyan}14`, transform:"skewX(-24deg)" }} />
      <div style={{ position:"absolute", right:"5%", top:0, bottom:0, width:34, background:`${T.cyan}0e`, transform:"skewX(-24deg)" }} />

      <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"flex-start", gap:18, flexWrap:"wrap" }}>
        <div style={{ width:60, height:60, borderRadius:16, flexShrink:0,
          background:`${T.cyan}12`, border:`1px solid ${T.cyan}44`, display:"grid", placeItems:"center",
          boxShadow:`0 0 30px -6px ${T.cyan}55` }}>
          <Activity size={30} color={T.cyan} strokeWidth={1.6} />
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <h2 className="t-hero">Painel de controle</h2>
          <p style={{ fontSize:13.5, color:T.sub, marginTop:6, maxWidth:520 }}>
            Visão geral do estoque, itens críticos e solicitações pendentes — tudo em tempo real.
          </p>
        </div>
        <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
          <div>
            <div className="mono" style={{ fontSize:24, fontWeight:700, color:T.cyan }}>{itens}</div>
            <div style={{ fontSize:11.5, color:T.muted, marginTop:2 }}>Itens no catálogo</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize:24, fontWeight:700 }}>{valor}</div>
            <div style={{ fontSize:11.5, color:T.muted, marginTop:2 }}>Valor em estoque</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────
export function Dashboard() {
  const { data, loading, err, reload, atualizar }     = useAsync(() => api.catalogo.listarMateriais(), [], "materiais");
  const { data: reqs, reload: reloadReqs, atualizar: atualizarReqs } = useAsync(() => api.requisicoes.listar("PENDENTE"), [], "reqs-pendentes");
  useEffect(() => {
    const h = () => { atualizar(); atualizarReqs(); };
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [atualizar, atualizarReqs]);

  if (loading) return <Loader text="Carregando estoque" />;
  if (err)     return <ErrBox err={err} onRetry={reload} />;

  const mats        = data || [];
  const valor       = mats.reduce((s, m) => s + Number(m.saldo_estoque) * Number(m.custo_medio), 0);
  const critico     = mats.filter(m => m.abaixo_do_minimo);
  const disponiveis = mats.filter(m => Number(m.saldo_disponivel) > 0);
  const reqPend     = reqs || [];

  const metrics = [
    { icon:Boxes,         label:"Itens cadastrados",      value:num(mats.length),        accent:T.cyan  },
    { icon:BarChart3,     label:"Valor em estoque",       value:brl(valor),              accent:T.green },
    { icon:TrendingUp,    label:"Disponíveis",            value:num(disponiveis.length), accent:T.blue  },
    { icon:AlertTriangle, label:"Abaixo do mínimo",       value:num(critico.length),     accent:critico.length > 0 ? T.amber : T.muted },
    { icon:Clock,         label:"Solicitações pendentes", value:num(reqPend.length),     accent:reqPend.length > 0 ? T.violet : T.muted },
  ];

  return (
    <div style={{ display:"grid", gap:20 }} className="fade-up">

      {/* Banner */}
      <Hero itens={num(mats.length)} valor={brl(valor)} />

      {/* Métricas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
        {metrics.map(m => (
          <div key={m.label} className="metric-card" style={{ "--accent": m.accent }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <span style={{ fontSize:12, color:T.sub, fontWeight:500 }}>{m.label}</span>
              <div style={{ padding:7, borderRadius:8, background:`${m.accent}18`, color:m.accent }}>
                <m.icon size={15} />
              </div>
            </div>
            <div className="mono" style={{ fontSize:22, fontWeight:600, letterSpacing:"-0.02em" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Solicitações pendentes */}
      {reqPend.length > 0 && (
        <Panel
          title="Solicitações de estoque pendentes"
          sub="Pedidos enviados pelo almoxarife aguardando ação de compras"
          right={<Btn kind="outline" size="sm" onClick={reloadReqs}><RefreshCw size={13} /> Atualizar</Btn>}
          noPad
        >
          <table className="tbl">
            <thead><tr><th>Material</th><th>Código</th><th>Qtd</th><th>Observação</th><th>Data</th></tr></thead>
            <tbody>{reqPend.slice(0, 10).map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight:500 }}>{r.material_nome}</td>
                <td className="mono" style={{ color:T.sub, fontSize:12 }}>{r.material_codigo}</td>
                <td className="mono">{r.quantidade}</td>
                <td style={{ color:T.sub, fontSize:13 }}>{r.observacao || "—"}</td>
                <td style={{ color:T.sub, fontSize:12 }}>
                  {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {reqPend.length > 10 && (
            <div style={{ padding:"10px 20px", color:T.muted, fontSize:12, textAlign:"center" }}>
              +{reqPend.length - 10} mais — veja em Fila de compras
            </div>
          )}
        </Panel>
      )}

      {/* Itens críticos */}
      <Panel
        title="Itens abaixo do estoque mínimo"
        sub="Prioridade para reposição"
        right={<Btn kind="outline" size="sm" onClick={reload}><RefreshCw size={13} /> Atualizar</Btn>}
        noPad
      >
        {critico.length === 0
          ? <Empty icon={CheckCircle2} title="Tudo em ordem" sub="Nenhum item abaixo do estoque mínimo." />
          : (
            <table className="tbl">
              <thead><tr><th>Código</th><th>Material</th><th>Tipo</th><th>Saldo</th><th>Mínimo</th></tr></thead>
              <tbody>{critico.map(m => (
                <tr key={m.id}>
                  <td className="mono" style={{ color:T.sub }}>{m.codigo}</td>
                  <td style={{ fontWeight:500 }}>{m.nome}</td>
                  <td><span style={{ fontSize:12, color:T.sub, background:T.bg2, padding:"2px 7px", borderRadius:4, border:`1px solid ${T.border}` }}>{TIPO[m.tipo] || m.tipo}</span></td>
                  <td className="mono" style={{ color:T.red, fontWeight:600 }}>{num(m.saldo_estoque)} <span style={{ color:T.muted, fontSize:11 }}>{m.unidade}</span></td>
                  <td className="mono" style={{ color:T.muted }}>{num(m.estoque_minimo)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
      </Panel>
    </div>
  );
}
