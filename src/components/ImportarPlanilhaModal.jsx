import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { T } from "../styles/tokens";
import { Modal } from "./Modal";
import { Btn } from "./Btn";
import { Spin } from "./Loader";

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function base64ParaBlob(b64, tipo) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CORES = { criar: T.cyan, atualizar: T.blue, erro: T.red };
const ROTULOS = { criar: "Criar", atualizar: "Atualizar", erro: "Erro" };

export function ImportarPlanilhaModal({ titulo, api, onClose, onDone, notify }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [ignorar, setIgnorar] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const escolher = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setArquivo(f); setPreview(null); setResultado(null); setIgnorar(false);
    setBusy(true);
    try { setPreview(await api.preview(f)); }
    catch (err) { notify(err.message, true); setArquivo(null); }
    finally { setBusy(false); }
  };

  const confirmar = async () => {
    setBusy(true);
    try {
      const r = await api.confirmar(arquivo, ignorar);
      setResultado(r);
      onDone(`Importação concluída: ${r.criados} criado(s), ${r.atualizados} atualizado(s).`);
    } catch (err) { notify(err.message, true); }
    finally { setBusy(false); }
  };

  const baixarModelo = async () => {
    try { baixarBlob(await api.modelo(), "modelo.xlsx"); }
    catch (err) { notify(err.message, true); }
  };

  const baixarRelatorio = () => {
    baixarBlob(base64ParaBlob(resultado.relatorio_xlsx_base64, XLSX), "relatorio_importacao.xlsx");
  };

  const temErro = preview && preview.erros > 0;

  return (
    <Modal title={titulo} onClose={onClose} wide>
      {/* Etapa 3: resultado */}
      {resultado ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle2 size={28} color={T.cyan} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Importação concluída</div>
              <div style={{ fontSize: 13, color: T.sub }}>
                {resultado.criados} criado(s) · {resultado.atualizados} atualizado(s) · {resultado.rejeitados} rejeitado(s)
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn kind="outline" onClick={baixarRelatorio}><Download size={14} /> Baixar relatório</Btn>
            <Btn kind="primary" onClick={onClose}>Concluir</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Passo 1: escolher arquivo */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <Btn kind="outline" size="sm" onClick={baixarModelo}><Download size={14} /> Baixar modelo</Btn>
            <div style={{ fontSize: 12, color: T.muted }}>Aceita .xlsx e .csv</div>
          </div>

          <input ref={inputRef} type="file" accept=".xlsx,.csv" onChange={escolher} style={{ display: "none" }} />
          <button onClick={() => inputRef.current?.click()} disabled={busy}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 20px",
              border: `1.5px dashed ${T.border}`, borderRadius: 12, background: T.bg2, cursor: "pointer", color: T.sub }}>
            {busy && !preview ? <Spin /> : <Upload size={26} color={T.cyan} />}
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
              {arquivo ? arquivo.name : "Selecionar planilha"}
            </div>
            <div style={{ fontSize: 12 }}>Clique para escolher o arquivo</div>
          </button>

          {/* Passo 2: pré-visualização */}
          {preview && (
            <>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
                <span style={{ color: T.sub }}>Total: <b style={{ color: T.ink }}>{preview.total}</b></span>
                <span style={{ color: T.cyan }}>Criar: <b>{preview.criar}</b></span>
                <span style={{ color: T.blue }}>Atualizar: <b>{preview.atualizar}</b></span>
                <span style={{ color: T.red }}>Erros: <b>{preview.erros}</b></span>
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <table className="tbl">
                  <thead><tr><th>Linha</th><th>Ação</th><th>Dados</th><th>Erro</th></tr></thead>
                  <tbody>
                    {preview.linhas.map((l, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: T.sub }}>{l.linha}</td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: CORES[l.acao],
                            background: `${CORES[l.acao]}18`, border: `1px solid ${CORES[l.acao]}35`,
                            borderRadius: 20, padding: "2px 8px" }}>{ROTULOS[l.acao]}</span>
                        </td>
                        <td style={{ fontSize: 12.5, color: T.sub }}>
                          {Object.entries(l.dados).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </td>
                        <td style={{ fontSize: 12.5, color: T.red }}>{l.erro || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {temErro && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.sub, cursor: "pointer" }}>
                  <input type="checkbox" checked={ignorar} onChange={e => setIgnorar(e.target.checked)}
                    style={{ accentColor: T.cyan, width: 16, height: 16 }} />
                  <AlertTriangle size={14} color={T.amber} />
                  Ignorar as {preview.erros} linha(s) com erro e importar o restante
                </label>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
                <Btn kind="primary" onClick={confirmar}
                  disabled={busy || (preview.criar + preview.atualizar === 0) || (temErro && !ignorar)}>
                  {busy ? <Spin /> : <ArrowRight size={15} />} Confirmar importação
                </Btn>
              </div>
              {temErro && !ignorar && (
                <div style={{ fontSize: 12, color: T.muted, textAlign: "right" }}>
                  Corrija a planilha ou marque "ignorar linhas com erro" para prosseguir.
                </div>
              )}
            </>
          )}

          {!preview && !busy && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.muted }}>
              <FileSpreadsheet size={14} /> Baixe o modelo, preencha e envie. Nada é gravado antes da sua confirmação.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
