import { useState } from 'react';
import { signInWithGoogle } from '../../firebase';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      setLoading(false);
    } catch (err) {
      console.error('Auth error', err);
      const code = err?.code || '';
      let message = err?.message || String(err);

      if (code === 'auth/configuration-not-found') {
        message = 'Firebase auth is not configured for this site. Add localhost and 127.0.0.1 as authorized domains in Firebase, and enable Google sign-in.';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase auth. Add your dev host to Firebase authorized domains and try again.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Popup blocked. Please allow popups or try again using the redirect flow.';
      }

      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12 sm:px-8 lg:px-10">
        <div className="w-full rounded-[28px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Welcome to</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Venture Halo</h1>
              <p className="mt-2 text-sm text-graysoft">A premium ecosystem for founders and capital partners.</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Continue</p>
            <div className="rounded-[24px] border border-white/10 bg-black/40 p-6">
              <p className="text-sm text-graysoft">Sign in to access your dashboard and shared meetings.</p>

              <div className="mt-6">
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10"
                >
                  {loading ? 'Signing in…' : 'Continue with Google'}
                </button>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              </div>
            </div>

            <p className="text-xs text-graymuted">Your session will be persisted locally for convenience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
