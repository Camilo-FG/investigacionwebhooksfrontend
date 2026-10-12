import { useState } from 'react';
import Icon from './Icon.jsx';

const PaymentsCard = ({ orders }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <h3><Icon name="list" size={20} /> Pagos Registrados</h3>
      <button onClick={() => setExpanded(!expanded)} className="btn-sm">
        {expanded ? 'Ocultar pagos' : 'Ver todos los pagos'}
      </button>
      {expanded && (
        <div style={{ marginTop: '10px', fontSize: '0.875rem' }}>
          {orders.length === 0 ? (
            <p>Ningún pago registrado aún.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {orders.map((o, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  <strong>ID:</strong> {o.id} &nbsp;|&nbsp;
                  <strong>Status:</strong> {o.status} &nbsp;|&nbsp;
                  <strong>Provider:</strong> {o.provider} &nbsp;|&nbsp;
                  <strong>Created:</strong> {o.createdAt ? o.createdAt.split('T')[0] : 'N/A'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsCard;