import Icon from './Icon.jsx';

// Tarjeta base. Si recibe `step`, muestra el número del paso (o un check si ya se completó).
export default function Card({ step, done, title, subtitle, badge, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      <header className="card-head">
        {step != null && (
          <span className="step-badge" data-done={done ? 'true' : 'false'}>
            {done ? <Icon name="check" size={15} /> : step}
          </span>
        )}
        <div className="card-title">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {badge}
      </header>
      {children}
    </section>
  );
}
