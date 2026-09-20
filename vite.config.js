import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puertos de los servicios cuando se corre SIN Docker (npm run dev).
// Se pueden cambiar así:  PORT_A=3002 npm run dev
const portA = process.env.PORT_A || 3000;
const portB = process.env.PORT_B || 3001;

// En desarrollo, Vite hace el mismo trabajo que Nginx en Docker:
// /api/a/* -> Servicio A   y   /api/b/* -> Servicio B
// Así el navegador ve un solo origen y no hay problemas de CORS.
const proxyTo = (port, prefix) => ({
  target: `http://127.0.0.1:${port}`,
  changeOrigin: true,
  rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
});

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api/a': proxyTo(portA, '/api/a'),
      '/api/b': proxyTo(portB, '/api/b'),
    },
  },
});
