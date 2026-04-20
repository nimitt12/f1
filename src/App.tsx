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

const App: React.FC = () => {
  return (
    <>
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
