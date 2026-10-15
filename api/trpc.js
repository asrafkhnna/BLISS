import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../server/routers.js';

export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }) => ({
    req,
    res,
  }),
});
