import React, { useState, useEffect } from 'react';

interface AccountSettingsProps {
  onClose: () => void;
  user: { name: string; picture: string } | null;
}

const CONSTRUCTORS = [
  { id: 'mercedes', name: 'Mercedes-AMG', fullName: 'Mercedes-AMG PETRONAS Formula One Team' },
  { id: 'ferrari', name: 'Ferrari', fullName: 'Scuderia Ferrari HP' },
  { id: 'mclaren', name: 'McLaren', fullName: 'McLaren Formula 1 Team' },
  { id: 'red_bull', name: 'Red Bull', fullName: 'Oracle Red Bull Racing' },
  { id: 'aston_martin', name: 'Aston Martin', fullName: 'Aston Martin Aramco F1 Team' },
  { id: 'alpine', name: 'Alpine', fullName: 'BWT Alpine F1 Team' },
  { id: 'williams', name: 'Williams', fullName: 'Williams Racing' },
  { id: 'rb', name: 'Racing Bulls', fullName: 'Visa Cash App RB F1 Team' },
  { id: 'haas', name: 'Haas', fullName: 'MoneyGram Haas F1 Team' },
  { id: 'audi', name: 'Audi', fullName: 'Audi F1 Factory Team' },
  { id: 'cadillac', name: 'Cadillac', fullName: 'Cadillac Racing F1' },
];

const DRIVERS = [
  { id: 'hamilton', name: 'Lewis Hamilton', code: 'HAM/44' },
  { id: 'russell', name: 'George Russell', code: 'RUS/63' },
  { id: 'leclerc', name: 'Charles Leclerc', code: 'LEC/16' },
  { id: 'sainz', name: 'Carlos Sainz', code: 'SAI/55' },
  { id: 'verstappen', name: 'Max Verstappen', code: 'VER/33' },
  { id: 'norris', name: 'Lando Norris', code: 'NOR/4' },
  { id: 'piastri', name: 'Oscar Piastri', code: 'PIA/81' },
  { id: 'alonso', name: 'Fernando Alonso', code: 'ALO/14' },
  { id: 'gasly', name: 'Pierre Gasly', code: 'GAS/10' },
  { id: 'antonelli', name: 'Kimi Antonelli', code: 'ANT/12' },
  { id: 'bearman', name: 'Oliver Bearman', code: 'BEA/87' },
  { id: 'hadjar', name: 'Isack Hadjar', code: 'HAD/6' },
  { id: 'bortoleto', name: 'Gabriel Bortoleto', code: 'BOR/5' },
];

const AccountPage: React.FC<AccountSettingsProps> = ({ onClose, user }) => {
  const [favConstructor, setFavConstructor] = useState<string>('');
  const [favDrivers, setFavDrivers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('f1_user_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavConstructor(prefs.constructor || '');
      setFavDrivers(prefs.drivers || []);
    }
    window.scrollTo(0, 0);
  }, []);

  const toggleDriver = (id: string) => {
    if (favDrivers.includes(id)) {
      setFavDrivers(favDrivers.filter(d => d !== id));
    } else if (favDrivers.length < 2) {
      setFavDrivers([...favDrivers, id]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('f1_user_prefs', JSON.stringify({
        constructor: favConstructor,
        drivers: favDrivers
      }));
      setIsSaving(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="account-page">
      <div className="account-hero">
        <div className="account-hero-bg">
          <div className="account-orb"></div>
        </div>
        
        <div className="account-nav">
          <button className="nav-back" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK TO PITWALL
          </button>
          <div className="nav-brand">ACCOUNT PROFILE</div>
        </div>

        <div className="account-profile-header">
          <div className="profile-img-container">
            <img src={user?.picture} alt={user?.name} className="profile-hero-img" />
            <div className="profile-badge">PRO</div>
          </div>
          <div className="profile-info">
            <h1 className="profile-hero-name">{user?.name}</h1>
            <div className="profile-meta">
              <span>ACTIVE MEMBER</span>
              <span className="dot"></span>
              <span>SEASON 2026</span>
            </div>
          </div>
        </div>
      </div>

      <div className="account-container">
        <div className="account-grid">
          {/* Main Settings Section */}
          <div className="account-main">
            <section className="pref-section">
              <div className="section-header">
                <div className="section-num">01</div>
                <div>
                  <h2 className="section-title">Favorite Constructor</h2>
                  <p className="section-desc">Select the team you want to follow most closely on your dashboard.</p>
                </div>
              </div>

              <div className="constructors-list">
                {CONSTRUCTORS.map(c => {
                  const isActive = favConstructor === c.id;
                  const teamVar = `--${c.id === 'red_bull' ? 'redbull' : c.id === 'aston_martin' ? 'aston' : c.id === 'rb' ? 'racingbulls' : c.id}`;
                  return (
                    <div 
                      key={c.id} 
                      className={`team-select-card ${isActive ? 'active' : ''}`}
                      onClick={() => setFavConstructor(c.id)}
                      style={{ '--team-color': `var(${teamVar})` } as React.CSSProperties}
                    >
                      <div className="team-card-bg"></div>
                      <div className="team-card-content">
                        <div className="team-indicator"></div>
                        <div className="team-text">
                          <div className="team-short">{c.name}</div>
                          <div className="team-full">{c.fullName}</div>
                        </div>
                      </div>
                      {isActive && <div className="active-tag">FAVORITE</div>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="pref-section">
              <div className="section-header">
                <div className="section-num">02</div>
                <div>
                  <h2 className="section-title">Favorite Drivers</h2>
                  <p className="section-desc">Choose up to 2 drivers to track their specific telemetry and updates.</p>
                </div>
              </div>

              <div className="drivers-selection-grid">
                {DRIVERS.map(d => {
                  const isActive = favDrivers.includes(d.id);
                  return (
                    <div 
                      key={d.id} 
                      className={`driver-select-card ${isActive ? 'active' : ''}`}
                      onClick={() => toggleDriver(d.id)}
                    >
                      <div className="driver-select-code">{d.code}</div>
                      <div className="driver-select-name">{d.name}</div>
                      {isActive && <div className="driver-select-check">✓</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar / Summary Section */}
          <div className="account-sidebar">
            <div className="summary-card">
              <h3 className="summary-title">PREFERENCE SUMMARY</h3>
              
              <div className="summary-item">
                <div className="summary-label">CONSTRUCTOR</div>
                <div className="summary-value">
                  {favConstructor ? CONSTRUCTORS.find(c => c.id === favConstructor)?.name : 'NONE SELECTED'}
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-label">DRIVERS</div>
                <div className="summary-value">
                  {favDrivers.length > 0 
                    ? favDrivers.map(id => DRIVERS.find(d => d.id === id)?.name).join(' & ') 
                    : 'NONE SELECTED'}
                </div>
              </div>

              <button 
                className={`save-btn-large ${isSaving ? 'loading' : ''}`}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'SYNCING DATA...' : 'SAVE ALL PREFERENCES'}
              </button>
            </div>

            <div className="info-card">
              <h4 className="info-title">PITWALL NOTIFICATIONS</h4>
              <p className="info-text">Favorite drivers and constructors will be highlighted in your live standings and race calendar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
