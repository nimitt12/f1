import React, { useState } from 'react';
import LogoMark from './LogoMark';
import Footer from './Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

interface AccountDeletionRequestProps {
  onBack: () => void;
  user: { id: string; email: string; name: string; picture: string } | null;
}

const AccountDeletionRequest: React.FC<AccountDeletionRequestProps> = ({ onBack, user }) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !confirmed || status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/account/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, reason: reason.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <>
      <div className="privacy-page adr-page">
        <button type="button" className="pp-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <header className="pp-header">
          <div className="pp-logo">
            <LogoMark className="pp-logo-mark" aria-hidden="true" />
            <span className="pp-kicker">Account // Data Deletion</span>
          </div>
          <h1 className="pp-title">Request Account <span>Deletion</span></h1>
          <p className="pp-meta">Permanently remove your My PitWall account and associated data.</p>
        </header>

        <div className="pp-body">
          <section className="pp-section">
            <p>
              Submitting this request tells us to delete your My PitWall account — including your
              saved favorite constructor/drivers and profile info — within 30 days. This can&rsquo;t
              be undone. See our <a href="/privacy">Privacy Policy</a> for details on what we store.
            </p>
          </section>

          {!user ? (
            <section className="pp-section adr-signed-out">
              <p>
                You need to be signed in to submit a self-service deletion request, since we have to
                verify which account it applies to. If you can&rsquo;t sign in, email us instead from
                the address linked to your account and we&rsquo;ll action it manually:
              </p>
              <p>
                <a className="adr-mail-btn" href="mailto:mypitwall@gmail.com?subject=Account%20Deletion%20Request">
                  Email mypitwall@gmail.com
                </a>
              </p>
            </section>
          ) : status === 'done' ? (
            <section className="pp-section adr-done">
              <div className="adr-done-badge">Request received</div>
              <p>
                We&rsquo;ve logged a deletion request for <strong>{user.email}</strong>. Your account
                and associated data will be removed within 30 days. You can keep using My PitWall
                until then.
              </p>
            </section>
          ) : (
            <section className="pp-section">
              <form className="adr-form" onSubmit={handleSubmit}>
                <div className="adr-field">
                  <label className="adr-label">Account</label>
                  <div className="adr-account-chip">
                    {user.picture && <img src={user.picture} alt="" className="adr-avatar" />}
                    <div>
                      <div className="adr-account-name">{user.name}</div>
                      <div className="adr-account-email">{user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="adr-field">
                  <label className="adr-label" htmlFor="adr-reason">Reason (optional)</label>
                  <textarea
                    id="adr-reason"
                    className="adr-textarea"
                    placeholder="Let us know why you're leaving — optional, helps us improve."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <label className="adr-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>I understand this will permanently delete my account and data, and this action cannot be undone.</span>
                </label>

                {status === 'error' && <p className="adr-error">{errorMsg}</p>}

                <button
                  type="submit"
                  className="adr-submit"
                  disabled={!confirmed || status === 'submitting'}
                >
                  {status === 'submitting' ? 'Submitting…' : 'Request Account Deletion'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AccountDeletionRequest;
