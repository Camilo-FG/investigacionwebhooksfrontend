import Icon from './Icon.jsx';

const LABELS = { online: 'en línea', offline: 'sin conexión', checking: 'comprobando…' };

function StatusPill({ name, role, state }) {
  return (
    <div className="pill" data-state={state} title={`${name}: ${LABELS[state]}`}>
      <span className="dot" />
      <span className="pill-text">
        <strong>{name}</strong>
        <em>{role}</em>
      </span>
      <span className="pill-state">{LABELS[state]}</span>
    </div>
  );
}

export default function Header({ statusA, statusB }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo" aria-hidden="true">
          <Icon name="arrow" size={22} />
        </div>
        <div>
          <h1>Webhooks Lab</h1>
          <p>Servicio A avisa a Servicio B cuando ocurre un evento, sin que nadie pregunte.</p>
        </div>
      </div>
      <div className="statuses" role="status" aria-label="Estado de los servicios">
        <StatusPill name="Servicio A" role="dispara" state={statusA} />
        <StatusPill name="Servicio B" role="recibe" state={statusB} />
      </div>
    </header>
  );
}
