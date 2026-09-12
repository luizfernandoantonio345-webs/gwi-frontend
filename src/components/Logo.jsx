import { useId } from "react";

// Brasão GRAMO — hexágono de engenharia com "G" 100% vetorial (sem fonte).
// `size` em px. `glow` liga o brilho externo. `animated` faz o brilho pulsar.
export function Logo({ size = 48, glow = false, animated = false }) {
  const uid = useId().replace(/:/g, "");
  const grad = `grad-${uid}`;
  const gradG = `gradG-${uid}`;
  const soft = `soft-${uid}`;

  const hex = "M32 3 L55.6 16.5 L55.6 47.5 L32 61 L8.4 47.5 L8.4 16.5 Z";
  const hexInner = "M32 10 L49.9 20.2 L49.9 43.8 L32 54 L14.1 43.8 L14.1 20.2 Z";
  // "G" geométrico: arco em C (boca à direita) + travessa horizontal para dentro.
  const gArc = "M42.5 24 A13 13 0 1 0 42.5 40";
  const gBar = "M42.5 40 L42.5 33 L33 33";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      className={animated ? "glow-pulse" : undefined}
      style={{ borderRadius: "22%", filter: glow ? "drop-shadow(0 0 14px rgba(0,230,168,.55))" : undefined }}>
      <defs>
        <linearGradient id={grad} x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a2a32" />
          <stop offset="1" stopColor="#03141a" />
        </linearGradient>
        <linearGradient id={gradG} x1="18" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4dffce" />
          <stop offset=".55" stopColor="#00e6a8" />
          <stop offset="1" stopColor="#00b483" />
        </linearGradient>
        <linearGradient id={soft} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".14" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Brasão */}
      <path d={hex} fill={`url(#${grad})`} stroke={`url(#${gradG})`} strokeWidth="2.4" strokeLinejoin="round" />
      {/* Realce superior */}
      <path d={hex} fill={`url(#${soft})`} />
      {/* Bisel interno */}
      <path d={hexInner} fill="none" stroke="#00e6a8" strokeOpacity=".28" strokeWidth="1.2" strokeLinejoin="round" />

      {/* G vetorial */}
      <g fill="none" stroke={`url(#${gradG})`} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={gArc} />
        <path d={gBar} />
      </g>
    </svg>
  );
}
