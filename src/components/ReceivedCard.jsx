import Card from './Card.jsx';
import Icon from './Icon.jsx';
import StatusBadge from './StatusBadge.jsx';
import { clickableRow } from './clickableRow.js';
import { useFreshKeys } from '../usePolling.js';
import { formatTime, outcomeInfo, shortId } from '../format.js';

const SIGNATURE = {
  true: { icon: 'check', label: 'Válida', tone: 'ok' },
  false: { icon: 'x', label: 'Inválida', tone: 'danger' },
  null: { icon: null, label: 'No revisada', tone: 'muted' },
};

export default function ReceivedCard({ received, loaded, error, storeDown, onOpen }) {
  const fresh = useFreshKeys(
    received.map((r) => r.id),
    loaded,
  );

  return (
    <Card
      step={5}
      done={received.some((r) => r.outcome === 'APPLIED')}
      title="Webhooks recibidos por la tienda"
      subtitle="Lo que llegó al Servicio A y qué hizo con cada uno, incluidos los rechazados."
      badge={
        storeDown ? (
          <span className="live" data-off="true">
            <span className="dot" />
            tienda caída
          </span>
        ) : (
          <span className="live" data-off={error ? 'true' : 'false'}>
            <span className="dot" />
            {error ? 'sin conexión' : 'en vivo'}
          </span>
        )
      }
    >
      {received.length === 0 ? (
        <div className="empty">
          <Icon name="inbox" size={34} />
          <strong>{error ? 'No se puede conectar con la tienda' : 'La tienda todavía no ha recibido webhooks'}</strong>
          <span>
            {error
              ? 'Comprueba que el Servicio A esté corriendo.'
              : 'Aquí aparece cada petición que llega a POST /webhooks/payments: válidas, repetidas y falsas.'}
          </span>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Resultado</th>
                <th>Firma</th>
                <th className="num">HTTP</th>
                <th>Estado enviado</th>
                <th>Pago ID</th>
              </tr>
            </thead>
            <tbody>
              {received.map((r) => {
                const outcome = outcomeInfo(r.outcome);
                const signature = SIGNATURE[String(r.signatureValid)];
                return (
                  <tr
                    key={r.id}
                    {...clickableRow(
                      () => onOpen(r.id),
                      `Ver el webhook recibido a las ${formatTime(r.receivedAt)}`,
                      fresh.has(r.id) ? 'is-new' : undefined,
                    )}
                  >
                    <td className="mono">{formatTime(r.receivedAt)}</td>
                    <td>
                      <span className="badge" data-tone={outcome.tone}>
                        {outcome.label}
                      </span>
                    </td>
                    <td>
                      <span className="sig" data-tone={signature.tone}>
                        {signature.icon && <Icon name={signature.icon} size={14} />}
                        {signature.label}
                      </span>
                    </td>
                    <td className="num mono">{r.httpStatus}</td>
                    <td>{r.status ? <StatusBadge status={r.status} /> : '—'}</td>
                    <td className="mono faint" title={r.paymentId ?? undefined}>
                      {r.paymentId ? shortId(r.paymentId) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
