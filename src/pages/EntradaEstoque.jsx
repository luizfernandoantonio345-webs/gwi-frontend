import { useState } from "react";
import { PackagePlus } from "lucide-react";
import api from "../api";
import { useAsync } from "../hooks/useAsync";
import { Panel } from "../components/Panel";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { Spin } from "../components/Loader";
import { T } from "../styles/tokens";

export function EntradaEstoque({ notify }) {
  const { data: mats } = useAsync(() => api.catalogo.listarMateriais(), []);
  const [form, setForm] = useState({ material_id:"", quantidade:1, custo_unitario:"", nota_fiscal:"", observacao:"" });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const registrar = async () => {
    if (!form.material_id || Number(form.quantidade) <= 0) return notify("Selecione o material e a quantidade.", true);
    setBusy(true);
    try {
      await api.operacoes.entradaEstoque({
        material_id:   Number(form.material_id),
        quantidade:    Number(form.quantidade),
        custo_unitario: form.custo_unitario ? Number(form.custo_unitario) : undefined,
        nota_fiscal:   form.nota_fiscal   || null,
        observacao:    form.observacao    || null,
      });
      notify("Entrada registrada no estoque.");
      setForm({ material_id:"", quantidade:1, custo_unitario:"", nota_fiscal:"", observacao:"" });
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  return (
    <Panel title="Entrada de estoque" sub="Registre recebimento de materiais">
      <div style={{ display:"grid", gap:16, maxWidth:520 }}>
        <Field label="Material">
          <select className="inp" value={form.material_id} onChange={set("material_id")}>
            <option value="">Selecione o material…</option>
            {(mats || []).map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}
          </select>
        </Field>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Quantidade">
            <input className="inp mono" type="number" min={1} value={form.quantidade} onChange={set("quantidade")} />
          </Field>
          <Field label="Custo unitário (opcional)">
            <input className="inp mono" type="number" min={0} step="0.01" placeholder="R$ 0,00" value={form.custo_unitario} onChange={set("custo_unitario")} />
          </Field>
        </div>

        <Field label="Nota fiscal (opcional)">
          <input className="inp" value={form.nota_fiscal} onChange={set("nota_fiscal")} placeholder="NF-e 12345" />
        </Field>
        <Field label="Observação (opcional)">
          <input className="inp" value={form.observacao} onChange={set("observacao")} placeholder="Ex: fornecedor X — entrega parcial" />
        </Field>

        <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:4, borderTop:`1px solid ${T.borderS}` }}>
          <Btn kind="primary" onClick={registrar} disabled={busy || !form.material_id}>
            {busy ? <Spin /> : <PackagePlus size={15} />} Registrar entrada
          </Btn>
        </div>
      </div>
    </Panel>
  );
}
