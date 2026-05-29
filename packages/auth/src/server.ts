import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { Resend } from 'resend';
import { account, db, session, user, verification } from '@rpg-life/db';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

if (!resendApiKey || !emailFrom) {
  throw new Error(
    'RESEND_API_KEY and EMAIL_FROM are required to send magic-link emails. Set them in your environment.',
  );
}

const resend = new Resend(resendApiKey);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  emailAndPassword: {
    enabled: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: emailFrom,
          to: email,
          subject: 'Your rpg-life sign-in link',
          html: `<p><a href="${url}">Sign in to rpg-life</a></p>`,
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
