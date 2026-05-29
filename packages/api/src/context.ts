import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@rpg-life/auth/server';
import { db } from '@rpg-life/db';

export type Context = {
  db: typeof db;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  req: Request;
};

export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const session = await auth.api.getSession({ headers: opts.req.headers });

  return {
    db,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      : null,
    req: opts.req,
  };
}
