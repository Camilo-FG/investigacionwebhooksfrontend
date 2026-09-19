const API_A = '/api/a';
const API_B = '/api/b';

const statusSub = document.getElementById('status-sub');
const statusPedido = document.getElementById('status-pedido');
const eventsBody = document.getElementById('events-body');

function setStatus(el, message, isError = false) {
  el.textContent = message;
  el.classList.toggle('error', isError);
}

document.getElementById('btn-sub').addEventListener('click', async () => {
  const url = document.getElementById('url').value.trim();
  const event = document.getElementById('event').value.trim();

  try {
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
        <td>${e.producto ?? ''}</td>
        <td>${e.monto ?? ''}</td>
        <td>${e.fecha ?? ''}</td>
        <td>${e.receivedAt ?? ''}</td>
      </tr>`,
      )
      .join('');
  } catch {
    // Keep last table state while B is starting
  }
}

refreshEvents();
setInterval(refreshEvents, 2000);
