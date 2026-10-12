import { colones, cartCount, cartTotal } from './catalog.js';
import { Stepper } from './ProductCard.jsx';

const METHODS = [
  { id: 'ONVO', icon: '💳', title: 'Tarjeta', note: 'Pago de prueba con ONVO' },
  { id: 'FAKE', icon: '🧪', title: 'Proveedor simulado', note: 'Servicio B de la demo 1' },
];

export default function Cart({ lines, setQty, clear, provider, setProvider, onPay, busy, error }) {
  const total = cartTotal(lines);
  const count = cartCount(lines);

  return (
    <section className="panel cart" id="carrito" aria-label="Carrito de compras">
      <header className="panel-head">
        <h2>
          <span aria-hidden="true">🛒</span> Tu carrito
        </h2>
        {count > 0 && (
          <button type="button" className="link-btn" onClick={clear} disabled={busy}>
            Vaciar
          </button>
        )}
      </header>

      {lines.length === 0 ? (
        <div className="cart-empty">
          <span aria-hidden="true">🧺</span>
          <strong>Tu carrito está vacío</strong>
          <p>Agrega productos del catálogo para empezar tu compra.</p>
        </div>
      ) : (
        <ul className="cart-lines">
          {lines.map(({ product, qty }) => (
            <li key={product.id}>
              <span className="cart-emoji" style={{ background: product.tint }} aria-hidden="true">
                {product.emoji}
              </span>
              <div className="cart-info">
                <strong>{product.name}</strong>
                <span>
                  {colones(product.price)} · {product.unit}
                </span>
              </div>
              <Stepper qty={qty} onChange={(next) => setQty(product.id, next)} name={product.name} />
              <b className="cart-line-total">{colones(product.price * qty)}</b>
            </li>
          ))}
        </ul>
      )}

      <div className="cart-total">
        <span>Total a pagar</span>
        <strong>{colones(total)}</strong>
      </div>

      <fieldset className="methods" disabled={busy}>
        <legend>Forma de pago</legend>
        {METHODS.map((m) => (
          <label key={m.id} className="method" data-active={provider === m.id}>
            <input type="radio" name="method" value={m.id} checked={provider === m.id} onChange={() => setProvider(m.id)} />
            <span className="method-icon" aria-hidden="true">
              {m.icon}
            </span>
            <span>
              <strong>{m.title}</strong>
              <small>{m.note}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {provider === 'FAKE' && (
        <p className="method-hint">
          El proveedor simulado decide según el total: parte entera par se aprueba, impar se rechaza, y desde ₡50 000
          pasa por “diferido”.
        </p>
      )}

      {error && (
        <p className="cart-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="pay-btn" onClick={onPay} disabled={busy || lines.length === 0}>
        {busy ? (
          <>
            <span className="spinner" aria-hidden="true" /> Procesando…
          </>
        ) : (
          <>Pagar {colones(total)}</>
        )}
      </button>
      <p className="secure-note">🔒 Compra de demostración: no se cobra dinero real.</p>
    </section>
  );
}
