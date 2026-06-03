import { useMemo } from 'react';

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 55 }, (_, index) => ({
        id: index,
        size: 1 + Math.random() * 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 28 + Math.random() * 18,
        opacity: 0.05 + Math.random() * 0.12,
        gold: Math.random() < 0.18,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full blur-sm particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            animationTimingFunction: 'ease-in-out',
            opacity: particle.opacity,
            backgroundColor: particle.gold ? 'rgba(212, 175, 55, 0.16)' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

export default function RoleSelection({ onSelectRole }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />
      <ParticleField />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-10">
        <div className="max-w-2xl space-y-12 text-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Choose your path</p>
            <h1 className="text-6xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-7xl">
              Welcome to Venture Halo
            </h1>
            <p className="text-lg leading-8 text-graysoft">
              A luxury startup intelligence ecosystem for founders and capital allocators.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <button
              onClick={() => onSelectRole('entrepreneur')}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-2 hover:border-gold/30 hover:bg-white/10"
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gold/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative space-y-5">
                <div className="text-5xl">🚀</div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">For Founders</h2>
                  <p className="text-sm leading-7 text-graysoft">
                    Build your investor-ready startup profile. Showcase your vision, traction, and dream to the right capital partners.
                  </p>
                </div>
                <div className="pt-4 text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                  Start your journey →
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectRole('investor')}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-2 hover:border-gold/30 hover:bg-white/10"
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gold/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative space-y-5">
                <div className="text-5xl">💎</div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">For Investors</h2>
                  <p className="text-sm leading-7 text-graysoft">
                    Explore premium startups, discover emerging opportunities, and connect with the next wave of founders.
                  </p>
                </div>
                <div className="pt-4 text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                  Explore ecosystem →
                </div>
              </div>
            </button>
          </div>

          <div className="pt-8 text-xs uppercase tracking-[0.32em] text-graymuted">
            A futuristic intelligence environment for capital and founders
          </div>
        </div>
      </div>
    </div>
  );
}
