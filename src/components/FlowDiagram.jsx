import Icon from './Icon.jsx';

const STEPS = [
  { icon: 'package', who: 'Servicio A', tone: 'a', title: 'Pedido creado', desc: 'POST /pedidos' },
  { icon: 'lock', who: 'Servicio A', tone: 'a', title: 'Payload firmado', desc: 'HMAC-SHA256 con la clave secreta' },
  { icon: 'send', who: 'En tránsito', tone: 'transit', title: 'Webhook enviado', desc: 'POST /webhooks/pedido + X-Signature' },
  { icon: 'shield', who: 'Servicio B', tone: 'b', title: 'Firma verificada', desc: 'Recalcula el HMAC y lo compara' },
];

const range = (active) => STEPS.map((_, i) => (i < active ? 'done' : i === active ? 'active' : 'idle'));

// Traduce la fase actual (lo que realmente ocurrió) al estado visual de cada paso y al mensaje.
// Estados de paso: idle | active | done | error | skipped
export function describeFlow(flow) {
  switch (flow.phase) {
    case 'creating':
      return { states: range(0), tone: 'info', text: 'Creando el pedido en el Servicio A…' };
    case 'delivering': {
      const texts = [
        '',
        'A firma el payload con HMAC-SHA256 usando la clave secreta compartida…',
        'A envía el POST con la firma en el header X-Signature…',
        'B recalcula la firma con su copia de la clave y la compara…',
      ];
      return { states: range(flow.active), tone: 'info', text: texts[flow.active] };
    }
    case 'delivered':
      return {
        states: ['done', 'done', 'done', 'done'],
        tone: 'ok',
        text:
          flow.latency != null
            ? `B verificó la firma y registró el evento. Llegó ${flow.latency} ms después de crear el pedido.`
            : 'B verificó la firma y registró el evento.',
      };
    case 'timeout':
      return {
        states: ['done', 'done', 'done', 'error'],
        tone: 'danger',
        text: 'B no confirmó el evento en 6 segundos. Revisa que la URL de la suscripción apunte a B y que B esté en línea.',
      };
    case 'nosubs':
      return {
        states: ['done', 'skipped', 'skipped', 'skipped'],
        tone: 'warn',
        text: 'El pedido se guardó, pero A no tiene ninguna suscripción a "pedido.creado", así que no envió nada. Registra una en el paso 1.',
      };
    case 'fake-sending':
      return {
        states: ['skipped', 'skipped', 'active', 'idle'],
        tone: 'info',
        text: 'Enviando a B un webhook con una firma inventada, sin pasar por A…',
      };
    case 'rejected':
      return {
        states: ['skipped', 'skipped', 'done', 'error'],
        tone: 'danger',
        text: 'B rechazó la petición (HTTP 401): la firma no coincide y no se registró ningún evento. Es lo esperado: la verificación funciona.',
      };
    case 'breach':
      return {
        states: ['skipped', 'skipped', 'done', 'error'],
        tone: 'danger',
        text: '¡Atención! B aceptó una petición con firma falsa. Revisa la verificación HMAC del Servicio B.',
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
        text: 'Crea un pedido para ver el recorrido del webhook, paso a paso.',
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
        <h2>Así viaja un webhook</h2>
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
