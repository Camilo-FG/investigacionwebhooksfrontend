import { useEffect, useRef, useState } from 'react';
import Card from './Card.jsx';
import Icon from './Icon.jsx';
import { formatMoney, formatTime, latencyMs, shortId } from '../format.js';

const keyOf = (e) => `${e.id}|${e.receivedAt}`;

export default function EventsCard({ events, loaded, error }) {
  // Resalta las filas que llegan mientras la página está abierta (no las que ya estaban al cargar).
  const seen = useRef(null);
  const [fresh, setFresh] = useState(() => new Set());

  useEffect(() => {
    if (!loaded) return;
    const keys = events.map(keyOf);
    if (seen.current === null) {
      seen.current = new Set(keys);
      return;
    }
    const added = keys.filter((k) => !seen.current.has(k));
    if (added.length) {
      added.forEach((k) => seen.current.add(k));
      setFresh((prev) => new Set([...prev, ...added]));
    }
  }, [events, loaded]);

  const rows = events.slice().reverse();

  return (
    <Card
      step={3}
      done={events.length > 0}
      title="Lo que recibe el Servicio B"
      subtitle="Cada fila es un webhook con la firma ya verificada."
      badge={
        <span className="live" data-off={error ? 'true' : 'false'}>
          <span className="dot" />
          {error ? 'sin conexión' : 'en vivo'}
        </span>
      }
    >
      {error && events.length > 0 && (
        <p className="banner">
          <Icon name="alert" size={16} /> No se puede leer el Servicio B ahora. Se muestran los últimos datos.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="empty">
          <Icon name="inbox" size={34} />
          <strong>{error ? 'No se puede conectar con el Servicio B' : 'B todavía no ha recibido eventos'}</strong>
          <span>
            {error
              ? 'Comprueba que el Servicio B esté corriendo.'
              : 'Registra una suscripción (paso 1) y crea un pedido (paso 2). La fila aparece sola.'}
          </span>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Monto</th>
                <th>Pedido creado</th>
                <th>Recibido</th>
                <th className="num">Latencia</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const ms = latencyMs(e);
                return (
                  <tr key={keyOf(e)} className={fresh.has(keyOf(e)) ? 'is-new' : undefined}>
                    <td className="cell-main">{e.producto}</td>
                    <td className="num mono">{formatMoney(e.monto)}</td>
                    <td className="mono">{formatTime(e.fecha)}</td>
                    <td className="mono">{formatTime(e.receivedAt)}</td>
                    <td className="num mono">{ms == null ? '—' : `${ms} ms`}</td>
                    <td className="mono faint" title={e.id}>
                      {shortId(e.id)}
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
