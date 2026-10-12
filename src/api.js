// Todas las peticiones salen por el mismo origen del frontend:
//   /api/a/*  -> Servicio A (tienda)     (Nginx en Docker, o el proxy de Vite con `npm run dev`)
//   /api/b/*  -> Servicio B (proveedor)
// Por eso el navegador nunca hace peticiones entre orígenes distintos (sin CORS).
export const API_A = '/api/a';
export const API_B = '/api/b';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  // Nest a veces responde 200 con el cuerpo vacío (p. ej. DELETE de algo que no existe).
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, body));
  return body;
}

// 502/503/504 los devuelve Nginx (o Vite) cuando el servicio de atrás no está corriendo.
const isGatewayError = (status) => status >= 502 && status <= 504;

function errorMessage(status, body) {
  if (isGatewayError(status)) return 'El servicio no responde. ¿Está corriendo?';
  const message = body && typeof body === 'object' ? body.message : null;
  if (Array.isArray(message)) return message.join(', ');
  return message || `HTTP ${status}`;
}

const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const api = {
  // Servicio A: tienda
  listPayments: () => request(`${API_A}/payments`),
  getPayment: (id) => request(`${API_A}/payments/${id}`),
  createPayment: (product, amount, provider) =>
    request(`${API_A}/payments`, json('POST', { product, amount, provider })),
  listOrders: () => request(`${API_A}/pedidos`),
  listReceived: () => request(`${API_A}/webhooks/recibidos`),
  getSimulation: () => request(`${API_A}/webhooks/simulacion`),
  setStoreDown: (storeDown) => request(`${API_A}/webhooks/simulacion`, json('PUT', { storeDown })),

  // Servicio B: proveedor de pagos
  listProviderPayments: () => request(`${API_B}/payments`),
  listSubscriptions: () => request(`${API_B}/suscripciones`),
  createSubscription: (url, event) => request(`${API_B}/suscripciones`, json('POST', { url, event })),
  deleteSubscription: (id) => request(`${API_B}/suscripciones/${id}`, { method: 'DELETE' }),
  listDeliveries: () => request(`${API_B}/webhooks/entregas`),
  replayDelivery: (id) => request(`${API_B}/webhooks/entregas/${id}/reenviar`, { method: 'POST' }),

  // Prueba de seguridad: se le habla directo a la tienda con una firma inventada.
  // El navegador no conoce el HMAC_SECRET, así que A debe responder 401.
  async sendFakeWebhook() {
    let res;
    try {
      res = await fetch(`${API_A}/webhooks/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': 'firma-falsa' },
        body: JSON.stringify({
          event: 'payment.updated',
          paymentId: '00000000-0000-4000-8000-000000000000',
          status: 'APPROVED',
        }),
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el Servicio A');
    }
    const body = await res.json().catch(() => null);
    // Un 503 con mensaje viene de la propia tienda (simulación de caída); sin mensaje, del proxy.
    if (isGatewayError(res.status) && !body?.message) {
      throw new ApiError(res.status, 'El Servicio A no responde. ¿Está corriendo?');
    }
    return { status: res.status, message: body?.message };
  },
};
