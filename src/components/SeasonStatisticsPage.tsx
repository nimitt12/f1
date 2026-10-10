import React, { useEffect, useMemo, useState } from 'react';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';
import AnalyticsSuite from './AnalyticsSuite';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type OutcomeCategory = 'classified' | 'mechanical' | 'incident' | 'regulatory' | 'other';

interface StatusRow {
  statusId: string;
  status: string;
  count: number;
  percentage: number;
  category: OutcomeCategory;
}

interface OverallStatusData {
  source: string;
  fetchedAt: string;
  cacheStatus: 'fresh' | 'refreshed' | 'stale';
  summary: {
    total: number;
    classified: number;
    nonClassified: number;
    completionRate: number;
    statusTypes: number;
    leadingStatus: { status: string; count: number } | null;
  };
  categories: Array<{ category: OutcomeCategory; count: number; percentage: number }>;
  statuses: StatusRow[];
}

interface SeasonStatisticsPageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

const CATEGORY_META: Record<OutcomeCategory, { label: string; color: string; description: string }> = {
  classified: { label: 'Classified', color: '#74f7c5', description: 'Finished, lapped, or officially classified' },
  mechanical: { label: 'Mechanical', color: '#ffb648', description: 'Power unit, drivetrain, suspension, and car failures' },
  incident: { label: 'Incidents', color: '#ff526d', description: 'Accidents, collisions, and spins' },
  regulatory: { label: 'Regulatory', color: '#b77cff', description: 'Disqualifications, exclusions, and eligibility outcomes' },
  other: { label: 'Other', color: '#7f91aa', description: 'Withdrawals and uncategorised retirements' },
};

