import React, { useState, useEffect } from 'react';
import Loader from './Loader';

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
  // 'sprint' renders the sprint qualifying classification (SQ1/SQ2/SQ3)
  // from its dedicated endpoint; defaults to the main qualifying session.
  session?: 'qualifying' | 'sprint';
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const QualifyingResults: React.FC<QualifyingResultsProps> = ({ season, round, session = 'qualifying' }) => {
  const [results, setResults] = useState<QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSprint = session === 'sprint';

  useEffect(() => {
    const fetchQualifying = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isSprint ? 'get-all-sprint-qualifying-results' : 'get-all-qualifying-results';
        const res = await fetch(`${BACKEND_URL}/results/${endpoint}/${season}/${round}`);
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
  }, [season, round, isSprint]);

  if (loading) {
    return <Loader label={isSprint ? "Analyzing sprint qualifying telemetry" : "Analyzing qualifying telemetry"} />;
  }

  if (error) {
    return <div className="qr-error">{error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="qr-no-data">
        <p>No {isSprint ? 'sprint qualifying' : 'qualifying'} data available for this round.</p>
      </div>
    );
  }

  return (
    <div className="qualifying-results-screen">
      <div className="qr-header">
        <div className="qr-title-wrap">
          <h2 className="qr-title">{isSprint ? <>Sprint <em>Qualifying</em></> : <>Qualifying <em>Session</em></>}</h2>
          <div className="qr-subtitle">Classification // Round {round}</div>
        </div>
        <div className="qr-header-line"></div>
      </div>

      <div className="qr-table-container">
        <table className="qr-table">
          <thead>
            <tr>
              <th className="qr-col-pos">POS</th>
              <th className="qr-col-driver">DRIVER</th>
              <th className="qr-col-team">TEAM</th>
              <th className="qr-col-q1">{isSprint ? 'SQ1' : 'Q1'}</th>
              <th className="qr-col-q2">{isSprint ? 'SQ2' : 'Q2'}</th>
              <th className="qr-col-q3">{isSprint ? 'SQ3' : 'Q3'}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const pos = Number(r.position);
              const podiumClass = pos === 1 ? 'qr-row--p1' : pos === 2 ? 'qr-row--p2' : pos === 3 ? 'qr-row--p3' : '';
              return (
                <tr key={r.driver_number} className={`qr-row ${podiumClass} theme-${r.team_name.toLowerCase().replace(/\s+/g, '')}`}>
                  <td className="qr-td-pos">
                    <span className="qr-pos-num">
                      {pos === 1 ? (
                        <svg className="qr-pos-trophy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                      ) : r.position}
                    </span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualifyingResults;
