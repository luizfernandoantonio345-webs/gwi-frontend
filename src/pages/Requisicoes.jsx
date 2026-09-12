import { useState, useRef, useEffect } from "react";
import { PackageSearch, Plus, X, RefreshCw, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { useAsync } from "../hooks/useAsync";
import { useIsMobile } from "../hooks/useIsMobile";
import { Loader, ErrBox, Spin } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";

const STATUS_BADGE = {
  PENDENTE:  { label: "Pendente",  cor: T.amber,  Icon: Clock },
  COMPRADO:  { label: "Comprado",  cor: T.blue,   Icon: Truck },
  RECEBIDO:  { label: "Recebido",  cor: T.green,  Icon: CheckCircle2 },
  CANCELADO: { label: "Cancelado", cor: T.muted,  Icon: XCircle },
};

function Badge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.PENDENTE;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
      background: `${s.cor}18`, color: s.cor, border: `1px solid ${s.cor}35` }}>
      <s.Icon size={11} /> {s.label}
    </span>
  );
}

// ── Modal criar nova solicitação ────────────────────────────────
function ModalNovaRequisicao({ onClose, onDone, notify }) {
  const [busca, setBusca]       = useState("");
  const [lista, setLista]       = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [material, setMaterial] = useState(null);
  const [qtd, setQtd]           = useState(1);
  const [obs, setObs]           = useState("");
  const [busy, setBusy]         = useState(false);
  const timerRef = useRef(null);

  const buscarMaterial = async (val) => {
    setBusca(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setLista([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await api.catalogo.listarMateriais({ busca: val.trim(), limit: 10 });
        setLista(Array.isArray(r) ? r : (r.items || []));
      } catch { setLista([]); }
      finally { setBuscando(false); }
    }, 350);
  };

  const enviar = async () => {
    if (!material) return;
    setBusy(true);
    try {
      await api.requisicoes.criar({
        material_id: material.id,
        quantidade: Number(qtd),
        observacao: obs || null,
      });
      onDone("Solicitação enviada com sucesso.");
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Nova solicitação de material" onClose={onClose}>
      <div style={{ display: "grid", gap: 16 }}>

        {material ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", background: `${T.cyan}12`,
            border: `1px solid ${T.cyan}33`, borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, color: T.ink, fontWeight: 600 }}>{material.nome}</p>
              <p style={{ margin: 0, color: T.sub, fontSize: 12 }}>
                {material.codigo} · Saldo atual: {material.saldo_estoque}
              </p>
            </div>
            <button onClick={() => { setMaterial(null); setLista([]); setBusca(""); }}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        ) : (
          <Field label="Buscar material">
            <div style={{ position: "relative" }}>
              <input className="inp" value={busca} onChange={e => buscarMaterial(e.target.value)}
                placeholder="Digite o nome ou código do material…" autoFocus />
              {(lista.length > 0 || buscando) && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8,
                  marginTop: 4, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px #0009" }}>
                  {buscando && <div style={{ padding: "10px 14px", color: T.muted, fontSize: 13 }}>Buscando…</div>}
                  {lista.map(m => (
                    <button key={m.id} onClick={() => { setMaterial(m); setLista([]); setBusca(""); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                        background: "transparent", border: "none", cursor: "pointer", color: T.ink,
                        borderBottom: `1px solid ${T.border}`, fontSize: 14 }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontWeight: 600 }}>{m.nome}</span>
                      <span style={{ color: T.sub, marginLeft: 8, fontSize: 12 }}>
                        {m.codigo} · Saldo: {m.saldo_estoque}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        )}

        {material && (
          <>
            <Field label="Quantidade necessária">
              <input className="inp mono" type="number" min={0.01} step={0.01}
                value={qtd} onChange={e => setQtd(e.target.value)} />
            </Field>
            <Field label="Observação (opcional)">
              <input className="inp" value={obs} onChange={e => setObs(e.target.value)}
                placeholder="Ex: urgente para obra 05, faltando em estoque…" />
            </Field>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn kind="outline" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={enviar} disabled={busy || !material}>
            {busy ? <Spin /> : <Plus size={14} />} Enviar solicitação
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Filtro de status ────────────────────────────────────────────
function FiltroStatus({ atual, onChange }) {
  const ops = [
    { v: undefined, l: "Todas" },
    { v: "PENDENTE",  l: "Pendentes"  },
    { v: "COMPRADO",  l: "Compradas"  },
    { v: "RECEBIDO",  l: "Recebidas"  },
    { v: "CANCELADO", l: "Canceladas" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {ops.map(o => (
        <button key={o.l} onClick={() => onChange(o.v)}
          style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${atual === o.v ? T.cyan : T.border}`,
            background: atual === o.v ? `${T.cyan}18` : "transparent",
            color: atual === o.v ? T.cyan : T.sub }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ── Linha da tabela ────────────────────────────────────────────
function LinhaReq({ req, onCancelar, cancelando }) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{req.material_nome}</td>
      <td className="mono" style={{ color: T.sub, fontSize: 12 }}>{req.material_codigo}</td>
      <td className="mono">{req.quantidade}</td>
      <td>{req.observacao ? <span style={{ color: T.sub, fontSize: 13 }}>{req.observacao}</span> : "—"}</td>
      <td style={{ color: T.sub, fontSize: 12 }}>
        {new Date(req.criado_em).toLocaleDateString("pt-BR")}
      </td>
      <td><Badge status={req.status} /></td>
      <td style={{ textAlign: "right" }}>
        {req.status === "PENDENTE" && (
          <Btn kind="outline" size="sm" onClick={() => onCancelar(req.id)} disabled={cancelando === req.id}
            style={{ color: T.red, borderColor: `${T.red}40` }}>
            {cancelando === req.id ? <Spin /> : <X size={12} />} Cancelar
          </Btn>
        )}
      </td>
    </tr>
  );
}

// ── Card da solicitação (mobile) ───────────────────────────────
function ReqCard({ req, onCancelar, cancelando }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:12, padding:14, background:T.bg2 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14.5 }}>{req.material_nome}</div>
          <div className="mono" style={{ color:T.sub, fontSize:12, marginTop:2 }}>{req.material_codigo}</div>
        </div>
        <Badge status={req.status} />
      </div>
      <div style={{ display:"flex", gap:18, marginTop:12, fontSize:13 }}>
        <span style={{ color:T.sub }}>Qtd: <span className="mono" style={{ color:T.ink }}>{req.quantidade}</span></span>
        <span style={{ color:T.sub }}>{new Date(req.criado_em).toLocaleDateString("pt-BR")}</span>
      </div>
      {req.observacao && <div style={{ color:T.sub, fontSize:13, marginTop:8 }}>{req.observacao}</div>}
      {req.status === "PENDENTE" && (
        <div style={{ marginTop:12 }}>
          <Btn kind="outline" size="sm" onClick={() => onCancelar(req.id)} disabled={cancelando === req.id}
            style={{ color:T.red, borderColor:`${T.red}40`, width:"100%" }}>
            {cancelando === req.id ? <Spin /> : <X size={12} />} Cancelar solicitação
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────
export function Requisicoes({ notify }) {
  const [modal,      setModal]      = useState(false);
  const [filtro,     setFiltro]     = useState(undefined);
  const [reload,     setReload]     = useState(0);
  const [cancelando, setCancelando] = useState(null);
  const isMobile = useIsMobile();

  const { data: lista, loading, err, reload: rld, atualizar } = useAsync(
    () => api.requisicoes.listar(filtro),
    [reload, filtro],
    null,
    20000
  );
  useEffect(() => {
    const h = () => atualizar();
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [atualizar]);

  const cancelar = async (id) => {
    setCancelando(id);
    try {
      await api.requisicoes.cancelar(id);
      setReload(r => r + 1);
      notify("Solicitação cancelada.");
    } catch (e) { notify(e.message, true); }
    finally { setCancelando(null); }
  };

  if (loading) return <Loader text="Carregando solicitações" />;
  if (err)     return <ErrBox err={err} onRetry={rld} />;

  const itens = lista || [];

  return (
    <>
      <Panel
        title="Solicitações de estoque"
        sub="Solicite materiais para compra e acompanhe o status"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="outline" size="sm" onClick={rld}><RefreshCw size={13} /></Btn>
            <Btn kind="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={13} /> Nova solicitação
            </Btn>
          </div>
        }
        noPad
      >
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <FiltroStatus atual={filtro} onChange={setFiltro} />
        </div>

        {itens.length === 0 ? (
          <Empty icon={PackageSearch} title="Nenhuma solicitação"
            sub="Clique em 'Nova solicitação' para solicitar um material ao setor de compras." />
        ) : isMobile ? (
          <div style={{ display:"grid", gap:10, padding:16 }}>
            {itens.map(r => <ReqCard key={r.id} req={r} onCancelar={cancelar} cancelando={cancelando} />)}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Material</th>
                <th>Código</th>
                <th>Qtd</th>
                <th>Observação</th>
                <th>Data</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map(r => (
                <LinhaReq key={r.id} req={r} onCancelar={cancelar} cancelando={cancelando} />
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {modal && (
        <ModalNovaRequisicao
          notify={notify}
          onClose={() => setModal(false)}
          onDone={msg => { notify(msg); setModal(false); setReload(r => r + 1); }}
        />
      )}
    </>
  );
}
