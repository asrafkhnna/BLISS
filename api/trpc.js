import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../server/routers.js';

export default async function handler(req) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}
