import React from 'react';
import SiteHeader from './SiteHeader';
import type { Race } from '../data/races';

export interface AuthUser {
  id: string;
  name: string;
  picture: string;
  email: string;
  is_admin?: boolean;
}

interface HeroProps {
  upcomingRace: Race | null;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
}

const Hero: React.FC<HeroProps> = ({ user, setUser, onOpenSettings, upcomingRace }) => {
  return (
    <section className="hero">
      <SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} stickyOnScroll upcomingRace={upcomingRace} />

      <div className="title-wrap">
        <h1 className="hero-title">
          <span className="line1">
            <span>{user ? `${(user.name || '').split(' ')[0]}'s` : "My"}</span>
          </span>
          <span className="line2">
            <span>PitWall.</span>
            <sup className="beta-tag">Beta</sup>
          </span>
        </h1>
        <div className="title-underline"></div>
      </div>
    </section>
  );
};

export default Hero;
