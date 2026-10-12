import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { usePolling, useUnseen } from './usePolling.js';
import { confirmationMs, FINAL_STATUSES, shortId } from './format.js';
import TopBar from './store/TopBar.jsx';
import Store from './store/Store.jsx';
import { cartCount, cartTotal, PRODUCTS } from './store/catalog.js';
import FlowDiagram from './components/FlowDiagram.jsx';
import SubscriptionsCard from './components/SubscriptionsCard.jsx';
import OrderCard from './components/OrderCard.jsx';
import OrdersCard from './components/OrdersCard.jsx';
import DeliveriesCard from './components/DeliveriesCard.jsx';
import ReceivedCard from './components/ReceivedCard.jsx';
import SecurityCard from './components/SecurityCard.jsx';
import SectionTabs from './components/SectionTabs.jsx';
import DeliveryInspector from './components/DeliveryInspector.jsx';
import ReceivedInspector from './components/ReceivedInspector.jsx';
import PaymentTimeline from './components/PaymentTimeline.jsx';
import OnvoCheckout from './components/OnvoCheckout.jsx';
import Toasts from './components/Toasts.jsx';

// Único evento que envía el proveedor (Servicio B) cuando un pago cambia de estado.
const EVENT_NAME = 'payment.updated';
// Con Supabase cada consulta tarda; un pago diferido necesita dos rondas de procesamiento.
const CONFIRMATION_TIMEOUT_MS = 30000;
// Con ONVO hay una persona escribiendo la tarjeta, y después el webhook tarda unos segundos.
const ONVO_CONFIRMATION_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const serviceState = (...queries) => {
  if (queries.some((q) => q.error)) return 'offline';
  return queries.every((q) => q.loaded) ? 'online' : 'checking';
};

