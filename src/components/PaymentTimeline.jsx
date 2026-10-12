import Modal from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import { FINAL_STATUSES, formatMoney, formatTimeMs, shortId } from '../format.js';

const ACTOR = {
  a: 'Tienda · A',
  b: 'Proveedor · B',
  transit: 'Webhook',
};

const ORDER_EFFECT = {
  APPROVED: ' y marca el pedido como pagado',
  REJECTED: ' y marca el pedido como pago rechazado',
  DEFERRED: '; el pedido sigue esperando',
};

function receivedEvent(r) {
  switch (r.outcome) {
    case 'APPLIED':
      return { tone: 'a', title: `La tienda verifica la firma y aplica ${r.status}${ORDER_EFFECT[r.status] ?? ''}` };
    case 'DUPLICATE':
      return { tone: 'a', title: `La tienda recibe ${r.status} otra vez: responde 200 sin aplicar cambios` };
    case 'STORE_DOWN':
      return { tone: 'danger', title: 'La tienda está caída: responde 503 y no procesa nada' };
    case 'INVALID_SIGNATURE':
      return { tone: 'danger', title: 'La tienda rechaza un webhook con firma inválida (401)' };
    default:
      return { tone: 'danger', title: `La tienda rechaza el webhook (HTTP ${r.httpStatus})` };
  }
}

// Une lo que sabe la tienda (pago y webhooks recibidos) con lo que sabe el proveedor
// (cobro recibido y webhooks enviados), ordenado por hora.
export function buildTimeline({ payment, order, providerPayment, deliveries, received }) {
  const events = [];

  if (providerPayment) {
    events.push({
      key: 'provider',
      at: providerPayment.receivedAt,
      actor: 'b',
      tone: 'b',
      title: 'El proveedor recibe el cobro y responde PROCESSING',
      detail: `Id externo ${shortId(providerPayment.externalPaymentId)} · empieza a procesar`,
    });
  }

  for (const d of deliveries) {
    const status = d.payload?.status;
    const failed = d.result === 'FAILED';
    events.push({
      key: `d-${d.id}`,
      at: d.sentAt,
      actor: 'transit',
      tone: failed ? 'danger' : 'transit',
      title: `El proveedor envía el webhook ${status}${d.replayOf ? ' (reenvío manual)' : ''}`,
      detail: failed
        ? `Falló tras ${d.attempts} intentos${d.responseStatus ? ` · última respuesta HTTP ${d.responseStatus}` : ''}`
        : `Entregado en el intento ${d.attempts} · HTTP ${d.responseStatus}`,
    });
  }

  for (const r of received) {
    events.push({ key: `r-${r.id}`, at: r.receivedAt, actor: 'a', detail: r.message, ...receivedEvent(r) });
  }

  events.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));

  return [
    {
      key: 'created',
      at: payment.createdAt,
      actor: 'a',
      tone: 'a',
      title: 'La tienda crea el pedido y el pago en PENDING',
      detail: `${order?.product ?? 'Pedido'} · ₡${formatMoney(payment.amount)} · se lo envía al proveedor`,
    },
    ...events,
  ];
}

const offset = (from, at) => {
  const ms = Math.max(0, Date.parse(at) - Date.parse(from));
  return Number.isFinite(ms) ? `+${(ms / 1000).toFixed(2)} s` : '';
};

export default function PaymentTimeline({ payment, order, providerPayment, deliveries, received, onClose }) {
  if (!payment) return null;

  const events = buildTimeline({ payment, order, providerPayment, deliveries, received });
  const waiting = !FINAL_STATUSES.includes(payment.status);

  return (
    <Modal
      open
      onClose={onClose}
      title="Línea de tiempo del pago"
      subtitle={`Pago ${shortId(payment.id)} · ${order?.product ?? ''}`}
    >
      <dl className="facts">
        <div>
          <dt>Pago</dt>
          <dd>
            <StatusBadge status={payment.status} />
          </dd>
        </div>
        <div>
          <dt>Pedido</dt>
          <dd>{order ? <StatusBadge status={order.status} /> : '—'}</dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd className="mono">₡{formatMoney(payment.amount)}</dd>
        </div>
      </dl>

      <ol className="timeline">
        {events.map((e) => (
          <li key={e.key} data-tone={e.tone}>
            <span className="timeline-dot" aria-hidden="true" />
            <div className="timeline-time">
              <span className="mono">{formatTimeMs(e.at)}</span>
              <span className="mono faint">{offset(payment.createdAt, e.at)}</span>
            </div>
            <div className="timeline-body">
              <span className="timeline-actor">{ACTOR[e.actor]}</span>
              <strong>{e.title}</strong>
              {e.detail && <span className="faint">{e.detail}</span>}
            </div>
          </li>
        ))}
        {waiting && (
          <li data-tone="waiting">
            <span className="timeline-dot" aria-hidden="true" />
            <div className="timeline-time">
              <span className="spinner tiny" aria-hidden="true" />
            </div>
            <div className="timeline-body">
              <strong>Esperando el resultado del proveedor…</strong>
              <span className="faint">Nadie consulta al proveedor: la tienda espera su webhook.</span>
            </div>
          </li>
        )}
      </ol>

      <p className="hint">
        Las horas vienen de cada servicio. Los registros de webhooks están en memoria y se pierden al reiniciar A o B.
      </p>
    </Modal>
  );
}
