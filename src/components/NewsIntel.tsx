import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Loader from './Loader';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  fullContent: string;
  category: string;
  pubDate: string;
  image?: string;
}

const NewsIntel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived (not copied) so the modal picks up the og:image once it lands,
  // even if it resolves after the article was opened.
  const selectedNews = selectedId ? news.find(n => n.id === selectedId) ?? null : null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    // Pull an image out of an RSS <item> wherever the feed happens to put one:
    // <enclosure>, the media: namespace, or an <img> embedded in the HTML body.
    const extractImage = (item: Element): string | undefined => {
      const enclosure = item.querySelector('enclosure');
      const encUrl = enclosure?.getAttribute('url');
      if (encUrl && /^image\//i.test(enclosure?.getAttribute('type') || 'image/')) {
        return encUrl;
      }

      // media:content / media:thumbnail (namespaced — getElementsByTagName keeps the prefix)
      const mediaTags = ['media:content', 'media:thumbnail'];
      for (const tag of mediaTags) {
        const el = item.getElementsByTagName(tag)[0];
        const url = el?.getAttribute('url');
        if (url) return url;
      }

      // First <img> inside description or content:encoded HTML
      const htmlBlob =
        item.getElementsByTagName('content:encoded')[0]?.textContent ||
        item.querySelector('description')?.textContent ||
        '';
      const imgMatch = htmlBlob.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) return imgMatch[1];

      return undefined;
    };

    const fetchNews = async () => {
      try {
        const response = await fetch('/f1-news');
        const xmlText = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');

        const parsedItems: NewsItem[] = Array.from(items).slice(0, 10).map((item, index) => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate =
            item.querySelector('pubDate')?.textContent ||
            item.getElementsByTagName('dc:date')[0]?.textContent ||
            '';

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

          let category = 'Formula 1';
          const t = title.toLowerCase();
          if (t.includes('f1 academy') || t.includes('academy')) category = 'F1 Academy';
          else if (t.includes('f2') || t.includes('formula 2')) category = 'Formula 2';
          else if (t.includes('f3') || t.includes('formula 3')) category = 'Formula 3';
          else if (t.includes('fantasy')) category = 'F1 Fantasy';

          return {
            id: `news-${index}`,
            title,
            link,
            summary,
            fullContent,
            category,
            pubDate,
            image: extractImage(item),
          };
        });

        setNews(parsedItems);
        setLoading(false);

        // The RSS feed itself carries no per-article images, so backfill by
        // fetching each article page (via the /f1-article proxy, to dodge
        // CORS) and reading its og:image meta tag. Fires in parallel and
        // patches items into state as each one resolves.
        parsedItems
          .filter((item) => !item.image)
          .forEach(async (item) => {
            const ogImage = await fetchOgImage(item.link);
            if (!ogImage) return;
            setNews((prev) =>
              prev.map((n) => (n.id === item.id ? { ...n, image: ogImage } : n))
            );
          });
      } catch (err) {
        console.error('Failed to fetch F1 news:', err);
        setLoading(false);
      }
    };

    const fetchOgImage = async (link: string): Promise<string | undefined> => {
      try {
        const { pathname } = new URL(link);
        const response = await fetch(`/f1-article${pathname}`);
        if (!response.ok) return undefined;
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
      } catch {
        return undefined;
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
      return dateStr.replace(/\s\+\d+$/, '').toUpperCase();
  };

  return (
    <>
      <div className="intel-head">
        <div className="col-name">
          Paddock <em>Intel</em>
        </div>
        <div className="col-sub">Live Formula 1 Feed · Top 10 Stories</div>
      </div>

      <div className="col">
      <div className="news-block">
        {loading && (
          <Loader label="Streaming paddock intel" size={36} />
        )}

        {!loading && news.map((item, index) => (
          <article 
            key={item.id} 
            className={`news-item ${index === 0 ? 'lead' : 'neutral'}`}
            onClick={() => setSelectedId(item.id)}
            style={{ cursor: 'pointer' }}
          >
            {item.image && (
              <div className="news-thumb">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    const wrap = e.currentTarget.closest('.news-thumb') as HTMLElement | null;
                    if (wrap) wrap.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="news-meta">
              <span className="news-kicker">{item.category}</span>
              <span className="news-date">{formatDate(item.pubDate)}</span>
              <span className="news-num">{(index + 1).toString().padStart(2, '0')}</span>
            </div>
            <div className="news-content-wrap">
              <h3 className="news-headline">{item.title}</h3>
              <p className="news-body">{item.summary}</p>
              <span className="news-go" aria-hidden="true">Read Story →</span>
            </div>
          </article>
        ))}

        {!loading && news.length === 0 && (
          <div style={{ padding: '20px', fontSize: '12px', opacity: 0.5 }}>
            No recent intel available from Formula 1.
          </div>
        )}
      </div>

      {/* News Modal - Rendered via Portal at body root */}
      {selectedNews && createPortal(
        <div className="news-modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="news-modal-window" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setSelectedId(null)}>×</button>

            {selectedNews.image && (
              <div className="news-modal-hero">
                <img
                  src={selectedNews.image}
                  alt=""
                  onError={(e) => {
                    const wrap = e.currentTarget.closest('.news-modal-hero') as HTMLElement | null;
                    if (wrap) wrap.style.display = 'none';
                  }}
                />
              </div>
            )}

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
                READ FULL STORY ON FORMULA1.COM
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </>
  );
};

export default NewsIntel;
