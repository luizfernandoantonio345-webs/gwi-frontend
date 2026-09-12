import { useState, useEffect } from "react";
import { AlertTriangle, Eye, EyeOff, ArrowRight, ShieldCheck,
         Mail, Lock } from "lucide-react";
import api, { acordarServidor, ehErroDeRede, definirLembrar } from "../api";
import { Spin } from "../components/Loader";
import { Logo } from "../components/Logo";
import { useIsMobile } from "../hooks/useIsMobile";

const ERRO_REDE = "Não foi possível conectar ao servidor. Ele pode estar iniciando — aguarde alguns segundos e tente novamente.";

const INPBG  = "#071820";
const BORDER = "rgba(255,255,255,0.08)";
const FOCUS  = "rgba(0,230,168,0.45)";
const ACC    = "#00e6a8";
const INK    = "#eaf3f0";
const SUB    = "#5a6b78";
const MID    = "#8fa3b0";

function InputField({ label, type = "text", value, onChange, onKeyDown,
                      placeholder, autoFocus, icon: Icon }) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label style={{ fontSize: 13, color: MID, marginBottom: 7, display: "block" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon size={15} color={SUB} style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none",
          }} />
        )}
        <input
          type={isPass ? (show ? "text" : "password") : type}
          value={value} autoFocus={autoFocus} placeholder={placeholder}
          onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: isPass ? "13px 44px 13px 42px" : Icon ? "13px 14px 13px 42px" : "13px 14px",
            background: INPBG,
            border: `1.5px solid ${focused ? FOCUS : BORDER}`,
            borderRadius: 10, fontSize: 16, color: INK,
            outline: "none", fontFamily: "inherit",
            transition: "border-color .15s, box-shadow .15s",
            boxShadow: focused ? "0 0 0 3px rgba(0,230,168,0.1)" : "none",
            colorScheme: "dark",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: SUB, display: "flex",
          }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [phase,    setPhase]    = useState("creds");
  const [chalId,   setChalId]   = useState(null);
  const [code,     setCode]     = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState(null);
  const [manter,   setManter]   = useState(true);
  const [showReset, setShowReset] = useState(false);

  // Acorda o backend assim que a tela abre (mitiga o cold start do Render).
  useEffect(() => { acordarServidor(); }, []);

  const submit = async () => {
    setBusy(true); setErr(null);
    definirLembrar(manter);
    try {
      const r = await api.auth.login(email.trim(), senha);
      if (r.mfaRequerido) { setChalId(r.desafioId); setPhase("mfa"); }
      else { onLogin(await api.auth.me()); }
    } catch (e) { setErr(ehErroDeRede(e) ? ERRO_REDE : (e.message || "Credenciais inválidas.")); }
    finally { setBusy(false); }
  };

  const mfaSubmit = async () => {
    setBusy(true); setErr(null);
    try { await api.auth.verificarMfa(chalId, code.trim()); onLogin(await api.auth.me()); }
    catch (e) { setErr(ehErroDeRede(e) ? ERRO_REDE : (e.message || "Código inválido.")); }
    finally { setBusy(false); }
  };

  const canLogin = !busy && email.trim() && senha;
  const canMfa   = !busy && code.length === 6;
  const isMobile = useIsMobile();

  return (
    <div style={{
      minHeight: "100vh", height: isMobile ? "auto" : "100vh",
      overflow: isMobile ? "auto" : "hidden",
      display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
      fontFamily: "Inter, system-ui, sans-serif",
      backgroundImage: "url('/bg-login.png')",
      backgroundSize: isMobile ? "cover" : "auto 100%",
      backgroundPosition: "center",
    }}>

      {/* ── Painel esquerdo — overlay sobre a foto (só desktop) ── */}
      {!isMobile && (
        <div style={{
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "44px 56px",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(3,8,18,0.72) 0%, rgba(3,8,18,0.45) 60%, rgba(3,8,18,0.55) 100%)",
          }} />

          {/* Centro */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: 22 }}>
              <Logo size={64} glow />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", color: ACC, marginBottom: 14 }}>
              BEM-VINDO AO
            </div>
            <h1 style={{ fontSize: "clamp(34px,4.5vw,52px)", fontWeight: 800, lineHeight: 1.05, color: INK, marginBottom: 4, letterSpacing: "-.025em" }}>
              Sistema <span style={{ color: ACC }}>GRAMO</span>
            </h1>
            <div style={{ fontSize: "clamp(16px,1.8vw,22px)", fontWeight: 600, color: MID, letterSpacing: ".08em", marginBottom: 18 }}>
              ENGENHARIA
            </div>
          </div>
        </div>
      )}

      {/* ── Painel direito — vidro fosco ── */}
      <div style={{
        background: isMobile
          ? "linear-gradient(180deg, rgba(2,7,11,0.30) 0%, rgba(2,7,11,0.55) 100%)"
          : "rgba(4,10,24,0.62)",
        backdropFilter: isMobile ? "blur(2px)" : "blur(48px)",
        WebkitBackdropFilter: isMobile ? "blur(2px)" : "blur(48px)",
        borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? "40px 22px" : "48px 52px",
        minHeight: isMobile ? "100vh" : "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 390 }} className="fade-up">

          {/* Brand premium (só mobile) */}
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", marginBottom: 34 }}>
              <div style={{ position: "relative", marginBottom: 18 }}>
                {/* anel de brilho */}
                <div aria-hidden style={{ position: "absolute", inset: -14, borderRadius: "50%",
                  background: `radial-gradient(circle, ${ACC}33, transparent 70%)` }} />
                <Logo size={76} glow animated />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".22em", color: ACC, marginBottom: 8 }}>
                BEM-VINDO AO
              </div>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.01em", color: INK, lineHeight: 1.1 }}>
                Sistema <span style={{ color: ACC }}>GRAMO</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: MID, letterSpacing: ".3em", marginTop: 4 }}>
                ENGENHARIA
              </div>
            </div>
          )}

          {phase === "creds" ? (
            <>

              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: "#e8f0fb", letterSpacing: "-.02em", marginBottom: 6 }}>
                  Entrar no sistema
                </h2>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <InputField label="E-mail" type="email" value={email} autoFocus icon={Mail}
                  placeholder="voce@gramo.com.br"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()} />
                <InputField label="Senha" type="password" value={senha} icon={Lock}
                  placeholder="••••••••••"
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: MID }}>
                    <input type="checkbox" checked={manter} onChange={e => setManter(e.target.checked)}
                      style={{ accentColor: ACC, width: 15, height: 15 }} />
                    Manter conectado
                  </label>
                  <button type="button" onClick={() => setShowReset(s => !s)}
                    style={{ background: "none", border: "none", color: ACC, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    Esqueceu a senha?
                  </button>
                </div>

                {showReset && (
                  <div style={{ padding: "10px 14px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.5,
                    background: "rgba(0,230,168,0.06)", border: `1px solid rgba(0,230,168,0.2)`, color: MID }}>
                    Por segurança, a redefinição é feita pelo gestor: peça ao responsável para gerar
                    uma nova senha em <b style={{ color: INK }}>Usuários → Editar</b>.
                  </div>
                )}

                {err && (
                  <div style={{
                    display: "flex", gap: 8, alignItems: "center",
                    padding: "10px 14px", borderRadius: 9, fontSize: 13,
                    background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171",
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {err}
                  </div>
                )}

                <button onClick={submit} disabled={!canLogin} style={{
                  width: "100%", padding: "14px", border: "none", borderRadius: 11,
                  background: canLogin ? ACC : "rgba(0,230,168,0.16)",
                  fontSize: 15.5, fontWeight: 700,
                  color: canLogin ? "#02130e" : SUB,
                  cursor: canLogin ? "pointer" : "not-allowed",
                  fontFamily: "inherit", transition: "all .15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: canLogin ? "0 6px 28px rgba(0,230,168,0.4)" : "none",
                }}>
                  {busy ? <Spin /> : null}
                  {busy ? "Autenticando…" : "Entrar"}
                  {!busy && <ArrowRight size={17} />}
                </button>

              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 15, margin: "0 auto 16px",
                  background: "rgba(0,230,168,0.08)", border: "1px solid rgba(0,230,168,0.18)",
                  display: "grid", placeItems: "center",
                }}>
                  <ShieldCheck size={26} color={ACC} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8f0fb", marginBottom: 6 }}>
                  Verificação em 2 etapas
                </h2>
                <p style={{ fontSize: 13, color: SUB }}>Informe o código do app autenticador</p>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <input value={code} autoFocus maxLength={6} placeholder="000 000"
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={e => e.key === "Enter" && mfaSubmit()}
                    style={{
                      width: "100%", padding: "18px",
                      background: INPBG, border: `1.5px solid ${code.length === 6 ? FOCUS : BORDER}`,
                      borderRadius: 10, fontSize: 30, fontWeight: 700, textAlign: "center",
                      letterSpacing: 14, outline: "none",
                      fontFamily: "'JetBrains Mono', monospace", color: INK,
                      transition: "all .15s", colorScheme: "dark",
                    }}
                  />
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 2.5, borderRadius: 2,
                        background: code.length > i ? ACC : BORDER,
                        transition: "background .12s",
                      }} />
                    ))}
                  </div>
                </div>

                {err && (
                  <div style={{
                    display: "flex", gap: 8, alignItems: "center",
                    padding: "10px 14px", borderRadius: 9, fontSize: 13,
                    background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171",
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {err}
                  </div>
                )}

                <button onClick={mfaSubmit} disabled={!canMfa} style={{
                  width: "100%", padding: "14px", border: "none", borderRadius: 11,
                  background: canMfa ? ACC : "rgba(0,230,168,0.16)",
                  fontSize: 15, fontWeight: 700, color: canMfa ? "#02130e" : SUB,
                  cursor: canMfa ? "pointer" : "not-allowed",
                  fontFamily: "inherit", transition: "all .15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: canMfa ? "0 6px 28px rgba(0,230,168,0.4)" : "none",
                }}>
                  {busy ? <Spin /> : <ShieldCheck size={16} />}
                  {busy ? "Verificando…" : "Confirmar acesso"}
                </button>

                <button onClick={() => { setPhase("creds"); setErr(null); setCode(""); }}
                  style={{
                    background: "none", border: "none", fontFamily: "inherit",
                    fontSize: 13, color: SUB, cursor: "pointer", padding: "4px", textAlign: "center",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = MID}
                  onMouseLeave={e => e.currentTarget.style.color = SUB}
                >← Voltar ao login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
