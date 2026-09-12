# GWI Materiais — Frontend

Interface web do sistema de gestão de materiais e almoxarifado da **GRAMO Engenharia**.
Aplicação SPA responsiva (desktop e mobile), instalável como PWA.

## Tecnologias

- **React 19** + **Vite**
- Design system próprio (tema escuro industrial) — sem framework de CSS
- `lucide-react` (ícones), `qrcode.react` (geração de QR), `html5-qrcode` (leitura de QR)
- Notificações em tempo real via **WebSocket** (com atualização periódica como fallback)

## Funcionalidades

- Autenticação com JWT + refresh automático; MFA (TOTP) opcional por usuário
- Perfis de acesso: Almoxarife, ADM/Compras e Gerente
- Baixa de materiais por QR Code (crachá do colaborador e código do material)
- Pedidos, aprovações por alçada, fila de compras e entrada de estoque
- Comodato de ferramentas (retirada e devolução)
- Solicitações de reposição de estoque
- Cadastro e **importação por planilha** (`.xlsx`/`.csv`) de materiais e colaboradores
- Geração e impressão de QR Code para colaboradores e ferramentas
- Notificações em tempo real com aviso visual e sonoro

## Executando localmente

```bash
npm install
npm run dev
```

Configure a URL da API pela variável de ambiente `VITE_API_BASE` (padrão: `http://localhost:8000`).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualização do build |
| `npm run lint` | Análise estática (oxlint) |

## Estrutura

```
src/
  api/         cliente HTTP + WebSocket
  components/  componentes reutilizáveis
  hooks/       hooks (dados, responsividade, toasts)
  layout/      sidebar, topbar, navegação mobile
  pages/       telas por funcionalidade
  styles/      tokens de tema
  utils/       formatação, perfil, som
```

## Deploy

Publicado como site estático (build do Vite). A URL da API é definida por `VITE_API_BASE`
no ambiente de build. O deploy é automático a cada push na branch `master`.

## Licença

Uso interno — GRAMO Engenharia. Todos os direitos reservados.
