import { T } from "../styles/tokens";

export const PAPEL = {
  ALMOXARIFE: "Almoxarife",
  ADM_COMPRAS: "ADM / Compras",
  GERENTE: "Gerente",
};

export const TIPO = {
  CONSUMIVEL: "Consumível",
  FERRAMENTA: "Ferramenta",
  EPI: "EPI",
};

export const STATUS = {
  RASCUNHO:             { label:"Rascunho",       cor:T.muted  },
  AGUARDANDO_GERENTE:   { label:"Ag. gerente",    cor:T.amber  },
  APROVADO:             { label:"Aprovado",        cor:T.cyan   },
  AGUARDANDO_COMPRA:    { label:"Ag. compra",      cor:T.blue   },
  COMPRADO:             { label:"Comprado",        cor:T.green  },
  RECEBIDO:             { label:"Recebido",        cor:T.green  },
  REJEITADO:            { label:"Rejeitado",       cor:T.red    },
  CANCELADO:            { label:"Cancelado",       cor:T.muted  },
};

export const URG = {
  BAIXA:   { label:"Baixa",   cor:T.muted },
  MEDIA:   { label:"Média",   cor:T.blue  },
  ALTA:    { label:"Alta",    cor:T.amber },
  CRITICA: { label:"Crítica", cor:T.red   },
};

export const PAGE_TITLES = {
  dashboard:   "Painel geral",
  baixaqr:     "Baixa por QR Code",
  pedido:      "Novo pedido",
  comodatos:   "Comodatos em aberto",
  materiais:   "Catálogo de materiais",
  aprovacoes:  "Aprovações",
  compras:     "Fila de compras",
  entrada:     "Entrada de estoque",
  cadastros:   "Cadastros",
  usuarios:    "Usuários do sistema",
  seguranca:   "Segurança",
  requisicoes: "Solicitações de estoque",
};

export const INICIO = {
  ALMOXARIFE:  "baixaqr",
  ADM_COMPRAS: "compras",
  GERENTE:     "dashboard",
};

// Quais páginas cada papel pode acessar (guarda de URL)
export const ACESSO = {
  dashboard:   ["GERENTE"],
  aprovacoes:  ["GERENTE"],
  baixaqr:     ["ALMOXARIFE"],
  requisicoes: ["ALMOXARIFE"],
  pedido:      ["ALMOXARIFE"],
  compras:     ["ADM_COMPRAS"],
  entrada:     ["ALMOXARIFE","ADM_COMPRAS"],
  comodatos:   ["ALMOXARIFE","GERENTE"],
  materiais:   ["ALMOXARIFE","ADM_COMPRAS","GERENTE"],
  cadastros:   ["ADM_COMPRAS","GERENTE"],
  usuarios:    ["GERENTE"],
  seguranca:   ["ALMOXARIFE","ADM_COMPRAS","GERENTE"],
};
