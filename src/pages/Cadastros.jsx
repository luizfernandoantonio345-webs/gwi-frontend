import { useState, useRef } from "react";
import { Users, Tag, Plus, RefreshCw, QrCode, Printer, Upload, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import { MobileCard } from "../components/MobileCard";
import { ImportarPlanilhaModal } from "../components/ImportarPlanilhaModal";
import { brl } from "../utils/format";

function ModalNovaClasse({ onClose, onDone }) {
  const [form, setForm] = useState({ nome:"", descricao:"" });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.nome.trim()) return;
    setBusy(true);
    try { await api.catalogo.criarClasse({ nome: form.nome, descricao: form.descricao || null }); onDone("Classe criada."); }
    catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Nova classe de material" onClose={onClose}>
      <div style={{ display:"grid", gap:14 }}>
        <Field label="Nome"><input className="inp" value={form.nome} onChange={set("nome")} placeholder="Ex: Elétrico, Hidráulico…" /></Field>
        <Field label="Descrição (opcional)"><input className="inp" value={form.descricao} onChange={set("descricao")} /></Field>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={salvar} disabled={busy || !form.nome.trim()}>{busy ? <Spin /> : "Criar classe"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalNovoMaterial({ classes, onClose, onDone }) {
  const [form, setForm] = useState({
    nome:"", codigo:"", tipo:"CONSUMIVEL", unidade:"UN",
    estoque_minimo:0, custo_medio:0, classe_id:"", descricao:"",
  });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.nome.trim() || !form.codigo.trim()) return;
    setBusy(true);
    try {
      await api.catalogo.criarMaterial({
        ...form,
        estoque_minimo: Number(form.estoque_minimo),
        custo_medio:    Number(form.custo_medio),
        classe_id:      form.classe_id ? Number(form.classe_id) : null,
      });
      onDone("Material cadastrado.");
    } catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Novo material" onClose={onClose} wide>
      <div style={{ display:"grid", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Nome"><input className="inp" value={form.nome} onChange={set("nome")} /></Field>
          <Field label="Código"><input className="inp mono" value={form.codigo} onChange={set("codigo")} placeholder="MAT-001" /></Field>
          <Field label="Tipo">
            <select className="inp" value={form.tipo} onChange={set("tipo")}>
              <option value="CONSUMIVEL">Consumível</option>
              <option value="PERMANENTE">Permanente</option>
              <option value="FERRAMENTA">Ferramenta</option>
            </select>
          </Field>
          <Field label="Unidade"><input className="inp" value={form.unidade} onChange={set("unidade")} placeholder="UN, m, kg…" /></Field>
          <Field label="Estoque mínimo"><input className="inp mono" type="number" min={0} value={form.estoque_minimo} onChange={set("estoque_minimo")} /></Field>
          <Field label="Custo médio (R$)"><input className="inp mono" type="number" min={0} step="0.01" value={form.custo_medio} onChange={set("custo_medio")} /></Field>
        </div>
        <Field label="Classe (opcional)">
          <select className="inp" value={form.classe_id} onChange={set("classe_id")}>
            <option value="">Nenhuma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Descrição (opcional)"><input className="inp" value={form.descricao} onChange={set("descricao")} /></Field>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={salvar} disabled={busy || !form.nome.trim() || !form.codigo.trim()}>
            {busy ? <Spin /> : "Cadastrar material"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalNovoColaborador({ onClose, onDone }) {
  const [form, setForm] = useState({ matricula:"", nome:"", cargo:"", centro_custo:"" });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.matricula.trim() || !form.nome.trim()) return;
    setBusy(true);
    try {
      await api.catalogo.criarColaborador({
        matricula: form.matricula.trim(),
        nome: form.nome.trim(),
        cargo: form.cargo.trim() || null,
        centro_custo: form.centro_custo.trim() || null,
      });
      onDone("Colaborador criado.");
    } catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Novo colaborador" onClose={onClose}>
      <div style={{ display:"grid", gap:14 }}>
        <Field label="Matrícula"><input className="inp mono" value={form.matricula} onChange={set("matricula")} placeholder="Ex: 00123" /></Field>
        <Field label="Nome completo"><input className="inp" value={form.nome} onChange={set("nome")} /></Field>
        <Field label="Cargo"><input className="inp" value={form.cargo} onChange={set("cargo")} placeholder="Ex: Eletricista" /></Field>
        <Field label="Centro de custo"><input className="inp" value={form.centro_custo} onChange={set("centro_custo")} placeholder="Ex: OBRA-01" /></Field>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={salvar} disabled={busy || !form.matricula.trim() || !form.nome.trim()}>
            {busy ? <Spin /> : "Criar colaborador"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalQrCode({ item, tipo, onClose }) {
  const printRef = useRef(null);

  const imprimir = () => {
    const conteudo = printRef.current?.innerHTML;
    if (!conteudo) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>QR - ${item.label}</title>
      <style>
        body { margin:0; display:flex; flex-direction:column; align-items:center;
          justify-content:center; height:100vh; font-family:sans-serif; background:#fff; }
        .qr-wrap { text-align:center; padding:20px; border:2px solid #ccc; border-radius:12px; }
        .qr-wrap p { margin:8px 0 0; font-size:13px; color:#333; }
        .qr-wrap .cod { font-size:11px; color:#888; font-family:monospace; }
      </style></head><body>${conteudo}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Modal title={`QR Code — ${item.label}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div ref={printRef} className="qr-wrap"
          style={{ padding: 24, background: "#fff", borderRadius: 12, border: `1px solid ${T.border}` }}>
          <QRCodeSVG value={item.codigo} size={200} level="H" includeMargin />
          <p style={{ margin: "10px 0 4px", color: "#111", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
            {item.label}
          </p>
          <p style={{ margin: 0, color: "#666", fontSize: 12, fontFamily: "monospace", textAlign: "center" }}>
            {item.codigo}
          </p>
          {tipo && <p style={{ margin: "4px 0 0", color: "#888", fontSize: 11, textAlign: "center" }}>{tipo}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn kind="primary" onClick={imprimir}><Printer size={14} /> Imprimir</Btn>
          <Btn kind="outline" onClick={onClose}>Fechar</Btn>
        </div>
      </div>
    </Modal>
  );
}

export function Cadastros({ notify, usuario }) {
  const [aba,      setAba]      = useState("materiais");
  const [modal,    setModal]    = useState(null);
  const [qrModal,  setQrModal]  = useState(null); // { label, codigo, tipo }
  const [importar, setImportar] = useState(null); // "materiais" | "colaboradores"
  const [remover,  setRemover]  = useState(null); // { tipo, id, label }
  const [removendo, setRemovendo] = useState(false);
  const [reload,   setReload]   = useState(0);
  const isMobile = useIsMobile();
  const ehAdm = usuario?.papel === "ADM_COMPRAS";
  const podeImportarColab = ehAdm || usuario?.papel === "ALMOXARIFE";

  const confirmarRemocao = async () => {
    setRemovendo(true);
    try {
      if (remover.tipo === "material") await api.catalogo.removerMaterial(remover.id);
      else await api.catalogo.removerColaborador(remover.id);
      notify(`"${remover.label}" removido.`);
      setRemover(null);
      setReload(r => r + 1);
    } catch (e) { notify(e.message, true); }
    finally { setRemovendo(false); }
  };

  const { data: mats,    loading: lm, err: em, reload: rlm } = useAsync(() => api.catalogo.listarMateriais(), [reload]);
  const { data: classes, loading: lc, err: ec, reload: rlc } = useAsync(() => api.catalogo.listarClasses(),   [reload]);
  const { data: users,   loading: lu, err: eu, reload: rlu } = useAsync(() => api.catalogo.listarColaboradores(), [reload]);

  const recarrega = msg => { notify(msg); setModal(null); setReload(r => r + 1); };

  const abas = [
    { k:"materiais", label:"Materiais", count: (mats || []).length   },
    { k:"classes",   label:"Classes",   count: (classes || []).length },
    { k:"usuarios",  label:"Colaboradores",  count: (users || []).length  },
  ];

  return (
    <>
      <div style={{ display:"grid", gap:16 }}>
        <div style={{ display:"flex", gap:4, padding:"4px", background:T.bg2, borderRadius:10, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {abas.map(a => (
            <button key={a.k} onClick={() => setAba(a.k)} style={{
              padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
              background: aba === a.k ? T.panel : "transparent",
              color:      aba === a.k ? T.ink   : T.sub,
              boxShadow:  aba === a.k ? `0 1px 4px rgba(0,0,0,.3)` : "none",
              transition: "all .15s",
            }}>{a.label} <span style={{ opacity:.6 }}>({a.count})</span></button>
          ))}
        </div>

        {aba === "materiais" && (
          <Panel title="Catálogo de materiais" noPad
            right={
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <Btn kind="outline" size="sm" onClick={rlm}><RefreshCw size={13} /></Btn>
                {ehAdm && <Btn kind="outline" size="sm" onClick={() => setImportar("materiais")}><Upload size={13} /> Importar</Btn>}
                <Btn kind="primary" size="sm" onClick={() => setModal("material")}><Plus size={13} /> Novo material</Btn>
              </div>
            }>
            {lm ? <Loader text="Carregando" /> : em ? <ErrBox err={em} onRetry={rlm} /> : (mats || []).length === 0
              ? <Empty icon={Tag} title="Nenhum material" sub="Cadastre o primeiro material." />
              : isMobile ? (
                <div style={{ display:"grid", gap:10, padding:16 }}>
                  {(mats || []).map(m => (
                    <MobileCard key={m.id}
                      title={m.nome}
                      subtitle={<span className="mono">{m.codigo}</span>}
                      fields={[
                        { label:"Tipo", value:m.tipo },
                        { label:"Unidade", value:m.unidade },
                        { label:"Custo médio", value:<span className="mono" style={{ color:T.cyan }}>{brl(m.custo_medio)}</span> },
                        { label:"Estoque mín.", value:<span className="mono">{m.estoque_minimo}</span> },
                      ]}
                      actions={<>
                        {m.tipo === "FERRAMENTA" && (
                          <Btn kind="outline" size="sm" style={{ flex:1 }}
                            onClick={() => setQrModal({ label: m.nome, codigo: m.codigo, tipo: m.tipo })}>
                            <QrCode size={12} /> QR
                          </Btn>
                        )}
                        {ehAdm && (
                          <Btn kind="danger" size="sm" style={{ flex:1 }}
                            onClick={() => setRemover({ tipo:"material", id:m.id, label:m.nome })}>
                            <Trash2 size={12} /> Remover
                          </Btn>
                        )}
                      </>}
                    />
                  ))}
                </div>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Código</th><th>Nome</th><th>Tipo</th><th>Unidade</th><th>Custo médio</th><th>Estoque mín.</th><th></th></tr></thead>
                  <tbody>{(mats || []).map(m => (
                    <tr key={m.id}>
                      <td className="mono" style={{ color:T.sub }}>{m.codigo}</td>
                      <td style={{ fontWeight:500 }}>{m.nome}</td>
                      <td style={{ color:T.sub, fontSize:13 }}>{m.tipo}</td>
                      <td style={{ color:T.muted, fontSize:13 }}>{m.unidade}</td>
                      <td className="mono" style={{ color:T.cyan }}>{brl(m.custo_medio)}</td>
                      <td className="mono" style={{ color:T.sub }}>{m.estoque_minimo}</td>
                      <td style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                        {m.tipo === "FERRAMENTA" && (
                          <Btn kind="outline" size="sm"
                            onClick={() => setQrModal({ label: m.nome, codigo: m.codigo, tipo: m.tipo })}>
                            <QrCode size={12} /> QR
                          </Btn>
                        )}
                        {ehAdm && (
                          <Btn kind="danger" size="sm" style={{ marginLeft:8 }}
                            onClick={() => setRemover({ tipo:"material", id:m.id, label:m.nome })}>
                            <Trash2 size={12} /> Remover
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
          </Panel>
        )}

        {aba === "classes" && (
          <Panel title="Classes de material" noPad
            right={
              <div style={{ display:"flex", gap:8 }}>
                <Btn kind="outline" size="sm" onClick={rlc}><RefreshCw size={13} /></Btn>
                <Btn kind="primary" size="sm" onClick={() => setModal("classe")}><Plus size={13} /> Nova classe</Btn>
              </div>
            }>
            {lc ? <Loader text="Carregando" /> : ec ? <ErrBox err={ec} onRetry={rlc} /> : (classes || []).length === 0
              ? <Empty icon={Tag} title="Nenhuma classe" sub="Organize materiais por categoria." />
              : isMobile ? (
                <div style={{ display:"grid", gap:10, padding:16 }}>
                  {(classes || []).map(c => (
                    <MobileCard key={c.id} title={c.nome}
                      fields={[{ label:"Descrição", value:c.descricao }]} />
                  ))}
                </div>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Descrição</th></tr></thead>
                  <tbody>{(classes || []).map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight:500 }}>{c.nome}</td>
                      <td style={{ color:T.sub, fontSize:13 }}>{c.descricao || "—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
          </Panel>
        )}

        {aba === "usuarios" && (
          <Panel title="Colaboradores" noPad
            right={
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <Btn kind="outline" size="sm" onClick={rlu}><RefreshCw size={13} /></Btn>
                {podeImportarColab && <Btn kind="outline" size="sm" onClick={() => setImportar("colaboradores")}><Upload size={13} /> Importar</Btn>}
                <Btn kind="primary" size="sm" onClick={() => setModal("usuario")}><Users size={13} /> Novo colaborador</Btn>
              </div>
            }>
            {lu ? <Loader text="Carregando" /> : eu ? <ErrBox err={eu} onRetry={rlu} /> : (users || []).length === 0
              ? <Empty icon={Users} title="Nenhum colaborador" sub="Adicione colaboradores ao sistema." />
              : isMobile ? (
                <div style={{ display:"grid", gap:10, padding:16 }}>
                  {(users || []).map(u => (
                    <MobileCard key={u.id}
                      title={u.nome}
                      subtitle={<span className="mono">Mat. {u.matricula}</span>}
                      fields={[
                        { label:"Cargo", value:u.cargo },
                        { label:"Centro de custo", value:u.centro_custo },
                      ]}
                      actions={<>
                        {u.matricula && (
                          <Btn kind="outline" size="sm" style={{ flex:1 }}
                            onClick={() => setQrModal({ label: u.nome, codigo: u.matricula, tipo: "Crachá" })}>
                            <QrCode size={12} /> Crachá
                          </Btn>
                        )}
                        {podeImportarColab && (
                          <Btn kind="danger" size="sm" style={{ flex:1 }}
                            onClick={() => setRemover({ tipo:"colaborador", id:u.id, label:u.nome })}>
                            <Trash2 size={12} /> Remover
                          </Btn>
                        )}
                      </>}
                    />
                  ))}
                </div>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Matrícula</th><th>Nome</th><th>Cargo</th><th>Centro de custo</th><th></th></tr></thead>
                  <tbody>{(users || []).map(u => (
                    <tr key={u.id}>
                      <td className="mono" style={{ color:T.sub }}>{u.matricula}</td>
                      <td style={{ fontWeight:500 }}>{u.nome}</td>
                      <td style={{ color:T.sub, fontSize:13 }}>{u.cargo || "—"}</td>
                      <td style={{ color:T.muted, fontSize:13 }}>{u.centro_custo || "—"}</td>
                      <td style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                        {u.matricula && (
                          <Btn kind="outline" size="sm"
                            onClick={() => setQrModal({ label: u.nome, codigo: u.matricula, tipo: "Crachá" })}>
                            <QrCode size={12} /> Crachá
                          </Btn>
                        )}
                        {podeImportarColab && (
                          <Btn kind="danger" size="sm" style={{ marginLeft:8 }}
                            onClick={() => setRemover({ tipo:"colaborador", id:u.id, label:u.nome })}>
                            <Trash2 size={12} /> Remover
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
          </Panel>
        )}
      </div>

      {modal === "classe"   && <ModalNovaClasse      onClose={() => setModal(null)} onDone={recarrega} />}
      {modal === "material" && <ModalNovoMaterial classes={classes || []} onClose={() => setModal(null)} onDone={recarrega} />}
      {modal === "usuario"  && <ModalNovoColaborador onClose={() => setModal(null)} onDone={recarrega} />}
      {qrModal              && <ModalQrCode item={qrModal} tipo={qrModal.tipo} onClose={() => setQrModal(null)} />}

      {importar === "materiais" && (
        <ImportarPlanilhaModal
          titulo="Importar materiais"
          api={{ preview: api.catalogo.importarMatPreview, confirmar: api.catalogo.importarMatConfirmar, modelo: api.catalogo.modeloMateriais }}
          notify={notify}
          onClose={() => setImportar(null)}
          onDone={msg => { notify(msg); setReload(r => r + 1); }}
        />
      )}
      {importar === "colaboradores" && (
        <ImportarPlanilhaModal
          titulo="Importar colaboradores"
          api={{ preview: api.catalogo.importarColabPreview, confirmar: api.catalogo.importarColabConfirmar, modelo: api.catalogo.modeloColaboradores }}
          notify={notify}
          onClose={() => setImportar(null)}
          onDone={msg => { notify(msg); setReload(r => r + 1); }}
        />
      )}

      {remover && (
        <Modal title="Remover cadastro" onClose={() => setRemover(null)}>
          <div style={{ display:"grid", gap:16 }}>
            <p style={{ fontSize:14, color:T.sub, lineHeight:1.6 }}>
              Deseja remover <b style={{ color:T.ink }}>{remover.label}</b>? Ele deixará de aparecer nas listagens.
              O histórico já registrado é preservado.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn kind="ghost" onClick={() => setRemover(null)}>Cancelar</Btn>
              <Btn kind="danger" onClick={confirmarRemocao} disabled={removendo}>
                {removendo ? <Spin /> : <Trash2 size={14} />} Remover
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
