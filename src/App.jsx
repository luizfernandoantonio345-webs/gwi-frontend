import { useState, useEffect, Component } from "react";
import {
  LayoutDashboard, Boxes, ClipboardList, CheckCircle2,
  ShoppingCart, QrCode, Handshake, PackagePlus, Settings2, Shield, PackageSearch, Users,
} from "lucide-react";

import api, { configurarAuthLost, acordarServidor, iniciarRealtime, pararRealtime } from "./api";
import { useToast } from "./hooks/useToast";
import { useIsMobile } from "./hooks/useIsMobile";
import { INICIO, ACESSO } from "./constants";
import { T } from "./styles/tokens";

import { Sidebar }   from "./layout/Sidebar";
import { TopBar }    from "./layout/TopBar";
import { BottomNav } from "./layout/BottomNav";
import { PerfilModal } from "./components/PerfilModal";
import { NotificacoesRealtime } from "./components/NotificacoesRealtime";
import { lerPerfil, salvarPerfil, usuarioExibicao } from "./utils/perfil";
import { bipNotificacao } from "./utils/som";
import { Login }     from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Materiais } from "./pages/Materiais";
import { NovoPedido }     from "./pages/NovoPedido";
import { Aprovacoes }     from "./pages/Aprovacoes";
import { FilaCompra }     from "./pages/FilaCompra";
import { BaixaQR }        from "./pages/BaixaQR";
import { Comodatos }      from "./pages/Comodatos";
import { EntradaEstoque } from "./pages/EntradaEstoque";
import { Cadastros }      from "./pages/Cadastros";
import { SegurancaMFA }   from "./pages/SegurancaMFA";
import { Requisicoes }    from "./pages/Requisicoes";
import { Usuarios }       from "./pages/Usuarios";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding:40, background:"#02070b", minHeight:"100vh", color:"#f87171", fontFamily:"monospace" }}>
          <h2 style={{ marginBottom:12 }}>Erro de renderização</h2>
          <pre style={{ fontSize:13, whiteSpace:"pre-wrap", color:"#fca5a5" }}>{this.state.err.message}</pre>
          <pre style={{ fontSize:11, color:"#7b8fac", marginTop:12 }}>{this.state.err.stack}</pre>
          <button onClick={() => this.setState({ err: null })}
            style={{ marginTop:20, padding:"8px 16px", background:"#00e6a8", color:"#02130e", border:"none", borderRadius:6, cursor:"pointer" }}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TODOS = ["ALMOXARIFE","ADM_COMPRAS","GERENTE"];

const NAV_ITEMS = [
  { id:"dashboard",   label:"Painel",           icon:LayoutDashboard, roles:["GERENTE"] },
  { id:"aprovacoes",  label:"Aprovações",        icon:CheckCircle2,    roles:["GERENTE"] },
  { id:"baixaqr",     label:"Baixa QR",          icon:QrCode,          roles:["ALMOXARIFE"] },
  { id:"requisicoes", label:"Solicitações",       icon:PackageSearch,   roles:["ALMOXARIFE"] },
  { id:"pedido",      label:"Novo pedido",       icon:ClipboardList,   roles:["ALMOXARIFE"] },
  { id:"compras",     label:"Fila de compras",   icon:ShoppingCart,    roles:["ADM_COMPRAS"] },
  { id:"entrada",     label:"Entrada estoque",   icon:PackagePlus,     roles:["ALMOXARIFE","ADM_COMPRAS"] },
  { id:"comodatos",   label:"Comodatos",         icon:Handshake,       roles:["ALMOXARIFE","GERENTE"] },
  { id:"materiais",   label:"Materiais",         icon:Boxes,           roles:TODOS },
  { id:"cadastros",   label:"Cadastros",         icon:Settings2,       roles:["ADM_COMPRAS","GERENTE"] },
  { id:"usuarios",    label:"Usuários",          icon:Users,           roles:["GERENTE"] },
  { id:"seguranca",   label:"Segurança",         icon:Shield,          roles:TODOS },
];

