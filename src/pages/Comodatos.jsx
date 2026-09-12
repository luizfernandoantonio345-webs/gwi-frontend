import { useState } from "react";
import { Handshake, RefreshCw, ChevronDown, ChevronUp, ArrowLeftRight, User } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { useAsync } from "../hooks/useAsync";
import { Loader, ErrBox, Spin } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";

// ── Modal de devolução com observação ──────────────────────────
function ModalDevolucao({ comodato, colaboradorNome, onClose, onDone, notify }) {
  const [obs,  setObs]  = useState("");
  const [busy, setBusy] = useState(false);

  const confirmar = async () => {
    setBusy(true);
    try {
      await api.operacoes.devolverComodato(comodato.comodato_id, obs || null);
      onDone();
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Confirmar devolução" onClose={onClose}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ padding: "10px 14px", background: `${T.cyan}12`,
          border: `1px solid ${T.cyan}33`, borderRadius: 8 }}>
          <p style={{ margin: 0, color: T.ink, fontWeight: 600 }}>{comodato.material_nome}</p>
          <p style={{ margin: 0, color: T.muted, fontSize: 13 }}>
            Colaborador: {colaboradorNome} · Qtd: {comodato.quantidade}
          </p>
        </div>
        <Field label="Observação (opcional)">
          <input className="inp" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: material devolvido com desgaste normal" />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn kind="outline" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={confirmar} disabled={busy}>
            {busy ? <Spin /> : <ArrowLeftRight size={14} />} Confirmar devolução
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Card por colaborador ───────────────────────────────────────
function CardColaborador({ grupo, onDevolver, papel }) {
  const [aberto, setAberto] = useState(false);
  const total = grupo.itens.length;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
      {/* Header do colaborador */}
      <button
        onClick={() => setAberto(a => !a)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: T.panel, border: "none", cursor: "pointer",
          textAlign: "left", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.blue}22`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={16} color={T.blue} />
          </div>
          <div>
            <p style={{ margin: 0, color: T.ink, fontWeight: 600, fontSize: 15 }}>
              {grupo.colaborador_nome}
            </p>
            <p style={{ margin: 0, color: T.muted, fontSize: 12 }}>
              {grupo.colaborador_matricula} · {grupo.cargo}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: `${T.amber}20`, color: T.amber, fontSize: 12, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20, border: `1px solid ${T.amber}40` }}>
            {total} {total === 1 ? "item" : "itens"}
          </span>
          {aberto ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
        </div>
      </button>

      {/* Lista de itens */}
      {aberto && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {grupo.itens.map(item => (
            <div key={item.comodato_id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 18px", borderBottom: `1px solid ${T.border}`,
                background: T.bg }}>
              <div>
                <p style={{ margin: 0, color: T.ink, fontWeight: 500, fontSize: 14 }}>
                  {item.material_nome}
                </p>
                <p style={{ margin: 0, color: T.muted, fontSize: 12 }}>
                  {item.material_codigo} · Qtd: {item.quantidade} · Retirado em:{" "}
                  {new Date(item.retirado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {(papel === "ALMOXARIFE" || papel === "ADM_COMPRAS") && (
                <Btn kind="outline" size="sm" onClick={() => onDevolver(item, grupo.colaborador_nome)}>
                  <ArrowLeftRight size={12} /> Devolver
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────
export function Comodatos({ notify, usuario }) {
  const [reload, setReload] = useState(0);
  const [devModal, setDevModal] = useState(null); // { item, colNome }

  const { data: grupos, loading, err, reload: rld } = useAsync(
    () => api.operacoes.comodatosPorColaborador(),
    [reload]
  );

  const papel = usuario?.papel;

  if (loading) return <Loader text="Carregando comodatos" />;
  if (err)     return <ErrBox err={err} onRetry={rld} />;

  const lista = grupos || [];

  return (
    <>
      <Panel
        title="Comodatos em aberto"
        sub={`${lista.reduce((s, g) => s + g.itens.length, 0)} ferramentas em uso · ${lista.length} colaboradores`}
        right={
          <Btn kind="outline" size="sm" onClick={rld}>
            <RefreshCw size={13} /> Atualizar
          </Btn>
        }
      >
        {lista.length === 0 ? (
          <Empty icon={Handshake} title="Nenhum comodato aberto" sub="Todas as ferramentas foram devolvidas." />
        ) : (
          <div style={{ marginTop: 4 }}>
            {lista.map(grupo => (
              <CardColaborador
                key={grupo.colaborador_id}
                grupo={grupo}
                papel={papel}
                onDevolver={(item, colNome) => setDevModal({ item, colNome })}
              />
            ))}
          </div>
        )}
      </Panel>

      {devModal && (
        <ModalDevolucao
          comodato={devModal.item}
          colaboradorNome={devModal.colNome}
          notify={notify}
          onClose={() => setDevModal(null)}
          onDone={() => {
            setDevModal(null);
            setReload(r => r + 1);
            notify("Devolução registrada com sucesso.");
          }}
        />
      )}
    </>
  );
}
