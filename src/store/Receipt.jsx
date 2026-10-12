import { colones } from './catalog.js';
import { confirmationMs, formatDuration, formatTime, shortId } from '../format.js';

const PROVIDER_NAME = { ONVO: 'ONVO', FAKE: 'el proveedor simulado' };

// Estado visual de los tres pasos del pedido según el estado real del pago en la tienda.
function stages(status, provider) {
  const name = PROVIDER_NAME[provider] ?? 'el proveedor';
  switch (status) {
    case 'APPROVED':
      return {
        tone: 'ok',
        pay: { state: 'done', title: 'Pago aprobado', text: `${name === 'ONVO' ? 'ONVO' : 'El proveedor'} confirmó el pago.` },
        prep: { state: 'active', title: 'Preparando tu pedido', text: 'Ya lo estamos alistando.' },
        headline: '¡Gracias por tu compra!',
      };
    case 'REJECTED':
      return {
        tone: 'bad',
        pay: { state: 'error', title: 'Pago rechazado', text: 'No se hizo ningún cobro.' },
        prep: { state: 'skipped', title: 'Pedido sin pagar', text: 'No se preparará hasta que el pago sea aprobado.' },
        headline: 'No pudimos cobrar tu compra',
      };
    case 'DEFERRED':
      return {
        tone: 'wait',
        pay: { state: 'active', title: 'Pago en revisión', text: 'Queda diferido: el proveedor enviará el resultado final.' },
        prep: { state: 'idle', title: 'Preparando tu pedido', text: 'Empieza cuando el pago sea aprobado.' },
        headline: 'Tu pago está en revisión',
      };
    default:
      return {
        tone: 'wait',
        pay: { state: 'active', title: 'Esperando la confirmación del pago', text: `Cuando ${name} termine, avisará a la tienda por webhook.` },
        prep: { state: 'idle', title: 'Preparando tu pedido', text: 'Empieza cuando el pago sea aprobado.' },
        headline: 'Recibimos tu pedido',
      };
  }
}

function Step({ state, title, text }) {
  return (
    <li className="track-step" data-state={state}>
      <span className="track-dot" aria-hidden="true">
        {state === 'done' ? '✓' : state === 'error' ? '✕' : state === 'skipped' ? '–' : ''}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </li>
  );
}

export default function Receipt({ purchase, payment, order, past = false, onKeepShopping, onRetry, onReopenCheckout, onOpenDetail }) {
  const status = payment?.status ?? 'PENDING';
  const s = stages(status, purchase.provider);
  const waiting = status === 'PENDING' || status === 'DEFERRED';
  const ms = confirmationMs(payment);

  return (
    <section className="panel receipt" id="carrito" data-tone={s.tone} aria-label="Resumen de tu compra" aria-live="polite">
      <header className="receipt-head">
        <span className="receipt-badge" aria-hidden="true">
          {s.tone === 'ok' ? '🎉' : s.tone === 'bad' ? '😕' : '⏳'}
        </span>
        <div>
          <h2>{s.headline}</h2>
          <p>
            Pedido <span className="mono">#{shortId(purchase.id)}</span> · {formatTime(purchase.createdAt)}
          </p>
        </div>
      </header>

      <ol className="tracker">
        <Step state="done" title="Pedido recibido" text="Lo registramos en la tienda." />
        <Step {...s.pay} />
        <Step {...s.prep} />
      </ol>

      {waiting && purchase.provider === 'ONVO' && purchase.onvo && onReopenCheckout && (
        <button type="button" className="ghost-btn" onClick={onReopenCheckout}>
          Abrir el formulario de pago
        </button>
      )}

      <div className="ticket" role="group" aria-label="Ticket de compra">
        <p className="ticket-title">TICKET · SÚPER WEBHOOKS</p>
        <ul>
          {purchase.items.length === 0 ? (
            <li>
              <span>{purchase.label}</span>
              <span>{colones(purchase.total)}</span>
            </li>
          ) : (
            purchase.items.map(({ product, qty }) => (
              <li key={product.id}>
                <span>
                  {qty} × {product.name}
                </span>
                <span>{colones(product.price * qty)}</span>
              </li>
            ))
          )}
        </ul>
        <p className="ticket-total">
          <span>TOTAL</span>
          <span>{colones(purchase.total)}</span>
        </p>
        <dl className="ticket-meta">
          <div>
            <dt>Pago</dt>
            <dd>{purchase.provider === 'ONVO' ? 'Tarjeta · ONVO' : 'Proveedor simulado'}</dd>
          </div>
          <div>
            <dt>Estado del pedido</dt>
            <dd>{order ? { PAID: 'Pagado', PENDING_PAYMENT: 'Esperando pago', PAYMENT_REJECTED: 'Pago rechazado' }[order.status] ?? order.status : 'Esperando pago'}</dd>
          </div>
          {ms != null && (
            <div>
              <dt>Confirmación</dt>
              <dd>en {formatDuration(ms)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="receipt-actions">
        {past ? (
          <button type="button" className="pay-btn" onClick={onKeepShopping}>
            Volver a la tienda
          </button>
        ) : status === 'REJECTED' ? (
          <button type="button" className="pay-btn" onClick={onRetry}>
            Volver a intentar
          </button>
        ) : (
          <button type="button" className="pay-btn" onClick={onKeepShopping} disabled={waiting}>
            {waiting ? 'Esperando confirmación…' : 'Seguir comprando'}
          </button>
        )}
        {!past && status === 'REJECTED' && (
          <button type="button" className="ghost-btn" onClick={onKeepShopping}>
            Cancelar compra
          </button>
        )}
        <button type="button" className="link-btn" onClick={onOpenDetail}>
          Ver la línea de tiempo técnica
        </button>
      </div>
    </section>
  );
}
