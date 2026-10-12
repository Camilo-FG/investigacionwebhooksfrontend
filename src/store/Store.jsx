import { useMemo, useState } from 'react';
import { CATEGORIES, PRODUCTS, MAX_PER_PRODUCT, cartTotal, orderLabel } from './catalog.js';
import ProductCard from './ProductCard.jsx';
import Cart from './Cart.jsx';
import Receipt from './Receipt.jsx';
import PurchaseHistory from './PurchaseHistory.jsx';

// Supermercado: catálogo, carrito y, después de pagar, el ticket que se actualiza solo cuando
// llega el webhook. Toda la lógica de pago vive en App (createPayment); aquí solo se arma la compra.
export default function Store({
  cart,
  setCart,
  payments,
  orders,
  createPayment,
  creating,
  reopenCheckout,
  onOpenPayment,
  error,
}) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('ONVO');
  const [purchase, setPurchase] = useState(null);
  const [cartError, setCartError] = useState('');

  const qtyOf = (id) => cart[id] ?? 0;
  const setQty = (id, qty) =>
    setCart((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(MAX_PER_PRODUCT, qty));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });

  const lines = useMemo(
    () => PRODUCTS.filter((p) => cart[p.id]).map((product) => ({ product, qty: cart[product.id] })),
    [cart],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) => (category === 'all' || p.category === category) && (!q || p.name.toLowerCase().includes(q)),
    );
  }, [category, query]);

  async function pay() {
    if (lines.length === 0) return;
    setCartError('');
    const items = lines;
    const total = cartTotal(items);
    await createPayment(orderLabel(items), total, provider, (payment) => {
      setPurchase({
        id: payment.id,
        items,
        total,
        provider,
        onvo: payment.onvo,
        createdAt: payment.createdAt ?? new Date().toISOString(),
      });
      setCart({});
      document.getElementById('carrito')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // La compra rechazada devuelve sus productos al carrito para intentarlo otra vez.
  function retry() {
    setCart(Object.fromEntries(purchase.items.map(({ product, qty }) => [product.id, qty])));
    setPurchase(null);
  }

  const payment = purchase ? payments.find((p) => p.id === purchase.id) : undefined;
  const order = payment ? orders.find((o) => o.id === payment.orderId) : undefined;

  return (
    <main className="store">
      <section className="hero" aria-label="Bienvenida">
        <div>
          <p className="hero-kicker">Súper Webhooks · Entrega a domicilio</p>
          <h1>Compra fresca, pago confirmado al instante</h1>
          <p className="hero-text">
            Arma tu carrito, paga con tarjeta y mira cómo la tienda se entera del resultado del pago en tiempo real.
          </p>
        </div>
        <ul className="hero-perks" aria-label="Beneficios">
          <li>🚚 Entrega el mismo día</li>
          <li>🧾 Ticket al instante</li>
          <li>🔒 Pago seguro con ONVO</li>
        </ul>
        <span className="hero-art" aria-hidden="true">
          🥦🍎🥖🧀
        </span>
      </section>

      <div className="store-grid">
        <div className="catalog">
          <div className="toolbar">
            <div className="cat-chips" role="tablist" aria-label="Categorías">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={category === c.id}
                  className="cat-chip"
                  data-active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  <span aria-hidden="true">{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
            <label className="search">
              <span className="sr-only">Buscar productos</span>
              <input type="search" placeholder="🔍  Buscar productos…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>

          {visible.length === 0 ? (
            <p className="no-results">No encontramos productos con “{query}”.</p>
          ) : (
            <div className="products">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} qty={qtyOf(product.id)} onChange={(qty) => setQty(product.id, qty)} />
              ))}
            </div>
          )}

          <PurchaseHistory orders={orders} payments={payments} onOpen={onOpenPayment} />
        </div>

        <aside className="side">
          {purchase ? (
            <Receipt
              purchase={purchase}
              payment={payment}
              order={order}
              onKeepShopping={() => setPurchase(null)}
              onRetry={retry}
              onReopenCheckout={purchase.onvo ? () => reopenCheckout(purchase) : undefined}
              onOpenDetail={() => onOpenPayment(purchase.id)}
            />
          ) : (
            <Cart
              lines={lines}
              setQty={setQty}
              clear={() => setCart({})}
              provider={provider}
              setProvider={setProvider}
              onPay={pay}
              busy={creating}
              error={cartError || error}
            />
          )}
        </aside>
      </div>

      <footer className="store-footer">
        Proyecto de Paradigmas de Programación · Súper Webhooks es una tienda de demostración: los pagos son de prueba.
      </footer>
    </main>
  );
}
