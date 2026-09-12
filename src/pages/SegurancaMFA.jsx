import { useState } from "react";
import { Shield, ShieldOff, Copy, CheckCircle2, KeyRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api";
import { T } from "../styles/tokens";
import { Panel } from "../components/Panel";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { Spin } from "../components/Loader";

export function SegurancaMFA({ usuario, notify }) {
  const [ativo,    setAtivo]    = useState(Boolean(usuario.mfa_ativo));
  const [fase,     setFase]     = useState("idle"); // idle | qr | backup | desativar
  const [uri,      setUri]      = useState(null);
  const [secret,   setSecret]   = useState(null);
  const [codigo,   setCodigo]   = useState("");
  const [backup,   setBackup]   = useState([]);
  const [senha,    setSenha]    = useState("");
  const [copiado,  setCopiado]  = useState(false);
  const [busy,     setBusy]     = useState(false);

  const iniciarSetup = async () => {
    setBusy(true);
    try {
      const r = await api.auth.setupMfa();
      setUri(r.uri); setSecret(r.secret); setCodigo(""); setFase("qr");
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  const confirmar = async () => {
    if (codigo.length < 6) return notify("Digite o código de 6 dígitos.", true);
    setBusy(true);
    try {
      const r = await api.auth.ativarMfa(codigo);
      setBackup(r.backup_codes || []);
      setAtivo(true); setFase("backup");
      notify("MFA ativado com sucesso!");
    } catch { notify("Código inválido.", true); }
    finally { setBusy(false); }
  };

  const desativar = async () => {
    if (!senha) return notify("Informe sua senha.", true);
    setBusy(true);
    try {
      await api.auth.desativarMfa(senha);
      setAtivo(false); setFase("idle"); setSenha("");
      notify("MFA desativado.");
    } catch (e) { notify(e.message || "Senha inválida.", true); }
    finally { setBusy(false); }
  };

  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
    catch { notify("Erro ao copiar.", true); }
  };

  return (
    <Panel title="Segurança da conta" sub="Autenticação de dois fatores (opcional)">
      <div style={{ display:"grid", gap:20, maxWidth:480 }}>

        {/* Status */}
        <div style={{ padding:"16px 20px", background:T.bg2, borderRadius:10, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <div style={{ fontWeight:600, marginBottom:4 }}>Autenticação em dois fatores</div>
            <div style={{ fontSize:13, color:T.sub }}>
              {ativo ? "Ativa — pedimos um código ao entrar." : "Inativa — o uso é opcional; ative se quiser mais segurança."}
            </div>
          </div>
          <div style={{ padding:10, borderRadius:10, background: ativo ? `${T.green}18` : `${T.muted}18`,
            color: ativo ? T.green : T.muted }}>
            {ativo ? <Shield size={20} /> : <ShieldOff size={20} />}
          </div>
        </div>

        {/* Ativar */}
        {!ativo && fase === "idle" && (
          <Btn kind="primary" onClick={iniciarSetup} disabled={busy}>
            {busy ? <Spin /> : <Shield size={15} />} Ativar MFA
          </Btn>
        )}

        {fase === "qr" && uri && (
          <div style={{ display:"grid", gap:16 }}>
            <div style={{ fontSize:14, color:T.sub, lineHeight:1.6 }}>
              Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc.).
            </div>
            <div style={{ display:"flex", justifyContent:"center", padding:20, background:"#fff", borderRadius:12 }}>
              <QRCodeSVG value={uri} size={200} level="M" />
            </div>
            <div>
              <div style={{ fontSize:12, color:T.sub, marginBottom:6 }}>Ou insira a chave manualmente:</div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <code style={{ flex:1, padding:"8px 12px", background:T.bg, borderRadius:7, border:`1px solid ${T.border}`,
                  fontSize:13, fontFamily:"JetBrains Mono,monospace", letterSpacing:2, color:T.cyan, overflowWrap:"anywhere" }}>{secret}</code>
                <Btn kind="outline" size="sm" onClick={() => copiar(secret)}>
                  {copiado ? <CheckCircle2 size={14} style={{ color:T.green }} /> : <Copy size={14} />}
                </Btn>
              </div>
            </div>
            <Field label="Código de verificação (6 dígitos)">
              <input className="inp mono" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="000000" maxLength={6} inputMode="numeric" style={{ letterSpacing:6, fontSize:20, textAlign:"center" }} />
            </Field>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn kind="ghost" onClick={() => setFase("idle")}>Cancelar</Btn>
              <Btn kind="primary" onClick={confirmar} disabled={busy || codigo.length < 6}>
                {busy ? <Spin /> : <CheckCircle2 size={15} />} Confirmar e ativar
              </Btn>
            </div>
          </div>
        )}

        {/* Backup codes (uma única vez) */}
        {fase === "backup" && (
          <div style={{ display:"grid", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, color:T.green, fontWeight:600 }}>
              <CheckCircle2 size={18} /> MFA ativado
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"12px 14px",
              background:`${T.amber}0c`, border:`1px solid ${T.amber}33`, borderRadius:10, fontSize:13, color:T.sub }}>
              <KeyRound size={16} color={T.amber} style={{ flexShrink:0, marginTop:2 }} />
              Guarde os códigos de recuperação abaixo em local seguro. Eles aparecem <b>só agora</b> e cada um serve uma vez, caso você perca o autenticador.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {backup.map(c => (
                <code key={c} style={{ padding:"8px 12px", background:T.bg, borderRadius:7, border:`1px solid ${T.border}`,
                  fontSize:14, fontFamily:"JetBrains Mono,monospace", textAlign:"center", color:T.ink }}>{c}</code>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn kind="outline" onClick={() => copiar(backup.join("\n"))}>
                {copiado ? <CheckCircle2 size={14} style={{ color:T.green }} /> : <Copy size={14} />} Copiar códigos
              </Btn>
              <Btn kind="primary" onClick={() => setFase("idle")}>Guardei os códigos</Btn>
            </div>
          </div>
        )}

        {/* Desativar */}
        {ativo && fase === "idle" && (
          <Btn kind="outline" onClick={() => setFase("desativar")}>
            <ShieldOff size={15} /> Desativar MFA
          </Btn>
        )}

        {fase === "desativar" && (
          <div style={{ display:"grid", gap:12 }}>
            <Field label="Confirme sua senha para desativar">
              <input className="inp" type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha atual" />
            </Field>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn kind="ghost" onClick={() => { setFase("idle"); setSenha(""); }}>Cancelar</Btn>
              <Btn kind="danger" onClick={desativar} disabled={busy || !senha}>
                {busy ? <Spin /> : <ShieldOff size={15} />} Desativar
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
