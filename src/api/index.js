const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const RT_KEY = "gwi_refresh";

let accessToken  = null;
let refreshToken = null;
let onAuthLost   = () => {};

// "Manter conectado": true = persiste no localStorage (sobrevive a fechar o
// navegador, ~7 dias). false = sessionStorage (some ao fechar a aba/navegador).
let _lembrar = true;
export function definirLembrar(v) { _lembrar = Boolean(v); }

function persistirRefresh(rt) {
  try {
    localStorage.removeItem(RT_KEY);
    sessionStorage.removeItem(RT_KEY);
    if (rt) (_lembrar ? localStorage : sessionStorage).setItem(RT_KEY, rt);
  } catch { /* storage indisponível (modo privado) */ }
}

export function configurarAuthLost(cb) { onAuthLost = cb || (() => {}); }
export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  persistirRefresh(refreshToken);
}
export function limparTokens() {
  accessToken = null;
  refreshToken = null;
  persistirRefresh(null);
}
export function estaAutenticado() { return Boolean(accessToken); }

// Reidrata a sessão a partir do refresh persistido (chamado no boot do App).
export async function restaurarSessao() {
  let rt = refreshToken;
  if (!rt) {
    try {
      rt = localStorage.getItem(RT_KEY);
      if (rt) { _lembrar = true; }
      else { rt = sessionStorage.getItem(RT_KEY); if (rt) _lembrar = false; }
    } catch { rt = null; }
  }
  if (!rt) return false;
  refreshToken = rt;
  const ok = await tentarRefresh();
  if (!ok) { limparTokens(); return false; }
  return true;
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

async function parseResposta(resp) {
  const texto = await resp.text();
  let corpo = null;
  try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = { detail: texto }; }
  if (!resp.ok) {
    const err = new Error((corpo && corpo.detail) || `Erro ${resp.status}`);
    err.status = resp.status;
    err.corpo  = corpo;
    throw err;
  }
  return corpo;
}

// Single-flight: requisições simultâneas que caem em 401 compartilham UM único
// refresh. Sem isso, o refresh com rotação seria reapresentado em paralelo, a
// detecção de reuso derrubaria a cadeia e a sessão cairia ("Not authenticated").
let _refreshEmAndamento = null;
async function tentarRefresh() {
  if (!refreshToken) return false;
  if (_refreshEmAndamento) return _refreshEmAndamento;
  _refreshEmAndamento = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!resp.ok) return false;
      const dados = await resp.json();
      setTokens(dados.access_token, dados.refresh_token);
      return true;
    } catch { return false; }
    finally { _refreshEmAndamento = null; }
  })();
  return _refreshEmAndamento;
}

async function req(metodo, caminho, { json, form, idempotente } = {}, _jaRefez = false) {
  const headers = {};
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form !== undefined) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (idempotente && metodo === "POST") headers["Idempotency-Key"] = idempotente;

  const resp = await fetch(`${API_BASE}${caminho}`, { method: metodo, headers, body });

  if (resp.status === 401 && !_jaRefez && refreshToken) {
    const ok = await tentarRefresh();
    if (ok) return req(metodo, caminho, { json, form, idempotente }, true);
    limparTokens();
    onAuthLost();
  }
  return parseResposta(resp);
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
}

// Acorda o backend (Render free "dorme" após inatividade): ping best-effort,
// disparado ao abrir o login para que o servidor já esteja de pé no submit.
export function acordarServidor() {
  return fetch(`${API_BASE}/health/live`, { method: "GET" }).catch(() => {});
}

// True quando o erro é de rede/conexão (e não uma resposta HTTP do servidor).
export function ehErroDeRede(e) {
  return Boolean(e) && !e.status &&
    (e.name === "TypeError" || /failed to fetch|networkerror|load failed|fetch/i.test(e.message || ""));
}

