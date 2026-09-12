import { useState } from "react";
import { Users, Plus, RefreshCw, Pencil } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { PAPEL } from "../constants";
import { useAsync } from "../hooks/useAsync";
import { useIsMobile } from "../hooks/useIsMobile";
import { Loader, ErrBox, Spin } from "../components/Loader";
import { Panel } from "../components/Panel";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { MobileCard } from "../components/MobileCard";

function PapelChip({ papel }) {
  return (
    <span style={{ fontSize:12, padding:"2px 8px", borderRadius:4,
      background:`${T.sub}18`, color:T.sub, border:`1px solid ${T.sub}33` }}>
      {PAPEL[papel] || papel}
    </span>
  );
}
function MiniBadge({ on, texto }) {
  return (
    <span style={{ fontSize:11, padding:"1px 6px", borderRadius:3,
      background: on ? `${T.cyan}15` : `${T.muted}15`, color: on ? T.cyan : T.muted }}>
      {texto}
    </span>
  );
}

const PAPEIS = ["ALMOXARIFE", "ADM_COMPRAS", "GERENTE"];

function ModalUsuario({ alvo, onClose, onDone }) {
  const editando = Boolean(alvo);
  const [form, setForm] = useState({
    nome: alvo?.nome || "",
    email: alvo?.email || "",
    senha: "",
    papel: alvo?.papel || "ALMOXARIFE",
  });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.nome.trim()) return;
    if (!editando && (!form.email.trim() || !form.senha.trim())) return;
    setBusy(true);
    try {
      if (editando) {
        const patch = { nome: form.nome.trim(), papel: form.papel };
        if (form.senha.trim()) patch.senha = form.senha;
        await api.auth.editarUsuario(alvo.id, patch);
        onDone("Usuário atualizado.");
      } else {
        await api.auth.criarUsuario({
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          papel: form.papel,
        });
        onDone("Usuário criado.");
      }
    } catch (e) { onDone(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={editando ? `Editar · ${alvo.nome}` : "Novo usuário"} onClose={onClose}>
      <div style={{ display:"grid", gap:14 }}>
        <Field label="Nome completo"><input className="inp" value={form.nome} onChange={set("nome")} /></Field>
        <Field label="E-mail">
          <input className="inp" type="email" value={form.email} onChange={set("email")}
            disabled={editando} placeholder="usuario@gramo.com" />
        </Field>
        <Field label={editando ? "Nova senha (deixe em branco para manter)" : "Senha inicial"}>
          <input className="inp" type="password" value={form.senha} onChange={set("senha")}
            placeholder="Mín. 12 caracteres, maiúscula, número e símbolo" />
        </Field>
        <Field label="Papel">
          <select className="inp" value={form.papel} onChange={set("papel")}>
            {PAPEIS.map(k => <option key={k} value={k}>{PAPEL[k]}</option>)}
          </select>
        </Field>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={salvar}
            disabled={busy || !form.nome.trim() || (!editando && (!form.email.trim() || !form.senha.trim()))}>
            {busy ? <Spin /> : (editando ? "Salvar alterações" : "Criar usuário")}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function Usuarios({ notify, usuario }) {
  const [modal,  setModal]  = useState(null); // null | "novo" | { ...alvo }
  const [reload, setReload] = useState(0);
  const isMobile = useIsMobile();

  const { data, loading, err, reload: rld } = useAsync(() => api.auth.listarUsuarios(), [reload]);

  const recarrega = msg => { notify(msg); setModal(null); setReload(r => r + 1); };

  const toggleAtivo = async (u) => {
    try {
      await api.auth.editarUsuario(u.id, { ativo: !u.ativo });
      recarrega(u.ativo ? "Usuário desativado." : "Usuário reativado.");
    } catch (e) { notify(e.message, true); }
  };

  if (loading) return <Loader text="Carregando usuários" />;
  if (err)     return <ErrBox err={err} onRetry={rld} />;

  const lista = data || [];

  return (
    <>
      <Panel
        title="Usuários do sistema"
        sub="Crie, edite e ative/desative os acessos"
        right={
          <div style={{ display:"flex", gap:8 }}>
            <Btn kind="outline" size="sm" onClick={rld}><RefreshCw size={13} /></Btn>
            <Btn kind="primary" size="sm" onClick={() => setModal("novo")}><Plus size={13} /> Novo usuário</Btn>
          </div>
        }
        noPad
      >
        {lista.length === 0
          ? <Empty icon={Users} title="Nenhum usuário" sub="Cadastre o primeiro acesso." />
          : isMobile ? (
            <div style={{ display:"grid", gap:10, padding:16 }}>
              {lista.map(u => (
                <div key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
                  <MobileCard
                    title={u.nome}
                    subtitle={u.email}
                    badge={<PapelChip papel={u.papel} />}
                    fields={[
                      { label:"MFA", value:<MiniBadge on={u.mfa_ativo} texto={u.mfa_ativo ? "Ativo" : "Inativo"} /> },
                      { label:"Status", value:<MiniBadge on={u.ativo} texto={u.ativo ? "Ativo" : "Desativado"} /> },
                    ]}
                    actions={<>
                      <Btn kind="outline" size="sm" onClick={() => setModal(u)}><Pencil size={12} /> Editar</Btn>
                      {u.id !== usuario.id && (
                        <Btn kind={u.ativo ? "danger" : "success"} size="sm" onClick={() => toggleAtivo(u)}>
                          {u.ativo ? "Desativar" : "Reativar"}
                        </Btn>
                      )}
                    </>}
                  />
                </div>
              ))}
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>MFA</th><th>Status</th><th></th></tr></thead>
              <tbody>{lista.map(u => (
                <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                  <td style={{ fontWeight:500 }}>{u.nome}</td>
                  <td style={{ color:T.sub, fontSize:13 }}>{u.email}</td>
                  <td>
                    <span style={{ fontSize:12, padding:"2px 8px", borderRadius:4,
                      background:`${T.sub}18`, color:T.sub, border:`1px solid ${T.sub}33` }}>
                      {PAPEL[u.papel] || u.papel}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:11, padding:"1px 6px", borderRadius:3,
                      background: u.mfa_ativo ? `${T.green}15` : `${T.muted}15`,
                      color: u.mfa_ativo ? T.green : T.muted }}>
                      {u.mfa_ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:11, padding:"1px 6px", borderRadius:3,
                      background: u.ativo ? `${T.cyan}15` : `${T.red}15`,
                      color: u.ativo ? T.cyan : T.red }}>
                      {u.ativo ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                    <Btn kind="outline" size="sm" onClick={() => setModal(u)}><Pencil size={12} /> Editar</Btn>
                    {u.id !== usuario.id && (
                      <Btn kind={u.ativo ? "danger" : "success"} size="sm" onClick={() => toggleAtivo(u)}
                        style={{ marginLeft:8 }}>
                        {u.ativo ? "Desativar" : "Reativar"}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
      </Panel>

      {modal === "novo" && <ModalUsuario onClose={() => setModal(null)} onDone={recarrega} />}
      {modal && modal !== "novo" && <ModalUsuario alvo={modal} onClose={() => setModal(null)} onDone={recarrega} />}
    </>
  );
}
