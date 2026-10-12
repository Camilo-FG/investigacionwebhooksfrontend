import { colones } from './catalog.js';

const LABELS = { online: 'en línea', offline: 'sin conexión', checking: 'comprobando…' };

function Dot({ name, state }) {
  return (
    <span className="svc" data-state={state} title={`${name}: ${LABELS[state]}`}>
      <i aria-hidden="true" />
      {name}
    </span>
  );
}

export default function TopBar({ view, onView, cartCount, cartTotal, onCart, statusA, statusB }) {
  return (
    <header className="topbar2">
      <div className="topbar2-in">
        <div className="brand2">
          <span className="brand2-logo" aria-hidden="true">
            🛒
          </span>
          <div>
            <strong>Súper Webhooks</strong>
            <small>Tu súper en línea</small>
          </div>
        </div>

        <nav className="nav2" aria-label="Secciones">
          <button type="button" data-active={view === 'tienda'} onClick={() => onView('tienda')} aria-current={view === 'tienda' ? 'page' : undefined}>
            Supermercado
          </button>
          <button type="button" data-active={view === 'lab'} onClick={() => onView('lab')} aria-current={view === 'lab' ? 'page' : undefined}>
            Bajo el capó
          </button>
        </nav>

        <div className="topbar2-right">
          <div className="svcs" role="status" aria-label="Estado de los servicios">
            <Dot name="Tienda" state={statusA} />
            <Dot name="Proveedor" state={statusB} />
          </div>
          {view === 'tienda' && (
            <button type="button" className="cart-btn" onClick={onCart} aria-label={`Ir al carrito: ${cartCount} productos`}>
              <span aria-hidden="true">🛒</span>
              <b>{cartCount}</b>
              <span className="cart-btn-total">{colones(cartTotal)}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