// ── Tempo real (WebSocket) ──────────────────────────────────────
// Conecta ao /ws e dispara um evento de janela "gwi:realtime" a cada mensagem.
// Reconecta sozinho (cobre o "sono" do Render free e a troca de token).
let _ws = null, _wsTimer = null, _wsAtivo = false;
function _wsAbrir() {
  if (!_wsAtivo || !accessToken) return;
  try {
    const base = API_BASE.replace(/^http/, "ws");
    _ws = new WebSocket(`${base}/ws?token=${encodeURIComponent(accessToken)}`);
    _ws.onmessage = (ev) => {
      let msg = {};
      try { msg = JSON.parse(ev.data); } catch { /* ignora */ }
      try { window.dispatchEvent(new CustomEvent("gwi:realtime", { detail: msg })); } catch { /* ignora */ }
    };
    _ws.onclose = () => { _ws = null; if (_wsAtivo) { clearTimeout(_wsTimer); _wsTimer = setTimeout(_wsAbrir, 5000); } };
    _ws.onerror = () => { try { if (_ws) _ws.close(); } catch { /* ignora */ } };
  } catch { if (_wsAtivo) { clearTimeout(_wsTimer); _wsTimer = setTimeout(_wsAbrir, 5000); } }
}
export function iniciarRealtime() { if (_wsAtivo) return; _wsAtivo = true; _wsAbrir(); }
export function pararRealtime() {
  _wsAtivo = false; clearTimeout(_wsTimer);
  if (_ws) { try { _ws.close(); } catch { /* ignora */ } _ws = null; }
}

function _formData(arquivo, extra) {
  const fd = new FormData();
  fd.append("arquivo", arquivo);
  Object.entries(extra || {}).forEach(([k, v]) => fd.append(k, String(v)));
  return fd;
}

async function reqArquivo(caminho, arquivo, extra) {
  const headers = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  let resp = await fetch(`${API_BASE}${caminho}`, { method: "POST", headers, body: _formData(arquivo, extra) });
  if (resp.status === 401 && refreshToken && (await tentarRefresh())) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    resp = await fetch(`${API_BASE}${caminho}`, { method: "POST", headers, body: _formData(arquivo, extra) });
  }
  return parseResposta(resp);
}

async function reqBlob(caminho) {
  const headers = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  let resp = await fetch(`${API_BASE}${caminho}`, { headers });
  if (resp.status === 401 && refreshToken && (await tentarRefresh())) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    resp = await fetch(`${API_BASE}${caminho}`, { headers });
  }
  if (!resp.ok) throw new Error("Falha ao baixar o arquivo.");
  return resp.blob();
}

export const auth = {
  async login(email, senha) {
    const dados = await req("POST", "/auth/login", { form: { username: email, password: senha } });
    if (dados.mfa_requerido) return { mfaRequerido: true, desafioId: dados.desafio_id };
    setTokens(dados.access_token, dados.refresh_token);
    return { mfaRequerido: false };
  },
  async verificarMfa(desafioId, codigo) {
    const dados = await req("POST", "/auth/mfa/verify", { json: { desafio_id: desafioId, codigo } });
    setTokens(dados.access_token, dados.refresh_token);
    return dados;
  },
  async logout() {
    if (refreshToken) { try { await req("POST", "/auth/logout", { json: { refresh_token: refreshToken } }); } catch {} }
    limparTokens();
  },
  me:          ()      => req("GET",  "/auth/me"),
  atualizarPerfil:(d)  => req("PATCH", "/auth/me", { json: d }),
  setupMfa:    ()      => req("POST", "/auth/mfa/setup"),
  ativarMfa:   (codigo)=> req("POST", "/auth/mfa/ativar", { json: { desafio_id: "x", codigo } }),
  desativarMfa:(senha) => req("POST", "/auth/mfa/desativar", { json: { senha } }),
  listarUsuarios:(o={})=> req("GET",  `/auth/usuarios${qs({limit:o.limit,offset:o.offset})}`).then(r => o.pagina ? r : r.items),
  criarUsuario:(u)     => req("POST", "/auth/usuarios", { json: u }),
  editarUsuario:(id,d) => req("PATCH", `/auth/usuarios/${id}`, { json: d }),
};

