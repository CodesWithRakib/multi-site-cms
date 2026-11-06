'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock, LogIn, Mail } from 'lucide-react';

import { Button } from '@multi-site-cms/ui';

import { apiErrorMessage } from '@/lib/api-error';
import { useAdmin } from '@/lib/admin-context';
import { useLoginMutation } from '@/lib/cms-api';

import { BrandMark } from './BrandMark';
import { LoginField } from './LoginField';

type LoginFormProps = {
  /** Same-origin path to open after a successful sign-in. */
  returnUrl: string;
};

/** Sign-in card. Only email/password: the API has no reset or remember-me flow. */
export function LoginForm({ returnUrl }: LoginFormProps) {
  const router = useRouter();
  const { t } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(t.auth.requiredFields);
      return;
    }

    try {
      await login({ email: email.trim(), password }).unwrap();
      router.push(returnUrl);
    } catch (error: unknown) {
      setErrorMessage(apiErrorMessage(error, t.auth.loginFailed));
    }
  };

  return (
    <section
      aria-labelledby="login-title"
      className="relative w-full max-w-[34rem] rounded-3xl border border-brand-400/30 bg-slate-950/70 p-6 shadow-[0_0_60px_-15px] shadow-brand-500/40 backdrop-blur-xl sm:p-10"
    >
      <header className="mb-8 flex flex-col items-center text-center">
        <BrandMark className="mb-5 size-16 ring-8 ring-brand-500/10" />
        <h1 id="login-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t.auth.loginTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{t.auth.loginSubtitle}</p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-medium text-red-200"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <LoginField
          id="email"
          type="email"
          name="email"
          autoComplete="username"
          required
          label={t.auth.emailLabel}
          placeholder={t.auth.emailPlaceholder}
          icon={<Mail />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <LoginField
          id="password"
          name="password"
          autoComplete="current-password"
          required
          label={t.auth.passwordLabel}
          placeholder={t.auth.passwordPlaceholder}
          icon={<Lock />}
          reveal={{ show: t.auth.showPassword, hide: t.auth.hidePassword }}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="mt-2 h-12 w-full rounded-xl bg-brand-400 text-base font-semibold text-brand-950 hover:bg-brand-300 focus-visible:ring-brand-300 focus-visible:ring-offset-slate-950 [&_svg]:size-5"
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" />
              <span>{t.auth.signingIn}</span>
            </>
          ) : (
            <>
              <LogIn aria-hidden="true" />
              <span>{t.auth.signInBtn}</span>
            </>
          )}
        </Button>
      </form>

      {/* No account hints here: this page ships to production, and listing
          privileged emails helps targeted attacks (SEC-14). */}
      <footer className="mt-8 flex items-center gap-3 text-xs text-slate-500">
        <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
        <span className="flex items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3.5" />
          {t.auth.secureFooter}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
      </footer>
    </section>
  );
}
