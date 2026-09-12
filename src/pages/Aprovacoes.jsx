import { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { STATUS } from "../constants";
import { brl, num } from "../utils/format";
import { useAsync } from "../hooks/useAsync";
import { useIsMobile } from "../hooks/useIsMobile";
import { Loader, ErrBox, Spin } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { MobileCard } from "../components/MobileCard";
import { UrgBadge } from "../components/Chip";

function ModalAprovacao({ pedido, onClose, onDone }) {
  const { data: mats } = useAsync(() => api.catalogo.listarMateriais(), []);
  const [qtds, setQtds] = useState(Object.fromEntries(pedido.itens.map(i => [i.id, i.qtd_solicitada])));
  const [obs,  setObs]  = useState("");
  const [busy, setBusy] = useState(false);

  const nomeMat = id => (mats || []).find(m => m.id === id)?.nome || `#${id}`;
  const valor   = pedido.itens.reduce((s, i) => s + Number(qtds[i.id] || 0) * Number(i.custo_unitario), 0);

  const decidir = async (rejeitar) => {
    setBusy(true);
    try {
      const itens = pedido.itens.map(i => ({ item_id:i.id, qtd_aprovada: rejeitar ? 0 : Number(qtds[i.id] || 0) }));
      const r = await api.pedidos.aprovar(pedido.id, { itens, observacao: obs || null });
      const msgs = {
        REJEITADO:         "Pedido rejeitado.",
        AGUARDANDO_COMPRA: "Aprovado — enviado à fila de compras.",
      };
      onDone(msgs[r.status] || `Pedido: ${STATUS[r.status]?.label}.`);
    } catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`Análise · ${pedido.numero}`} onClose={onClose} wide>
      <div style={{ display:"grid", gap:16 }}>
        <table className="tbl">
          <thead><tr><th>Material</th><th>Solicitado</th><th style={{ width:130 }}>Qtd. aprovada</th></tr></thead>
          <tbody>{pedido.itens.map(i => (
            <tr key={i.id}>
              <td style={{ fontWeight:500 }}>{nomeMat(i.material_id)}</td>
              <td className="mono" style={{ color:T.sub }}>{num(i.qtd_solicitada)}</td>
              <td>
                <input className="inp mono" type="number" min={0} max={i.qtd_solicitada}
                  value={qtds[i.id]} onChange={e => setQtds(q => ({ ...q, [i.id]: e.target.value }))} />
              </td>
            </tr>
          ))}</tbody>
        </table>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", background:T.bg2, borderRadius:8, border:`1px solid ${T.border}` }}>
          <span style={{ fontSize:13, color:T.sub }}>Valor total aprovado</span>
          <span className="mono" style={{ fontSize:18, fontWeight:700, color:T.cyan }}>{brl(valor)}</span>
        </div>

        <Field label="Observação (opcional)">
          <input className="inp" value={obs} onChange={e => setObs(e.target.value)} placeholder="Comentário para o solicitante…" />
        </Field>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn kind="danger" onClick={() => decidir(true)} disabled={busy}>Rejeitar</Btn>
          <Btn kind="primary" onClick={() => decidir(false)} disabled={busy}>
            {busy ? <Spin /> : <CheckCircle2 size={15} />} Confirmar aprovação
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function Aprovacoes({ notify }) {
  const [sel,    setSel]    = useState(null);
  const [reload, setReload] = useState(0);
  const isMobile = useIsMobile();

  const statusFiltro = "AGUARDANDO_GERENTE";

  // Atualiza a cada 15s (fallback) e na hora quando chega evento em tempo real.
  const { data, loading, err, reload: rld, atualizar } = useAsync(() => api.pedidos.listar(statusFiltro), [statusFiltro, reload], null, 15000);
  useEffect(() => {
    const h = () => atualizar();
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [atualizar]);

  if (loading) return <Loader text="Carregando aprovações" />;
  if (err)     return <ErrBox err={err} onRetry={rld} />;

  const lista = data || [];

  return (
    <>
      <Panel
        title="Pedidos aguardando aprovação"
        sub="Você aprova todos os pedidos encaminhados"
        right={<Btn kind="outline" size="sm" onClick={rld}><RefreshCw size={13} /> Atualizar</Btn>}
        noPad
      >
        {lista.length === 0
          ? <Empty icon={CheckCircle2} title="Nada pendente" sub="Nenhum pedido aguardando sua análise." />
          : isMobile ? (
            <div style={{ display:"grid", gap:10, padding:16 }}>
              {lista.map(p => (
                <MobileCard key={p.id}
                  title={<span className="mono">{p.numero}</span>}
                  badge={<UrgBadge u={p.urgencia} />}
                  fields={[
                    { label:"Itens", value:`${p.itens.length} item(s)` },
                    { label:"Valor est.", value:<span className="mono" style={{ color:T.cyan }}>{brl(p.valor_estimado)}</span> },
                  ]}
                  actions={<Btn kind="primary" size="sm" onClick={() => setSel(p)} style={{ width:"100%" }}>Analisar →</Btn>}
                />
              ))}
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Nº</th><th>Urgência</th><th>Itens</th><th>Valor est.</th><th></th></tr></thead>
              <tbody>{lista.map(p => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight:600 }}>{p.numero}</td>
                  <td><UrgBadge u={p.urgencia} /></td>
                  <td style={{ color:T.sub }}>{p.itens.length} item(s)</td>
                  <td className="mono" style={{ color:T.cyan }}>{brl(p.valor_estimado)}</td>
                  <td style={{ textAlign:"right" }}>
                    <Btn kind="primary" size="sm" onClick={() => setSel(p)}>Analisar →</Btn>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
      </Panel>

      {sel && (
        <ModalAprovacao
          pedido={sel}
          onClose={() => setSel(null)}
          onDone={msg => { notify(msg); setSel(null); setReload(r => r + 1); }}
        />
      )}
    </>
  );
}