export const catalogo = {
  listarMateriais:    (o={}) => req("GET", `/materiais${qs({abaixo_minimo:o.abaixoMinimo,busca:o.busca,limit:o.limit,offset:o.offset})}`).then(r=>o.pagina?r:r.items),
  criarMaterial:      (m)    => req("POST", "/materiais", { json: m }),
  listarClasses:      (o={}) => req("GET", `/classes${qs({limit:o.limit,offset:o.offset})}`).then(r=>o.pagina?r:r.items),
  criarClasse:        (c)    => req("POST", "/classes", { json: c }),
  listarColaboradores:(o={}) => req("GET", `/colaboradores${qs({busca:o.busca,limit:o.limit,offset:o.offset})}`).then(r=>o.pagina?r:r.items),
  criarColaborador:   (c)    => req("POST", "/colaboradores", { json: c }),
  removerMaterial:    (id)   => req("DELETE", `/materiais/${id}`),
  removerColaborador: (id)   => req("DELETE", `/colaboradores/${id}`),

  // Importação por planilha
  importarColabPreview:   (arq)          => reqArquivo("/colaboradores/importar/preview", arq),
  importarColabConfirmar: (arq, ignorar) => reqArquivo("/colaboradores/importar/confirmar", arq, { ignorar_erros: ignorar }),
  modeloColaboradores:    ()             => reqBlob("/colaboradores/importar/modelo"),
  importarMatPreview:     (arq)          => reqArquivo("/materiais/importar/preview", arq),
  importarMatConfirmar:   (arq, ignorar) => reqArquivo("/materiais/importar/confirmar", arq, { ignorar_erros: ignorar }),
  modeloMateriais:        ()             => reqBlob("/materiais/importar/modelo"),
};

export const pedidos = {
  listar:  (statusFiltro, o={}) => req("GET", `/pedidos${qs({status_filtro:statusFiltro,limit:o.limit,offset:o.offset})}`).then(r=>o.pagina?r:r.items),
  detalhar:(id)        => req("GET",  `/pedidos/${id}`),
  criar:   (p)         => req("POST", "/pedidos",           { json:p, idempotente:uuid() }),
  aprovar: (id, dados) => req("POST", `/pedidos/${id}/aprovar`,  { json:dados, idempotente:uuid() }),
  comprar: (id, dados) => req("POST", `/pedidos/${id}/comprar`,  { json:dados, idempotente:uuid() }),
  receber: (id)        => req("POST", `/pedidos/${id}/receber`,  { idempotente:uuid() }),
};

export const operacoes = {
  baixaQr:               (dados) => req("POST", "/estoque/baixa-qr",       { json:dados, idempotente:uuid() }),
  devolverComodato:      (id, obs) => req("POST", "/comodatos/devolver",   { json:{ comodato_id: id, observacao: obs }, idempotente:uuid() }),
  listarComodatos:       (apenasAbertos=true) => req("GET", `/comodatos?apenas_abertos=${apenasAbertos}`),
  comodatosPorColaborador: () => req("GET", "/comodatos/por-colaborador"),
  entradaEstoque:        (dados) => req("POST", "/estoque/entrada",        { json:dados, idempotente:uuid() }),
  integridadeKardex:     (id)    => req("GET",  `/estoque/integridade/${id}`),
  listarUsuarios:        ()      => req("GET",  "/auth/usuarios"),
  buscarColaboradores:   (q)     => req("GET",  `/colaboradores/buscar${qs({q})}`),
  listarMovimentacoes:   (o={})  => req("GET",  `/estoque/movimentacoes${qs(o)}`),
};

export const requisicoes = {
  criar:          (dados)  => req("POST",  "/requisicoes",                 { json:dados, idempotente:uuid() }),
  listar:         (status) => req("GET",   `/requisicoes${qs({status})}`),
  marcarComprado: (id, obs) => req("PATCH", `/requisicoes/${id}/comprado`, { json:{ observacao: obs } }),
  marcarRecebido: (id, obs) => req("PATCH", `/requisicoes/${id}/recebido`, { json:{ observacao: obs } }),
  cancelar:       (id)     => req("PATCH", `/requisicoes/${id}/cancelar`,  { json:{} }),
};

export default { auth, catalogo, pedidos, operacoes, requisicoes, setTokens, limparTokens, estaAutenticado, configurarAuthLost, restaurarSessao };
