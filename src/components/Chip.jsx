import { STATUS, URG } from "../constants";

export function Chip({ status }) {
  const c = STATUS[status] || { label: status, cor: "#445266" };
  return (
    <span className="chip mono" style={{ background:`${c.cor}1a`, color:c.cor, border:`1px solid ${c.cor}28` }}>
      <span className="chip-dot" style={{ background: c.cor }} />
      {c.label}
    </span>
  );
}

export function UrgBadge({ u }) {
  const cfg = URG[u] || { label: u, cor: "#445266" };
  return <span style={{ color: cfg.cor, fontSize: 13, fontWeight: 500 }}>{cfg.label}</span>;
}
