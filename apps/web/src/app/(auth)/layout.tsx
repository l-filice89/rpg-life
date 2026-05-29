import { AuthMotif } from '@/components/auth/auth-motif';
import './auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-screen relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <AuthMotif />
      <p className="brand-mark relative z-10 mb-8 text-center text-sm font-semibold tracking-wide text-muted-foreground">
        RPG <span className="text-primary">Life</span>
      </p>
      {children}
    </div>
  );
}
