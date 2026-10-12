export const shortId = (id = '') => String(id).slice(0, 8);

export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CR', { hour12: false });
}

// Con milisegundos: en la línea de tiempo varios pasos ocurren dentro del mismo segundo.
export function formatTimeMs(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatTime(iso)}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

// Pretty-print de un cuerpo JSON; si no es JSON se devuelve tal cual.
export function prettyJson(value) {
  if (value == null || value === '') return '';
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const FINAL_STATUSES = ['APPROVED', 'REJECTED'];

// Milisegundos entre que la tienda creó el pago y el webhook con el resultado final lo actualizó.
export function confirmationMs(payment) {
  if (!payment || !FINAL_STATUSES.includes(payment.status)) return null;
  const ms = Date.parse(payment.updatedAt) - Date.parse(payment.createdAt);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

export function formatDuration(ms) {
  if (ms == null) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

// Etiqueta y tono (para .badge) de cada estado de pago y de pedido.
export const STATUS_INFO = {
  PENDING: { label: 'Pendiente', tone: 'warn' },
  DEFERRED: { label: 'Diferido', tone: 'warn' },
  APPROVED: { label: 'Aprobado', tone: 'ok' },
  REJECTED: { label: 'Rechazado', tone: 'danger' },
  PENDING_PAYMENT: { label: 'Esperando pago', tone: 'warn' },
  PAID: { label: 'Pagado', tone: 'ok' },
  PAYMENT_REJECTED: { label: 'Pago rechazado', tone: 'danger' },
};

export const statusInfo = (status) => STATUS_INFO[status] ?? { label: status ?? '—', tone: 'warn' };

// Qué hizo la tienda con cada webhook que le llegó.
export const OUTCOME_INFO = {
  APPLIED: { label: 'Aplicado', tone: 'ok' },
  DUPLICATE: { label: 'Repetido · sin cambios', tone: 'info' },
  INVALID_SIGNATURE: { label: 'Firma inválida', tone: 'danger' },
  STORE_DOWN: { label: 'Tienda caída', tone: 'danger' },
  REJECTED: { label: 'Rechazado', tone: 'danger' },
};

export const outcomeInfo = (outcome) => OUTCOME_INFO[outcome] ?? { label: outcome ?? '—', tone: 'warn' };

export const DELIVERY_RESULT = {
  DELIVERED: { label: 'Entregado', tone: 'ok' },
  FAILED: { label: 'Falló', tone: 'danger' },
};

export const deliveryResult = (result) => DELIVERY_RESULT[result] ?? { label: result ?? '—', tone: 'warn' };
