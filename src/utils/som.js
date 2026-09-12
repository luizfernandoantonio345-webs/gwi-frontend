// Notificação sonora via Web Audio (sem arquivo). Um "sino/chime" suave de dois
// tons: síntese aditiva (harmônicos) + filtro passa-baixa + decaimento longo.
// Soa como notificação de app profissional, não como "bip".
let _ctx;

function _sino(ctx, freq, inicio, dur, vol) {
  const t = ctx.currentTime + inicio;

  const master = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200; // remove aspereza
  master.connect(lp);
  lp.connect(ctx.destination);

  // envelope suave (ataque curto, cauda longa tipo sino)
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  // harmônicos normalizados (soma ~1) = mais volume sem distorcer
  const partials = [[1, 0.6], [2, 0.25], [3, 0.1], [4.2, 0.05]];
  for (const [mult, g] of partials) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    og.gain.value = g;
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

export function bipNotificacao() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _ctx = _ctx || new AC();
    if (_ctx.state === "suspended") _ctx.resume();
    // dois toques ascendentes e agradáveis (G5 -> C6) — volume mais alto
    _sino(_ctx, 783.99, 0.00, 0.95, 0.42);
    _sino(_ctx, 1046.50, 0.14, 1.15, 0.36);
  } catch { /* silêncio se o áudio não estiver disponível */ }
}
