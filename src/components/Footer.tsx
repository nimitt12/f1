import React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="footer-wrap">
      <footer className="footer">
        <div className="f-note">
          <span className="f-dot"></span>Lights out and away we go<span className="f-dot"></span>
        </div>
        <div className="f-brand">
          The <em>Pit Wall</em>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
