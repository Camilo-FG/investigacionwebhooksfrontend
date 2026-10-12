import { formatTime } from '../format.js';
import { colones } from './catalog.js';
import StatusBadge from '../components/StatusBadge.jsx';

// Compras anteriores: salen del pedido y del pago que guarda la tienda, se actualizan solas.
export default function PurchaseHistory({ orders, payments, onOpen, limit = 6 }) {
  const paymentByOrder = new Map(payments.filter((p) => p.orderId).map((p) => [p.orderId, p]));
  const rows = [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
    .map((order) => ({ order, payment: paymentByOrder.get(order.id) }));

  return (
    <section className="history" aria-label="Mis compras">
      <h2>
        <span aria-hidden="true">🧾</span> Mis compras
      </h2>
      {rows.length === 0 ? (
        <p className="history-empty">Todavía no has comprado nada. Tus pedidos aparecerán aquí.</p>
      ) : (
        <ul>
          {rows.map(({ order, payment }) => (
            <li key={order.id}>
              <button type="button" onClick={() => payment && onOpen(payment.id)} disabled={!payment}>
                <span className="history-main">
                  <strong>{order.product}</strong>
                  <small>
                    {formatTime(order.createdAt)} · {payment?.provider === 'ONVO' ? 'Tarjeta (ONVO)' : payment ? 'Proveedor simulado' : '—'}
                  </small>
                </span>
                <span className="history-side">
                  <b>{colones(order.amount)}</b>
                  <StatusBadge status={order.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
