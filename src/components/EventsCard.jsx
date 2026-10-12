import Icon from './Icon.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'hace un momento';
  if (seconds < 60) return `hace ${seconds}s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
  return `hace ${Math.floor(seconds / 3600)}h`;
}

const STATUS_CONFIG = {
  APPROVED: { icon: 'check-circle', color: 'var(--ok, #34d3a0)', label: 'Aprobado' },
  REJECTED: { icon: 'x-circle', color: 'var(--danger, #ff6b7f)', label: 'Rechazado' },
  PENDING: { icon: 'clock', color: 'var(--warn, #f5b942)', label: 'Pendiente' },
};

const EventsCard = ({ events }) => {
  // Solo los últimos 5 eventos, ordenados por fecha descendente
  const recent = [...(events || [])]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return (
    <div className="card">
      <h3><Icon name="radio" size={20} /> Eventos Recientes</h3>
      <p className="faint" style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
        Últimos 5 movimientos del sistema
      </p>

      {recent.length === 0 ? (
        <p style={{ marginTop: '12px', color: 'var(--muted, #93a0bd)', fontSize: '0.875rem' }}>
          No hay eventos registrados aún.
        </p>
      ) : (
        <div style={{ marginTop: '12px' }}>
          {recent.map((e, i) => {
            const config = STATUS_CONFIG[e.status] || STATUS_CONFIG.PENDING;
            return (
              <div
                key={e.id || i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border-soft, #1f2942)' : 'none',
                }}
              >
                <div style={{ color: config.color, marginTop: '2px' }}>
                  <Icon name={config.icon} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #e8edf7)' }}>
                    Pago {config.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted, #93a0bd)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span>₡{Number(e.amount).toLocaleString()}</span>
                    <span>·</span>
                    <span>{e.provider}</span>
                    <span>·</span>
                    <span>{timeAgo(e.updatedAt || e.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsCard;