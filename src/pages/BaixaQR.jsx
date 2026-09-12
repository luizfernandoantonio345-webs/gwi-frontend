import { useState, useEffect, useRef, useCallback } from "react";
import { User, Package, ArrowLeft, ArrowRight, CheckCircle2, Camera, CameraOff, Search,
         QrCode, Zap, Shield, BarChart3, ClipboardCheck, ChevronRight, Info, Clock } from "lucide-react";
import api from "../api";
import { T } from "../styles/tokens";
import { Panel } from "../components/Panel";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { Spin } from "../components/Loader";

// ──────────────────────────────────────────────────────────────
// Banner do topo
// ──────────────────────────────────────────────────────────────
function HeroBaixa() {
  const feats = [
    { icon: Zap,       t: "Rápido",     s: "Agilidade no processo" },
    { icon: Shield,    t: "Seguro",     s: "Registro confiável" },
    { icon: BarChart3, t: "Organizado", s: "Tudo em tempo real" },
  ];
  return (
    <div className="blueprint hero-card" style={{ position:"relative", overflow:"hidden", borderRadius:16,
      border:`1px solid ${T.cyan}44`, background:"linear-gradient(120deg,#06171d,#061219 60%,#05121a)",
      padding:"24px 26px", marginBottom:18 }}>
      {/* Foto industrial (direita, esmaecida) */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"52%",
        backgroundImage:"url('/bg-login.png')", backgroundSize:"cover", backgroundPosition:"center",
        opacity:.32, pointerEvents:"none",
        maskImage:"linear-gradient(to right, transparent, #000 55%)",
        WebkitMaskImage:"linear-gradient(to right, transparent, #000 55%)" }} />
      <div style={{ position:"absolute", right:-150, top:-210, width:540, height:540, borderRadius:"50%",
        background:`${T.cyan}18`, filter:"blur(120px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", right:"9%", top:0, bottom:0, width:64, background:`${T.cyan}22`, transform:"skewX(-24deg)" }} />
      <div style={{ position:"absolute", right:"5%", top:0, bottom:0, width:30, background:`${T.cyan}14`, transform:"skewX(-24deg)" }} />
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
          <div style={{ width:58, height:58, borderRadius:15, flexShrink:0, background:`${T.cyan}12`,
            border:`1px solid ${T.cyan}44`, display:"grid", placeItems:"center", boxShadow:`0 0 30px -6px ${T.cyan}55` }}>
            <QrCode size={30} color={T.cyan} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="t-hero">Baixa por QR Code</h2>
            <p style={{ fontSize:13.5, color:T.sub, marginTop:5, maxWidth:520 }}>
              Escaneie o crachá do colaborador ou busque manualmente para registrar a operação de baixa de materiais.
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:32, flexWrap:"wrap", marginTop:20 }}>
          {feats.map(f => (
            <div key={f.t} style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${T.cyan}10`,
                border:`1px solid ${T.cyan}2e`, display:"grid", placeItems:"center" }}>
                <f.icon size={17} color={T.cyan} />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{f.t}</div>
                <div style={{ fontSize:11.5, color:T.muted }}>{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// QR scanner usando html5-qrcode
// ──────────────────────────────────────────────────────────────
function Corner({ pos }) {
  const base = { position:"absolute", width:26, height:26, borderColor:T.cyan, borderStyle:"solid", borderWidth:0 };
  const map = {
    tl:{ top:14, left:14, borderTopWidth:2, borderLeftWidth:2, borderTopLeftRadius:8 },
    tr:{ top:14, right:14, borderTopWidth:2, borderRightWidth:2, borderTopRightRadius:8 },
    bl:{ bottom:14, left:14, borderBottomWidth:2, borderLeftWidth:2, borderBottomLeftRadius:8 },
    br:{ bottom:14, right:14, borderBottomWidth:2, borderRightWidth:2, borderBottomRightRadius:8 },
  };
  return <div style={{ ...base, ...map[pos], opacity:.55 }} />;
}

function QrScanner({ onResult }) {
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro]   = useState(null);
  const scannerRef = useRef(null);
  const elId = useRef("qr-" + Math.random().toString(36).slice(2));

  const parar = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setAtivo(false);
  }, []);

  const iniciar = useCallback(async () => {
    setErro(null);
    setAtivo(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(elId.current);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => { onResult(text); parar(); },
        () => {}
      );
    } catch {
      setErro("Câmera indisponível ou acesso negado.");
      setAtivo(false);
    }
  }, [onResult, parar]);

  useEffect(() => () => { parar(); }, [parar]);

  return (
    <div>
      {/* Status */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:7, fontSize:11, color:T.sub,
          border:`1px solid ${T.border}`, background:T.bg2, borderRadius:20, padding:"5px 11px" }}>
          <span className={ativo ? "pulse-dot" : ""} style={{ width:6, height:6, borderRadius:"50%",
            background: ativo ? T.cyan : T.red }} />
          {ativo ? "Lendo câmera" : "Câmera inativa"}
        </span>
      </div>

      {/* Moldura */}
      <div style={{ position:"relative", height:300, borderRadius:14, overflow:"hidden",
        border:`1px solid ${T.cyan}33`, background:"#02090e",
        backgroundImage:`radial-gradient(circle at center, ${T.cyan}12, transparent 45%)`,
        display:"grid", placeItems:"center" }}>

        {/* Alvo do vídeo (html5-qrcode injeta aqui) */}
        <div id={elId.current} style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          display: ativo ? "block" : "none" }} />

        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

        {ativo && (
          <div style={{ position:"absolute", left:"12%", right:"12%", height:2, background:T.cyan,
            boxShadow:`0 0 18px ${T.cyan}`, animation:"scan 1.8s ease-in-out infinite" }} />
        )}

        {!ativo && (
          <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
            <div style={{ width:80, height:80, margin:"0 auto", borderRadius:16, background:"#081c25",
              border:`1px solid ${T.cyan}44`, display:"grid", placeItems:"center" }}>
              <QrCode size={42} color={T.ink} strokeWidth={1.2} />
            </div>
            <div style={{ fontSize:15, fontWeight:600, marginTop:16 }}>Clique para ativar a câmera</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Permita o acesso para escanear o QR Code</div>
            <button onClick={iniciar} aria-label="Ativar câmera" style={{ marginTop:16, width:46, height:46,
              borderRadius:"50%", background:T.cyan, color:"#02130e", display:"inline-grid", placeItems:"center",
              boxShadow:`0 0 26px -4px ${T.cyan}`, border:"none", cursor:"pointer" }}>
              <Camera size={20} />
            </button>
          </div>
        )}

        {ativo && (
          <button onClick={parar} style={{ position:"absolute", bottom:14, right:14, zIndex:2,
            display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:T.ink,
            background:"#02090ecc", border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 11px", cursor:"pointer" }}>
            <CameraOff size={14} /> Parar
          </button>
        )}
      </div>

      {erro && <p style={{ color: T.red, fontSize: 12, marginTop: 8 }}>{erro}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Autocomplete busca colaborador
// ──────────────────────────────────────────────────────────────
function BuscaColaborador({ onSelect }) {
  const [q, setQ]           = useState("");
  const [lista, setLista]   = useState([]);
  const [buscando, setBuscando] = useState(false);
  const timerRef = useRef(null);

  const buscar = (val) => {
    setQ(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setLista([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await api.operacoes.buscarColaboradores(val.trim());
        setLista(r);
      } catch { setLista([]); }
      finally { setBuscando(false); }
    }, 350);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }} />
        <input
          className="inp"
          style={{ paddingLeft: 32 }}
          value={q}
          onChange={e => buscar(e.target.value)}
          placeholder="Nome ou matrícula…"
        />
      </div>
      {(lista.length > 0 || buscando) && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8,
          marginTop: 4, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 24px #0009" }}>
          {buscando && <div style={{ padding: "10px 14px", color: T.muted, fontSize: 13 }}>Buscando…</div>}
          {lista.map(c => (
            <button key={c.id} onClick={() => { onSelect(c); setQ(""); setLista([]); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                background: "transparent", border: "none", cursor: "pointer", color: T.ink,
                borderBottom: `1px solid ${T.border}`, fontSize: 14 }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontWeight: 600 }}>{c.nome}</span>
              <span style={{ color: T.muted, marginLeft: 8, fontSize: 12 }}>{c.matricula} · {c.cargo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Busca material por código
// ──────────────────────────────────────────────────────────────
function BuscaMaterial({ onSelect }) {
  const [q, setQ]           = useState("");
  const [lista, setLista]   = useState([]);
  const [buscando, setBuscando] = useState(false);
  const timerRef = useRef(null);

  const buscar = (val) => {
    setQ(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 1) { setLista([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await api.catalogo.listarMateriais({ busca: val.trim(), limit: 10 });
        setLista(Array.isArray(r) ? r : (r.items || []));
      } catch { setLista([]); }
      finally { setBuscando(false); }
    }, 350);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }} />
        <input
          className="inp mono"
          style={{ paddingLeft: 32 }}
          value={q}
          onChange={e => buscar(e.target.value)}
          placeholder="Código ou nome do material…"
        />
      </div>
      {(lista.length > 0 || buscando) && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8,
          marginTop: 4, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 24px #0009" }}>
          {buscando && <div style={{ padding: "10px 14px", color: T.muted, fontSize: 13 }}>Buscando…</div>}
          {lista.map(m => (
            <button key={m.id} onClick={() => { onSelect(m); setQ(""); setLista([]); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                background: "transparent", border: "none", cursor: "pointer", color: T.ink,
                borderBottom: `1px solid ${T.border}`, fontSize: 14 }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontWeight: 600 }}>{m.nome}</span>
              <span style={{ color: T.muted, marginLeft: 8, fontSize: 12 }}>{m.codigo} · {m.tipo}</span>
              <span style={{ color: m.saldo_estoque > 0 ? T.green : T.red, marginLeft: 8, fontSize: 12 }}>
                Saldo: {m.saldo_estoque}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Chip "selecionado"
// ──────────────────────────────────────────────────────────────
function ChipSelecionado({ label, sub, onClear }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", background: `${T.cyan}12`, border: `1px solid ${T.cyan}33`,
      borderRadius: 8, gap: 8 }}>
      <div>
        <div style={{ color: T.ink, fontWeight: 600, fontSize: 14 }}>{label}</div>
        {sub && <div style={{ color: T.muted, fontSize: 12 }}>{sub}</div>}
      </div>
      <button onClick={onClear} style={{ color: T.muted, background: "none", border: "none",
        cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Stepper header
// ──────────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = [
    { title:"Colaborador", sub:"Identifique o colaborador", icon:User },
    { title:"Material",    sub:"Selecione o material",       icon:Package },
    { title:"Operação",    sub:"Confirme os dados",          icon:ClipboardCheck },
  ];
  return (
    <div className="stepper-wrap" style={{ display:"flex", alignItems:"center", borderRadius:14,
      border:`1px solid ${T.border}`, background:T.panel, padding:"14px 20px", marginBottom:20 }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const ativo = step === n;
        const Icon = s.icon;
        return (
          <div key={n} style={{ display:"contents" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0, display:"grid", placeItems:"center",
                background: ativo ? T.cyan : done ? `${T.cyan}22` : "#0a1922",
                color: ativo ? "#02130e" : done ? T.cyan : T.muted,
                border:`1px solid ${ativo || done ? T.cyan : "#26404c"}`,
                boxShadow: ativo ? `0 0 22px -2px ${T.cyan}88` : "none" }}>
                {done ? <CheckCircle2 size={19} /> : <Icon size={18} />}
              </div>
              <div style={{ minWidth:0 }} className="step-txt">
                <div style={{ fontSize:13.5, fontWeight:600, color: ativo || done ? T.ink : T.muted, whiteSpace:"nowrap" }}>{s.title}</div>
                <div style={{ fontSize:11, marginTop:2, color: ativo ? T.cyan : T.muted, whiteSpace:"nowrap" }}>{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height:2, minWidth:20, margin:"0 16px", borderRadius:2,
                background: step > n ? T.cyan : "#20404d" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tela de sucesso
// ──────────────────────────────────────────────────────────────
function Sucesso({ msg, onNova }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      gap: 14, padding: "36px 0", textAlign: "center" }}>
      <div className="glow-pulse" style={{ width:92, height:92, borderRadius:"50%",
        background:`${T.cyan}12`, border:`1px solid ${T.cyan}55`, display:"grid", placeItems:"center" }}>
        <CheckCircle2 size={46} color={T.cyan} />
      </div>
      <div style={{ fontSize:11, letterSpacing:".2em", textTransform:"uppercase", color:T.cyan, marginTop:6 }}>
        Operação concluída
      </div>
      <p style={{ color: T.ink, fontSize: 17, fontWeight: 600, maxWidth:420 }}>{msg}</p>
      <Btn kind="primary" onClick={onNova} style={{ marginTop:6 }}>Nova operação</Btn>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Colaboradores recentes (persistidos localmente)
// ──────────────────────────────────────────────────────────────
const RECENTES_KEY = "gwi_colabs_recentes";
function lerRecentes() {
  try { return JSON.parse(localStorage.getItem(RECENTES_KEY)) || []; } catch { return []; }
}
function salvarRecente(c) {
  try {
    const anteriores = lerRecentes().filter(x => x.matricula !== c.matricula);
    const nova = [{ id:c.id, nome:c.nome, matricula:c.matricula, cargo:c.cargo, ts:Date.now() }, ...anteriores].slice(0, 6);
    localStorage.setItem(RECENTES_KEY, JSON.stringify(nova));
    return nova;
  } catch { return lerRecentes(); }
}
function iniciais(nome) {
  return (nome || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
}
function horaCurta(ts) {
  try { return new Date(ts).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }); } catch { return ""; }
}

function Avatar({ nome, ativo }) {
  return (
    <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, display:"grid", placeItems:"center",
      fontSize:12, fontWeight:700, color:T.cyan,
      background: ativo ? `${T.cyan}22` : `${T.cyan}12`, border:`1px solid ${T.cyan}${ativo ? "88" : "44"}` }}>
      {iniciais(nome)}
    </div>
  );
}

function RecentColaboradores({ itens, selecionadoId, onSelect }) {
  return (
    <section className="panel" style={{ alignSelf:"start" }}>
      <div className="panel-header">
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <span style={{ width:3, height:20, borderRadius:3, background:T.cyan, boxShadow:`0 0 10px ${T.cyan}66` }} />
          <h3 style={{ fontSize:15, fontWeight:600 }}>Últimos colaboradores</h3>
        </div>
      </div>
      {itens.length === 0 ? (
        <div style={{ padding:"36px 20px", textAlign:"center" }}>
          <Clock size={26} color={T.muted} style={{ marginBottom:10 }} />
          <p style={{ fontSize:13, color:T.sub }}>Nenhum colaborador recente</p>
          <p style={{ fontSize:12, color:T.muted, marginTop:4 }}>
            Os últimos identificados aparecerão aqui.
          </p>
        </div>
      ) : (
        <div>
          {itens.map(c => {
            const ativo = selecionadoId === c.id;
            return (
              <button key={c.matricula} onClick={() => onSelect(c)}
                style={{ display:"flex", alignItems:"center", gap:11, width:"100%", textAlign:"left",
                  padding:"12px 18px", borderBottom:`1px solid ${T.borderS}`, cursor:"pointer",
                  background: ativo ? `${T.cyan}12` : "transparent", border:"none",
                  borderLeft: ativo ? `2px solid ${T.cyan}` : "2px solid transparent", transition:"background .12s" }}
                onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = "#0a2029"; }}
                onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = "transparent"; }}>
                <Avatar nome={c.nome} ativo={ativo} />
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, lineHeight:1.3 }}>{c.nome}</div>
                  <div style={{ fontSize:11.5, color:T.muted }}>{c.cargo || "—"} · Mat. {c.matricula}</div>
                </div>
                <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:T.cyan }} />
                  {horaCurta(c.ts)}
                </span>
                <ChevronRight size={15} color={T.muted} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ColabSelecionado({ c, onClear }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10,
      background:`${T.cyan}10`, border:`1px solid ${T.cyan}55` }}>
      <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, display:"grid", placeItems:"center",
        fontSize:12.5, fontWeight:700, color:T.cyan, background:`${T.cyan}22`, border:`1px solid ${T.cyan}66` }}>
        {iniciais(c.nome)}
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14, fontWeight:600 }}>{c.nome}</span>
          <span style={{ fontSize:9, letterSpacing:".08em", textTransform:"uppercase", color:T.cyan,
            background:`${T.cyan}18`, borderRadius:20, padding:"2px 8px" }}>Selecionado</span>
        </div>
        <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{c.cargo || "—"} · Matrícula {c.matricula}</div>
      </div>
      <button onClick={onClear} title="Remover" style={{ color:T.muted, background:"none", border:"none",
        cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
    </div>
  );
}

function BuscaRapidaHints() {
  const hints = ["Matrícula", "Nome", "Cargo"];
  return (
    <div>
      <div style={{ fontSize:11.5, color:T.muted, marginBottom:8 }}>Você pode buscar por</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {hints.map(h => (
          <span key={h} style={{ fontSize:12, color:T.sub, background:T.bg2, border:`1px solid ${T.border}`,
            borderRadius:8, padding:"6px 11px" }}>{h}</span>
        ))}
      </div>
    </div>
  );
}

function HelpBar() {
  return (
    <div style={{ marginTop:18, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
      padding:"14px 18px", borderRadius:12, border:`1px solid ${T.border}`, background:T.panel }}>
      <Info size={17} color={T.cyan} />
      <span style={{ fontSize:13, color:T.sub, flex:1, minWidth:200 }}>
        Dúvidas? Consulte o setor de Almoxarifado ou o manual do sistema.
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────
export function BaixaQR({ notify }) {
  const [step, setStep]               = useState(1);
  const [colaborador, setColaborador] = useState(null);
  const [material, setMaterial]       = useState(null);
  const [qtd, setQtd]                 = useState(1);
  const [obs, setObs]                 = useState("");
  const [busy, setBusy]               = useState(false);
  const [sucesso, setSucesso]         = useState(null);
  const [recentes, setRecentes]       = useState(() => lerRecentes());

  const reset = () => {
    setStep(1); setColaborador(null); setMaterial(null);
    setQtd(1); setObs(""); setSucesso(null);
  };

  // Seleciona o colaborador (destaca) e registra nos recentes — sem avançar.
  const escolherColaborador = (c) => {
    setColaborador(c);
    setRecentes(salvarRecente(c));
  };

  // QR colaborador: matrícula embutida no QR (ex: "MAT-001234")
  const onQrColaborador = async (texto) => {
    const matricula = texto.trim();
    try {
      const lista = await api.operacoes.buscarColaboradores(matricula);
      const col = lista.find(c => c.matricula === matricula || c.matricula.includes(matricula));
      if (col) { escolherColaborador(col); setStep(2); }
      else notify(`Matrícula "${matricula}" não encontrada.`, true);
    } catch { notify("Erro ao buscar colaborador.", true); }
  };

  // QR material: código do material
  const onQrMaterial = async (texto) => {
    const codigo = texto.trim();
    try {
      const lista = await api.catalogo.listarMateriais({ busca: codigo, limit: 5 });
      const arr = Array.isArray(lista) ? lista : (lista.items || []);
      const mat = arr.find(m => m.codigo === codigo) || arr[0];
      if (mat) { setMaterial(mat); setStep(3); }
      else notify(`Código "${codigo}" não encontrado.`, true);
    } catch { notify("Erro ao buscar material.", true); }
  };

  const efetivar = async (tipoOp) => {
    if (!colaborador || !material) return;
    setBusy(true);
    try {
      if (tipoOp === "devolver") {
        // devolver um comodato — precisamos encontrar comodato aberto
        const comodatos = await api.operacoes.listarComodatos(true);
        const comodato = comodatos.find(c =>
          c.material_id === material.id && c.colaborador_id === colaborador.id
        );
        if (!comodato) {
          notify("Nenhum comodato aberto para esse colaborador + material.", true);
          setBusy(false); return;
        }
        await api.operacoes.devolverComodato(comodato.id, obs || null);
        setSucesso(`Devolução registrada: ${material.nome} · ${colaborador.nome}`);
      } else {
        await api.operacoes.baixaQr({
          codigo_material: material.codigo,
          matricula: colaborador.matricula,
          quantidade: Number(qtd),
          observacao: obs || null,
        });
        const acao = material.tipo === "FERRAMENTA" ? "Comodato aberto" : "Saída registrada";
        setSucesso(`${acao}: ${material.nome} · ${colaborador.nome}`);
      }
    } catch (e) { notify(e.message, true); }
    finally { setBusy(false); }
  };

  if (sucesso) {
    return (
      <div className="fade-up" style={{ maxWidth: 1180 }}>
        <HeroBaixa />
        <Panel>
          <Sucesso msg={sucesso} onNova={reset} />
        </Panel>
        <HelpBar />
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ maxWidth: 1180 }}>
      <HeroBaixa />
      <Stepper step={step} />

      {/* ── Passo 1: Colaborador (layout de duas colunas) ── */}
      {step === 1 && (
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.5fr) minmax(0,.85fr)", gap:18, alignItems:"start" }}
          className="baixa-grid">

          {/* Card do scanner + busca */}
          <section className="panel" style={{ padding:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${T.cyan}10`,
                border:`1px solid ${T.cyan}2e`, display:"grid", placeItems:"center" }}>
                <Camera size={20} color={T.cyan} />
              </div>
              <div>
                <h3 style={{ fontSize:15.5, fontWeight:600 }}>Escanear QR Code</h3>
                <p style={{ fontSize:12.5, color:T.sub }}>Aponte a câmera para o crachá do colaborador</p>
              </div>
            </div>

            <QrScanner onResult={onQrColaborador} />

            {/* Divisor OU */}
            <div style={{ display:"flex", alignItems:"center", gap:14, margin:"20px 0" }}>
              <div style={{ flex:1, height:1, background:T.border }} />
              <span style={{ fontSize:12, color:T.muted }}>OU</span>
              <div style={{ flex:1, height:1, background:T.border }} />
            </div>

            <Field label="Buscar colaborador">
              <BuscaColaborador onSelect={escolherColaborador} />
            </Field>

            <div style={{ marginTop:16 }}>
              <BuscaRapidaHints />
            </div>

            {colaborador && (
              <div style={{ marginTop:18 }}>
                <ColabSelecionado c={colaborador} onClear={() => setColaborador(null)} />
              </div>
            )}

            <Btn kind="primary" onClick={() => colaborador && setStep(2)} disabled={!colaborador}
              style={{ width:"100%", marginTop:18 }}>
              Continuar <ArrowRight size={16} />
            </Btn>
          </section>

          {/* Recentes */}
          <RecentColaboradores
            itens={recentes}
            selecionadoId={colaborador?.id}
            onSelect={escolherColaborador}
          />
        </div>
      )}

      {(step === 2 || step === 3) && (
      <Panel>
        <div style={{ maxWidth: 560 }}>

        {/* ── Passo 2: Material ── */}
        {step === 2 && (
          <div style={{ display: "grid", gap: 20 }}>
            <ChipSelecionado
              label={colaborador.nome}
              sub={`${colaborador.matricula} · ${colaborador.cargo}`}
              onClear={() => { setColaborador(null); setStep(1); }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10,
              color: T.muted, fontSize: 13, fontWeight: 500 }}>
              <Package size={16} /> Identificar material
            </div>

            <div>
              <p style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>
                Escaneie o QR Code do material:
              </p>
              <QrScanner onResult={onQrMaterial} label="Escanear material" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.muted, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              ou busque pelo código / nome
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <Field label="Buscar material">
              <BuscaMaterial onSelect={m => { setMaterial(m); setStep(3); }} />
            </Field>

            <Btn kind="ghost" onClick={() => setStep(1)} style={{ gap: 6, width: "fit-content" }}>
              <ArrowLeft size={14} /> Voltar
            </Btn>
          </div>
        )}

        {/* ── Passo 3: Operação ── */}
        {step === 3 && (
          <div style={{ display: "grid", gap: 20 }}>
            <ChipSelecionado
              label={colaborador.nome}
              sub={`${colaborador.matricula} · ${colaborador.cargo}`}
              onClear={() => { setColaborador(null); setStep(1); }}
            />
            <ChipSelecionado
              label={material.nome}
              sub={`${material.codigo} · ${material.tipo} · Saldo: ${material.saldo_estoque}`}
              onClear={() => { setMaterial(null); setStep(2); }}
            />

            {/* Quantidade (para não-ferramenta) */}
            {material.tipo !== "FERRAMENTA" && (
              <Field label="Quantidade">
                <input className="inp mono" type="number" min={0.01} step={0.01}
                  value={qtd} onChange={e => setQtd(e.target.value)} />
              </Field>
            )}

            <Field label="Observação (opcional)">
              <input className="inp" value={obs} onChange={e => setObs(e.target.value)}
                placeholder="Ex: Obra 05, instalação elétrica…" />
            </Field>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {material.tipo === "FERRAMENTA" ? (
                <>
                  <Btn kind="primary" onClick={() => efetivar("retirada")} disabled={busy}>
                    {busy ? <Spin /> : null} Retirada (comodato)
                  </Btn>
                  <Btn kind="outline" onClick={() => efetivar("devolver")} disabled={busy}>
                    {busy ? <Spin /> : null} Devolução
                  </Btn>
                </>
              ) : (
                <Btn kind="primary" onClick={() => efetivar("saida")} disabled={busy}>
                  {busy ? <Spin /> : null} Registrar saída
                </Btn>
              )}
              <Btn kind="ghost" onClick={() => setStep(2)} style={{ gap: 6 }}>
                <ArrowLeft size={14} /> Voltar
              </Btn>
            </div>
          </div>
        )}
        </div>
      </Panel>
      )}

      <HelpBar />
    </div>
  );
}
