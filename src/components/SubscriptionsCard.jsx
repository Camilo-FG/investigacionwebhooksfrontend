import { useState } from 'react';
import Card from './Card.jsx';
import Icon from './Icon.jsx';

// Con `npm run dev` los servicios corren en localhost; dentro de Docker se llaman por su nombre.
const URL_DOCKER = 'http://service-b:3001/webhooks/pedido';
const URL_LOCAL = 'http://localhost:3001/webhooks/pedido';
const DEFAULT_URL = import.meta.env.DEV ? URL_LOCAL : URL_DOCKER;

export default function SubscriptionsCard({ subscriptions, eventName, onAdd, onRemove }) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const value = url.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) {
      setError('Escribe una URL válida que empiece con http:// o https://');
      return;
    }
    setError('');
    setBusy(true);
    await onAdd(value);
    setBusy(false);
  }

  return (
    <Card
      step={1}
      done={subscriptions.length > 0}
      title="Suscríbete al evento"
      subtitle="Le dices a A a qué URL avisar cuando pase algo."
    >
      <form onSubmit={submit} noValidate>
        <label htmlFor="sub-url">URL que recibirá el webhook</label>
        <input
          id="sub-url"
          className="mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby="sub-hint"
          spellCheck="false"
          autoComplete="off"
        />
        <div className="chips" role="group" aria-label="URLs de ejemplo">
          <button type="button" className="chip" data-active={url === URL_DOCKER} onClick={() => setUrl(URL_DOCKER)}>
            Con Docker · service-b
          </button>
          <button type="button" className="chip" data-active={url === URL_LOCAL} onClick={() => setUrl(URL_LOCAL)}>
            Sin Docker · localhost
          </button>
        </div>
        {error ? (
          <p id="sub-hint" className="field-error">
            {error}
          </p>
        ) : (
          <p id="sub-hint" className="hint">
            Dentro de Docker los servicios se ven por su nombre (service-b), no por localhost.
          </p>
        )}

        <label htmlFor="sub-event">Evento</label>
        <select id="sub-event" value={eventName} disabled aria-describedby="event-hint">
          <option value={eventName}>{eventName}</option>
        </select>
        <p id="event-hint" className="hint">
          Es el único evento que dispara el Servicio A al crear un pedido.
        </p>

        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="plus" size={17} />}
          Registrar suscripción
        </button>
      </form>

      <div className="list-head">
        <h3>Suscripciones activas</h3>
        <span className="count">{subscriptions.length}</span>
      </div>
      {subscriptions.length === 0 ? (
        <p className="empty-inline">Aún no hay ninguna. Sin suscripciones, A no tiene a quién avisar.</p>
      ) : (
        <ul className="sub-list">
          {subscriptions.map((s) => (
            <li key={s.id}>
              <span className="sub-id">#{s.id}</span>
              <div className="sub-body">
                <span className="mono sub-url" title={s.url}>
                  {s.url}
                </span>
                <span className="tag-event">{s.event}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemove(s.id)}
                aria-label={`Eliminar suscripción ${s.id}`}
                title="Eliminar suscripción"
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
