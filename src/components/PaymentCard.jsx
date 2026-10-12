import { useState } from 'react';
import Icon from './Icon.jsx';

const PaymentCard = ({ onCreate, busy }) => {
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('FAKE');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amountError, setAmountError] = useState('');

  const handleCreate = async () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setAmountError('Ingresa un monto válido mayor a 0');
      return;
    }
    setAmountError('');
    setLoading(true);
    try {
      await onCreate(num, provider);
      setSuccess(true);
      // El polling automático en App.jsx detectará el cambio de status
    } catch (err) {
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = success ? { borderColor: 'var(--ok, #34d3a0)', background: 'rgba(52, 211, 160, 0.1)' } : {};

  return (
    <div className="card" style={cardStyle}>
      <h3><Icon name="credit-card" size={20} /> Procesar Pago</h3>
      <div className="form-group">
        <label htmlFor="amount">Monto (₡):</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => {
            const num = Number(amount);
            if (amount && (isNaN(num) || num <= 0)) {
              setAmountError('Ingresa un monto válido mayor a 0');
            } else {
              setAmountError('');
            }
          }}
          min="0.01"
          required
          disabled={busy}
          aria-invalid={amountError ? 'true' : 'false'}
          aria-describedby={amountError ? 'amount-error' : undefined}
        />
        {amountError && (
          <p id="amount-error" style={{ marginTop: '4px', fontSize: '0.8125rem', color: 'var(--danger, #ff6b7f)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="alert-circle" size={14} /> {amountError}
          </p>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="provider">Proveedor:</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          disabled={busy}
        >
          <option value="FAKE">Fake Payment Provider</option>
          <option value="ONVO">ONVO</option>
        </select>
      </div>
      <button onClick={handleCreate} disabled={busy || loading} className="btn-primary">
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> Procesando...
          </>
        ) : (
          <>
            <Icon name="zap" size={17} /> Procesar Pago
          </>
        )}
      </button>
      {success && (
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--ok, #34d3a0)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="check-circle" size={16} /> Pago iniciado - observando confirmación...
        </p>
      )}
    </div>
  );
};

export default PaymentCard;