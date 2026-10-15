import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../server/routers';

export default async function handler(req, res) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ req, res }),
    onError({ error }) {
      console.error('TRPC Error', error);
    },
  });
}
