import { useState, useEffect, useCallback } from "react";

// Cache em memória para "stale-while-revalidate": ao revisitar uma tela,
// mostra o dado anterior na hora e atualiza em segundo plano (sem loader).
const _cache = new Map();

export function useAsync(fn, deps, cacheKey, pollMs) {
  const seeded = cacheKey != null && _cache.has(cacheKey);
  const [data, setData]       = useState(seeded ? _cache.get(cacheKey) : null);
  const [loading, setLoading] = useState(!seeded);
  const [err, setErr]         = useState(null);

  const exec = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fn();
      setData(r);
      if (cacheKey != null) _cache.set(cacheKey, r);
    } catch (e) { setErr(e.message || "Erro."); }
    finally { setLoading(false); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Se já há cache, revalida em silêncio (tela abre instantânea).
  useEffect(() => { exec({ silent: seeded }); }, [exec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualização automática em segundo plano (near-real-time), sem loader.
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => exec({ silent: true }), pollMs);
    return () => clearInterval(id);
  }, [exec, pollMs]);

  return {
    data, loading, err,
    reload: () => exec({ silent: false }),
    atualizar: () => exec({ silent: true }),
  };
}
