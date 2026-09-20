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

// Devuelve la hora actual y se actualiza cada `interval` ms.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
