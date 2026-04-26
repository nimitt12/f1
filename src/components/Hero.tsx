import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
  id: string;
  name: string;
  picture: string;
  email: string;
}

interface HeroProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
}

const Hero: React.FC<HeroProps> = ({ user, setUser, onOpenSettings }) => {
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
    setUser(null);
    setIsMenuOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded: any = jwtDecode(credentialResponse.credential);
      setUser({
        id: decoded.sub,
        name: decoded.name,
        picture: decoded.picture,
        email: decoded.email
      });
    }
  };

  return (
    <section className="hero">
      <span className="speed-line"></span>
      <span className="speed-line"></span>
      <span className="speed-line"></span>

      <div className="hero-top">
        <div className="brand-eyebrow">
          <span className="checker-flag"></span>
          <span className="live-badge">Live Edition</span>
        </div>
        
        <div className="brand-right">
          {user ? (
            <div className="greeting-box">
              <div className="greeting-text">
                <span className="greeting-main">{greeting}</span>
                <span className="dateline">{dateline}</span>
              </div>
              <img 
                src={user.picture} 
                alt={user.name} 
                className="user-avatar"
              />
            </div>
          ) : (
            <div className="dateline">{dateline}</div>
          )}

          <button 
            className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div className="title-wrap">
        <h1 className="hero-title">
          <span className="line1">
            <span>{user ? `${user.name.split(' ')[0]}'s` : "My"}</span>
          </span>
          <span className="line2">
            <span>PitWall.</span>
          </span>
        </h1>
        <div className="title-underline"></div>
      </div>

      <div className="hero-sub">
        <span className="live-badge">Season 2026</span>
      </div>

      {isMenuOpen && createPortal(
        <div className="glass-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="glass-menu-panel" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <span className="brand-eyebrow" style={{ color: '#fff', marginBottom: 0 }}>PITWALL MENU</span>
              <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>

            <nav className="menu-nav-links">
              <a href="#drivers" onClick={() => setIsMenuOpen(false)}>Drivers</a>
              <a href="#constructors" onClick={() => setIsMenuOpen(false)}>Constructors</a>
              <a href="#paddock" onClick={() => setIsMenuOpen(false)}>Paddock Intel</a>
              <a href="#calendar" onClick={() => setIsMenuOpen(false)}>Calendar</a>
            </nav>

            <div className="menu-divider"></div>

            <div className="menu-user-section">
              {user ? (
                <>
                  <button className="menu-action-btn" onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Account
                  </button>
                  <button className="menu-action-btn logout" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log out
                  </button>
                </>
              ) : (
                <div className="menu-login-wrap">
                  <div style={{ marginBottom: '16px', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>SIGN IN TO PITWALL</div>
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => console.log('Login Failed')}
                    theme="filled_black"
                    shape="pill"
                  />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Hero;
