import Icon from './Icon.jsx';
import { formatDuration } from '../format.js';

const STEPS = [
  { icon: 'credit-card', who: 'Servicio A · tienda', tone: 'a', title: 'Pago creado', desc: 'POST /payments → PENDING' },
  { icon: 'clock', who: 'Servicio B · proveedor', tone: 'b', title: 'Procesando', desc: 'Responde PROCESSING y decide' },
  { icon: 'send', who: 'En tránsito', tone: 'transit', title: 'Webhook enviado', desc: 'POST /webhooks/payments + X-Signature' },
  { icon: 'shield', who: 'Servicio A · tienda', tone: 'a', title: 'Pago confirmado', desc: 'Verifica el HMAC y actualiza' },
];

const range = (active) => STEPS.map((_, i) => (i < active ? 'done' : i === active ? 'active' : 'idle'));

// Traduce la fase actual (lo que realmente ocurrió) al estado visual de cada paso y al mensaje.
// Estados de paso: idle | active | done | error | skipped
export function describeFlow(flow) {
  switch (flow.phase) {
    case 'creating':
      return { states: range(0), tone: 'info', text: 'La tienda crea el pedido y el pago en PENDING, y se lo envía al proveedor…' };
    case 'processing':
      return {
        states: range(1),
        tone: 'info',
        text: 'El proveedor respondió PROCESSING y está procesando el pago. Nadie le pregunta: cuando termine, avisará con un webhook…',
      };
    case 'deferred':
      return {
        states: range(1),
        tone: 'warn',
        text: 'Llegó un webhook DEFERRED: el pago quedó diferido y el pedido sigue esperando. El proveedor enviará otro webhook con el resultado final…',
      };
    case 'delivered': {
      const approved = flow.status === 'APPROVED';
      return {
        states: ['done', 'done', 'done', 'done'],
        tone: approved ? 'ok' : 'warn',
        text: `${approved ? 'Pago aprobado: el pedido quedó pagado.' : 'Pago rechazado: el pedido quedó sin pagar.'} La tienda se enteró por el webhook firmado, ${formatDuration(flow.ms)} después de crear el pago.`,
      };
    }
    case 'failed':
      return {
        states: ['done', 'done', 'error', 'idle'],
        tone: 'danger',
        text: `El proveedor no pudo entregar el webhook ${flow.status ?? ''}: la tienda respondió ${flow.http ? `HTTP ${flow.http}` : 'con un error'} en los ${flow.attempts} intentos. El pedido sigue esperando. Enciende la tienda y usa "Reenviar" en esa entrega.`,
      };
    case 'timeout':
      return {
        states: ['done', 'done', 'error', 'idle'],
        tone: 'danger',
        text: 'La tienda no recibió el resultado a tiempo. Revisa en "Webhooks enviados" si la entrega falló y que la URL suscrita apunte a la tienda.',
      };
    case 'nosubs':
      return {
        states: ['done', 'done', 'skipped', 'skipped'],
        tone: 'warn',
        text: 'El pago se creó, pero el proveedor no tiene ninguna URL suscrita a "payment.updated", así que no avisará a nadie y el pago quedará en PENDING. Registra una en el paso 1.',
      };
    case 'fake-sending':
      return {
        states: ['skipped', 'skipped', 'active', 'idle'],
        tone: 'info',
        text: 'Enviando a la tienda un webhook con una firma inventada, sin pasar por el proveedor…',
      };
    case 'rejected':
      return {
        states: ['skipped', 'skipped', 'done', 'error'],
        tone: 'ok',
        text: 'La tienda rechazó la petición (HTTP 401): la firma no coincide y no cambió ningún pago. Es lo esperado: la verificación funciona.',
      };
    case 'breach':
      return {
        states: ['skipped', 'skipped', 'done', 'error'],
        tone: 'danger',
        text: '¡Atención! La tienda aceptó una petición con firma falsa. Revisa la verificación HMAC del Servicio A.',
      };
    case 'error':
      return {
        states: ['error', 'idle', 'idle', 'idle'],
        tone: 'danger',
        text: flow.detail ? `Algo falló: ${flow.detail}` : 'Algo falló al comunicarse con los servicios.',
      };
    default:
      return {
        states: ['idle', 'idle', 'idle', 'idle'],
        tone: 'muted',
        text: 'Haz una compra para ver cómo el proveedor avisa el resultado del pago a la tienda, paso a paso.',
      };
  }
}

// Estado del tramo entre dos pasos consecutivos.
function linkState(a, b) {
  if (a === 'skipped' && b === 'skipped') return 'skipped';
  if (b === 'active' && a !== 'idle') return 'active';
  if (a === 'skipped' && b === 'done') return 'done';
  if (a === 'done' && b === 'done') return 'done';
  if (a === 'done' && b === 'error') return 'error';
  if (a === 'skipped') return 'skipped';
  return 'idle';
}

const STATE_TEXT = {
  idle: 'pendiente',
  active: 'en curso',
  done: 'completado',
  error: 'falló',
  skipped: 'no aplica',
};

const CAPTION_ICON = { info: 'info', ok: 'check', warn: 'alert', danger: 'alert', muted: 'info' };

export default function FlowDiagram({ flow }) {
  const { states, tone, text } = describeFlow(flow);

  return (
    <section className="card flow-card" aria-label="Recorrido del webhook">
      <div className="flow-head">
        <h2>Así se confirma un pago con un webhook</h2>
        <p>El diagrama se anima con lo que realmente responden los servicios.</p>
      </div>

      <ol className="flow">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flow-step"
            data-state={states[i]}
            data-tone={step.tone}
            aria-current={states[i] === 'active' ? 'step' : undefined}
          >
            <div className="node">
              <Icon name={step.icon} size={24} />
              {states[i] === 'done' && (
                <span className="node-badge ok">
                  <Icon name="check" size={11} />
                </span>
              )}
              {states[i] === 'error' && (
                <span className="node-badge bad">
                  <Icon name="x" size={11} />
                </span>
              )}
            </div>
            <div className="flow-text">
              <span className="tag">{step.who}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <span className="sr-only">{STATE_TEXT[states[i]]}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="link" data-state={linkState(states[i], states[i + 1])} aria-hidden="true">
                <i />
              </div>
            )}
          </li>
        ))}
      </ol>

      <p className="flow-caption" data-tone={tone} role="status" aria-live="polite">
        <Icon name={CAPTION_ICON[tone]} size={18} />
        <span>{text}</span>
      </p>
    </section>
  );
}
