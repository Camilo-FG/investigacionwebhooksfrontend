import { useState } from 'react';
import Card from './Card.jsx';
import Icon from './Icon.jsx';

// Montos de ejemplo según las reglas del proveedor simulado (Servicio B).
const PRESETS = [
  { amount: '15000', label: 'Se aprueba', hint: 'parte entera par' },
  { amount: '15001', label: 'Se rechaza', hint: 'parte entera impar' },
  { amount: '60000', label: 'Pasa por DEFERRED', hint: 'desde 50 000' },
];

export default function OrderCard({ done, onCreate, busy }) {
  const [product, setProduct] = useState('Producto A');
  const [amount, setAmount] = useState('15000');
  const [provider, setProvider] = useState('FAKE');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!product.trim()) return setError('Escribe el nombre del producto.');
    if (amount === '' || !Number.isFinite(value) || value <= 0) return setError('El monto debe ser un número mayor a 0.');
    setError('');
    onCreate(product.trim(), value, provider);
  }

  return (
    <Card
      step={2}
      done={done}
      title="Compra un producto"
      subtitle="La tienda crea el pedido y el pago, y se lo envía al proveedor."
    >
      <form onSubmit={submit} noValidate>
        <div className="row">
          <div>
            <label htmlFor="order-product">Producto</label>
            <input
              id="order-product"
              value={product}
              maxLength={120}
              onChange={(e) => setProduct(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="order-amount">Monto (₡)</label>
            <input
              id="order-amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={error ? 'true' : 'false'}
            />
          </div>
        </div>
        <div className="chips" role="group" aria-label="Montos de ejemplo">
          {PRESETS.map((p) => (
            <button
              key={p.amount}
              type="button"
              className="chip"
              data-active={amount === p.amount}
              onClick={() => setAmount(p.amount)}
              title={p.hint}
            >
              ₡{Number(p.amount).toLocaleString('es-CR')} · {p.label}
            </button>
          ))}
        </div>

        <label htmlFor="order-provider">Proveedor de pagos</label>
        <select id="order-provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="FAKE">Fake Payment Provider (Servicio B)</option>
          <option value="ONVO" disabled>
            ONVO (segunda demo, aún no integrado)
          </option>
        </select>

        {error ? (
          <p className="field-error">{error}</p>
        ) : (
          <p className="hint">El proveedor decide según el monto. El resultado llega después, por webhook.</p>
        )}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="credit-card" size={17} />}
          Comprar y pagar
        </button>
      </form>
    </Card>
  );
}
