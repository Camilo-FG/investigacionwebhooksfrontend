// Todas las peticiones salen por el mismo origen del frontend:
//   /api/a/*  -> Servicio A   (Nginx en Docker, o el proxy de Vite con `npm run dev`)
//   /api/b/*  -> Servicio B
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
  return (body && typeof body === 'object' && body.message) || `HTTP ${status}`;
}

const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const api = {
  // Servicio A
  listSubscriptions: () => request(`${API_A}/suscripciones`),
  createSubscription: (url, event) => request(`${API_A}/suscripciones`, json('POST', { url, event })),
  deleteSubscription: (id) => request(`${API_A}/suscripciones/${id}`, { method: 'DELETE' }),
  listOrders: () => request(`${API_A}/pedidos`),
  createOrder: (producto, monto) => request(`${API_A}/pedidos`, json('POST', { producto, monto })),

  // Servicio B
  listEvents: () => request(`${API_B}/webhooks/recibidos`),

  // Prueba de seguridad: se le habla directo a B con una firma inventada.
  // El navegador no conoce el HMAC_SECRET, así que B debe responder 401.
  async sendFakeWebhook() {
    let res;
    try {
      res = await fetch(`${API_B}/webhooks/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': 'firma-falsa' },
        body: JSON.stringify({ id: 'falso-1', producto: 'Pedido falso', monto: 999 }),
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el Servicio B');
    }
    if (isGatewayError(res.status)) throw new ApiError(res.status, 'El Servicio B no responde. ¿Está corriendo?');
    const body = await res.json().catch(() => null);
    return { status: res.status, message: body?.message };
  },
};
