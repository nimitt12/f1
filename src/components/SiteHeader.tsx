import { signInWithGoogle, clearSession } from '../lib/auth';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import type { AuthUser } from './Hero';
import LogoMark from './LogoMark';
import { COMMUNITY_URL } from '../lib/links';
import { raceSlug, type Race } from '../data/races';

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
  stickyOnScroll?: boolean;
  upcomingRace?: Race | null;
}

// The shared top bar used across the site (dashboard hero + race details).
// Renders the season badge and the profile/menu card so every view has the
// same header chrome.
const SiteHeader: React.FC<SiteHeaderProps> = ({ user, setUser, onOpenSettings, onHomeNavigate, leftSlot, stickyOnScroll = false, upcomingRace }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stickyOnScroll || !headerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyHeader(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [stickyOnScroll]);

  // A drawer should be just as easy to leave from a keyboard as it is with a
  // pointer. Locking the document also prevents the dashboard scrolling behind
  // the translucent overlay.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    menuRef.current?.querySelector<HTMLButtonElement>('.close-menu-btn')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
      if (event.key !== 'Tab') return;
      const controls = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex="0"]'
      ) ?? []).filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isMenuOpen]);

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
    clearSession();
    setUser(null);
    setIsMenuOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const userData = await signInWithGoogle(credentialResponse.credential);
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

  const openSchedule = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.history.pushState({}, '', '/schedule');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  const openStandings = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.history.pushState({}, '', '/standings');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  const openConstructorStandings = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.history.pushState({}, '', '/constructor-standings');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  const openStatistics = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.history.pushState({}, '', '/statistics');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  return (
    <>
      <div className="hero-top" ref={headerRef}>
        {leftSlot ?? (
          <div className="brand-eyebrow">
            <span className="live-badge">Season 2026</span>
            <a
              className="feedback-chip"
              href={COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Shape Pitwall: share feedback (opens in a new tab)"
            >
              <svg
                className="feedback-chip-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
              </svg>
              <span className="feedback-chip-label">Shape MyPitWall</span>
              <span className="feedback-chip-action">Feedback <span aria-hidden="true">↗</span></span>
            </a>
          </div>
        )}

        <div className="brand-right">
          <button
            className={`profile-menu-card ${isMenuOpen ? 'open' : ''} ${user ? '' : 'guest'}`}
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <LogoMark className="pmc-logo" aria-hidden="true" />
            <span className="pmc-divider pmc-divider-logo" aria-hidden="true"></span>
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

      {stickyOnScroll && showStickyHeader && createPortal(
        <header className="home-sticky-header">
          <a className="home-sticky-brand" href="/" aria-label="MyPitWall — back to top" onClick={event => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
          }}>
            <LogoMark aria-hidden="true" />
            <span>My<span>PitWall.</span></span>
          </a>
          {upcomingRace ? (
            <a className="home-sticky-race" href={`/race/${upcomingRace.season}/${raceSlug(upcomingRace)}`} onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              window.history.pushState({}, '', event.currentTarget.href);
              window.dispatchEvent(new PopStateEvent('popstate'));
              window.scrollTo(0, 0);
            }}>
              <span className="home-sticky-race-label">Up next · Round {upcomingRace.round}</span>
              <strong>{upcomingRace.raceName}</strong>
              <span className="home-sticky-race-details">
                <span>{upcomingRace.Circuit.Location.locality} · </span>
                <time dateTime={upcomingRace.time ? `${upcomingRace.date}T${upcomingRace.time}` : upcomingRace.date}>
                  {upcomingRace.time
                    ? new Date(`${upcomingRace.date}T${upcomingRace.time}`).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
                    : `${new Date(`${upcomingRace.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · Time TBC`}
                </time>
              </span>
            </a>
          ) : <span className="home-sticky-race-details">Next race to be announced</span>}
          <button className="home-sticky-menu" onClick={() => setIsMenuOpen(true)} aria-label="Open menu" aria-expanded={isMenuOpen}>
            {user ? <img src={user.picture} alt="" /> : <span>Sign In</span>}
            <span className="hamburger-lines" aria-hidden="true"><span /><span /><span /></span>
          </button>
        </header>,
        document.body
      )}

      {isMenuOpen && createPortal(
        <div className="glass-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div ref={menuRef} className="glass-menu-panel" role="dialog" aria-modal="true" aria-label="MyPitWall navigation" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <span className="menu-kicker">
                <LogoMark className="menu-kicker-mark" aria-hidden="true" />
                <span><b>MyPitWall</b> Navigation</span>
              </span>
              <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">×</button>
            </div>

            <nav className="menu-nav-links" aria-label="Primary navigation">
              <span className="menu-nav-label">Race control</span>
              <a href="/schedule" onClick={openSchedule} style={{ '--menu-i': 0 } as React.CSSProperties}>
                <span className="menu-link-index">01</span>
                <span className="menu-link-body">
                  <span className="menu-link-label">Schedule</span>
                  <span className="menu-link-desc">Every race, sprint and session</span>
                </span>
                <span className="menu-link-arrow" aria-hidden="true">→</span>
              </a>
              <a href="/standings" onClick={openStandings} style={{ '--menu-i': 1 } as React.CSSProperties}>
                <span className="menu-link-index">02</span>
                <span className="menu-link-body">
                  <span className="menu-link-label">Driver Standings</span>
                  <span className="menu-link-desc">Points and ranking evolution</span>
                </span>
                <span className="menu-link-arrow" aria-hidden="true">→</span>
              </a>
              <a href="/constructor-standings" onClick={openConstructorStandings} style={{ '--menu-i': 2 } as React.CSSProperties}>
                <span className="menu-link-index">03</span>
                <span className="menu-link-body">
                  <span className="menu-link-label">Constructor Standings</span>
                  <span className="menu-link-desc">Team championship analytics</span>
                </span>
                <span className="menu-link-arrow" aria-hidden="true">→</span>
              </a>
              <a href="/statistics" onClick={openStatistics} style={{ '--menu-i': 3 } as React.CSSProperties}>
                <span className="menu-link-index">04</span>
                <span className="menu-link-body">
                  <span className="menu-link-label">All-Time Statistics</span>
                  <span className="menu-link-desc">Every race outcome from 1950 to today</span>
                </span>
                <span className="menu-link-arrow" aria-hidden="true">→</span>
              </a>
              {[
                { hash: 'paddock', label: 'Paddock Intel', desc: 'Latest F1 news & analysis' },
              ].map((item, i) => (
                <a
                  key={item.hash}
                  href={`#${item.hash}`}
                  onClick={(e) => handleSectionLink(e, item.hash)}
                  style={{ '--menu-i': i + 4 } as React.CSSProperties}
                >
                  <span className="menu-link-index">{String(i + 5).padStart(2, '0')}</span>
                  <span className="menu-link-body">
                    <span className="menu-link-label">{item.label}</span>
                    <span className="menu-link-desc">{item.desc}</span>
                  </span>
                  <span className="menu-link-arrow" aria-hidden="true">→</span>
                </a>
              ))}
              <a
                href={COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                style={{ '--menu-i': 5 } as React.CSSProperties}
                aria-label="Feedback & Community (opens in a new tab)"
              >
                <span className="menu-link-index">06</span>
                <span className="menu-link-body">
                  <span className="menu-link-label">Feedback & Community</span>
                  <span className="menu-link-desc">Share ideas, report bugs and join the conversation</span>
                </span>
                <span className="menu-link-arrow" aria-hidden="true">↗</span>
              </a>
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
                  <p className="menu-login-sub">Your favorite drivers. Your local race times. Your Pitwall.</p>
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
