import { useState } from 'react';
import Card from './Card.jsx';
import Icon from './Icon.jsx';

export default function OrderCard({ done, onCreate, busy }) {
  const [producto, setProducto] = useState('Café');
  const [monto, setMonto] = useState('12.5');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const amount = Number(monto);
    if (!producto.trim()) return setError('Escribe el nombre del producto.');
    if (monto === '' || !Number.isFinite(amount) || amount < 0) return setError('El monto debe ser un número mayor o igual a 0.');
    setError('');
    onCreate(producto.trim(), amount);
  }

  return (
    <Card
      step={2}
      done={done}
      title="Crea un pedido"
      subtitle="Este es el trigger: al guardarse, A dispara el webhook solo."
    >
      <form onSubmit={submit} noValidate>
        <div className="row">
          <div>
            <label htmlFor="order-product">Producto</label>
            <input id="order-product" value={producto} onChange={(e) => setProducto(e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="order-amount">Monto</label>
            <input
              id="order-amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="package" size={17} />}
          Crear pedido y disparar webhook
        </button>
      </form>
    </Card>
  );
}
