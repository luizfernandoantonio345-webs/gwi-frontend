import { useState, useEffect } from "react";

// Retorna true quando a viewport é de celular/PDA (≤768px).
export function useIsMobile(breakpoint = 768) {
  const consulta = `(max-width:${breakpoint}px)`;
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(consulta).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(consulta);
    const onChange = e => setMobile(e.matches);
    mql.addEventListener("change", onChange);
    setMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [consulta]);

  return mobile;
}
