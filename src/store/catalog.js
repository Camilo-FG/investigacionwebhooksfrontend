// Catálogo del supermercado. Los precios están en colones y son lo que se manda como `amount`.
export const CATEGORIES = [
  { id: 'all', label: 'Todo', emoji: '🛒' },
  { id: 'frutas', label: 'Frutas y verduras', emoji: '🥬' },
  { id: 'lacteos', label: 'Lácteos y huevos', emoji: '🥛' },
  { id: 'panaderia', label: 'Panadería', emoji: '🥖' },
  { id: 'despensa', label: 'Despensa', emoji: '🍚' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🧃' },
];

export const PRODUCTS = [
  { id: 'banano', name: 'Bananos', unit: 'kg', price: 1150, emoji: '🍌', category: 'frutas', tint: '#fff3c4' },
  { id: 'pina', name: 'Piña dulce', unit: 'unidad', price: 1800, emoji: '🍍', category: 'frutas', tint: '#ffe9b8' },
  { id: 'aguacate', name: 'Aguacate Hass', unit: 'unidad', price: 900, emoji: '🥑', category: 'frutas', tint: '#dff3d2' },
  { id: 'tomate', name: 'Tomate', unit: 'kg', price: 1350, emoji: '🍅', category: 'frutas', tint: '#ffdcd6' },
  { id: 'zanahoria', name: 'Zanahoria', unit: 'kg', price: 980, emoji: '🥕', category: 'frutas', tint: '#ffe3c6' },
  { id: 'manzana', name: 'Manzana roja', unit: 'kg', price: 2400, emoji: '🍎', category: 'frutas', tint: '#ffdcd6', tag: 'Fresca' },

  { id: 'leche', name: 'Leche entera', unit: '1 L', price: 1050, emoji: '🥛', category: 'lacteos', tint: '#e6f1ff' },
  { id: 'queso', name: 'Queso fresco', unit: '400 g', price: 3200, emoji: '🧀', category: 'lacteos', tint: '#fff0b8' },
  { id: 'huevos', name: 'Huevos', unit: 'cartón de 30', price: 4900, was: 5600, emoji: '🥚', category: 'lacteos', tint: '#fbf1e3', tag: 'Oferta' },
  { id: 'yogurt', name: 'Yogurt natural', unit: '1 kg', price: 2150, emoji: '🍶', category: 'lacteos', tint: '#eef2ff' },

  { id: 'pan', name: 'Pan de caja', unit: 'paquete', price: 1650, emoji: '🍞', category: 'panaderia', tint: '#fbe7cc' },
  { id: 'baguette', name: 'Baguette', unit: 'unidad', price: 850, emoji: '🥖', category: 'panaderia', tint: '#fbe7cc' },
  { id: 'tortillas', name: 'Tortillas de maíz', unit: 'paquete', price: 1300, emoji: '🌽', category: 'panaderia', tint: '#fff3c4' },
  { id: 'galletas', name: 'Galletas surtidas', unit: 'paquete', price: 1950, emoji: '🍪', category: 'panaderia', tint: '#f3e2d1' },

  { id: 'arroz', name: 'Arroz blanco', unit: '1 kg', price: 1100, emoji: '🍚', category: 'despensa', tint: '#f2f0ea' },
  { id: 'frijoles', name: 'Frijoles negros', unit: '800 g', price: 1750, emoji: '🥫', category: 'despensa', tint: '#e9e1d9' },
  { id: 'cafe', name: 'Café molido', unit: '500 g', price: 4600, emoji: '☕', category: 'despensa', tint: '#efe0d0', tag: 'Nacional' },
  { id: 'aceite', name: 'Aceite de oliva', unit: '500 ml', price: 6900, emoji: '🍾', category: 'despensa', tint: '#e8f0cf' },

  { id: 'naranja', name: 'Jugo de naranja', unit: '1 L', price: 2100, emoji: '🧃', category: 'bebidas', tint: '#ffe9b8' },
  { id: 'agua', name: 'Agua mineral', unit: '1,5 L', price: 980, emoji: '💧', category: 'bebidas', tint: '#e0f2fb' },
  { id: 'refresco', name: 'Refresco de fresa', unit: '2 L', price: 1250, emoji: '🥤', category: 'bebidas', tint: '#ffdcd6' },
];

export const MAX_PER_PRODUCT = 20;

export const colones = (n) => `₡${Math.round(Number(n) || 0).toLocaleString('es-CR')}`;

// El pedido se guarda con un único texto de hasta 120 caracteres (límite del backend).
export function orderLabel(lines) {
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const detail = lines.map((l) => `${l.product.name} ×${l.qty}`).join(', ');
  const label = `${count} ${count === 1 ? 'artículo' : 'artículos'}: ${detail}`;
  return label.length <= 120 ? label : `${label.slice(0, 117)}...`;
}

export const cartTotal = (lines) => lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
export const cartCount = (lines) => lines.reduce((sum, l) => sum + l.qty, 0);

// Reconstruye las líneas de una compra vieja a partir de la etiqueta que guarda el pedido
// ("3 artículos: Leche ×2, Pan ×1"). Devuelve null si no se puede (etiqueta cortada, producto
// que ya no existe, pedido de otra pantalla) y el ticket muestra entonces la etiqueta tal cual.
export function parseOrderLabel(label) {
  const match = /^\d+ art[ií]culos?: (.+)$/.exec(label ?? '');
  if (!match || label.endsWith('...')) return null;
  const lines = [];
  for (const part of match[1].split(', ')) {
    const m = /^(.+) ×(\d+)$/.exec(part);
    const product = m && PRODUCTS.find((p) => p.name === m[1]);
    if (!product) return null;
    lines.push({ product, qty: Number(m[2]) });
  }
  return lines;
}
