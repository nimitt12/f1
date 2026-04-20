import React from 'react';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import NextRace from './components/NextRace';
import Calendar from './components/Calendar';
import DriversStandings from './components/DriversStandings';
import ConstructorsStandings from './components/ConstructorsStandings';
import NewsIntel from './components/NewsIntel';
import StatsRibbon from './components/StatsRibbon';
import Footer from './components/Footer';

const themes = [
  { id: 'default', label: 'Default Red' },
  { id: 'mercedes', label: 'Mercedes' },
  { id: 'ferrari', label: 'Ferrari' },
  { id: 'mclaren', label: 'McLaren' },
  { id: 'redbull', label: 'Red Bull' },
  { id: 'williams', label: 'Williams' },
  { id: 'haas', label: 'Haas' },
  { id: 'alpine', label: 'Alpine' },
  { id: 'audi', label: 'Audi' },
  { id: 'racingbulls', label: 'Racing Bulls' },
  { id: 'aston', label: 'Aston Martin' },
  { id: 'cadillac', label: 'Cadillac' },
];

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = React.useState('default');

  React.useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div style={{ 
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, 
      display: 'flex', alignItems: 'center', gap: '8px', 
      background: 'var(--carbon)', padding: '8px 12px', 
      border: '1px solid var(--racing)', color: '#fff', 
      fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <span style={{ letterSpacing: '0.1em', fontWeight: 600 }}>THEME</span>
      <select 
        value={theme} 
        onChange={e => setTheme(e.target.value)} 
        style={{ 
          background: 'var(--carbon-2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', 
          padding: '4px 8px', outline: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' 
        }}
      >
        {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <ThemeSwitcher />
      <Ticker />
      <Hero />
      <NextRace />
      <Calendar />

      <section className="main-section">
        <div className="main-grid">
          <DriversStandings />
          <ConstructorsStandings />
          <NewsIntel />
        </div>
      </section>

      <StatsRibbon />
      <Footer />
    </>
  );
};

export default App;
