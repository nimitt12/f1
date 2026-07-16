import React from 'react';
import LogoMark from './LogoMark';
import Footer from './Footer';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <>
      <div className="privacy-page">
        <button type="button" className="pp-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <header className="pp-header">
          <div className="pp-logo">
            <LogoMark className="pp-logo-mark" aria-hidden="true" />
            <span className="pp-kicker">Legal // Data Handling</span>
          </div>
          <h1 className="pp-title">Privacy <span>Policy</span></h1>
          <p className="pp-meta">Effective date: July 16, 2026 &middot; Applies to mypitwall.in</p>
        </header>

        <div className="pp-body">
          <section className="pp-section">
            <h2>1. Who We Are</h2>
            <p>
              My PitWall ("we", "us") operates the website and progressive web app at{' '}
              <a href="https://www.mypitwall.in">mypitwall.in</a> — a free Formula 1 dashboard
              offering live timing, telemetry, standings, race calendars, and news. This policy
              explains what information we collect when you use the site, why we collect it, and
              the choices you have. For anything privacy-related, contact us at{' '}
              <a href="mailto:mypitwall@gmail.com">mypitwall@gmail.com</a>.
            </p>
            <p>
              My PitWall is an independent fan project and is not affiliated with the Formula One
              group of companies.
            </p>
          </section>

          <section className="pp-section">
            <h2>2. Information We Collect</h2>
            <h3>Account information (only if you sign in)</h3>
            <p>
              Signing in is optional. If you choose to sign in with Google, we receive your name,
              email address, and profile picture from your Google account via Google Sign-In. This
              is sent to our backend to create and maintain your My PitWall account and is used to
              personalize your experience (for example, favorite driver tracking and account
              settings). We never see or store your Google password.
            </p>
            <h3>Usage and analytics data</h3>
            <p>
              We use two third-party analytics services to understand how the site is used and to
              improve it:
            </p>
            <ul>
              <li>
                <strong>Google Analytics</strong> — collects information such as pages viewed,
                approximate location (country/city level), device and browser type, and how you
                arrived at the site.
              </li>
              <li>
                <strong>Microsoft Clarity</strong> — collects interaction data such as clicks,
                scrolls, and page navigation, and may replay anonymized sessions and generate
                heatmaps to help us understand usability issues.
              </li>
            </ul>
            <p>
              These services may set cookies or use similar technologies in your browser. The data
              they collect is aggregated and not used by us to personally identify you.
            </p>
            <h3>Preferences stored on your device</h3>
            <p>
              To make the site work smoothly, we store some data locally in your browser
              (localStorage) — such as your chosen team theme, the last view you had open, the last
              race you looked at, and your signed-in user profile. This data stays on your device,
              is never transmitted to analytics services by us, and you can remove it at any time
              by signing out or clearing your browser's site data.
            </p>
          </section>

          <section className="pp-section">
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide the service — live timing, standings, race data, and news.</li>
              <li>To create and maintain your account when you sign in, and personalize features tied to it.</li>
              <li>To understand aggregate usage patterns and improve the site's performance and usability.</li>
              <li>To diagnose technical problems and keep the service secure.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information, and we do not share it
              with third parties for their own marketing purposes.
            </p>
          </section>

          <section className="pp-section">
            <h2>4. Where Your Data Lives &amp; Third-Party Services</h2>
            <p>The site relies on the following service providers, each of which processes data under its own privacy policy:</p>
            <ul>
              <li><strong>Vercel</strong> — hosts the website.</li>
              <li><strong>Render</strong> — hosts our backend API, where account data is stored.</li>
              <li><strong>Google</strong> — Sign-In (authentication), Analytics (usage measurement), and Fonts (typeface delivery).</li>
              <li><strong>Microsoft Clarity</strong> — usability analytics and session replay.</li>
              <li><strong>Formula1.com</strong> — the news feed shown in Paddock Intel is fetched from Formula1.com's public RSS feed.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>5. Cookies &amp; Local Storage</h2>
            <p>
              We do not set advertising cookies. Cookies and similar technologies on this site come
              from the analytics services described above (Google Analytics and Microsoft Clarity)
              and from Google Sign-In when you authenticate. Separately, we use your browser's
              localStorage for the on-device preferences described in section 2. You can block or
              clear cookies and site data through your browser settings; the site will continue to
              work, though your preferences and sign-in state will be reset.
            </p>
          </section>

          <section className="pp-section">
            <h2>6. Data Retention &amp; Deletion</h2>
            <p>
              Account information is retained for as long as your account exists. You can request
              deletion of your account and associated data at any time by emailing{' '}
              <a href="mailto:mypitwall@gmail.com">mypitwall@gmail.com</a> from the address linked
              to your account — we will action the request within 30 days. On-device data is under
              your control and can be cleared instantly from your browser. Analytics data is
              retained according to Google's and Microsoft's respective retention policies.
            </p>
          </section>

          <section className="pp-section">
            <h2>7. Your Choices &amp; Rights</h2>
            <ul>
              <li>Use the site without signing in — an account is never required.</li>
              <li>Sign out at any time to remove your profile from the device.</li>
              <li>Clear your browser's site data to remove all locally stored preferences.</li>
              <li>Block analytics via browser settings, extensions, or Google's <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Analytics opt-out</a>.</li>
              <li>Request access to, correction of, or deletion of your account data by email.</li>
            </ul>
            <p>
              Depending on where you live, you may have additional statutory rights (such as those
              under the GDPR or similar laws). We honor such requests regardless of your location —
              just get in touch.
            </p>
          </section>

          <section className="pp-section">
            <h2>8. Children's Privacy</h2>
            <p>
              My PitWall is not directed at children under 13, and we do not knowingly collect
              personal information from them. If you believe a child has provided us personal
              information, contact us and we will delete it.
            </p>
          </section>

          <section className="pp-section">
            <h2>9. Security</h2>
            <p>
              All traffic between your browser, our site, and our backend is encrypted over HTTPS.
              Authentication is delegated to Google, so we never handle your credentials. No system
              is perfectly secure, but we limit the data we collect to what the service needs.
            </p>
          </section>

          <section className="pp-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this policy as the site evolves. Material changes will be reflected by
              a new effective date at the top of this page. Continued use of the site after changes
              take effect constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="pp-section">
            <h2>11. Contact</h2>
            <p>
              Questions, concerns, or requests:{' '}
              <a href="mailto:mypitwall@gmail.com">mypitwall@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
