import Icon from './Icon.jsx';

const ICONS = { ok: 'check', danger: 'alert', info: 'info', warn: 'alert' };

export default function Toasts({ toasts, onClose }) {
  return (
    <div className="toasts" role="region" aria-label="Notificaciones" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          <Icon name={ICONS[t.tone] ?? 'info'} size={18} />
          <span>{t.text}</span>
          <button type="button" className="icon-btn" onClick={() => onClose(t.id)} aria-label="Cerrar notificación">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
