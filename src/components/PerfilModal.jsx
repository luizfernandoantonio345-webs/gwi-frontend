import { useState, useRef } from "react";
import { Camera, Trash2, Check } from "lucide-react";
import { T } from "../styles/tokens";
import { PAPEL } from "../constants";
import { Modal } from "./Modal";
import { Btn } from "./Btn";
import { Field } from "./Field";
import { Avatar } from "./Avatar";
import { processarFoto } from "../utils/perfil";

export function PerfilModal({ user, perfil, onClose, onSalvar, notify }) {
  const [nome, setNome] = useState((perfil?.nome && perfil.nome.trim()) || user?.nome || "");
  const [foto, setFoto] = useState(perfil?.foto || null);
  const [processando, setProcessando] = useState(false);
  const inputRef = useRef(null);

  const escolherFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessando(true);
    try { setFoto(await processarFoto(file)); }
    catch (err) { notify?.(err.message, true); }
    finally { setProcessando(false); }
  };

  const salvar = () => {
    const limpo = nome.trim();
    if (!limpo) { notify?.("Informe um nome.", true); return; }
    onSalvar({ nome: limpo, foto: foto || null });
  };

  return (
    <Modal title="Meu perfil" onClose={onClose}>
      <div style={{ display: "grid", gap: 20 }}>

        {/* Foto */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar nome={nome} foto={foto} size={72} ativo />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={inputRef} type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
            <Btn kind="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={processando}>
              <Camera size={14} /> {processando ? "Processando…" : foto ? "Trocar foto" : "Adicionar foto"}
            </Btn>
            {foto && (
              <Btn kind="ghost" size="sm" onClick={() => setFoto(null)}>
                <Trash2 size={14} /> Remover foto
              </Btn>
            )}
          </div>
        </div>

        {/* Nome */}
        <Field label="Nome de exibição">
          <input className="inp" value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Como seu nome aparece no sistema" maxLength={80} autoFocus />
        </Field>

        {/* Só leitura */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="lbl">E-mail</div>
            <div style={{ fontSize: 13.5, color: T.sub, overflowWrap: "anywhere" }}>{user?.email}</div>
          </div>
          <div>
            <div className="lbl">Perfil de acesso</div>
            <div style={{ fontSize: 13.5, color: T.sub }}>{PAPEL[user?.papel] || user?.papel}</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
          Nome e foto ficam salvos neste dispositivo para personalizar sua experiência.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={salvar}><Check size={15} /> Salvar</Btn>
        </div>
      </div>
    </Modal>
  );
}
