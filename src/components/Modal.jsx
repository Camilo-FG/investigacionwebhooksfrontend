import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// <dialog> nativo: Esc para cerrar, foco atrapado y fondo inerte sin código extra.
export default function Modal({ open, title, subtitle, onClose, footer, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="modal-inner">
          <header className="modal-head">
            <div>
              <h2 id="modal-title">{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button type="button" className="icon-btn neutral" onClick={onClose} aria-label="Cerrar">
              <Icon name="x" size={18} />
            </button>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

// Bloque etiquetado con contenido monoespaciado (cuerpos JSON, cabeceras...).
export function CodeBlock({ label, hint, children }) {
  return (
    <section className="code-section">
      <h3>{label}</h3>
      {hint && <p className="hint">{hint}</p>}
      <pre className="code">{children}</pre>
    </section>
  );
}
