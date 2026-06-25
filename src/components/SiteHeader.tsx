import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import type { AuthUser } from './Hero';

interface SiteHeaderProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
  // When set, the in-page section links (Drivers/Constructors/…) route back to
  // the dashboard and scroll there instead of jumping to anchors that only
  // exist on the dashboard. Used by the race details page.
  onHomeNavigate?: (hash: string) => void;
  // Replaces the default "Season 2026" badge on the left (e.g. the race details
  // page puts its Back button here so it doesn't need a redundant season tag).
  leftSlot?: React.ReactNode;
}

// The shared top bar used across the site (dashboard hero + race details).
// Renders the season badge and the profile/menu card so every view has the
// same header chrome.
const SiteHeader: React.FC<SiteHeaderProps> = ({ user, setUser, onOpenSettings, onHomeNavigate, leftSlot }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { greeting, dateline } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    const D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const dl = `${D[now.getDay()]} · ${String(now.getDate()).padStart(2, '0')} ${M[now.getMonth()]}`;

    const userFirstName = user?.name ? user.name.split(' ')[0] : 'Guest';
    return { greeting: `${g}, ${userFirstName}`, dateline: dl };
  }, [user]);

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    googleLogout();
    localStorage.removeItem('f1_token');
    setUser(null);
    setIsMenuOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: credentialResponse.credential })
        });

        if (!response.ok) throw new Error('Backend authentication failed');

        const data = await response.json();
        // Persist the JWT so the admin portal can authorize against the backend
        if (data.token) localStorage.setItem('f1_token', data.token);
        // Standardize the user object (handle potential full_name/avatar_url from backend)
        const userData = {
          ...data.user,
          name: data.user.name || data.user.full_name || 'User',
          picture: data.user.picture || data.user.avatar_url || data.user.picture_url || ''
        };
        setUser(userData);
      } catch (error) {
        console.error('Backend auth failed:', error);
      }
    }
  };

  const handleSectionLink = (e: React.MouseEvent, hash: string) => {
    setIsMenuOpen(false);
    if (onHomeNavigate) {
      e.preventDefault();
      onHomeNavigate(hash);
    }
  };

  return (
    <>
      <div className="hero-top">
        {leftSlot ?? (
          <div className="brand-eyebrow">
            <span className="live-badge">Season 2026</span>
          </div>
        )}

        <div className="brand-right">
          <button
            className={`profile-menu-card ${isMenuOpen ? 'open' : ''} ${user ? '' : 'guest'}`}
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            {user ? (
              <>
                <span className="greeting-text">
                  <span className="greeting-main">{greeting}</span>
                  <span className="dateline">{dateline}</span>
                </span>
                <span className="avatar-wrap">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="user-avatar"
                  />
                </span>
              </>
            ) : (
              <span className="greeting-text guest-greeting">
                <span className="guest-signin">
                  Sign In
                  <span className="guest-signin-arrow" aria-hidden="true">→</span>
                </span>
                <span className="dateline">{dateline}</span>
              </span>
            )}

            <span className="pmc-divider" aria-hidden="true"></span>
            <span className="hamburger-lines" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen && createPortal(
        <div className="glass-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="glass-menu-panel" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <span className="brand-eyebrow" style={{ color: '#fff', marginBottom: 0 }}>PITWALL MENU</span>
              <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>

            <nav className="menu-nav-links">
              <a href="#drivers" onClick={(e) => handleSectionLink(e, 'drivers')}>Drivers</a>
              <a href="#constructors" onClick={(e) => handleSectionLink(e, 'constructors')}>Constructors</a>
              <a href="#paddock" onClick={(e) => handleSectionLink(e, 'paddock')}>Paddock Intel</a>
              <a href="#calendar" onClick={(e) => handleSectionLink(e, 'calendar')}>Calendar</a>
            </nav>

            <div className="menu-divider"></div>

            <div className="menu-user-section">
              {user ? (
                <>
                  {user.is_admin && (
                    <a className="menu-action-btn admin" href="/admin-portal">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Admin Portal
                    </a>
                  )}
                  <button className="menu-action-btn" onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    My Account
                  </button>
                  <button className="menu-action-btn logout" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log out
                  </button>
                </>
              ) : (
                <div className="menu-login-wrap">
                  <div className="menu-login-label">Sign in to Pitwall</div>
                  <p className="menu-login-sub">Unlock favorite driver tracking, personalized race times, and exclusive paddock insights.</p>
                  <div className="modal-action">
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={() => console.log('Login Failed')}
                      theme="filled_black"
                      shape="pill"
                    />
                  </div>
                  <div className="modal-secure">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M6 10V8a6 6 0 1112 0v2m-13 0h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Secure Google sign-in
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SiteHeader;
