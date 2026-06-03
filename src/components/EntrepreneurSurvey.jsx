import { useState, useMemo } from 'react';

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

function ProgressIndicator({ current, total }) {
  return (
    <div className="mb-12 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Build Your Startup Profile</h1>
        <span className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
          Step {current} of {total}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-gold to-gold/80 transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, type = 'text', optional = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium uppercase tracking-[0.24em] text-graysoft">
        {label} {optional && <span className="text-graymuted">(optional)</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-graymuted/40 transition duration-300 focus:border-gold/40 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function TextAreaField({ label, placeholder, value, onChange, optional = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium uppercase tracking-[0.24em] text-graysoft">
        {label} {optional && <span className="text-graymuted">(optional)</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-graymuted/40 transition duration-300 focus:border-gold/40 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function SelectButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-5 py-3 text-sm font-medium uppercase tracking-[0.24em] transition duration-300 ${
        selected
          ? 'border-gold/40 bg-white/10 text-gold shadow-glow'
          : 'border-white/10 bg-white/5 text-graysoft hover:border-white/20 hover:bg-white/8'
      }`}
    >
      {label}
    </button>
  );
}

function Section1({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Founder Identity</p>
        <h2 className="text-2xl font-semibold text-white">Tell us about yourself</h2>
      </div>

      <InputField
        label="Your Name"
        placeholder="First and last name"
        value={data.founderName || ''}
        onChange={(v) => onChange({ ...data, founderName: v })}
      />

      <InputField
        label="Startup Name"
        placeholder="What's your startup called?"
        value={data.startupName || ''}
        onChange={(v) => onChange({ ...data, startupName: v })}
      />

      <InputField
        label="Location"
        placeholder="City, Country"
        value={data.location || ''}
        onChange={(v) => onChange({ ...data, location: v })}
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium uppercase tracking-[0.24em] text-graysoft">
          Startup Stage
        </label>
        <div className="flex flex-wrap gap-3">
          {['Idea', 'MVP', 'Growth'].map((stage) => (
            <SelectButton
              key={stage}
              label={stage}
              selected={data.stage === stage}
              onClick={() => onChange({ ...data, stage })}
            />
          ))}
        </div>
      </div>

      <InputField
        label="Team Size"
        placeholder="e.g., 2"
        type="number"
        value={data.teamSize || ''}
        onChange={(v) => onChange({ ...data, teamSize: v })}
        optional
      />

      <InputField
        label="LinkedIn / Profile Link"
        placeholder="https://linkedin.com/in/..."
        value={data.profileLink || ''}
        onChange={(v) => onChange({ ...data, profileLink: v })}
        optional
      />
    </div>
  );
}

function Section2({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Startup Idea</p>
        <h2 className="text-2xl font-semibold text-white">Share your vision</h2>
      </div>

      <TextAreaField
        label="One-Sentence Pitch"
        placeholder="Describe your startup in one powerful sentence..."
        value={data.oneSentencePitch || ''}
        onChange={(v) => onChange({ ...data, oneSentencePitch: v })}
      />

      <TextAreaField
        label="What Problem Are You Solving?"
        placeholder="What pain point or opportunity are you addressing?"
        value={data.problemStatement || ''}
        onChange={(v) => onChange({ ...data, problemStatement: v })}
      />

      <TextAreaField
        label="Why Is This Problem Important?"
        placeholder="What's the market impact and urgency?"
        value={data.problemImportance || ''}
        onChange={(v) => onChange({ ...data, problemImportance: v })}
      />

      <TextAreaField
        label="What Inspired You?"
        placeholder="What sparked the idea for this startup?"
        value={data.inspiration || ''}
        onChange={(v) => onChange({ ...data, inspiration: v })}
        optional
      />
    </div>
  );
}

function Section3({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Product</p>
        <h2 className="text-2xl font-semibold text-white">Describe your solution</h2>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium uppercase tracking-[0.24em] text-graysoft">
          Do you currently have an MVP?
        </label>
        <div className="flex flex-wrap gap-3">
          {['Yes', 'No', 'In Development'].map((option) => (
            <SelectButton
              key={option}
              label={option}
              selected={data.hasMVP === option}
              onClick={() => onChange({ ...data, hasMVP: option })}
            />
          ))}
        </div>
      </div>

      <TextAreaField
        label="Describe Your Product"
        placeholder="What does your product do? How does the user experience it?"
        value={data.productDescription || ''}
        onChange={(v) => onChange({ ...data, productDescription: v })}
      />

      <TextAreaField
        label="How Does Your Product Work?"
        placeholder="Walk us through the key features and functionality..."
        value={data.productMechanic || ''}
        onChange={(v) => onChange({ ...data, productMechanic: v })}
      />

      <InputField
        label="Current Users / Customers"
        placeholder="Number of users or revenue if applicable"
        value={data.currentUsers || ''}
        onChange={(v) => onChange({ ...data, currentUsers: v })}
        optional
      />

      <InputField
        label="Website / Demo Link"
        placeholder="https://..."
        value={data.productLink || ''}
        onChange={(v) => onChange({ ...data, productLink: v })}
        optional
      />
    </div>
  );
}

function Section4({ data, onChange }) {
  const industries = ['Healthcare', 'FinTech', 'Climate Tech', 'SaaS', 'AI/ML', 'E-Commerce', 'Education', 'Other'];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Business Model</p>
        <h2 className="text-2xl font-semibold text-white">Build your business strategy</h2>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium uppercase tracking-[0.24em] text-graysoft">
          Industry
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {industries.map((industry) => (
            <SelectButton
              key={industry}
              label={industry}
              selected={data.industry === industry}
              onClick={() => onChange({ ...data, industry })}
            />
          ))}
        </div>
      </div>

      <TextAreaField
        label="Target Audience"
        placeholder="Who is your ideal customer? Describe their profile..."
        value={data.targetAudience || ''}
        onChange={(v) => onChange({ ...data, targetAudience: v })}
      />

      <TextAreaField
        label="How Will Your Startup Make Money?"
        placeholder="Revenue model, pricing strategy, unit economics..."
        value={data.revenueModel || ''}
        onChange={(v) => onChange({ ...data, revenueModel: v })}
      />

      <TextAreaField
        label="Main Competitors"
        placeholder="Who are your direct and indirect competitors?"
        value={data.competitors || ''}
        onChange={(v) => onChange({ ...data, competitors: v })}
      />

      <TextAreaField
        label="What Makes Your Startup Different?"
        placeholder="Your competitive advantage, unfair advantage, or unique angle..."
        value={data.differentiation || ''}
        onChange={(v) => onChange({ ...data, differentiation: v })}
      />
    </div>
  );
}

function Section5({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Funding</p>
        <h2 className="text-2xl font-semibold text-white">Investment goals</h2>
      </div>

      <InputField
        label="How Much Funding Are You Seeking?"
        placeholder="e.g., $500K, $2M, $5M"
        value={data.fundingAmount || ''}
        onChange={(v) => onChange({ ...data, fundingAmount: v })}
      />

      <TextAreaField
        label="What Will the Funding Be Used For?"
        placeholder="Product development, team, marketing, operations..."
        value={data.fundingUse || ''}
        onChange={(v) => onChange({ ...data, fundingUse: v })}
      />

      <InputField
        label="Current Traction / Revenue"
        placeholder="MRR, ARR, user growth rate, or N/A"
        value={data.currentTraction || ''}
        onChange={(v) => onChange({ ...data, currentTraction: v })}
        optional
      />

      <TextAreaField
        label="Future Goals / Milestones"
        placeholder="12-month, 2-year, and 5-year milestones"
        value={data.futureGoals || ''}
        onChange={(v) => onChange({ ...data, futureGoals: v })}
      />

      <TextAreaField
        label="Why Should Investors Believe in This Startup?"
        placeholder="Your founder story, market timing, execution capability, etc."
        value={data.investorPitch || ''}
        onChange={(v) => onChange({ ...data, investorPitch: v })}
      />
    </div>
  );
}

function Section6({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted mb-6">Founder Vision</p>
        <h2 className="text-2xl font-semibold text-white">Your long-term mission</h2>
      </div>

      <TextAreaField
        label="Where Do You See This Startup in 5 Years?"
        placeholder="Market position, scale, impact..."
        value={data.fiveYearVision || ''}
        onChange={(v) => onChange({ ...data, fiveYearVision: v })}
      />

      <TextAreaField
        label="What Is Your Ultimate Mission?"
        placeholder="The big-picture change you want to create in the world"
        value={data.ultimateMission || ''}
        onChange={(v) => onChange({ ...data, ultimateMission: v })}
      />

      <TextAreaField
        label="What's Your Biggest Challenge Right Now?"
        placeholder="The main obstacle you're facing or need help with"
        value={data.biggestChallenge || ''}
        onChange={(v) => onChange({ ...data, biggestChallenge: v })}
      />

      <TextAreaField
        label="Why Are You Committed to This Idea?"
        placeholder="Your personal drive, passion, and conviction"
        value={data.commitment || ''}
        onChange={(v) => onChange({ ...data, commitment: v })}
      />
    </div>
  );
}

export default function EntrepreneurSurvey({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const totalSteps = 6;

  const steps = [
    { title: 'Founder Identity', component: Section1 },
    { title: 'Startup Idea', component: Section2 },
    { title: 'Product', component: Section3 },
    { title: 'Business Model', component: Section4 },
    { title: 'Funding', component: Section5 },
    { title: 'Founder Vision', component: Section6 },
  ];

  const CurrentSection = steps[step - 1].component;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(formData);
    }
  };

  const isLastStep = step === totalSteps;
  const isFirstStep = step === 1;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />
      <ParticleField />

      <div className="relative mx-auto max-w-3xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="mt-12">
          <ProgressIndicator current={step} total={totalSteps} />
        </div>

        <div className="mt-10 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft transition-all duration-500 sm:p-10">
          <CurrentSection data={formData} onChange={setFormData} />

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition duration-300 ${
                isFirstStep
                  ? 'border border-white/5 bg-white/5 text-graymuted/50 cursor-not-allowed'
                  : 'border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              className="rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10"
            >
              {isLastStep ? 'Complete Profile' : 'Next'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs uppercase tracking-[0.32em] text-graymuted">
          Building your investor-ready startup profile
        </div>
      </div>
    </div>
  );
}
