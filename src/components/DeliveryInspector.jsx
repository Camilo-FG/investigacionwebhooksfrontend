import Icon from './Icon.jsx';
import Modal, { CodeBlock } from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import { deliveryResult, formatTimeMs, prettyJson, shortId } from '../format.js';

export default function DeliveryInspector({ delivery, onClose, onReplay, replaying }) {
  if (!delivery) return null;

  const result = deliveryResult(delivery.result);
  const headers = Object.entries(delivery.request?.headers ?? {})
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
  const applied = delivery.responseBody?.applied;

  return (
    <Modal
      open
      onClose={onClose}
      title="Webhook enviado por el proveedor"
      subtitle={`Entrega ${shortId(delivery.id)} · ${formatTimeMs(delivery.sentAt)}`}
      footer={
        <>
          <p className="hint">
            Reenviar manda los mismos bytes con la misma firma. Si la tienda ya lo procesó, debe responder 200 sin
            cambiar nada.
          </p>
          <button type="button" className="btn primary" onClick={() => onReplay(delivery.id)} disabled={replaying}>
            {replaying ? <span className="spinner" aria-hidden="true" /> : <Icon name="repeat" size={17} />}
            Reenviar este webhook
          </button>
        </>
      }
    >
      <dl className="facts">
        <div>
          <dt>Evento</dt>
          <dd className="mono">{delivery.event}</dd>
        </div>
        <div>
          <dt>Estado avisado</dt>
          <dd>
            <StatusBadge status={delivery.payload?.status} />
          </dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>
            <span className="badge" data-tone={result.tone}>
              {result.label}
            </span>
          </dd>
        </div>
        <div>
          <dt>Pago</dt>
          <dd className="mono" title={delivery.payload?.paymentId}>
            {shortId(delivery.payload?.paymentId)}
          </dd>
        </div>
        {delivery.replayOf && (
          <div>
            <dt>Reenvío de</dt>
            <dd className="mono">{shortId(delivery.replayOf)}</dd>
          </div>
        )}
      </dl>

      <CodeBlock label="Petición" hint="Lo que salió del Servicio B hacia la tienda.">
        {`POST ${delivery.url}\n${headers}`}
      </CodeBlock>

      <CodeBlock
        label="Cuerpo (JSON)"
        hint="Se muestra con formato. La firma HMAC-SHA256 se calculó sobre los bytes originales de abajo."
      >
        {prettyJson(delivery.request?.body)}
      </CodeBlock>
      <pre className="code code-raw" aria-label="Bytes originales del cuerpo">
        {delivery.request?.body}
      </pre>

      <CodeBlock
        label={`Respuesta de la tienda${delivery.responseStatus ? ` · HTTP ${delivery.responseStatus}` : ''}`}
        hint={
          applied === false
            ? 'applied: false → la tienda ya lo había procesado y no cambió nada (idempotencia).'
            : applied === true
              ? 'applied: true → la tienda aplicó el cambio de estado.'
              : delivery.error
                ? `Error: ${delivery.error}`
                : undefined
        }
      >
        {prettyJson(delivery.responseBody) || '(sin respuesta)'}
      </CodeBlock>

      <section className="code-section">
        <h3>Intentos</h3>
        <ol className="attempts">
          {(delivery.attemptLog ?? []).map((a) => (
            <li key={a.attempt} data-ok={a.responseStatus >= 200 && a.responseStatus < 300 ? 'true' : 'false'}>
              <span className="mono">#{a.attempt}</span>
              <span className="mono">{formatTimeMs(a.at)}</span>
              <span>{a.responseStatus ? `HTTP ${a.responseStatus}` : a.error || 'sin respuesta'}</span>
              <span className="mono faint">{a.durationMs} ms</span>
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  );
}
