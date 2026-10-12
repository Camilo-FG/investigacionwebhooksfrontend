import { useCallback, useEffect, useRef, useState } from 'react';

// Consulta `fetcher` cada `interval` ms y guarda el último resultado.
// Si una consulta falla, conserva los datos anteriores y expone el error.
export function usePolling(fetcher, interval) {
  const [state, setState] = useState({ data: null, error: null, loaded: false });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ data, error: null, loaded: true });
      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, error, loaded: true }));
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { ...state, refresh };
}

// Devuelve las claves que aparecieron mientras la página está abierta (no las que ya estaban al cargar).
export function useFreshKeys(keys, loaded) {
  const seen = useRef(null);
  const [fresh, setFresh] = useState(() => new Set());
  const joined = keys.join('\n');

  useEffect(() => {
    if (!loaded) return;
    const current = joined ? joined.split('\n') : [];
    if (seen.current === null) {
      seen.current = new Set(current);
      return;
    }
    const added = current.filter((k) => !seen.current.has(k));
    if (added.length) {
      added.forEach((k) => seen.current.add(k));
      setFresh((prev) => new Set([...prev, ...added]));
    }
  }, [joined, loaded]);

  return fresh;
}

// Cuántas claves llegaron sin que su sección estuviera visible. Al activarla se marcan como vistas.
export function useUnseen(keys, loaded, active) {
  const [seen, setSeen] = useState(null);
  const joined = keys.join('\n');

  useEffect(() => {
    if (!loaded) return;
    setSeen((prev) => {
      const current = joined ? joined.split('\n') : [];
      if (prev !== null && !active) return prev;
      if (prev !== null && current.every((k) => prev.has(k))) return prev;
      return new Set([...(prev ?? []), ...current]);
    });
  }, [joined, loaded, active]);

  if (!seen) return 0;
  return keys.filter((k) => !seen.has(k)).length;
}

// Devuelve la hora actual y se actualiza cada `interval` ms.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