export default function App() {
  const [toast, notify] = useToast();

  const [authed,  setAuthed]  = useState(false);
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [perfil, setPerfil] = useState({});
  const [perfilAberto, setPerfilAberto] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { if (user) setPerfil(lerPerfil(user)); }, [user]);

  const displayUser = usuarioExibicao(user, perfil);
  const salvarPerfilAtual = (dados) => {
    // Atualização local imediata (UI responde na hora)
    setPerfil(salvarPerfil(user, dados));
    setPerfilAberto(false);
    notify("Perfil atualizado.");
    // Sincroniza com o servidor em background (quando o endpoint existir)
    api.auth.atualizarPerfil(dados).then(u => u && setUser(u)).catch(() => {});
  };

  useEffect(() => {
    configurarAuthLost(() => { setAuthed(false); setUser(null); });
  }, []);

  // Keep-alive: mantém o backend (Render free) acordado enquanto o app está
  // aberto e logado — ping a cada 10 min. Não substitui um monitor 24/7.
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => { acordarServidor(); }, 600000);
    return () => clearInterval(id);
  }, [authed]);

  // Tempo real: conecta o WebSocket enquanto logado (notificações instantâneas).
  useEffect(() => {
    if (!authed) return;
    iniciarRealtime();
    return () => pararRealtime();
  }, [authed]);

  // Notificação global: qualquer evento em tempo real toca o som.
  // O visual aparece no canto inferior direito (NotificacoesRealtime).
  useEffect(() => {
    if (!authed) return;
    const h = () => bipNotificacao();
    window.addEventListener("gwi:realtime", h);
    return () => window.removeEventListener("gwi:realtime", h);
  }, [authed]);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 4000);
    api.restaurarSessao()
      .then(() => api.auth.me())
      .then(u => { setUser(u); setAuthed(true); setPage(INICIO[u.papel] || "dashboard"); })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
  }, []);

  const onLogin = async (userData) => {
    setUser(userData);
    setAuthed(true);
    setPage(INICIO[userData.papel] || "dashboard");
  };

  const onLogout = async () => {
    await api.auth.logout().catch(() => {});
    setAuthed(false);
    setUser(null);
    setPage("dashboard");
  };

  const nav = NAV_ITEMS.filter(n => n.roles.includes(user?.papel));

  // Guarda: se a página atual não é permitida para o papel, redireciona
  const paginaInicio = INICIO[user?.papel] || "dashboard";
  const paginaAtual  = ACESSO[page]?.includes(user?.papel) ? page : paginaInicio;

  if (loading) return (
    <div style={{ height:"100vh", display:"grid", placeItems:"center", background:"#02070b" }}>
      <div style={{ width:36, height:36, border:"3px solid #17303c", borderTopColor:"#00e6a8", borderRadius:"50%", animation:"spin .75s linear infinite", boxShadow:"0 0 24px rgba(0,230,168,.25)" }} />
    </div>
  );

  if (!authed) return (
    <>
      <Login onLogin={onLogin} notify={notify} />
      {toast}
    </>
  );

  const pageProps = { usuario: user, notify, onDone: () => setPage(paginaInicio) };

  const navegar = (p) => {
    if (ACESSO[p]?.includes(user?.papel)) { setPage(p); setDrawerOpen(false); }
  };

  const renderPage = () => {
    switch (paginaAtual) {
      case "dashboard": return <Dashboard />;
      case "materiais": return <Materiais />;
      case "pedido":    return <NovoPedido {...pageProps} />;
      case "aprovacoes":return <Aprovacoes {...pageProps} />;
      case "compras":   return <FilaCompra {...pageProps} />;
      case "baixaqr":   return <BaixaQR    {...pageProps} />;
      case "comodatos":   return <Comodatos  {...pageProps} />;
      case "entrada":     return <EntradaEstoque {...pageProps} />;
      case "cadastros":   return <Cadastros  {...pageProps} />;
      case "seguranca":   return <SegurancaMFA {...pageProps} />;
      case "requisicoes": return <Requisicoes {...pageProps} />;
      case "usuarios":    return <Usuarios {...pageProps} />;
      default:            return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
        {/* Sidebar: fixa no desktop, drawer no mobile */}
        {!isMobile && (
          <Sidebar user={displayUser} nav={nav} page={paginaAtual} onNavigate={navegar} onLogout={onLogout} onOpenPerfil={() => setPerfilAberto(true)} />
        )}
        {isMobile && drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:40, background:"#05080ecc", backdropFilter:"blur(2px)" }} />
            <div style={{ position:"fixed", top:0, bottom:0, left:0, zIndex:41, width:248, maxWidth:"82vw",
              background:T.bg, boxShadow:"0 0 40px #000" }}>
              <Sidebar user={displayUser} nav={nav} page={paginaAtual} onNavigate={navegar} onLogout={onLogout} onOpenPerfil={() => setPerfilAberto(true)} />
            </div>
          </>
        )}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <TopBar user={displayUser} page={paginaAtual} onNavigate={navegar} isMobile={isMobile} onOpenMenu={() => setDrawerOpen(true)} onOpenPerfil={() => setPerfilAberto(true)} />
          <main style={{ flex:1, overflowY:"auto", padding: isMobile ? "16px 14px" : "24px 28px" }} className="fade-up" key={page}>
            <ErrorBoundary>
              {renderPage()}
            </ErrorBoundary>
          </main>
          {isMobile && (
            <BottomNav nav={nav} page={paginaAtual} onNavigate={navegar} onOpenMenu={() => setDrawerOpen(true)} />
          )}
        </div>
        {toast}
        <NotificacoesRealtime />
        {perfilAberto && (
          <PerfilModal user={user} perfil={perfil} notify={notify}
            onClose={() => setPerfilAberto(false)} onSalvar={salvarPerfilAtual} />
        )}
      </div>
    </ErrorBoundary>
  );
}
