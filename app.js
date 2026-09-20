const API_A = '/api/a';
const API_B = '/api/b';

const statusSub = document.getElementById('status-sub');
const statusPedido = document.getElementById('status-pedido');
const statusFirma = document.getElementById('status-firma');
const eventsBody = document.getElementById('events-body');

function setStatus(el, message, isError = false) {
  el.textContent = message;
  el.classList.toggle('error', isError);
}

// Los datos de la tabla vienen de un JSON que alguien pudo escribir a mano
// (p. ej. un "producto" con HTML). Se escapan antes de meterlos en innerHTML.
function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

document.getElementById('btn-sub').addEventListener('click', async () => {
  const url = document.getElementById('url').value.trim();
  const event = document.getElementById('event').value.trim();

  try {
    // Servicio A no evita suscripciones duplicadas: si se registra dos veces la
    // misma URL+evento, cada pedido dispara el webhook dos veces. Se revisa antes.
    const listRes = await fetch(`${API_A}/suscripciones`);
    if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
    const existing = (await listRes.json()).find((s) => s.url === url && s.event === event);
    if (existing) {
      setStatus(statusSub, `Ya estaba registrada (#${existing.id}) → ${existing.url}`);
      return;
    }

    const res = await fetch(`${API_A}/suscripciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, event }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setStatus(statusSub, `Suscripción #${data.id} registrada → ${data.url}`);
  } catch (err) {
    setStatus(statusSub, `Error: ${err.message}`, true);
  }
});

// Demo de seguridad: le habla directo al receptor (B) con una firma inventada.
// El navegador nunca conoce el HMAC_SECRET, así que no puede firmar bien: B debe
// responder 401 y el evento no debe aparecer en la tabla.
document.getElementById('btn-firma').addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_B}/webhooks/pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': 'firma-falsa' },
      body: JSON.stringify({ id: 'falso-1', producto: 'Pedido falso', monto: 999 }),
    });
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      setStatus(statusFirma, `B rechazó la petición: HTTP 401 — ${data.message ?? 'Firma inválida'}`);
    } else {
      setStatus(statusFirma, `¡Atención! B respondió HTTP ${res.status}: aceptó una firma falsa`, true);
    }
  } catch (err) {
    setStatus(statusFirma, `Error: ${err.message}`, true);
  }
});

document.getElementById('btn-pedido').addEventListener('click', async () => {
  const producto = document.getElementById('producto').value.trim();
  const monto = Number(document.getElementById('monto').value);

  try {
    const res = await fetch(`${API_A}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto, monto }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setStatus(statusPedido, `Pedido creado: ${data.id}`);
  } catch (err) {
    setStatus(statusPedido, `Error: ${err.message}`, true);
  }
});

async function refreshEvents() {
  try {
    const res = await fetch(`${API_B}/webhooks/recibidos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();

    if (!events.length) {
      eventsBody.innerHTML = '<tr><td colspan="4">Sin eventos aún…</td></tr>';
      return;
    }

    eventsBody.innerHTML = events
      .slice()
      .reverse()
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(e.producto)}</td>
        <td>${escapeHtml(e.monto)}</td>
        <td>${escapeHtml(e.fecha)}</td>
        <td>${escapeHtml(e.receivedAt)}</td>
      </tr>`,
      )
      .join('');
  } catch {
    // Keep last table state while B is starting
  }
}

refreshEvents();
setInterval(refreshEvents, 2000);
