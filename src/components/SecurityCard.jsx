import Card from './Card.jsx';
import Icon from './Icon.jsx';

export default function SecurityCard({ onSend, busy }) {
  return (
    <Card title="Prueba de seguridad" subtitle="¿Qué pasa si alguien se hace pasar por A?" className="card-security">
      <p className="body-text">
        El endpoint de B es público, así que cualquiera podría enviarle un POST falso. Por eso A firma cada mensaje con
        HMAC y B lo verifica. Este botón envía un webhook con una firma inventada: el navegador no conoce la clave
        secreta, así que B debe responder <span className="mono">401</span> y no registrar nada.
      </p>
      <button type="button" className="btn danger" onClick={onSend} disabled={busy}>
        {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="shield" size={17} />}
        Enviar webhook con firma falsa
      </button>
    </Card>
  );
}
