import React, { useMemo, useState } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
  name: string;
  picture: string;
}

interface HeroProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const Hero: React.FC<HeroProps> = ({ user, setUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { greeting, dateline } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    
    const D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dl = `${D[now.getDay()]} · ${String(now.getDate()).padStart(2, '0')} ${M[now.getMonth()]} · ${now.getFullYear()}`;
    
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
        name: decoded.name,
        picture: decoded.picture
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
          <span>F1 2026</span>
        </div>
        <div className="brand-right">
          {user ? (
            <div className="greeting" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              {greeting}
              <div className="profile-menu-wrap" style={{ position: 'relative' }}>
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  width="24" 
                  height="24" 
                  style={{ borderRadius: '50%', border: '1px solid var(--racing)', cursor: 'pointer' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                />
                {isMenuOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-item">My Account</div>
                    <div className="dropdown-item">Settings</div>
                    <div className="dropdown-item logout" onMouseDown={handleLogout}>Log out</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.log('Login Failed')}
                theme="filled_black"
                shape="pill"
                size="small"
              />
            </div>
          )}
          <div className="dateline">{dateline}</div>
        </div>
      </div>

      <div className="title-wrap">
        <h1 className="hero-title">
          <span className="line1">
            <span>{user ? `${user.name.split(' ')[0]}'s` : "Your"}</span>
          </span>
          <span className="line2">
            <span>Pit Wall.</span>
          </span>
        </h1>
        <div className="title-underline"></div>
      </div>

      <div className="hero-sub">
        <span className="live-badge">Season 2026</span>
        <span>Drivers · Constructors · Paddock · Calendar</span>
      </div>
    </section>
  );
};

export default Hero;
