import { X } from "lucide-react";
import { T } from "../styles/tokens";

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:50,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:20, background:"#05080edd", backdropFilter:"blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="panel fade-up"
        style={{ width:"100%", maxWidth:wide?680:460, boxShadow:"0 40px 100px -20px #000" }}
      >
        <div className="panel-header">
          <h3 style={{ fontSize:15, fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ color:T.muted, cursor:"pointer", padding:4, borderRadius:6, display:"flex" }}>
            <X size={17} />
          </button>
        </div>
        <div style={{ padding:20, maxHeight:"74vh", overflowY:"auto" }}>{children}</div>
      </div>
    </div>
  );
}
