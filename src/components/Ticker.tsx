import React, { useEffect, useState } from 'react';
import { generateTriviaFacts } from '../lib/trivia';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

const Ticker: React.FC = () => {
  const [facts, setFacts] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      // Prefer admin-curated trivia from the DB; fall back to the auto-generated
      // facts when none have been set (or the endpoint is unavailable).
      try {
        const res = await fetch(`${BACKEND_URL}/trivia`);
        if (res.ok) {
          const data = await res.json();
          const lines: string[] = Array.isArray(data)
            ? data.map((t: { body: string }) => t.body).filter(Boolean)
            : [];
          if (lines.length > 0) {
            setFacts(lines);
            return;
          }
        }
      } catch {
        // ignore — fall through to auto-generated facts
      }
      setFacts(await generateTriviaFacts());
    };
    load();
  }, []);

  const renderItems = () => (
    <>
      {facts.map((fact, i) => (
        <React.Fragment key={i}>
          <span className="tick">
            <span className="val">{fact}</span>
          </span>
          <span className="tick tick-dot" aria-hidden="true">
            <span className="tick-sep-line" />
            <span className="tick-sep-diamond">◆</span>
            <span className="tick-sep-line" />
          </span>
        </React.Fragment>
      ))}
      {facts.length === 0 && (
        <span className="tick">LOADING F1 TRIVIA...</span>
      )}
    </>
  );

  return (
    <div className="ticker-wrap">
      <div className="ticker-fade-l" />
      <div className="ticker-track">
        {renderItems()}
        {renderItems()}
      </div>
      <div className="ticker-fade-r" />
    </div>
  );
};

export default Ticker;
