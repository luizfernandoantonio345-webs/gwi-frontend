import { useState, useEffect } from "react";
import { ShoppingCart, Package, RefreshCw, PackageSearch, CheckCircle2, Truck, Clock } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { brl } from "../utils/format";
import { useAsync } from "../hooks/useAsync";
import { useIsMobile } from "../hooks/useIsMobile";
import { Loader, ErrBox, Spin } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { MobileCard } from "../components/MobileCard";
import { Chip, UrgBadge } from "../components/Chip";

// ── Modal efetivar compra (pedidos antigos) ──────────────────────
function ModalCompra({ pedido, onClose, onDone }) {
  const { data: mats } = useAsync(() => api.catalogo.listarMateriais(), []);
  const [rows, setRows] = useState(
    Object.fromEntries(pedido.itens.map(i => [i.id, { qtd: i.qtd_aprovada ?? i.qtd_solicitada, custo: i.custo_unitario }]))
  );
  const [busy, setBusy] = useState(false);

  const nomeMat = id => (mats || []).find(m => m.id === id)?.nome || `#${id}`;
  const set = (id, k, v) => setRows(d => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const efetivar = async () => {
    setBusy(true);
    try {
      await api.pedidos.comprar(pedido.id, {
        itens: pedido.itens.map(i => ({
          item_id: i.id,
          qtd_comprada: Number(rows[i.id].qtd),
          custo_unitario: Number(rows[i.id].custo),
        })),
      });
      onDone("Compra efetivada com sucesso.");
    } catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`Efetivar compra · ${pedido.numero}`} onClose={onClose} wide>
      <div style={{ display:"grid", gap:16 }}>
        <table className="tbl">
          <thead><tr><th>Material</th><th style={{ width:110 }}>Qtd. comprada</th><th style={{ width:140 }}>Custo unitário</th></tr></thead>
          <tbody>{pedido.itens.map(i => (
            <tr key={i.id}>
              <td style={{ fontWeight:500 }}>{nomeMat(i.material_id)}</td>
              <td><input className="inp mono" type="number" min={0} value={rows[i.id].qtd} onChange={e => set(i.id, "qtd", e.target.value)} /></td>
              <td><input className="inp mono" type="number" min={0} step="0.01" value={rows[i.id].custo} onChange={e => set(i.id, "custo", e.target.value)} /></td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={efetivar} disabled={busy}>
            {busy ? <Spin /> : <ShoppingCart size={15} />} Confirmar compra
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal confirmar observação para requisição ─────────────────
function ModalObsReq({ titulo, onClose, onConfirm, notify }) {
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);

  const confirmar = async () => {
    setBusy(true);
    try { await onConfirm(obs); onClose(); }
    catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={titulo} onClose={onClose}>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Observação (opcional)">
          <input className="inp" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: pedido confirmado no fornecedor X…" autoFocus />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn kind="outline" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={confirmar} disabled={busy}>
            {busy ? <Spin /> : <CheckCircle2 size={14} />} Confirmar
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Badge requisição ──────────────────────────────────────────
function ReqBadge({ status }) {
  const map = {
    PENDENTE:  { label: "Pendente",  cor: T.amber },
    COMPRADO:  { label: "Comprado",  cor: T.blue  },
    RECEBIDO:  { label: "Recebido",  cor: T.green },
    CANCELADO: { label: "Cancelado", cor: T.muted },
  };
  const s = map[status] || map.PENDENTE;
  return (
    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
      background: `${s.cor}18`, color: s.cor, border: `1px solid ${s.cor}35` }}>
      {s.label}
    </span>
  );
}

// ── Aba: Solicitações do almoxarife ───────────────────────────
function AbaRequisicoes({ notify }) {
  const [reload, setReload] = useState(0);
  const [filtro, setFiltro] = useState("PENDENTE");
  const [obsModal, setObsModal] = useState(null); // { titulo, onConfirm }
  const isMobile = useIsMobile();

  const { data: lista, loading, err, reload: rld, atualizar } = useAsync(
    () => api.requisicoes.listar(filtro),
    [reload, filtro],
    null,
    15000
  );
  useEffect(() => {
    const h = () => atualizar();
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [atualizar]);

  const acaoComprado = (id) => setObsModal({
    titulo: "Marcar como comprado",
    onConfirm: async (obs) => {
      await api.requisicoes.marcarComprado(id, obs);
      setReload(r => r + 1);
      notify("Requisição marcada como comprada.");
    },
  });

  const acaoRecebido = (id) => setObsModal({
    titulo: "Confirmar recebimento",
    onConfirm: async (obs) => {
      await api.requisicoes.marcarRecebido(id, obs);
      setReload(r => r + 1);
      notify("Material recebido — estoque atualizado.");
    },
  });

  const filtros = [
    { v: "PENDENTE", l: "Pendentes", Icon: Clock },
    { v: "COMPRADO", l: "Compradas", Icon: Truck },
    { v: "RECEBIDO", l: "Recebidas", Icon: CheckCircle2 },
  ];

  if (loading) return <Loader text="Carregando solicitações" />;
  if (err)     return <ErrBox err={err} onRetry={rld} />;

  const itens = lista || [];

  return (
    <>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filtros.map(f => (
            <button key={f.v} onClick={() => setFiltro(f.v)}
              style={{ display: "flex", alignItems: "center", gap: 5,
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${filtro === f.v ? T.cyan : T.border}`,
                background: filtro === f.v ? `${T.cyan}18` : "transparent",
                color: filtro === f.v ? T.cyan : T.sub }}>
              <f.Icon size={11} /> {f.l}
            </button>
          ))}
        </div>
        <Btn kind="outline" size="sm" onClick={rld}><RefreshCw size={13} /></Btn>
      </div>

      {itens.length === 0 ? (
        <Empty icon={PackageSearch} title="Nenhuma solicitação"
          sub={`Nenhuma solicitação com status "${filtro}".`} />
      ) : isMobile ? (
        <div style={{ display:"grid", gap:10, padding:16 }}>
          {itens.map(r => (
            <MobileCard key={r.id}
              title={r.material_nome}
              subtitle={r.material_codigo}
              badge={<ReqBadge status={r.status} />}
              fields={[
                { label:"Qtd", value:<span className="mono">{r.quantidade}</span> },
                { label:"Data", value:new Date(r.criado_em).toLocaleDateString("pt-BR") },
                { label:"Observação", value:r.observacao },
              ]}
              actions={<>
                {r.status === "PENDENTE" && (
                  <Btn kind="primary" size="sm" onClick={() => acaoComprado(r.id)} style={{ width:"100%" }}>
                    <Truck size={12} /> Comprado
                  </Btn>
                )}
                {r.status === "COMPRADO" && (
                  <Btn kind="success" size="sm" onClick={() => acaoRecebido(r.id)} style={{ width:"100%" }}>
                    <Package size={12} /> Recebido
                  </Btn>
                )}
              </>}
            />
          ))}
        </div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Material</th><th>Código</th><th>Qtd</th><th>Observação</th><th>Data</th><th>Status</th><th></th></tr></thead>
          <tbody>{itens.map(r => (
            <tr key={r.id}>
              <td style={{ fontWeight: 500 }}>{r.material_nome}</td>
              <td className="mono" style={{ color: T.sub, fontSize: 12 }}>{r.material_codigo}</td>
              <td className="mono">{r.quantidade}</td>
              <td style={{ color: T.sub, fontSize: 13 }}>{r.observacao || "—"}</td>
              <td style={{ color: T.sub, fontSize: 12 }}>
                {new Date(r.criado_em).toLocaleDateString("pt-BR")}
              </td>
              <td><ReqBadge status={r.status} /></td>
              <td style={{ textAlign: "right" }}>
                {r.status === "PENDENTE" && (
                  <Btn kind="primary" size="sm" onClick={() => acaoComprado(r.id)}>
                    <Truck size={12} /> Comprado
                  </Btn>
                )}
                {r.status === "COMPRADO" && (
                  <Btn kind="success" size="sm" onClick={() => acaoRecebido(r.id)}>
                    <Package size={12} /> Recebido
                  </Btn>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {obsModal && (
        <ModalObsReq
          titulo={obsModal.titulo}
          onConfirm={obsModal.onConfirm}
          notify={notify}
          onClose={() => setObsModal(null)}
        />
      )}
    </>
  );
}

// ── Página principal ───────────────────────────────────────────
export function FilaCompra({ notify, usuario }) {
  const [aba,    setAba]    = useState("pedidos");
  const [sel,    setSel]    = useState(null);
  const [reload, setReload] = useState(0);
  const isMobile = useIsMobile();

  const { data, loading, err, reload: rld, atualizar } = useAsync(() => api.pedidos.listar(null), [reload], null, 15000);
  useEffect(() => {
    const h = () => atualizar();
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [atualizar]);

  const fila      = (data || []).filter(p => ["AGUARDANDO_COMPRA", "COMPRADO"].includes(p.status));
  const recarrega = msg => { notify(msg); setSel(null); setReload(r => r + 1); };

  const darEntrada = async p => {
    try { await api.pedidos.receber(p.id); recarrega("Entrada registrada no estoque."); }
    catch (e) { notify(e.message, true); }
  };

  const abas = [
    { k: "pedidos",      label: "Pedidos aprovados" },
    { k: "requisicoes",  label: "Solicitações do almoxarife" },
  ];

  return (
    <>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, padding: "4px", background: T.bg2, borderRadius: 10,
          border: `1px solid ${T.border}`, width: "fit-content" }}>
          {abas.map(a => (
            <button key={a.k} onClick={() => setAba(a.k)} style={{
              padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: aba === a.k ? T.panel : "transparent",
              color:      aba === a.k ? T.ink   : T.sub,
              boxShadow:  aba === a.k ? "0 1px 4px rgba(0,0,0,.3)" : "none",
              transition: "all .15s",
            }}>{a.label}</button>
          ))}
        </div>

        {aba === "pedidos" && (
          <Panel
            title="Pedidos aprovados"
            sub="Pedidos aguardando compra ou entrada de estoque"
            right={<Btn kind="outline" size="sm" onClick={rld}><RefreshCw size={13} /> Atualizar</Btn>}
            noPad
          >
            {loading ? <Loader text="Carregando fila" /> : err ? <ErrBox err={err} onRetry={rld} /> :
              fila.length === 0 ? (
                <Empty icon={ShoppingCart} title="Fila vazia" sub="Nenhum pedido aguardando compra." />
              ) : isMobile ? (
                <div style={{ display:"grid", gap:10, padding:16 }}>
                  {fila.map(p => (
                    <MobileCard key={p.id}
                      title={<span className="mono">{p.numero}</span>}
                      badge={<Chip status={p.status} />}
                      fields={[
                        { label:"Urgência", value:<UrgBadge u={p.urgencia} /> },
                        { label:"Valor", value:<span className="mono" style={{ color:T.cyan }}>{brl(p.valor_estimado)}</span> },
                      ]}
                      actions={p.status === "AGUARDANDO_COMPRA"
                        ? <Btn kind="primary" size="sm" onClick={() => setSel(p)} style={{ width:"100%" }}><ShoppingCart size={13} /> Efetivar compra</Btn>
                        : <Btn kind="success" size="sm" onClick={() => darEntrada(p)} style={{ width:"100%" }}><Package size={13} /> Dar entrada</Btn>}
                    />
                  ))}
                </div>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Nº</th><th>Status</th><th>Urgência</th><th>Valor</th><th></th></tr></thead>
                  <tbody>{fila.map(p => (
                    <tr key={p.id}>
                      <td className="mono" style={{ fontWeight:600 }}>{p.numero}</td>
                      <td><Chip status={p.status} /></td>
                      <td><UrgBadge u={p.urgencia} /></td>
                      <td className="mono" style={{ color:T.cyan }}>{brl(p.valor_estimado)}</td>
                      <td style={{ textAlign:"right" }}>
                        {p.status === "AGUARDANDO_COMPRA"
                          ? <Btn kind="primary" size="sm" onClick={() => setSel(p)}><ShoppingCart size={13} /> Efetivar compra</Btn>
                          : <Btn kind="success" size="sm" onClick={() => darEntrada(p)}><Package size={13} /> Dar entrada</Btn>}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
          </Panel>
        )}

        {aba === "requisicoes" && (
          <Panel title="Solicitações do almoxarife" sub="Pedidos de reposição de estoque" noPad>
            <AbaRequisicoes notify={notify} />
          </Panel>
        )}
      </div>

      {sel && <ModalCompra pedido={sel} onClose={() => setSel(null)} onDone={recarrega} />}
    </>
  );
}
