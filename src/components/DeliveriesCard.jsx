import Card from './Card.jsx';
import Icon from './Icon.jsx';
import StatusBadge from './StatusBadge.jsx';
import { clickableRow } from './clickableRow.js';
import { useFreshKeys } from '../usePolling.js';
import { deliveryResult, formatTime, shortId } from '../format.js';

export default function DeliveriesCard({ deliveries, loaded, error, onOpen, onReplay, replayingId }) {
  const fresh = useFreshKeys(
    deliveries.map((d) => d.id),
    loaded,
  );

  return (
    <Card
      step={4}
      done={deliveries.some((d) => d.result === 'DELIVERED')}
      title="Webhooks enviados por el proveedor"
      subtitle="Cada aviso firmado que el Servicio B le mandó a la tienda. Haz clic en uno para ver exactamente qué viajó."
      badge={
        <span className="live" data-off={error ? 'true' : 'false'}>
          <span className="dot" />
          {error ? 'sin conexión' : 'en vivo'}
        </span>
      }
    >
      {error && deliveries.length > 0 && (
        <p className="banner">
          <Icon name="alert" size={16} /> No se puede leer el Servicio B ahora. Se muestran los últimos datos.
        </p>
      )}

      {deliveries.length === 0 ? (
        <div className="empty">
          <Icon name="send" size={34} />
          <strong>{error ? 'No se puede conectar con el proveedor' : 'El proveedor todavía no ha enviado webhooks'}</strong>
          <span>
            {error
              ? 'Comprueba que el Servicio B esté corriendo.'
              : 'Cuando el proveedor termine de procesar un pago, aquí aparece el aviso que le envió a la tienda.'}
          </span>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Estado avisado</th>
                <th>Entrega</th>
                <th className="num">Intentos</th>
                <th className="num">HTTP</th>
                <th>Pago ID</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => {
                const result = deliveryResult(d.result);
                return (
                  <tr
                    key={d.id}
                    {...clickableRow(
                      () => onOpen(d.id),
                      `Ver el webhook ${d.payload?.status ?? ''} enviado a las ${formatTime(d.sentAt)}`,
                      fresh.has(d.id) ? 'is-new' : undefined,
                    )}
                  >
                    <td className="mono">{formatTime(d.sentAt)}</td>
                    <td>
                      <StatusBadge status={d.payload?.status} />
                      {d.replayOf && <span className="tag-event tag-inline">reenvío</span>}
                    </td>
                    <td>
                      <span className="badge" data-tone={result.tone}>
                        {result.label}
                      </span>
                    </td>
                    <td className="num mono">{d.attempts}</td>
                    <td className="num mono">{d.responseStatus ?? '—'}</td>
                    <td className="mono faint" title={d.payload?.paymentId}>
                      {shortId(d.payload?.paymentId)}
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className="icon-btn neutral"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplay(d.id);
                        }}
                        disabled={replayingId === d.id}
                        aria-label={`Reenviar el webhook ${d.payload?.status ?? ''}`}
                        title="Reenviar este webhook"
                      >
                        {replayingId === d.id ? (
                          <span className="spinner small" aria-hidden="true" />
                        ) : (
                          <Icon name="repeat" size={16} />
                        )}
                      </button>
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
