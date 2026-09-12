import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { T } from "../styles/tokens";

export function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const node = toast ? (
    <div style={{
      position:"fixed", bottom:24, left:"50%", zIndex:9999,
      transform:"translateX(-50%)", animation:"toastIn .22s ease-out",
      background:T.panel, border:`1px solid ${toast.err ? T.red+"55" : T.green+"55"}`,
      borderRadius:9, padding:"11px 18px", display:"flex", alignItems:"center", gap:10,
      boxShadow:"0 20px 60px -10px #000c, 0 0 0 1px #ffffff08",
      minWidth:240, maxWidth:440,
    }}>
      {toast.err
        ? <AlertTriangle size={15} color={T.red} style={{ flexShrink:0 }} />
        : <CheckCircle2 size={15} color={T.green} style={{ flexShrink:0 }} />}
      <span style={{ fontSize:13.5 }}>{toast.msg}</span>
    </div>
  ) : null;

  return [node, (msg, err = false) => setToast({ msg, err })];
}
