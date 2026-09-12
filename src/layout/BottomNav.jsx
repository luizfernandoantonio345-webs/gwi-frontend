import { Menu } from "lucide-react";
import { T } from "../styles/tokens";

function ItemNav({ ativo, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 3, padding: "8px 2px", minHeight: 56, border: "none", background: "transparent", cursor: "pointer",
        color: ativo ? T.cyan : T.sub,
      }}
    >
      <Icon size={21} />
      <span style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1, maxWidth: 72, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

// Barra de navegação inferior para mobile/PDA.
// Mostra os primeiros itens do papel + botão "Menu" que abre o drawer completo.
export function BottomNav({ nav, page, onNavigate, onOpenMenu, maxItems = 4 }) {
  const principais = nav.slice(0, maxItems);

  return (
    <nav
      className="bottom-nav"
      style={{
        display: "flex", alignItems: "stretch",
        borderTop: `1px solid ${T.border}`, background: `${T.bg}f2`, backdropFilter: "blur(10px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {principais.map(n => (
        <ItemNav key={n.id} ativo={page === n.id} onClick={() => onNavigate(n.id)} icon={n.icon} label={n.label} />
      ))}
      <ItemNav ativo={false} onClick={onOpenMenu} icon={Menu} label="Menu" />
    </nav>
  );
}
