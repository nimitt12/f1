import React, { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  category: string;
  pubDate: string;
}

const NewsIntel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          
          // Clean description: extract first few words/paragraphs of text
          const rawDescription = item.querySelector('description')?.textContent || '';
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = rawDescription;
          
          // Try to get first <p> or just the text
          let description = tempDiv.querySelector('p')?.textContent || tempDiv.textContent || '';
          
          // Truncate to a reasonable length for the dashboard
          if (description.length > 160) {
            description = description.substring(0, 157) + '...';
          }

          // Determine category/kicker
          // Check for specific keywords in title or just use a generic one
          let category = 'FIA Official';
          if (title.toLowerCase().includes('f1') || title.toLowerCase().includes('formula 1')) category = 'Formula 1';
          if (title.toLowerCase().includes('wrc')) category = 'WRC';
          if (title.toLowerCase().includes('circuit')) category = 'Circuit';

          return {
            id: `news-${index}`,
            title,
            link,
            description,
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
        <div className="podium-head">Japanese GP · Suzuka · Result</div>
        <div className="podium-list">
          <div className="pod-row p1">
            <div className="pod-badge">P1</div>
            <div>
              <div className="pod-driver-name">Kimi Antonelli</div>
              <div className="pod-driver-team">Mercedes · #12</div>
            </div>
            <div className="pod-time">1:28:14.802</div>
          </div>
          <div className="pod-row p2">
            <div className="pod-badge">P2</div>
            <div>
              <div className="pod-driver-name">George Russell</div>
              <div className="pod-driver-team">Mercedes · #63</div>
            </div>
            <div className="pod-time">+3.441</div>
          </div>
          <div className="pod-row p3">
            <div className="pod-badge">P3</div>
            <div>
              <div className="pod-driver-name">Charles Leclerc</div>
              <div className="pod-driver-team">Ferrari · #16</div>
            </div>
            <div className="pod-time">+9.127</div>
          </div>
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
            onClick={() => window.open(item.link, '_blank')}
            style={{ cursor: 'pointer' }}
          >
            <div className="news-meta">
              <span className="news-kicker">{item.category}</span>
              <span className="news-num">{(index + 1).toString().padStart(2, '0')}</span>
            </div>
            <span className="news-date">{formatDate(item.pubDate)}</span>
            <h3 className="news-headline">{item.title}</h3>
            <p className="news-body">{item.description}</p>
          </article>
        ))}

        {!loading && news.length === 0 && (
          <div style={{ padding: '20px', fontSize: '12px', opacity: 0.5 }}>
            No recent intel available from FIA.
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsIntel;
