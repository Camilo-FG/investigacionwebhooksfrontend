import { useCallback, useRef, useState } from 'react';
import { api } from './api.js';
import { usePolling } from './usePolling.js';
import { latencyMs, shortId } from './format.js';
import Header from './components/Header.jsx';
import FlowDiagram from './components/FlowDiagram.jsx';
import SubscriptionsCard from './components/SubscriptionsCard.jsx';
import OrderCard from './components/OrderCard.jsx';
import SecurityCard from './components/SecurityCard.jsx';
import EventsCard from './components/EventsCard.jsx';
import OrdersCard from './components/OrdersCard.jsx';
import Toasts from './components/Toasts.jsx';

// Único evento que emite el Servicio A (al crear un pedido).
const EVENT_NAME = 'pedido.creado';
const DELIVERY_TIMEOUT_MS = 6500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const serviceState = (...queries) => {
  if (queries.some((q) => q.error)) return 'offline';
  return queries.every((q) => q.loaded) ? 'online' : 'checking';
};

export default function App() {
  // Datos en vivo: A (suscripciones y pedidos) y B (eventos recibidos).
  const subsQ = usePolling(api.listSubscriptions, 2500);
  const ordersQ = usePolling(api.listOrders, 2000);
  const eventsQ = usePolling(api.listEvents, 2000);

  const subscriptions = subsQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const events = eventsQ.data ?? [];

  // ---- Notificaciones ----
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const closeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (tone, text) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, tone, text }]);
      setTimeout(() => closeToast(id), 4500);
    },
    [closeToast],
  );

  // ---- Recorrido del webhook (alimenta el diagrama animado) ----
  const [flow, setFlow] = useState({ phase: 'idle' });
  const runRef = useRef(0); // si empieza otro recorrido, el anterior deja de actualizar el diagrama

  async function createOrder(producto, monto) {
    const run = ++runRef.current;
    const live = () => runRef.current === run;

    setFlow({ phase: 'creating' });
    let order;
    try {
      order = await api.createOrder(producto, monto);
    } catch (err) {
      if (live()) setFlow({ phase: 'error', detail: err.message });
      notify('danger', `No se pudo crear el pedido: ${err.message}`);
      return;
    }
    ordersQ.refresh();
    notify('ok', `Pedido ${shortId(order.id)} creado en el Servicio A.`);

    // ¿A tiene a quién avisar?
    let currentSubs = subscriptions;
    try {
      currentSubs = await api.listSubscriptions();
    } catch {
      /* se usa la lista que ya teníamos */
    }
    if (!live()) return;
    if (!currentSubs.some((s) => s.event === EVENT_NAME)) {
      setFlow({ phase: 'nosubs' });
      return;
    }

    // Animación de los pasos internos (firma y envío no se pueden observar desde el navegador).
    setFlow({ phase: 'delivering', active: 1 });
    await sleep(550);
    if (!live()) return;
    setFlow({ phase: 'delivering', active: 2 });
    await sleep(550);
    if (!live()) return;
    setFlow({ phase: 'delivering', active: 3 });

    // La confirmación sí es real: se espera a que B liste el evento con el ID de este pedido.
    const deadline = Date.now() + DELIVERY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const list = await eventsQ.refresh();
      if (!live()) return;
      const received = list?.find((e) => e.id === order.id);
      if (received) {
        setFlow({ phase: 'delivered', latency: latencyMs(received) });
        return;
      }
      await sleep(500);
      if (!live()) return;
    }
    setFlow({ phase: 'timeout' });
  }

  async function sendFakeSignature() {
    const run = ++runRef.current;
    const live = () => runRef.current === run;

    setFlow({ phase: 'fake-sending' });
    try {
      const [res] = await Promise.all([api.sendFakeWebhook(), sleep(900)]);
      if (!live()) return;
      if (res.status === 401) {
        setFlow({ phase: 'rejected' });
        notify('ok', 'B rechazó la firma falsa con HTTP 401.');
      } else if (res.status >= 200 && res.status < 300) {
        setFlow({ phase: 'breach' });
        notify('danger', 'B aceptó una firma falsa. Revisa la verificación HMAC.');
      } else {
        setFlow({ phase: 'error', detail: `B respondió HTTP ${res.status}` });
      }
      eventsQ.refresh();
    } catch (err) {
      if (live()) setFlow({ phase: 'error', detail: err.message });
      notify('danger', err.message);
    }
  }

  // ---- Suscripciones ----
  async function addSubscription(url) {
    try {
      // A no evita duplicados: si se registra dos veces, cada pedido dispararía el webhook dos veces.
      let current = subscriptions;
      try {
        current = await api.listSubscriptions();
      } catch {
        /* se usa la lista que ya teníamos */
      }
      const duplicate = current.find((s) => s.url === url && s.event === EVENT_NAME);
      if (duplicate) {
        notify('info', `Esa suscripción ya estaba registrada (#${duplicate.id}).`);
        return;
      }
      const created = await api.createSubscription(url, EVENT_NAME);
      await subsQ.refresh();
      notify('ok', `Suscripción #${created.id} registrada.`);
    } catch (err) {
      notify('danger', `No se pudo registrar la suscripción: ${err.message}`);
    }
  }

  async function removeSubscription(id) {
    try {
      await api.deleteSubscription(id);
      await subsQ.refresh();
      notify('info', `Suscripción #${id} eliminada.`);
    } catch (err) {
      notify('danger', `No se pudo eliminar la suscripción: ${err.message}`);
    }
  }

  return (
    <div className="app">
      <Header statusA={serviceState(subsQ, ordersQ)} statusB={serviceState(eventsQ)} />

      <main>
        <FlowDiagram flow={flow} />

        <div className="grid">
          <div className="col">
            <SubscriptionsCard
              subscriptions={subscriptions}
              eventName={EVENT_NAME}
              onAdd={addSubscription}
              onRemove={removeSubscription}
            />
            <OrderCard done={orders.length > 0} onCreate={createOrder} busy={flow.phase === 'creating'} />
          </div>
          <div className="col">
            <EventsCard events={events} loaded={eventsQ.loaded} error={eventsQ.error} />
            <OrdersCard orders={orders} events={events} />
            <SecurityCard onSend={sendFakeSignature} busy={flow.phase === 'fake-sending'} />
          </div>
        </div>
      </main>

      <footer>
        Proyecto de Paradigmas de Programación · Investigación sobre Webhooks · Servicio A → firma HMAC → Servicio B
      </footer>

      <Toasts toasts={toasts} onClose={closeToast} />
    </div>
  );
}
