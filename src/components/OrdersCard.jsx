import Card from './Card.jsx';
import Icon from './Icon.jsx';
import StatusBadge from './StatusBadge.jsx';
import { clickableRow } from './clickableRow.js';
import { useFreshKeys } from '../usePolling.js';
import { confirmationMs, formatDuration, formatMoney, formatTime, shortId } from '../format.js';

// La clave incluye los estados para que la fila se resalte cada vez que un webhook la cambia.
const keyOf = (row) => `${row.order.id}|${row.order.status}|${row.payment?.status ?? ''}`;

export default function OrdersCard({ orders, payments, loaded, error, onOpen }) {
  const paymentByOrder = new Map(payments.filter((p) => p.orderId).map((p) => [p.orderId, p]));
  const rows = orders.map((order) => ({ order, payment: paymentByOrder.get(order.id) }));
  const fresh = useFreshKeys(rows.map(keyOf), loaded);

  return (
    <Card
      step={3}
      done={rows.some((r) => r.order.status !== 'PENDING_PAYMENT')}
      title="Pedidos y pagos en la tienda"
      subtitle="Cambian solos cuando llega el webhook del proveedor. Haz clic en uno para ver su línea de tiempo."
      badge={
        <span className="live" data-off={error ? 'true' : 'false'}>
          <span className="dot" />
          {error ? 'sin conexión' : 'en vivo'}
        </span>
      }
    >
      {error && rows.length > 0 && (
        <p className="banner">
          <Icon name="alert" size={16} /> No se puede leer el Servicio A ahora. Se muestran los últimos datos.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="empty">
          <Icon name="package" size={34} />
          <strong>{error ? 'No se puede conectar con la tienda' : 'Todavía no hay pedidos'}</strong>
          <span>
            {error
              ? 'Comprueba que el Servicio A esté corriendo y que DATABASE_URL sea válida.'
              : 'Haz una compra en el paso 2. El pedido aparece en "Esperando pago" y cambia solo cuando llega el webhook.'}
          </span>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Monto</th>
                <th>Pedido</th>
                <th>Pago</th>
                <th>Creado</th>
                <th className="num">Confirmado en</th>
                <th>Pago ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.order.id}
                  {...(row.payment
                    ? clickableRow(
                        () => onOpen(row.payment.id),
                        `Ver la línea de tiempo del pedido ${row.order.product}`,
                        fresh.has(keyOf(row)) ? 'is-new' : undefined,
                      )
                    : { className: fresh.has(keyOf(row)) ? 'is-new' : undefined })}
                >
                  <td className="cell-main" title={row.order.product}>
                    {row.order.product}
                  </td>
                  <td className="num mono">{formatMoney(row.order.amount)}</td>
                  <td>
                    <StatusBadge status={row.order.status} />
                  </td>
                  <td>{row.payment ? <StatusBadge status={row.payment.status} /> : '—'}</td>
                  <td className="mono">{formatTime(row.order.createdAt)}</td>
                  <td className="num mono">{formatDuration(confirmationMs(row.payment))}</td>
                  <td className="mono faint" title={row.payment?.id}>
                    {row.payment ? shortId(row.payment.id) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
