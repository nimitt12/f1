import { authFetch } from '../lib/auth';
import { COMMUNITY_URL } from '../lib/links';
import React, { useState, useEffect } from 'react';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import LogoMark from './LogoMark';
import Footer from './Footer';
import './AccountPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
interface AccountPageProps {
  onClose: () => void;
  onHomeNavigate: (hash: string) => void;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
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

const teamColor = (id: string) => `var(--${({ red_bull: 'redbull', aston_martin: 'aston', rb: 'racingbulls' } as Record<string, string>)[id] || id}, var(--racing))`;

const AccountPage: React.FC<AccountPageProps> = ({ onClose, onHomeNavigate, user, setUser }) => {
  const [favConstructor, setFavConstructor] = useState('');
  const [favDrivers, setFavDrivers] = useState<string[]>([]);
  const [baseline, setBaseline] = useState({ constructor: '', drivers: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const dirty = favConstructor !== baseline.constructor || [...favDrivers].sort().join(',') !== [...baseline.drivers].sort().join(',');

  useEffect(() => {
    let active = true;
    const fetchPrefs = async () => {
      if (!user) return;
      setLoading(true);
      setLoadFailed(false);
      setError('');
      try {
        const response = await authFetch(`${BACKEND_URL}/profile/${encodeURIComponent(user.id)}`);
        if (!response.ok) throw new Error('Unable to load preferences');
        const data = await response.json();
        if (!active) return;
        const constructor = typeof data?.fav_constructor === 'string' ? data.fav_constructor : '';
        const drivers = Array.isArray(data?.fav_drivers) ? data.fav_drivers.filter((id: unknown): id is string => typeof id === 'string') : [];
        setFavConstructor(constructor);
        setFavDrivers(drivers);
        setBaseline({ constructor, drivers });
      } catch {
        if (active) { setLoadFailed(true); setError('Your preferences could not be loaded. Please try again.'); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchPrefs();
    return () => { active = false; };
  }, [user, attempt]);

  const toggleDriver = (id: string) => {
    setSaved(false);
    setFavDrivers(current => current.includes(id) ? current.filter(d => d !== id) : current.length < 2 ? [...current, id] : current);
  };
  const handleSave = async () => {
    if (!user || loading || loadFailed || isSaving || !dirty) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await authFetch(`${BACKEND_URL}/profile/${encodeURIComponent(user.id)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fav_constructor: favConstructor, fav_drivers: favDrivers }),
      });
      if (!response.ok) throw new Error('Save failed');
      setBaseline({ constructor: favConstructor, drivers: [...favDrivers] });
      setSaved(true);
    } catch {
      setError('We couldn’t save your preferences. Your selections are still here — please try again.');
    } finally { setIsSaving(false); }
  };
  const selectedTeam = CONSTRUCTORS.find(c => c.id === favConstructor);
  const initials = user?.name?.split(' ').map(part => part[0]).slice(0, 2).join('') || 'PW';

  return (
    <div className="ap-page">
      <header className="ap-header">
        <SiteHeader pageTitle="My Account" user={user} setUser={setUser} onOpenSettings={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onHomeNavigate={onHomeNavigate}
          leftSlot={<button className="rd-back-btn" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Back</button>} />
      </header>
      <main className="ap-content">
        <nav className="ap-breadcrumb" aria-label="Breadcrumb"><a href="/" onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); onClose(); }}>← Back to Pitwall</a><span>/</span><span aria-current="page">My account</span></nav>
        <div className="ap-intro"><div><p className="ap-eyebrow">YOUR PERSONAL PADDOCK</p><h1>Your account<span>.</span></h1><p>A little more you. A lot more Formula 1.</p></div><span className="ap-season">SEASON / 2026</span></div>
        <section className="ap-profile" aria-label="Your profile">
          <div className="ap-avatar">{user?.picture && !avatarFailed ? <img src={user.picture} alt="" onError={() => setAvatarFailed(true)} /> : <span>{initials}</span>}</div>
          <div className="ap-identity"><span className="ap-eyebrow">PITWALL MEMBER</span><h2>{user?.name || 'Welcome to Pitwall'}</h2><p>{user?.email || 'Sign in from the menu to personalize your account.'}</p></div>
          <div className="ap-profile-note"><span className="ap-status-dot" />{user ? 'Signed in with Google' : 'Not signed in'}<small>Your grid. Your favorites. Your Pitwall.</small></div>
          <LogoMark className="ap-watermark" aria-hidden="true" />
        </section>
        <div className="ap-layout">
          <div className="ap-preferences" aria-busy={loading && !!user}>
            <fieldset className="ap-panel" disabled={loading || loadFailed || isSaving || !user}>
              <legend className="ap-sr-only">Favorite constructor</legend>
              <div className="ap-section-heading"><span className="ap-number">01</span><div><h2>Choose your team</h2><p>The constructor you’re backing, every race weekend.</p></div><span className="ap-count">SELECT 1</span></div>
              <div className="ap-teams">
                {CONSTRUCTORS.map(c => <button type="button" key={c.id} className={`ap-team ${favConstructor === c.id ? 'is-selected' : ''}`} aria-pressed={favConstructor === c.id} onClick={() => { setFavConstructor(c.id); setSaved(false); }} style={{ '--team-color': teamColor(c.id) } as React.CSSProperties}>
                  <span className="ap-team-stripe" /><span className="ap-team-copy"><strong>{c.name}</strong><small>{c.fullName}</small></span><span className="ap-selection" aria-hidden="true">{favConstructor === c.id ? '✓' : ''}</span>
                </button>)}
              </div>
            </fieldset>
            <fieldset className="ap-panel" disabled={loading || loadFailed || isSaving || !user}>
              <legend className="ap-sr-only">Favorite drivers, choose up to two</legend>
              <div className="ap-section-heading"><span className="ap-number">02</span><div><h2>Pick your driver lineup</h2><p>Choose up to two favorites. They don’t have to be teammates.</p></div><span className="ap-count" aria-live="polite">{favDrivers.length} / 2</span></div>
              <div className="ap-drivers">{DRIVERS.map(d => <button type="button" key={d.id} className={`ap-driver ${favDrivers.includes(d.id) ? 'is-selected' : ''}`} aria-pressed={favDrivers.includes(d.id)} disabled={!favDrivers.includes(d.id) && favDrivers.length >= 2} onClick={() => toggleDriver(d.id)}><span className="ap-driver-code">{d.code}</span><strong>{d.name}</strong><span className="ap-selection" aria-hidden="true">{favDrivers.includes(d.id) ? '✓' : ''}</span></button>)}</div>
              <p className="ap-hint">{favDrivers.length >= 2 ? 'Lineup complete. Deselect a driver to choose someone else.' : 'You can change your lineup at any time.'}</p>
            </fieldset>
          </div>
          <aside className="ap-sidebar">
            <section className="ap-summary">
              <p className="ap-eyebrow">YOUR PITWALL SETUP</p><h2>Ready for lights out.</h2><p className="ap-summary-desc">Your favorites, all in one place.</p>
              <div className="ap-summary-team"><span className="ap-label">CONSTRUCTOR</span><strong style={{ '--team-color': teamColor(favConstructor) } as React.CSSProperties}><i />{loading && user ? 'Loading…' : selectedTeam?.name || favConstructor || 'Choose your team'}</strong></div>
              <div className="ap-summary-drivers"><span className="ap-label">DRIVER LINEUP</span>{[0, 1].map(index => { const id = favDrivers[index]; const driver = DRIVERS.find(d => d.id === id); return <div className={`ap-lineup-slot ${id ? 'is-filled' : ''}`} key={index}><span>0{index + 1}</span><strong>{loading && user ? 'Loading…' : driver?.name || id || 'Seat available'}</strong>{id && <span aria-hidden="true">✓</span>}</div>; })}</div>
              {error && <div className="ap-error" role="alert">{error}{loadFailed && <button onClick={() => setAttempt(n => n + 1)}>Try again ↻</button>}</div>}
              <button className="ap-save" onClick={handleSave} disabled={!user || loading || loadFailed || isSaving || !dirty}>{isSaving ? 'Saving preferences…' : saved && !dirty ? 'Preferences saved ✓' : 'Save preferences'}<span aria-hidden="true">{!isSaving && !saved ? '→' : ''}</span></button>
              <p className="ap-save-status" role="status">{!user ? 'Sign in to save your setup.' : loading ? 'Loading your setup…' : loadFailed ? 'Retry loading to edit your setup.' : isSaving ? 'Saving your setup…' : saved && !dirty ? 'You’re all set for the next race.' : dirty ? 'You have unsaved changes.' : 'Your preferences are up to date.'}</p>
              {dirty && !isSaving && <button className="ap-reset" onClick={() => { setFavConstructor(baseline.constructor); setFavDrivers([...baseline.drivers]); setSaved(false); setError(''); }}>Discard changes</button>}
            </section>
            <a className="ap-community" href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer"><span className="ap-eyebrow">BUILT FOR FANS, WITH FANS</span><h3>Help shape Pitwall <span aria-hidden="true">↗</span></h3><p>Have an idea? Join the community and tell us what you’d love to see.</p><span className="ap-community-link">Join the conversation</span></a>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default AccountPage;
