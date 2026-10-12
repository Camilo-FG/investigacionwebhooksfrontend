import Card from './Card.jsx';
import Icon from './Icon.jsx';

export default function SecurityCard({ storeDown, onToggleStoreDown, togglingStore, onSend, busy }) {
  return (
    <Card title="Pruebas de la demo" subtitle="Qué pasa cuando algo sale mal." className="card-security">
      <section className="test-block">
        <div className="switch-row">
          <div>
            <h3 id="store-down-label">Simular tienda caída</h3>
            <p className="body-text">
              El endpoint de webhooks de la tienda responde <span className="mono">503</span>. El proveedor reintenta 3
              veces y marca la entrega como fallida; el pedido se queda esperando. Luego vuelve a encender la tienda y
              usa <strong>Reenviar</strong> en esa entrega para recuperarla.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={storeDown ? 'true' : 'false'}
            aria-labelledby="store-down-label"
            onClick={() => onToggleStoreDown(!storeDown)}
            disabled={togglingStore}
          >
            <span className="switch-thumb" />
          </button>
        </div>
        {storeDown && (
          <p className="banner">
            <Icon name="power" size={16} /> La tienda está caída: los webhooks que lleguen se rechazan con 503.
          </p>
        )}
      </section>

      <section className="test-block">
        <h3>Webhook con firma falsa</h3>
        <p className="body-text">
          El endpoint de webhooks es público, así que cualquiera podría enviarle un POST diciendo que un pago se aprobó.
          Este botón lo intenta con una firma inventada: el navegador no conoce la clave secreta, así que la tienda debe
          responder <span className="mono">401</span> y no cambiar ningún pago. Aparecerá en "Webhooks recibidos".
        </p>
        <button type="button" className="btn danger" onClick={onSend} disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="shield" size={17} />}
          Enviar webhook con firma falsa
        </button>
      </section>
    </Card>
  );
}
