'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { signIn } from '@rpg-life/auth/client';
import { Button, Input, Label } from '@rpg-life/ui';
import { maskEmail } from '@/lib/mask-email';

const emailSchema = z.string().email();
const REALM_ADDRESS_ERROR = 'Enter a valid realm address';
const LINK_ERROR_MESSAGE =
  'This sign-in link has expired or is invalid. Request a new one below.';

type View = 'email' | 'post-send';

export function SignInForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get('error');

  const [view, setView] = useState<View>('email');
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const sendMagicLink = useCallback(async (targetEmail: string) => {
    const parsed = emailSchema.safeParse(targetEmail.trim());
    if (!parsed.success) {
      setValidationError(REALM_ADDRESS_ERROR);
      return false;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsPending(true);

    const { error } = await signIn.magicLink({
      email: parsed.data,
      callbackURL: '/quest-board',
    });

    setIsPending(false);

    if (error) {
      setSubmitError(error.message ?? 'Could not send sign-in link. Try again.');
      return false;
    }

    setSentEmail(parsed.data);
    setView('post-send');
    return true;
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMagicLink(email);
  }

  async function handleResend() {
    const target = view === 'post-send' ? sentEmail : email;
    await sendMagicLink(target);
  }

  if (view === 'post-send') {
    return (
      <div className="portal-frame relative z-10 mx-auto w-full max-w-sm text-center">
        <div
          className="sent-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center text-primary"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z" />
          </svg>
        </div>

        <h1 className="text-display-sm text-foreground">Check your stars</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a sign-in link to</p>
        <p className="email-badge mt-3 inline-block rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
          {maskEmail(sentEmail)}
        </p>
        <p className="status-message mt-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Link sent</strong> — open your inbox to continue your
          quest.
        </p>

        <Button
          type="button"
          variant="ghost"
          className="resend-link mt-6 text-primary"
          disabled={isPending}
          onClick={() => void handleResend()}
        >
          Resend sign-in link
        </Button>
        <p className="resend-hint mt-2 text-xs text-muted-foreground">
          Didn&apos;t receive it? Check spam or try again in a minute.
        </p>
        {submitError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="portal-frame relative z-10 mx-auto w-full max-w-sm">
      {linkError ? (
        <div
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {LINK_ERROR_MESSAGE}
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto p-0 text-destructive"
            disabled={isPending}
            onClick={() => void handleResend()}
          >
            Resend sign-in link
          </Button>
        </div>
      ) : null}

      <div
        className="portal-crest mx-auto mb-4 flex h-12 w-12 items-center justify-center text-primary"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          <circle cx="12" cy="12" r="2" fill="var(--background)" />
        </svg>
      </div>

      <h1 className="text-display-sm text-center text-foreground">Enter the realm</h1>
      <p className="auth-sub mt-2 text-center text-sm text-muted-foreground">
        Sign in to continue your quest and track your Hero&apos;s journey.
      </p>

      <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="field-group space-y-2">
          <Label htmlFor="email-signin">Email</Label>
          <Input
            id="email-signin"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? 'email-error' : undefined}
          />
          {validationError ? (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send sign-in link'}
        </Button>
      </form>
    </div>
  );
}
