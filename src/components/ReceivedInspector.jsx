import Modal, { CodeBlock } from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatTimeMs, outcomeInfo, prettyJson, shortId } from '../format.js';

const SIGNATURE_TEXT = {
  true: 'Válida: coincide con el HMAC calculado con la clave compartida',
  false: 'Inválida: no coincide, el mensaje se descarta',
  null: 'No se revisó',
};

export default function ReceivedInspector({ entry, onClose }) {
  if (!entry) return null;

  const outcome = outcomeInfo(entry.outcome);

  return (
    <Modal
      open
      onClose={onClose}
      title="Webhook recibido por la tienda"
      subtitle={`${formatTimeMs(entry.receivedAt)} · respondió HTTP ${entry.httpStatus}`}
    >
      <dl className="facts">
        <div>
          <dt>Resultado</dt>
          <dd>
            <span className="badge" data-tone={outcome.tone}>
              {outcome.label}
            </span>
          </dd>
        </div>
        <div>
          <dt>Estado que traía</dt>
          <dd>{entry.status ? <StatusBadge status={entry.status} /> : '—'}</dd>
        </div>
        <div>
          <dt>Pago</dt>
          <dd className="mono" title={entry.paymentId ?? undefined}>
            {entry.paymentId ? shortId(entry.paymentId) : '—'}
          </dd>
        </div>
      </dl>

      <CodeBlock label="X-Signature" hint={SIGNATURE_TEXT[String(entry.signatureValid)]}>
        {entry.signature ?? '(no vino la cabecera)'}
      </CodeBlock>

      <CodeBlock label="Cuerpo recibido">{prettyJson(entry.body) || '(vacío)'}</CodeBlock>

      <CodeBlock label={`Respuesta · HTTP ${entry.httpStatus}`}>{entry.message}</CodeBlock>
    </Modal>
  );
}