const isStatisticsData = (value: unknown): value is OverallStatusData => {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<OverallStatusData>;
  return Array.isArray(row.statuses) && !!row.summary && typeof row.fetchedAt === 'string';
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const downloadCsv = (data: OverallStatusData) => {
  const lines = [
    ['Status ID', 'Outcome', 'Category', 'Count', 'Share'],
    ...data.statuses.map((row) => [row.statusId, row.status, CATEGORY_META[row.category].label, row.count, `${row.percentage.toFixed(2)}%`]),
  ].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'pitwall-all-time-f1-race-outcomes.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

const SeasonStatisticsPage: React.FC<SeasonStatisticsPageProps> = ({
  user,
  setUser,
  onBack,
  onOpenSettings,
  onHomeNavigate,
}) => {
  const [data, setData] = useState<OverallStatusData | null>(null);
  const [filter, setFilter] = useState<OutcomeCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const selectCategory = (category: OutcomeCategory | 'all') => {
    setFilter(category);
    setPage(0);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setLoading(true);
    setError('');
    setData(null);
    selectCategory('all');
    setSearch('');
    setReloadKey((value) => value + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const getStatistics = async () => {
      const response = await fetch(`${BACKEND_URL}/statistics/statuses`, { signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 404 ? 'The statistics API is not available on this backend build.' : 'The statistics feed could not be loaded.');
      const payload: unknown = await response.json();
      if (!isStatisticsData(payload)) throw new Error('The statistics service returned an unexpected response.');
      return payload;
    };

    getStatistics()
      .then((payload) => {
        if (controller.signal.aborted) return;
        setData(payload);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setData(null);
        setError(requestError instanceof Error ? requestError.message : 'The statistics feed could not be loaded.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reloadKey]);

  const categories = useMemo(() => {
    if (!data) return [];
    return (Object.keys(CATEGORY_META) as OutcomeCategory[]).map((category) => ({
      category,
      count: data.categories.find((item) => item.category === category)?.count || 0,
      percentage: data.categories.find((item) => item.category === category)?.percentage || 0,
    }));
  }, [data]);

  const visibleStatuses = useMemo(() => (data?.statuses || [])
    .filter((row) => (filter === 'all' || row.category === filter) && row.status.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.count - a.count), [data, filter, search]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visibleStatuses.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStatuses = visibleStatuses.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const maxStatusCount = Math.max(1, ...visibleStatuses.map((row) => row.count));
  const biggestNonClassified = data?.statuses.find((row) => row.category !== 'classified');
  const donut = categories.length
    ? `conic-gradient(${categories.map((item, index) => {
        const before = categories.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0);
        return `${CATEGORY_META[item.category].color} ${before}% ${before + item.percentage}%`;
      }).join(', ')})`
    : '#172033';

  return (
    <div className="season-stats-page">
      <div className="season-stats-header">
        <SiteHeader
          user={user}
          setUser={setUser}
          onOpenSettings={onOpenSettings}
          onHomeNavigate={onHomeNavigate}
          leftSlot={<button className="rd-back-btn season-stats-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Dashboard</button>}
        />
      </div>

      <main className="season-stats-main">
        <section className="season-stats-hero">
          <div className="season-stats-hero-copy">
            <span className="season-stats-kicker"><i /> Pitwall data lab</span>
            <h1>Every finish in <em>F1 history.</em></h1>
            <p>The complete record of how drivers reached—or failed to reach—the chequered flag, from 1950 to today.</p>
          </div>
          <div className="season-stats-era"><span>Archive coverage</span><strong>1950 — TODAY</strong><small>All World Championship races</small></div>
          <div className="season-stats-hero-year" aria-hidden="true">ALL TIME</div>
        </section>

        {error && (
          <section className="season-stats-error" role="status">
            <span>!</span><div><strong>Telemetry unavailable</strong><p>{error}</p></div>
            <button onClick={retry}>Retry feed</button>
          </section>
        )}

        {loading ? (
          <div className="season-stats-loading" role="status"><i /><span>Reconstructing Formula 1 history…</span></div>
        ) : data && (
          <>
            <section className="season-kpi-grid" aria-label="All-time Formula 1 outcome summary">
              <article><span>01 / Archive</span><strong>{formatNumber(data.summary.total)}</strong><p>recorded driver outcomes</p></article>
              <article><span>02 / Completion</span><strong>{data.summary.completionRate.toFixed(1)}<small>%</small></strong><p>{formatNumber(data.summary.classified)} classified finishes</p></article>
              <article><span>03 / Attrition</span><strong>{formatNumber(data.summary.nonClassified)}</strong><p>non-classified outcomes</p></article>
              <article><span>04 / Variety</span><strong>{String(data.summary.statusTypes).padStart(2, '0')}</strong><p>distinct outcome types</p></article>
            </section>

            <section className="season-stats-dashboard">
              <article className="season-outcome-panel">
                <header><div><span>Outcome mix</span><h2>The anatomy of F1 history</h2></div><small>{data.cacheStatus === 'stale' ? 'Saved snapshot' : 'Synced data'}</small></header>
                <div className="season-outcome-body">
                  <div className="season-donut" style={{ '--donut': donut } as React.CSSProperties}>
                    <div><strong>{data.summary.completionRate.toFixed(1)}%</strong><span>classified</span></div>
                  </div>
                  <div className="season-category-list">
                    {categories.map((item) => (
                      <button key={item.category} className={filter === item.category ? 'active' : ''} aria-pressed={filter === item.category} onClick={() => selectCategory(filter === item.category ? 'all' : item.category)}>
                        <i style={{ background: CATEGORY_META[item.category].color }} />
                        <span><strong>{CATEGORY_META[item.category].label}</strong><small>{CATEGORY_META[item.category].description}</small></span>
                        <b>{item.percentage.toFixed(1)}%</b>
                      </button>
                    ))}
                  </div>
                </div>
              </article>

              <article className="season-insight-panel">
                <header><span>Archive signal</span><h2>What stands out</h2></header>
                <div className="season-insight-primary">
                  <span>Historical archive</span>
                  <strong>{data.summary.statusTypes}<small> types</small></strong>
                  <p>Distinct official finishing statuses recorded across Formula 1 World Championship history.</p>
                </div>
                <div className="season-insight-row"><span>Most common outcome</span><strong>{data.summary.leadingStatus?.status || '—'} <b>{data.summary.leadingStatus ? formatNumber(data.summary.leadingStatus.count) : ''}</b></strong></div>
                <div className="season-insight-row"><span>Leading attrition cause</span><strong>{biggestNonClassified?.status || '—'} <b>{biggestNonClassified ? formatNumber(biggestNonClassified.count) : ''}</b></strong></div>
              </article>
            </section>

            <section className="season-status-panel season-outcome-explorer">
              <header className="season-status-head">
                <div><span>Explore the archive</span><h2>Race outcomes, at a glance</h2><p>Choose a category to explore its outcomes. Each count represents one driver’s race result.</p></div>
                <div className="season-status-actions">
                  <button className="season-download" onClick={() => downloadCsv(data)} aria-label="Download all-time outcomes as CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 21h16" /></svg>CSV</button>
                </div>
              </header>
              <div className="season-outcome-categories" role="group" aria-label="Filter outcomes by category">
                <button className={`season-outcome-card ${filter === 'all' ? 'active' : ''}`} aria-pressed={filter === 'all'} onClick={() => selectCategory('all')}>
                  <span>All outcomes</span><strong>{formatNumber(data.summary.total)}</strong><small>{data.statuses.length} outcome types</small>
                  <div className="season-outcome-meter" aria-hidden="true">{categories.map((item) => <i key={item.category} style={{ width: `${item.percentage}%`, background: CATEGORY_META[item.category].color }} />)}</div>
                </button>
                {categories.map((item) => (
                  <button key={item.category} className={`season-outcome-card ${filter === item.category ? 'active' : ''}`} style={{ '--category-color': CATEGORY_META[item.category].color } as React.CSSProperties} aria-pressed={filter === item.category} onClick={() => selectCategory(item.category)}>
                    <span><i />{CATEGORY_META[item.category].label}</span><strong>{formatNumber(item.count)}</strong><small>{item.percentage.toFixed(1)}% of all results</small>
                    <div className="season-outcome-meter" aria-hidden="true"><i style={{ width: `${item.percentage}%` }} /></div>
                  </button>
                ))}
              </div>
              <div className="season-outcome-toolbar">
                <div><h3>{filter === 'all' ? 'Most common outcomes' : `${CATEGORY_META[filter].label} outcomes`}</h3><p>{filter === 'all' ? 'Ranked by frequency across the archive' : CATEGORY_META[filter].description}</p></div>
                <label className="season-outcome-search"><span>Search outcomes</span><input type="search" placeholder="Search e.g. engine…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
              </div>
              <div className="season-status-table">
                <div className="season-status-table-head"><span>Outcome</span><span>Relative frequency</span><span>Results</span><span>All results</span></div>
                {pageStatuses.map((row, index) => (
                  <div className="season-status-row" key={row.statusId}>
                    <div className="season-status-name"><b>{String(currentPage * pageSize + index + 1).padStart(2, '0')}</b><i style={{ background: CATEGORY_META[row.category].color }} /><span><strong>{row.status}</strong><small>{CATEGORY_META[row.category].label}</small></span></div>
                    <div className="season-status-track" aria-hidden="true"><i style={{ width: `${row.count / maxStatusCount * 100}%`, background: CATEGORY_META[row.category].color }} /></div>
                    <strong>{formatNumber(row.count)}</strong>
                    <b>{row.percentage.toFixed(1)}%</b>
                  </div>
                ))}
                {!visibleStatuses.length && <div className="season-outcome-empty"><strong>No matching outcomes</strong><p>Try another search or category.</p><button onClick={() => { setSearch(''); selectCategory('all'); }}>Reset filters</button></div>}
              </div>
              <div className="season-outcome-pagination">
                <span role="status">{visibleStatuses.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, visibleStatuses.length)} of ${visibleStatuses.length} outcome types` : '0 outcome types'}<small>Shares are always a percentage of all recorded results.</small></span>
                {pageCount > 1 && <nav aria-label="Outcome pages"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="Previous outcome page">← Previous</button><span>{currentPage + 1} / {pageCount}</span><button disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)} aria-label="Next outcome page">Next →</button></nav>}
              </div>
            </section>

            <div className="season-stats-source">
              <span><i /> Last synced {new Date(data.fetchedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <span>Source: Jolpica F1 all-time status archive · Stored and served by Pitwall</span>
            </div>
            <AnalyticsSuite season="2026" />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SeasonStatisticsPage;
