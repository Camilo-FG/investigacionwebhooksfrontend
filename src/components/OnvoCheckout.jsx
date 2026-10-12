import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';

const SDK_URL = 'https://sdk.onvopay.com/sdk.js';
const CONTAINER_ID = 'onvo-container';

// Carga el SDK de ONVO una sola vez. Si falla, se permite reintentar al volver a abrir el modal.
let sdkPromise = null;
function loadSdk() {
  if (window.onvo) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => (window.onvo ? resolve() : reject(new Error('El SDK de ONVO cargó sin exponer "onvo"')));
      script.onerror = () => {
        script.remove();
        reject(new Error('No se pudo cargar el SDK de ONVO (¿sin internet o bloqueado?)'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

// Formulario de tarjeta de ONVO. Los datos de la tarjeta los maneja el SDK dentro del navegador:
// nunca pasan por la tienda. Cuando el SDK dice "pagado" NO se marca nada como aprobado aquí:
// el resultado real llega a la tienda por webhook (POST /webhooks/onvo) y la pantalla lo observa.
export default function OnvoCheckout({ checkout, onPaid, onClose }) {
  const [loadError, setLoadError] = useState('');
  const [sdkError, setSdkError] = useState('');
  const intentId = checkout?.onvo.paymentIntentId;
  const publicKey = checkout?.onvo.publishableKey;

  useEffect(() => {
    if (!intentId) return undefined;
    let cancelled = false;
    setLoadError('');
    setSdkError('');

    loadSdk()
      .then(() => {
        if (cancelled) return;
        // <dialog> pinta su contenido en el siguiente ciclo; se espera a que exista el contenedor.
        const container = document.getElementById(CONTAINER_ID);
        if (!container) throw new Error('No se encontró el contenedor del formulario');
        container.innerHTML = '';
        window.onvo
          .pay({
            publicKey,
            paymentIntentId: intentId,
            paymentType: 'one_time',
            onSuccess: () => {
              if (!cancelled) onPaid();
            },
            onError: (error) => {
              if (!cancelled) setSdkError(error?.message || 'ONVO no pudo procesar la tarjeta. Prueba de nuevo.');
            },
          })
          .render(`#${CONTAINER_ID}`);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
      const container = document.getElementById(CONTAINER_ID);
      if (container) container.innerHTML = '';
    };
    // onPaid se lee solo cuando el SDK avisa; no debe reiniciar el formulario si cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentId, publicKey]);

  return (
    <Modal
      open={Boolean(checkout)}
      title="Pagar con ONVO"
      subtitle="Modo de prueba: no se cobra dinero real."
      onClose={onClose}
      footer={
        <p className="hint">
          <Icon name="info" size={14} /> Tarjeta de prueba aprobada: <code>4242 4242 4242 4242</code>, fecha futura y
          cualquier CVV. Rechazada: <code>4000 0000 0000 0002</code>. Al pagar, ONVO avisa a la tienda con un webhook;
          desde <code>localhost</code> ONVO no puede llamar, así que ahí el estado cambia solo en el despliegue público.
        </p>
      }
    >
      {loadError && (
        <p className="onvo-error" role="alert">
          <Icon name="alert-circle" size={16} /> {loadError}
        </p>
      )}
      {sdkError && (
        <p className="onvo-error" role="alert">
          <Icon name="alert-circle" size={16} /> {sdkError}
        </p>
      )}
      <div id={CONTAINER_ID} className="onvo-box" />
    </Modal>
  );
}
