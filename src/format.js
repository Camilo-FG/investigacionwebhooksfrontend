export const shortId = (id = '') => String(id).slice(0, 8);

export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CR', { hour12: false });
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Milisegundos entre que A creó el pedido y B lo registró.
export function latencyMs(event) {
  const ms = Date.parse(event.receivedAt) - Date.parse(event.fecha);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}
