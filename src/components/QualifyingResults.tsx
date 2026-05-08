import React, { useState, useEffect } from 'react';

interface QualifyingResult {
  position: string;
  driver_number: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  given_name: string;
  family_name: string;
  team_name: string;
  code: string;
}

interface QualifyingResultsProps {
  season: string;
  round: string;
}

const QualifyingResults: React.FC<QualifyingResultsProps> = ({ season, round }) => {
  const [results, setResults] = useState<QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualifying = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://pitwall-backend-dq9r.onrender.com/results/get-all-qualifying-results/${season}/${round}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setError("Failed to fetch qualifying classification");
        }
      } catch (e) {
        console.error("Failed to fetch qualifying results", e);
        setError("Telemetry connection lost");
      } finally {
        setLoading(false);
      }
    };

    fetchQualifying();
  }, [season, round]);

  if (loading) {
    return <div className="qr-loading">Analyzing qualifying telemetry...</div>;
  }

  if (error) {
    return <div className="qr-error">{error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="qr-no-data">
        <p>No qualifying data available for this round.</p>
      </div>
    );
  }

  const top3 = results.slice(0, 3);
  const theRest = results.slice(3);

  return (
    <div className="qualifying-results-screen">
      <div className="qr-header">
        <div className="qr-title-wrap">
          <h2 className="qr-title">Qualifying <em>Session</em></h2>
          <div className="qr-subtitle">Classification // Round {round}</div>
        </div>
        <div className="qr-header-line"></div>
      </div>

      <div className="qr-top-hero">
        {[top3[1], top3[0], top3[2]].map((r) => {
          if (!r) return null;
          return (
            <div key={r.driver_number} className={`qr-hero-card pos-${r.position} theme-${r.team_name.toLowerCase().replace(/\s+/g, '')}`}>
              <div className="qr-card-blur"></div>
              <div className="qr-pos-badge">P{r.position}</div>
              <div className="qr-driver-info">
                <span className="qr-driver-name">{r.given_name} <strong>{r.family_name}</strong></span>
                <span className="qr-team-name">{r.team_name}</span>
              </div>
              <div className="qr-best-time">
                <span className="qr-time-label">BEST</span>
                <span className="qr-time-val">{r.q3 || r.q2 || r.q1}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="qr-table-container">
        <table className="qr-table">
          <thead>
            <tr>
              <th className="qr-col-pos">POS</th>
              <th className="qr-col-driver">DRIVER</th>
              <th className="qr-col-team">TEAM</th>
              <th className="qr-col-q1">Q1</th>
              <th className="qr-col-q2">Q2</th>
              <th className="qr-col-q3">Q3</th>
            </tr>
          </thead>
          <tbody>
            {theRest.map((r) => (
              <tr key={r.driver_number} className={`qr-row theme-${r.team_name.toLowerCase().replace(/\s+/g, '')}`}>
                <td className="qr-td-pos">
                  <span className="qr-pos-num">{r.position}</span>
                </td>
                <td className="qr-td-driver">
                  <div className="qr-driver-cell">
                    <span className="qr-driver-code">{r.code}</span>
                    <span className="qr-driver-fullname">{r.given_name} {r.family_name}</span>
                  </div>
                </td>
                <td className="qr-td-team">{r.team_name}</td>
                <td className={`qr-td-time ${!r.q1 ? 'knocked-out' : ''}`}>{r.q1 || '—'}</td>
                <td className={`qr-td-time ${!r.q2 ? 'knocked-out' : ''}`}>{r.q2 || '—'}</td>
                <td className={`qr-td-time ${!r.q3 ? 'knocked-out' : ''}`}>{r.q3 || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualifyingResults;
