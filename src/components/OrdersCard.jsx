import Card from './Card.jsx';
import Icon from './Icon.jsx';
import { useNow } from '../usePolling.js';
import { formatMoney, formatTime, shortId } from '../format.js';

const GRACE_MS = 6500; // tiempo que se espera antes de dar un pedido por "no entregado"

function Delivery({ status }) {
  if (status === 'delivered')
    return (
      <span className="badge" data-tone="ok">
        <Icon name="check" size={12} /> Entregado a B
      </span>
    );
  if (status === 'pending')
    return (
      <span className="badge" data-tone="warn">
        <span className="spinner tiny" aria-hidden="true" /> Enviando…
      </span>
    );
  return (
    <span className="badge" data-tone="danger" title="Ningún evento con este ID llegó a B">
      <Icon name="x" size={12} /> No llegó a B
    </span>
  );
}

export default function OrdersCard({ orders, events }) {
  const now = useNow(1000);
  const deliveredIds = new Set(events.map((e) => e.id));
  const rows = orders.slice().reverse();

  const statusOf = (o) => {
    if (deliveredIds.has(o.id)) return 'delivered';
    return now - Date.parse(o.fecha) < GRACE_MS ? 'pending' : 'missed';
  };

  return (
    <Card
      title="Pedidos creados en A"
      subtitle="Se comparan con lo que llegó a B para confirmar la entrega."
      badge={<span className="count">{orders.length}</span>}
    >
      {rows.length === 0 ? (
        <p className="empty-inline">Todavía no hay pedidos.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Monto</th>
                <th>Hora</th>
                <th>ID</th>
                <th>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="cell-main">{o.producto}</td>
                  <td className="num mono">{formatMoney(o.monto)}</td>
                  <td className="mono">{formatTime(o.fecha)}</td>
                  <td className="mono faint" title={o.id}>
                    {shortId(o.id)}
                  </td>
                  <td>
                    <Delivery status={statusOf(o)} />
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
