import { colones, MAX_PER_PRODUCT } from './catalog.js';

function Stepper({ qty, onChange, name }) {
  return (
    <div className="stepper" role="group" aria-label={`Cantidad de ${name}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`Quitar uno de ${name}`}>
        −
      </button>
      <output aria-live="polite">{qty}</output>
      <button type="button" onClick={() => onChange(qty + 1)} disabled={qty >= MAX_PER_PRODUCT} aria-label={`Agregar uno de ${name}`}>
        +
      </button>
    </div>
  );
}

export { Stepper };

export default function ProductCard({ product, qty, onChange }) {
  return (
    <article className="product" data-in-cart={qty > 0}>
      <div className="product-art" style={{ background: product.tint }} aria-hidden="true">
        <span>{product.emoji}</span>
        {product.tag && <em className="product-tag">{product.tag}</em>}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-unit">{product.unit}</p>
        <div className="product-foot">
          <p className="product-price">
            <strong>{colones(product.price)}</strong>
            {product.was && <s>{colones(product.was)}</s>}
          </p>
          {qty > 0 ? (
            <Stepper qty={qty} onChange={onChange} name={product.name} />
          ) : (
            <button type="button" className="add-btn" onClick={() => onChange(1)} aria-label={`Agregar ${product.name} al carrito`}>
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
