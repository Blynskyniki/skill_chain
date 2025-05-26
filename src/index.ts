// server.ts

import Fastify from 'fastify';
import { registerRoutes } from './routes';

// --- Запуск сервера ---
const start = async () => {
  const fastify = Fastify({ logger: true });
  await registerRoutes(fastify);
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log('✅ Сервер запущен: http://localhost:3000');
};

start();
