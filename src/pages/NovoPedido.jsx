import { useState } from "react";
import { ClipboardList, Plus, X } from "lucide-react";
import api from "../api";
import { URG } from "../constants";
import { useAsync } from "../hooks/useAsync";
import { Panel } from "../components/Panel";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { Spin } from "../components/Loader";
import { T } from "../styles/tokens";

export function NovoPedido({ onDone, notify }) {
  const { data: mats } = useAsync(() => api.catalogo.listarMateriais(), []);
  const [linhas, setLinhas]               = useState([{ material_id:"", qtd:1 }]);
  const [urgencia, setUrgencia]           = useState("MEDIA");
  const [justificativa, setJustificativa] = useState("");
  const [busy, setBusy]                   = useState(false);

  const setRow = (i, k, v) => setLinhas(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l));

  const enviar = async () => {
    const itens = linhas
      .filter(l => l.material_id && Number(l.qtd) > 0)
      .map(l => ({ material_id: Number(l.material_id), qtd_solicitada: Number(l.qtd) }));
    if (!itens.length) return notify("Adicione ao menos um item.", true);
    setBusy(true);
    try {
      await api.pedidos.criar({ urgencia, justificativa: justificativa || null, itens });
      notify("Pedido enviado ao gerente.");
      onDone();
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  return (
    <Panel title="Novo pedido de material" sub="Encaminhado ao gerente para aprovação">
      <div style={{ display:"grid", gap:16 }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 120px 38px", gap:10, alignItems:"end" }}>
            <Field label={i === 0 ? "Material" : undefined}>
              <select className="inp" value={l.material_id} onChange={e => setRow(i, "material_id", e.target.value)}>
                <option value="">Selecione o material…</option>
                {(mats || []).map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}
              </select>
            </Field>
            <Field label={i === 0 ? "Qtd" : undefined}>
              <input className="inp mono" type="number" min={1} value={l.qtd} onChange={e => setRow(i, "qtd", e.target.value)} />
            </Field>
            <Btn kind="ghost" onClick={() => setLinhas(ls => ls.length > 1 ? ls.filter((_, j) => j !== i) : ls)} style={{ padding:9 }}>
              <X size={15} />
            </Btn>
          </div>
        ))}

        <Btn kind="outline" size="sm" onClick={() => setLinhas(ls => [...ls, { material_id:"", qtd:1 }])} style={{ justifySelf:"start" }}>
          <Plus size={13} /> Adicionar item
        </Btn>

        <div style={{ display:"grid", gridTemplateColumns:"170px 1fr", gap:12, paddingTop:12, borderTop:`1px solid ${T.borderS}` }}>
          <Field label="Urgência">
            <select className="inp" value={urgencia} onChange={e => setUrgencia(e.target.value)}>
              {Object.keys(URG).map(u => <option key={u} value={u}>{URG[u].label}</option>)}
            </select>
          </Field>
          <Field label="Justificativa (opcional)">
            <input className="inp" value={justificativa} onChange={e => setJustificativa(e.target.value)} placeholder="Ex: reposição obra 01" />
          </Field>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" onClick={enviar} disabled={busy}>
            {busy ? <Spin /> : <ClipboardList size={15} />} Enviar pedido
          </Btn>
        </div>
      </div>
    </Panel>
  );
}