export default function App() {
  // Datos en vivo: A (pedidos, pagos, webhooks recibidos) y B (cobros, suscripciones, webhooks enviados).
  const ordersQ = usePolling(api.listOrders, 2000);
  const paymentsQ = usePolling(api.listPayments, 2000);
  const receivedQ = usePolling(api.listReceived, 2000);
  const simulationQ = usePolling(api.getSimulation, 4000);
  const providerPaymentsQ = usePolling(api.listProviderPayments, 2000);
  const subsQ = usePolling(api.listSubscriptions, 2500);
  const deliveriesQ = usePolling(api.listDeliveries, 2000);

  const orders = ordersQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const received = receivedQ.data ?? [];
  const storeDown = simulationQ.data?.storeDown === true;
  const providerPayments = providerPaymentsQ.data ?? [];
  const subscriptions = subsQ.data ?? [];
  const deliveries = deliveriesQ.data ?? [];

  const refreshAll = useCallback(() => {
    ordersQ.refresh();
    paymentsQ.refresh();
    receivedQ.refresh();
    providerPaymentsQ.refresh();
    deliveriesQ.refresh();
  }, [ordersQ.refresh, paymentsQ.refresh, receivedQ.refresh, providerPaymentsQ.refresh, deliveriesQ.refresh]);

  // ---- Notificaciones ----
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const closeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (tone, text) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, tone, text }]);
      setTimeout(() => closeToast(id), 5500);
    },
    [closeToast],
  );

  // ---- Sección visible en la columna derecha; las otras avisan con un punto si les llegó algo nuevo ----
  const [tab, setTab] = useState('orders');
  const unseenOrders = useUnseen(
    payments.map((p) => `${p.id}|${p.status}`),
    paymentsQ.loaded,
    tab === 'orders',
  );
  const unseenSent = useUnseen(
    deliveries.map((d) => d.id),
    deliveriesQ.loaded,
    tab === 'sent',
  );
  const unseenSentFailed = useUnseen(
    deliveries.filter((d) => d.result === 'FAILED').map((d) => d.id),
    deliveriesQ.loaded,
    tab === 'sent',
  );
  const unseenReceived = useUnseen(
    received.map((r) => r.id),
    receivedQ.loaded,
    tab === 'received',
  );
  const unseenReceivedRejected = useUnseen(
    received.filter((r) => r.httpStatus >= 300).map((r) => r.id),
    receivedQ.loaded,
    tab === 'received',
  );
  const tabs = [
    { id: 'orders', label: 'Pedidos y pagos', icon: 'package', count: orders.length, unseen: unseenOrders },
    {
      id: 'sent',
      label: 'Webhooks enviados',
      icon: 'send',
      count: deliveries.length,
      unseen: unseenSent,
      alert: unseenSentFailed > 0,
    },
    {
      id: 'received',
      label: 'Webhooks recibidos',
      icon: 'inbox',
      count: received.length,
      unseen: unseenReceived,
      alert: unseenReceivedRejected > 0,
    },
  ];

  // ---- Detalle abierto: inspector de un webhook enviado, uno recibido o la línea de tiempo de un pago ----
  const [detail, setDetail] = useState(null);
  const closeDetail = useCallback(() => setDetail(null), []);

  // ---- Recorrido del webhook (alimenta el diagrama animado) ----
  const [flow, setFlow] = useState({ phase: 'idle' });
  const runRef = useRef(0); // si empieza otro recorrido, el anterior deja de actualizar el diagrama

  // ---- Formulario de tarjeta de ONVO (solo mientras se paga un pago con ONVO) ----
  const [checkout, setCheckout] = useState(null);

  // ---- Vista: el supermercado (por defecto) o el panel técnico con el diagrama y los webhooks ----
  const [view, setView] = useState('tienda');
  useEffect(() => {
    document.body.dataset.view = view;
  }, [view]);

  // Carrito del supermercado: { idProducto: cantidad }.
  const [cart, setCart] = useState({});
  const cartLines = PRODUCTS.filter((p) => cart[p.id]).map((product) => ({ product, qty: cart[product.id] }));

  // onCreated(payment) se llama en cuanto la tienda crea el pago (antes de esperar el resultado).
  async function createPayment(product, amount, provider, onCreated) {
    const run = ++runRef.current;
    const live = () => runRef.current === run;

    setFlow({ phase: 'creating', provider });
    setTab('orders');
    let payment;
    try {
      payment = await api.createPayment(product, amount, provider);
    } catch (err) {
      if (live()) setFlow({ phase: 'error', provider, detail: err.message });
      notify('danger', `No se pudo crear el pago: ${err.message}`);
      return;
    }
    refreshAll();
    notify('ok', `Pedido creado. Pago ${shortId(payment.id)} en PENDING.`);
    onCreated?.(payment);

    if (provider === 'ONVO') {
      await payWithOnvo(payment, live);
      return;
    }

    // ¿El proveedor tiene a quién avisar?
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

    // El navegador solo observa: el cambio de estado lo provoca el webhook del proveedor.
    setFlow({ phase: 'processing' });
    let deferred = false;
    const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(1000);
      if (!live()) return;
      const [current, sent] = await Promise.all([
        api.getPayment(payment.id).catch(() => null),
        api.listDeliveries().catch(() => []),
      ]);
      if (!live()) return;
      if (!current) continue;

      if (FINAL_STATUSES.includes(current.status)) {
        setFlow({ phase: 'delivered', status: current.status, ms: confirmationMs(current) });
        refreshAll();
        notify(
          current.status === 'APPROVED' ? 'ok' : 'info',
          `Webhook recibido: el pago ${shortId(current.id)} fue ${current.status === 'APPROVED' ? 'aprobado' : 'rechazado'}.`,
        );
        return;
      }

      const failed = sent.find((d) => d.payload?.paymentId === payment.id && d.result === 'FAILED');
      if (failed) {
        setFlow({
          phase: 'failed',
          status: failed.payload.status,
          http: failed.responseStatus,
          attempts: failed.attempts,
        });
        refreshAll();
        notify('danger', `El proveedor no pudo entregar el webhook ${failed.payload.status} tras ${failed.attempts} intentos.`);
        return;
      }

      if (current.status === 'DEFERRED' && !deferred) {
        deferred = true;
        setFlow({ phase: 'deferred' });
        refreshAll();
      }
    }
    setFlow({ phase: 'timeout' });
    refreshAll();
  }

  // Con ONVO el comprador paga en el formulario del SDK y la tienda se entera por el webhook de ONVO.
  // El navegador solo observa el pago hasta que deja de estar PENDING; nunca lo marca como aprobado.
  async function payWithOnvo(payment, live) {
    if (!payment.onvo?.paymentIntentId || !payment.onvo?.publishableKey) {
      setFlow({ phase: 'error', provider: 'ONVO', detail: 'La tienda no devolvió los datos de ONVO para el formulario de pago.' });
      notify('danger', 'La respuesta de la tienda no trae los datos de ONVO.');
      return;
    }
    setCheckout({ paymentId: payment.id, onvo: payment.onvo });
    setFlow({ phase: 'onvo-paying', provider: 'ONVO' });

    const deadline = Date.now() + ONVO_CONFIRMATION_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(2000);
      if (!live()) return;
      const current = await api.getPayment(payment.id).catch(() => null);
      if (!live()) return;
      if (current && FINAL_STATUSES.includes(current.status)) {
        setCheckout(null);
        setFlow({ phase: 'delivered', provider: 'ONVO', status: current.status, ms: confirmationMs(current) });
        refreshAll();
        notify(
          current.status === 'APPROVED' ? 'ok' : 'info',
          `Webhook de ONVO recibido: el pago ${shortId(current.id)} fue ${current.status === 'APPROVED' ? 'aprobado' : 'rechazado'}.`,
        );
        return;
      }
    }
    setCheckout(null);
    setFlow({ phase: 'timeout', provider: 'ONVO' });
    refreshAll();
  }

  // Vuelve a abrir el formulario de ONVO de una compra que sigue pendiente (por ejemplo, si se cerró el modal).
  function reopenCheckout(purchase) {
    if (purchase?.onvo) setCheckout({ paymentId: purchase.id, onvo: purchase.onvo });
  }

  // El SDK avisa que ONVO aceptó la tarjeta; el resultado oficial todavía lo trae el webhook.
  function onvoPaid() {
    setCheckout(null);
    setFlow((f) => (f.provider === 'ONVO' && f.phase === 'onvo-paying' ? { phase: 'processing', provider: 'ONVO' } : f));
    notify('info', 'ONVO recibió el pago. Esperando su webhook para confirmarlo…');
  }

  async function sendFakeSignature() {
    const run = ++runRef.current;
    const live = () => runRef.current === run;

    setFlow({ phase: 'fake-sending' });
    setTab('received');
    try {
      const [res] = await Promise.all([api.sendFakeWebhook(), sleep(900)]);
      receivedQ.refresh();
      if (!live()) return;
      if (res.status === 401) {
        setFlow({ phase: 'rejected' });
        notify('ok', 'La tienda rechazó la firma falsa con HTTP 401.');
      } else if (res.status >= 200 && res.status < 300) {
        setFlow({ phase: 'breach' });
        notify('danger', 'La tienda aceptó una firma falsa. Revisa la verificación HMAC.');
      } else {
        setFlow({ phase: 'error', detail: `La tienda respondió HTTP ${res.status}${res.message ? `: ${res.message}` : ''}` });
      }
    } catch (err) {
      if (live()) setFlow({ phase: 'error', detail: err.message });
      notify('danger', err.message);
    }
  }

  // ---- Reenvío manual de un webhook (idempotencia y recuperación) ----
  const [replayingId, setReplayingId] = useState(null);

  async function replayDelivery(id) {
    setReplayingId(id);
    try {
      const delivery = await api.replayDelivery(id);
      refreshAll();
      const status = delivery.payload?.status;
      if (delivery.result !== 'DELIVERED') {
        notify(
          'danger',
          `El reenvío de ${status} falló: la tienda respondió ${delivery.responseStatus ? `HTTP ${delivery.responseStatus}` : 'con un error'}.`,
        );
      } else if (delivery.responseBody?.applied === false) {
        notify('info', `Reenvío de ${status}: la tienda respondió 200 sin aplicar cambios (ya lo había procesado).`);
      } else {
        notify('ok', `Reenvío de ${status}: la tienda lo aplicó.`);
      }
      setDetail((current) => (current?.type === 'delivery' ? { type: 'delivery', id: delivery.id } : current));
    } catch (err) {
      notify('danger', `No se pudo reenviar: ${err.message}`);
    } finally {
      setReplayingId(null);
    }
  }

  // ---- Simulación de tienda caída ----
  const [togglingStore, setTogglingStore] = useState(false);

  async function toggleStoreDown(next) {
    setTogglingStore(true);
    try {
      await api.setStoreDown(next);
      await simulationQ.refresh();
      notify(
        next ? 'danger' : 'ok',
        next
          ? 'Tienda caída: sus webhooks responderán 503. Haz una compra para ver los reintentos.'
          : 'La tienda volvió. Usa "Reenviar" en la entrega fallida para recuperarla.',
      );
    } catch (err) {
      notify('danger', `No se pudo cambiar la simulación: ${err.message}`);
    } finally {
      setTogglingStore(false);
    }
  }

  // ---- Suscripciones en el proveedor ----
  async function addSubscription(url) {
    try {
      const before = new Set(subscriptions.map((s) => s.id));
      // B no duplica: si la URL ya estaba registrada devuelve la suscripción existente.
      const created = await api.createSubscription(url, EVENT_NAME);
      await subsQ.refresh();
      if (before.has(created.id)) {
        notify('info', `Esa URL ya estaba registrada (#${created.id}).`);
      } else {
        notify('ok', `Suscripción #${created.id} registrada en el proveedor.`);
      }
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

  // ---- Datos del detalle abierto (se recalculan con cada consulta, así el detalle se ve en vivo) ----
  const openDelivery = detail?.type === 'delivery' ? deliveries.find((d) => d.id === detail.id) : null;
  const openReceived = detail?.type === 'received' ? received.find((r) => r.id === detail.id) : null;
  const openPayment = detail?.type === 'payment' ? payments.find((p) => p.id === detail.id) : null;

  return (
    <div className="app" data-view={view}>
      <TopBar
        view={view}
        onView={setView}
        cartCount={cartCount(cartLines)}
        cartTotal={cartTotal(cartLines)}
        onCart={() => document.getElementById('carrito')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        statusA={serviceState(ordersQ, paymentsQ, receivedQ)}
        statusB={serviceState(subsQ, deliveriesQ, providerPaymentsQ)}
      />

      {view === 'tienda' ? (
        <Store
          cart={cart}
          setCart={setCart}
          payments={payments}
          orders={orders}
          createPayment={createPayment}
          creating={flow.phase === 'creating'}
          reopenCheckout={reopenCheckout}
          onOpenPayment={(id) => setDetail({ type: 'payment', id })}
        />
      ) : (
        <>
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
            <OrderCard done={orders.length > 0} onCreate={createPayment} busy={flow.phase === 'creating'} />
            <SecurityCard
              storeDown={storeDown}
              onToggleStoreDown={toggleStoreDown}
              togglingStore={togglingStore}
              onSend={sendFakeSignature}
              busy={flow.phase === 'fake-sending'}
            />
          </div>
          <div className="col tabbed">
            <SectionTabs tabs={tabs} active={tab} onChange={setTab} label="Evidencia de la demo" />
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
              {tab === 'orders' && (
                <OrdersCard
                  orders={orders}
                  payments={payments}
                  loaded={ordersQ.loaded && paymentsQ.loaded}
                  error={ordersQ.error || paymentsQ.error}
                  onOpen={(id) => setDetail({ type: 'payment', id })}
                />
              )}
              {tab === 'sent' && (
                <DeliveriesCard
                  deliveries={deliveries}
                  loaded={deliveriesQ.loaded}
                  error={deliveriesQ.error}
                  onOpen={(id) => setDetail({ type: 'delivery', id })}
                  onReplay={replayDelivery}
                  replayingId={replayingId}
                />
              )}
              {tab === 'received' && (
                <ReceivedCard
                  received={received}
                  loaded={receivedQ.loaded}
                  error={receivedQ.error}
                  storeDown={storeDown}
                  onOpen={(id) => setDetail({ type: 'received', id })}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <footer>
        Proyecto de Paradigmas de Programación · Investigación sobre Webhooks · Servicio B (proveedor) → webhook firmado
        con HMAC → Servicio A (tienda)
      </footer>
        </>
      )}

      <DeliveryInspector
        delivery={openDelivery}
        onClose={closeDetail}
        onReplay={replayDelivery}
        replaying={replayingId === openDelivery?.id}
      />
      <ReceivedInspector entry={openReceived} onClose={closeDetail} />
      <PaymentTimeline
        payment={openPayment}
        order={orders.find((o) => o.id === openPayment?.orderId)}
        providerPayment={providerPayments.find((p) => p.paymentId === openPayment?.id)}
        deliveries={deliveries.filter((d) => d.payload?.paymentId === openPayment?.id)}
        received={received.filter((r) => r.paymentId === openPayment?.id)}
        onClose={closeDetail}
      />

      <OnvoCheckout checkout={checkout} onPaid={onvoPaid} onClose={() => setCheckout(null)} />

      <Toasts toasts={toasts} onClose={closeToast} />
    </div>
  );
}
