import React from 'react';
import SiteHeader from './SiteHeader';

export interface AuthUser {
  id: string;
  name: string;
  picture: string;
  email: string;
  is_admin?: boolean;
}

interface HeroProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
}

const Hero: React.FC<HeroProps> = ({ user, setUser, onOpenSettings }) => {
  return (
    <section className="hero">
      <span className="speed-line"></span>
      <span className="speed-line"></span>
      <span className="speed-line"></span>

      <SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} />

      <div className="title-wrap">
        <h1 className="hero-title">
          <span className="line1">
            <span>{user ? `${(user.name || '').split(' ')[0]}'s` : "My"}</span>
          </span>
          <span className="line2">
            <span>PitWall.</span>
          </span>
        </h1>
        <div className="title-underline"></div>
      </div>
    </section>
  );
};

export default Hero;