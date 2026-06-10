import { useState } from 'react';

function TermsOfService({ onBack }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionNumber) => {
    setExpandedSection(expandedSection === sectionNumber ? null : sectionNumber);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />
      
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="relative z-10 mt-6 flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-4 shadow-panel backdrop-blur-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-graymuted">Venture Halo</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Terms of Service</h1>
          </div>
          <button 
            onClick={onBack}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-graysoft transition hover:border-gold/30 hover:text-gold"
          >
            Back
          </button>
        </header>

        <main className="relative z-10 mt-12 flex-1 space-y-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft">
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-3xl font-semibold text-white">Venture Halo Terms of Service</h2>
                <p className="mt-2 text-sm text-graysoft">Effective Date: [Insert Date]</p>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-base leading-7 text-graysoft">
                  Welcome to Venture Halo ("Venture Halo," "we," "our," or "us"). By accessing or using our platform, website, or services, you agree to these Terms of Service ("Terms"). If you do not agree, you may not use Venture Halo.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    number: 1,
                    title: "Nature of the Platform",
                    content: [
                      "Venture Halo is an online platform designed to connect entrepreneurs, founders, investors, and other users.",
                      "Venture Halo acts solely as a platform and does not:",
                      "Provide investment advice.",
                      "Provide legal advice.",
                      "Provide financial advice.",
                      "Guarantee funding.",
                      "Guarantee partnerships.",
                      "Guarantee business success.",
                      "Verify or endorse every user.",
                      "Users are solely responsible for their decisions and interactions."
                    ]
                  },
                  {
                    number: 2,
                    title: "Eligibility",
                    content: [
                      "Users must:",
                      "Be at least 18 years old, or",
                      "Use the platform under the supervision and consent of a parent or legal guardian if permitted by applicable law.",
                      "By using Venture Halo, you represent that you have the legal capacity to enter into these Terms."
                    ]
                  },
                  {
                    number: 3,
                    title: "User Accounts",
                    content: [
                      "Users are responsible for:",
                      "Maintaining account security.",
                      "Keeping login credentials confidential.",
                      "All activities occurring under their account.",
                      "Venture Halo is not responsible for unauthorized access resulting from user negligence."
                    ]
                  },
                  {
                    number: 4,
                    title: "User Responsibility",
                    content: [
                      "Users are solely responsible for:",
                      "Conducting their own due diligence.",
                      "Verifying identities.",
                      "Evaluating opportunities.",
                      "Reviewing contracts.",
                      "Seeking independent professional advice.",
                      "No transaction or relationship should be entered into solely based on information available on Venture Halo."
                    ]
                  },
                  {
                    number: 5,
                    title: "No Guarantees",
                    content: [
                      "Venture Halo makes no guarantees regarding:",
                      "Investments.",
                      "Funding.",
                      "Business opportunities.",
                      "Partnerships.",
                      "Revenue.",
                      "Profitability.",
                      "Success.",
                      "User behavior.",
                      "Accuracy of information.",
                      "Identity or legitimacy of users.",
                      "Returns on investments.",
                      "Business outcomes.",
                      "All services are provided \"AS IS\" and \"AS AVAILABLE.\"",
                      "Users acknowledge that use of the platform involves inherent risks and that Venture Halo does not guarantee any particular result or outcome"
                    ]
                  },
                  {
                    number: 6,
                    title: "Prohibited Activities",
                    content: [
                      "Users may not:",
                      "Commit fraud.",
                      "Impersonate others.",
                      "Misrepresent qualifications or financial capabilities.",
                      "Upload illegal or harmful content.",
                      "Harass or threaten others.",
                      "Engage in scams.",
                      "Infringe intellectual property rights.",
                      "Distribute malware.",
                      "Attempt unauthorized access.",
                      "Use the platform for unlawful purposes.",
                      "Violation may result in immediate suspension or termination."
                    ]
                  },
                  {
                    number: 7,
                    title: "Fraud and Due Diligence",
                    content: [
                      "Venture Halo does not guarantee the identity, legitimacy, or conduct of any founder, investor, or user.",
                      "Users must independently verify:",
                      "Identities.",
                      "Credentials.",
                      "Financial capacity.",
                      "Business claims.",
                      "Venture Halo shall not be responsible for losses arising from:",
                      "Fraud.",
                      "Misrepresentation.",
                      "Scams.",
                      "Failed transactions.",
                      "False information provided by users."
                    ]
                  },
                  {
                    number: 8,
                    title: "Intellectual Property",
                    content: [
                      "All Venture Halo logos, trademarks, branding, software, and content are owned by Venture Halo unless otherwise stated.",
                      "Users retain ownership of their own content.",
                      "By uploading content, users grant Venture Halo a non-exclusive license to display and distribute such content for the operation of the platform."
                    ]
                  },
                  {
                    number: 9,
                    title: "User Content",
                    content: [
                      "Users are solely responsible for content they upload.",
                      "Venture Halo does not guarantee the accuracy, reliability, or legality of user-generated content.",
                      "We reserve the right to remove content that violates these Terms."
                    ]
                  },
                  {
                    number: 10,
                    title: "Third-Party Services",
                    content: [
                      "Venture Halo may contain links or integrations with third-party services.",
                      "We are not responsible for:",
                      "Third-party websites.",
                      "Third-party products.",
                      "Third-party conduct.",
                      "Third-party policies.",
                      "Users interact with third parties at their own risk."
                    ]
                  },
                  {
                    number: 11,
                    title: "Platform Availability",
                    content: [
                      "We do not guarantee uninterrupted service.",
                      "The platform may experience:",
                      "Downtime.",
                      "Errors.",
                      "Maintenance periods.",
                      "Technical failures.",
                      "Venture Halo is not liable for losses resulting from service interruptions."
                    ]
                  },
                  {
                    number: 12,
                    title: "Limitation of Liability",
                    content: [
                      "To the fullest extent permitted by applicable law, Venture Halo, its founders, owners, affiliates, employees, representatives, contractors, and partners shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising out of or relating to:",
                      "Loss of money.",
                      "Loss of investments.",
                      "Loss of profits.",
                      "Loss of business opportunities.",
                      "Loss of data.",
                      "Reputational harm.",
                      "Emotional distress.",
                      "Loss of goodwill.",
                      "Business interruption.",
                      "Failed investments.",
                      "Failed transactions.",
                      "Failed partnerships.",
                      "User disputes.",
                      "Fraud, scams, or misrepresentation committed by other users.",
                      "False statements made by investors, founders, or third parties.",
                      "Bankruptcy or insolvency of users.",
                      "Inaccurate information.",
                      "Technical failures.",
                      "Service interruptions.",
                      "Unauthorized access.",
                      "Cyberattacks.",
                      "Third-party services or integrations.",
                      "Any damages arising from reliance on information obtained through Venture Halo.",
                      "Users expressly acknowledge and agree that all interactions, transactions, and decisions made through or in connection with Venture Halo are undertaken solely at their own risk.",
                      "Venture Halo does not act as an investment advisor, broker, agent, fiduciary, financial institution, legal advisor, or guarantor of any user, opportunity, transaction, or business outcome.",
                      "No provision of these Terms shall be interpreted as creating any obligation on the part of Venture Halo to guarantee the conduct, financial capability, legitimacy, or performance of any founder, investor, or user."
                    ]
                  },
                  {
                    number: 13,
                    title: "Indemnification",
                    content: [
                      "Users agree to indemnify and hold harmless Venture Halo and its founders from claims, liabilities, damages, losses, expenses, and legal fees arising from:",
                      "User misconduct.",
                      "Violations of these Terms.",
                      "Illegal activities.",
                      "Intellectual property infringement.",
                      "User interactions."
                    ]
                  },
                  {
                    number: 14,
                    title: "Account Suspension",
                    content: [
                      "Venture Halo reserves the right to:",
                      "Suspend accounts.",
                      "Restrict access.",
                      "Remove content.",
                      "Permanently terminate users.",
                      "At our sole discretion and without prior notice."
                    ]
                  },
                  {
                    number: 15,
                    title: "Changes to the Terms",
                    content: [
                      "We may modify these Terms at any time.",
                      "Continued use of Venture Halo constitutes acceptance of updated Terms."
                    ]
                  },
                  {
                    number: 16,
                    title: "Governing Law",
                    content: [
                      "These Terms shall be governed by the laws of [Insert Country/State].",
                      "Disputes shall be resolved in the courts having jurisdiction over that location."
                    ]
                  },
                  {
                    number: 17,
                    title: "Contact",
                    content: [
                      "For questions regarding these Terms, contact:",
                      "tithipalande2017@gmail.com"
                    ]
                  }
                ].map((section) => (
                  <div key={section.number} className="rounded-2xl border border-white/10 bg-black/20 p-6">
                    <button
                      onClick={() => toggleSection(section.number)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {section.number}. {section.title}
                      </h3>
                      <span className="text-gold transition-transform duration-200">
                        {expandedSection === section.number ? '−' : '+'}
                      </span>
                    </button>
                    {expandedSection === section.number && (
                      <div className="mt-4 space-y-2">
                        {section.content.map((item, index) => (
                          <p key={index} className="text-sm leading-6 text-graysoft">
                            {item}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <p className="text-sm leading-6 text-graysoft">
                  By using Venture Halo, users acknowledge that they have read, understood, and agreed to these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TermsOfService;
