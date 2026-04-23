import React, { useState, useEffect } from 'react';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; picture: string } | null;
}

const CONSTRUCTORS = [
  { id: 'mercedes', name: 'Mercedes-AMG PETRONAS' },
  { id: 'ferrari', name: 'Scuderia Ferrari' },
  { id: 'mclaren', name: 'McLaren Formula 1' },
  { id: 'red_bull', name: 'Red Bull Racing' },
  { id: 'aston_martin', name: 'Aston Martin Aramco' },
  { id: 'alpine', name: 'Alpine F1 Team' },
  { id: 'williams', name: 'Williams Racing' },
  { id: 'rb', name: 'Racing Bulls' },
  { id: 'haas', name: 'Haas F1 Team' },
  { id: 'audi', name: 'Audi F1 Team' },
  { id: 'cadillac', name: 'Cadillac F1' },
];

const DRIVERS = [
  { id: 'hamilton', name: 'Lewis Hamilton' },
  { id: 'russell', name: 'George Russell' },
  { id: 'leclerc', name: 'Charles Leclerc' },
  { id: 'sainz', name: 'Carlos Sainz' },
  { id: 'verstappen', name: 'Max Verstappen' },
  { id: 'norris', name: 'Lando Norris' },
  { id: 'piastri', name: 'Oscar Piastri' },
  { id: 'alonso', name: 'Fernando Alonso' },
  { id: 'gasly', name: 'Pierre Gasly' },
  { id: 'antonelli', name: 'Andrea Kimi Antonelli' },
  { id: 'bearman', name: 'Oliver Bearman' },
  { id: 'hadjar', name: 'Isack Hadjar' },
  { id: 'bortoleto', name: 'Gabriel Bortoleto' },
];

const AccountSettings: React.FC<AccountSettingsProps> = ({ isOpen, onClose, user }) => {
  const [favConstructor, setFavConstructor] = useState<string>('');
  const [favDrivers, setFavDrivers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('f1_user_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      setFavConstructor(prefs.constructor || '');
      setFavDrivers(prefs.drivers || []);
    }
  }, [isOpen]);

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
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title-wrap">
            <h2 className="settings-title">Account Settings</h2>
            <p className="settings-subtitle">Personalize your F1 PitWall experience</p>
          </div>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3 className="section-label">Profile Information</h3>
            <div className="profile-preview">
              <img src={user?.picture} alt={user?.name} className="profile-img-large" />
              <div className="profile-details">
                <div className="profile-name">{user?.name}</div>
                <div className="profile-status">Logged in via Google</div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3 className="section-label">Favorite Constructor</h3>
            <div className="constructor-grid">
              {CONSTRUCTORS.map(c => (
                <div 
                  key={c.id} 
                  className={`choice-card ${favConstructor === c.id ? 'active' : ''}`}
                  onClick={() => setFavConstructor(c.id)}
                  style={{ '--choice-color': `var(--${c.id === 'red_bull' ? 'redbull' : c.id === 'aston_martin' ? 'aston' : c.id === 'rb' ? 'racingbulls' : c.id})` } as React.CSSProperties}
                >
                  <div className="choice-indicator"></div>
                  <span className="choice-name">{c.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3 className="section-label">Favorite Drivers (Select 2)</h3>
            <div className="drivers-grid">
              {DRIVERS.map(d => (
                <div 
                  key={d.id} 
                  className={`choice-card compact ${favDrivers.includes(d.id) ? 'active' : ''}`}
                  onClick={() => toggleDriver(d.id)}
                >
                  <span className="choice-name">{d.name}</span>
                  {favDrivers.includes(d.id) && <span className="choice-check">✓</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
