import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  fullContent: string;
  category: string;
  pubDate: string;
}

interface RaceResult {
  position: string;
  Driver: {
    givenName: string;
    familyName: string;
    permanentNumber: string;
    code?: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  Time?: {
    time: string;
  };
}

const NewsIntel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  
  const [podiumResults, setPodiumResults] = useState<RaceResult[]>([]);
  const [raceInfo, setRaceInfo] = useState<{ name: string; circuit: string } | null>(null);
  const [podiumLoading, setPodiumLoading] = useState(true);

  useEffect(() => {
    const fetchPodium = async () => {
      try {
        // Mock data representing the latest race results (Japanese GP)
        const data = {
          MRData: {
            RaceTable: {
              Races: [
                {
                  raceName: "Japanese Grand Prix",
                  Circuit: {
                    circuitName: "Suzuka International Racing Course"
                  },
                  Results: [
                    {
                      position: "1",
                      Driver: {
                        givenName: "Andrea Kimi",
                        familyName: "Antonelli",
                        permanentNumber: "12",
                        code: "ANT"
                      },
                      Constructor: {
                        constructorId: "mercedes",
                        name: "Mercedes"
                      },
                      Time: {
                        time: "1:28:14.802"
                      }
                    },
                    {
                      position: "2",
                      Driver: {
                        givenName: "George",
                        familyName: "Russell",
                        permanentNumber: "63",
                        code: "RUS"
                      },
                      Constructor: {
                        constructorId: "mercedes",
                        name: "Mercedes"
                      },
                      Time: {
                        time: "+3.441"
                      }
                    },
                    {
                      position: "3",
                      Driver: {
                        givenName: "Charles",
                        familyName: "Leclerc",
                        permanentNumber: "16",
                        code: "LEC"
                      },
                      Constructor: {
                        constructorId: "ferrari",
                        name: "Ferrari"
                      },
                      Time: {
                        time: "+9.127"
                      }
                    }
                  ]
                }
              ]
            }
          }
        };

        const race = data.MRData.RaceTable.Races[0];
        if (race) {
          setRaceInfo({
            name: race.raceName,
            circuit: race.Circuit.circuitName
          });
          setPodiumResults(race.Results.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to parse podium results', err);
      } finally {
        setPodiumLoading(false);
      }
    };

    fetchPodium();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNews(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/fia-news');
        const xmlText = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        
        const parsedItems: NewsItem[] = Array.from(items).slice(0, 10).map((item, index) => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          
          const rawDescription = item.querySelector('description')?.textContent || '';
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = rawDescription;
          
          // Full content (cleaned but not truncated)
          const fullContent = tempDiv.querySelector('p')?.textContent || tempDiv.textContent || '';
          
          // Truncated summary for the list
          let summary = fullContent;
          if (summary.length > 160) {
            summary = summary.substring(0, 157) + '...';
          }

          let category = 'FIA Official';
          if (title.toLowerCase().includes('f1') || title.toLowerCase().includes('formula 1')) category = 'Formula 1';
          if (title.toLowerCase().includes('wrc')) category = 'WRC';
          if (title.toLowerCase().includes('circuit')) category = 'Circuit';

          return {
            id: `news-${index}`,
            title,
            link,
            summary,
            fullContent,
            category,
            pubDate
          };
        });

        console.log("🚀 ~ fetchNews ~ parsedItems:", parsedItems)
        setNews(parsedItems);
      } catch (err) {
        console.error('Failed to fetch FIA news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
      return dateStr.replace(/\s\+\d+$/, '').toUpperCase();
  };

  return (
    <div className="col">
      <div className="col-head">
        <div className="col-num">§ 03</div>
        <div className="col-name">
          Paddock <em>Intel</em>
        </div>
        <div className="col-sub">Live FIA Feed · Top 10 Press Releases</div>
      </div>

      <div className="podium-block">
        <div className="podium-head">
          {podiumLoading ? 'Fetching Results...' : `Last Race Results · ${raceInfo?.name}`}
        </div>
        <div className="podium-list">
          {podiumLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
              Updating Podium...
            </div>
          ) : podiumResults.map((result) => (
            <div key={result.position} className={`pod-row p${result.position}`}>
              <div className="pod-badge">P{result.position}</div>
              <div>
                <div className="pod-driver-name">{result.Driver.givenName} {result.Driver.familyName}</div>
                <div className="pod-driver-team">{result.Constructor.name} · #{result.Driver.permanentNumber}</div>
              </div>
              <div className="pod-time">{result.Time?.time || 'DNF'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="news-block">
        {loading && (
          <div className="news-loading" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
            Streaming Paddock Intel...
          </div>
        )}

        {!loading && news.map((item, index) => (
          <article 
            key={item.id} 
            className={`news-item ${index === 0 ? 'lead' : 'neutral'}`}
            onClick={() => setSelectedNews(item)}
            style={{ cursor: 'pointer' }}
          >
            <div className="news-meta">
              <span className="news-kicker">{item.category}</span>
              <span className="news-num">{(index + 1).toString().padStart(2, '0')}</span>
            </div>
            <span className="news-date">{formatDate(item.pubDate)}</span>
            <h3 className="news-headline">{item.title}</h3>
            <p className="news-body">{item.summary}</p>
          </article>
        ))}

        {!loading && news.length === 0 && (
          <div style={{ padding: '20px', fontSize: '12px', opacity: 0.5 }}>
            No recent intel available from FIA.
          </div>
        )}
      </div>

      {/* News Modal - Rendered via Portal at body root */}
      {selectedNews && createPortal(
        <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="news-modal-window" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setSelectedNews(null)}>×</button>
            
            <div className="news-modal-meta">
              <span className="news-kicker">{selectedNews.category}</span>
              <span className="news-date">{formatDate(selectedNews.pubDate)}</span>
            </div>
            
            <h2 className="news-modal-title">{selectedNews.title}</h2>
            
            <div className="news-modal-content">
              {selectedNews.fullContent.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="news-modal-footer">
              <button 
                className="news-modal-link-btn"
                onClick={() => window.open(selectedNews.link, '_blank')}
              >
                READ ORIGINAL PRESS RELEASE ON FIA.COM
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NewsIntel;
