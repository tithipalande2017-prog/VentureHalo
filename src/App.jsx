import { useEffect, useMemo, useState } from 'react';
import EntrepreneurSurvey from './components/EntrepreneurSurvey';
import FounderDashboard from './components/FounderDashboard';
import RoleSelection from './components/RoleSelection';
import InvestorExperience from './components/InvestorExperience';
import LoginScreen from './components/LoginScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { detectTimezone } from './utils/timezone';

const startupCards = [
  {
    name: 'HelioForge',
    pitch: 'Adaptive capital intelligence for frontier founders.',
    stage: 'Series A',
    target: '$18M',
    industry: 'Deep Tech',
  },
  {
    name: 'AuraSphere',
    pitch: 'AI-curated investor networks with real-time signal flow.',
    stage: 'Seed',
    target: '$4.2M',
    industry: 'Investor Intelligence',
  },
  {
    name: 'Nexus Cove',
    pitch: 'Premium deal discovery for founders with traction.',
    stage: 'Growth',
    target: '$27M',
    industry: 'Marketplace',
  },
  {
    name: 'Lumen Vault',
    pitch: 'Cohort-backed risk insights for strategic capital.',
    stage: 'Pre-Series A',
    target: '$7.4M',
    industry: 'Climate Tech',
  },
];

const intelligenceFeatures = [
  {
    title: 'Founder signal market',
    description: 'Curated discovery, sentiment factors, and quality assessment for emerging startups.',
  },
  {
    title: 'Investor readiness score',
    description: 'Real-time traction metrics, runway clarity, and diligence-ready profiles.',
  },
  {
    title: 'Portfolio heatmap',
    description: 'Holistic visibility into the next wave of premium deal flow.',
  },
];

const metricPanels = [
  { label: 'Verified founders', value: '1.2K+' },
  { label: 'Active syndicates', value: '320+' },
  { label: 'M cap tracked', value: '$12.8B' },
];

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

