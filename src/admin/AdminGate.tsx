import React, { useEffect, useState } from 'react';
import './admin.css';
import AdminPortal from './AdminPortal';
import Loader from '../components/Loader';
import { getToken } from './adminAuth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

type GateStatus = 'loading' | 'authorized' | 'unauthenticated' | 'denied' | 'error';

/**
 * Authorization gate for the admin portal.
 *
 * Renders a loading screen while it confirms — against the backend — that the
 * current session belongs to a user with `is_admin`. Only then is the actual
 * portal mounted. Everything here is advisory UX: the backend independently
 * enforces admin access on every `/admin/*` request.
 */
const AdminGate: React.FC = () => {
  const [status, setStatus] = useState<GateStatus>('loading');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const token = getToken();
      if (!token) {
        if (active) setStatus('unauthenticated');
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;

        if (res.ok) {
          setStatus('authorized');
        } else if (res.status === 403) {
          setStatus('denied');
        } else {
          // 401 — token missing/expired/invalid
          setStatus('unauthenticated');
        }
      } catch {
        if (active) setStatus('error');
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, []);

  if (status === 'authorized') {
    return <AdminPortal />;
  }

  if (status === 'loading') {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <img src="/logo.svg" alt="Pitwall" className="admin-gate-mark" />
          <Loader label={null} variant="inline" accent="var(--admin-accent-hot)" />
          <h1>Authorizing access</h1>
          <p>Verifying your admin credentials with the paddock servers…</p>
        </div>
      </main>
    );
  }

  const COPY: Record<Exclude<GateStatus, 'loading' | 'authorized'>, { title: string; message: string }> = {
    unauthenticated: {
      title: 'Sign in required',
      message: 'You need to sign in with an admin account before accessing the control room. Head back to Pitwall and sign in first.',
    },
    denied: {
      title: 'Access restricted',
      message: 'Your account does not have admin privileges. If you believe this is a mistake, contact a Pitwall administrator.',
    },
    error: {
      title: 'Verification failed',
      message: 'We could not reach the authorization service. Check your connection and try again.',
    },
  };

  const { title, message } = COPY[status];

  return (
    <main className="admin-gate">
      <div className="admin-gate-card denied">
        <img src="/logo.svg" alt="Pitwall" className="admin-gate-mark" />
        <div className="admin-gate-lock" aria-hidden="true">🔒</div>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="admin-gate-actions">
          {status === 'error' ? (
            <button className="admin-primary-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          ) : (
            <a className="admin-primary-btn" href="/">
              Back to Pitwall
            </a>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminGate;