async function saveUserTimezone(uid) {
  try {
    const db = getFirestore();
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    const timezone = detectTimezone();
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Only update if timezone is missing
      if (!userData.timezone) {
        await updateDoc(userDocRef, { timezone });
        console.log('[App] Timezone added to existing user:', timezone);
      }
    } else {
      // Create user document with timezone
      await setDoc(userDocRef, {
        uid,
        timezone,
        createdAt: new Date().toISOString()
      });
      console.log('[App] New user document created with timezone:', timezone);
    }
  } catch (error) {
    console.error('[App] Failed to save user timezone:', error);
    // Don't block authentication if timezone save fails
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [role, setRole] = useState(null);
  const [view, setView] = useState('landing');
  const [surveyData, setSurveyData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthResolved(true);

      // Save timezone for new and existing users
      if (u) {
        await saveUserTimezone(u.uid);
      }
    });
    return () => unsub();
  }, []);

  if (!authResolved) return null;

  if (!user) {
    return <LoginScreen />;
  }

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setView(selectedRole === 'entrepreneur' ? 'survey' : 'landing');
  };

  const handleSurveyComplete = (data) => {
    console.log('Survey completed with data:', data);
    setSurveyData(data);
    setView('dashboard');
  };

  const handleBackToRoleSelection = () => {
    setRole(null);
    setView('landing');
    setSurveyData(null);
  };

  if (!role) {
    return <RoleSelection onSelectRole={handleSelectRole} />;
  }

  if (role === 'entrepreneur' && view === 'survey') {
    return <EntrepreneurSurvey onComplete={handleSurveyComplete} />;
  }

  if (role === 'entrepreneur' && view === 'dashboard') {
    return <FounderDashboard surveyData={surveyData} user={user} />;
  }

  if (role === 'investor') {
    return <InvestorExperience user={user} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />
      <ParticleField />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 shadow-panel backdrop-blur-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-graymuted">Venture Halo</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {role === 'entrepreneur' ? 'Founder Ecosystem' : 'Investor-grade startup discovery, reimagined.'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {role === 'entrepreneur' && (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-graysoft">Premium workspace</span>
                {view !== 'landing' && (
                  <button onClick={() => setView('landing')} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-graysoft transition hover:border-gold/30 hover:text-gold">Discovery</button>
                )}
              </>
            )}
            <button onClick={handleBackToRoleSelection} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-graysoft transition hover:border-gold/30 hover:text-gold">Switch Role</button>
          </div>
        </header>

        <main className="relative z-10 mt-12 flex-1 space-y-16">
          <section className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="space-y-8">
              <div className="max-w-2xl space-y-6">
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Strategic startup intelligence</p>
                <h2 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-6xl">A luxury black-and-gold ecosystem for founders and capital partners.</h2>
                <p className="max-w-xl text-lg leading-8 text-graysoft">Discover premium venture opportunities, matched investor insight, and clean capital readiness in a cinematic environment built for high-performance decision making.</p>
              </div>

              <div className="flex flex-wrap gap-4">
                {role === 'entrepreneur' ? (
                  <>
                    <button onClick={() => setView('survey')} className="inline-flex items-center justify-center rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10">Edit profile</button>
                    <button onClick={() => setView('dashboard')} className="inline-flex items-center justify-center rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10">View dashboard</button>
                  </>
                ) : (
                  <button onClick={() => { setRole('entrepreneur'); setView('survey'); }} className="inline-flex items-center justify-center rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10">Build your profile</button>
                )}
                <a className="inline-flex items-center justify-center rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10" href="#discovery">Explore startups</a>
                <a className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition duration-300 hover:bg-white/10" href="#vision">Our vision</a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft">
              <div className="absolute -right-14 -top-12 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
              <div className="absolute left-10 top-6 h-24 w-24 rounded-full border border-gold/20 bg-white/10 blur-sm" />
              <div className="relative space-y-6">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-xl">
                  <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Investor confidence</p>
                  <h3 className="mt-3 text-3xl font-semibold text-white">Curated capital intelligence engine</h3>
                  <p className="mt-4 text-sm leading-7 text-graysoft">A single source for startup discovery, portfolio health, and readiness signals across premium deal flow.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {metricPanels.map((panel) => (
                    <div key={panel.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-graymuted">{panel.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{panel.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="discovery" className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Startup discovery preview</p>
                <h3 className="mt-3 text-3xl font-semibold text-white">Navigate vetted opportunities with clarity and calm.</h3>
              </div>
              <p className="max-w-xl text-sm leading-7 text-graysoft">Each listing is surfaced through signal-backed curation, deeper market context, and elegant investor-grade presentation.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {intelligenceFeatures.map((feature) => (
                <article key={feature.title} className="group rounded-[28px] border border-white/10 bg-white/5 p-7 transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-graymuted">{feature.title}</p>
                  <p className="mt-4 text-base leading-7 text-graysoft">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Investor intelligence</p>
                <h3 className="mt-3 text-3xl font-semibold text-white">High-touch insight for discerning capital allocators.</h3>
              </div>
              <div className="rounded-full border border-gold/20 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.32em] text-gold">Stable, premium, intentional</div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <article className="rounded-[32px] border border-white/10 bg-white/5 p-7 shadow-panel transition duration-300 hover:-translate-y-1 hover:border-gold/30">
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Market pulse</p>
                <h4 className="mt-4 text-2xl font-semibold text-white">Sleek convergence of startup metrics and narrative context.</h4>
                <p className="mt-4 text-sm leading-7 text-graysoft">Track performance in a calm workspace built to surface the strongest founders with subtle precision.</p>
              </article>
              <article className="rounded-[32px] border border-white/10 bg-white/5 p-7 shadow-panel transition duration-300 hover:-translate-y-1 hover:border-gold/30">
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Signal clarity</p>
                <h4 className="mt-4 text-2xl font-semibold text-white">Minimal noise, maximum strategic context.</h4>
                <p className="mt-4 text-sm leading-7 text-graysoft">Premium layers of intelligence help you avoid hype and focus on reliable deal flow.</p>
              </article>
              <article className="rounded-[32px] border border-white/10 bg-white/5 p-7 shadow-panel transition duration-300 hover:-translate-y-1 hover:border-gold/30">
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Portfolio readiness</p>
                <h4 className="mt-4 text-2xl font-semibold text-white">A grounded ecosystem for capital allocation decisions.</h4>
                <p className="mt-4 text-sm leading-7 text-graysoft">Evaluate startups with a luxury-grade interface designed for measured confidence.</p>
              </article>
            </div>
          </section>

          <section className="space-y-8" id="showcase">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Startup showcase cards</p>
              <h3 className="text-3xl font-semibold text-white">Premium ventures selected for strategic investor review.</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {startupCards.map((startup) => (
                <article key={startup.name} className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-panel transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/10">
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="relative space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-graymuted">{startup.stage}</span>
                      <span className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">{startup.industry}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">{startup.name}</h4>
                      <p className="mt-3 text-sm leading-7 text-graysoft">{startup.pitch}</p>
                    </div>
                    <div className="rounded-3xl bg-black/30 px-4 py-3 text-sm text-graysoft">Funding target {startup.target}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="vision" className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
              <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Platform vision</p>
              <h3 className="text-3xl font-semibold text-white">Build a premium intelligence environment for capital and founders.</h3>
              <p className="text-base leading-8 text-graysoft">From curated discovery to investor-grade intelligence, every surface is designed to feel stable, elegant, and deeply immersive.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <p className="text-sm font-semibold text-white">Cinematic depth</p>
                  <p className="mt-3 text-sm leading-7 text-graysoft">Soft layers, ambient texture, and subtle glow create a premium visual rhythm.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <p className="text-sm font-semibold text-white">Calm motion</p>
                  <p className="mt-3 text-sm leading-7 text-graysoft">Smooth fades and gentle transitions preserve focus without distraction.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
              <div className="space-y-5">
                <div className="rounded-3xl border border-gold/15 bg-black/20 p-6">
                  <h4 className="text-xl font-semibold text-white">A premium ecosystem for founders and investors.</h4>
                  <p className="mt-4 text-sm leading-7 text-graysoft">Every interaction is crafted to support high-value discovery and decision making with poise.</p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-3xl bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Anchor values</p>
                    <p className="mt-3 text-sm leading-7 text-graysoft">Precision, stability, and premium execution.</p>
                  </div>
                  <div className="rounded-3xl bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Design ethos</p>
                    <p className="mt-3 text-sm leading-7 text-graysoft">Controlled cinematic ambiance, not noise.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative z-10 mt-16 rounded-[32px] border border-white/10 bg-white/5 p-8 text-sm text-graysoft shadow-panel backdrop-blur-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-semibold text-white">Venture Halo</p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-graysoft">A luxury black-and-gold startup intelligence ecosystem built for the next generation of founders and investors.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-graysoft">
              <a href="#discovery" className="transition hover:text-white">Discovery</a>
              <a href="#showcase" className="transition hover:text-white">Showcase</a>
              <a href="#vision" className="transition hover:text-white">Vision</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
