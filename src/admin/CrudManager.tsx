/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

// Column metadata returned by GET /admin/tables
interface ColumnMeta {
  name: string;
  type: 'text' | 'integer' | 'text[]';
  required: boolean;
  auto: boolean;
  isPk: boolean;
}

interface TableMeta {
  name: string;
  pk: string;
  columns: ColumnMeta[];
}

type Row = Record<string, unknown>;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Pretty label for a table/column id (snake_case -> Title Case)
const labelize = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Render a cell value for display in the table
const displayValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleString();
  }
  return String(value);
};

// Convert a stored value into the string an <input> expects
const toInputString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

const PAGE_SIZE = 50;

// Tables that expose season/round dropdown filters
const FILTER_TABLES = ['results', 'qualifying'];

const CrudManager: React.FC<{ onLog?: (msg: string) => void }> = ({ onLog }) => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTable, setActiveTable] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Season/round filters (results & qualifying tabs only)
  const [filterSeason, setFilterSeason] = useState('');
  const [filterRound, setFilterRound] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [rounds, setRounds] = useState<string[]>([]);

  // Editing modal state. `null` = closed; row object = edit; {} = create.
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const log = useCallback((msg: string) => onLog?.(msg), [onLog]);

  const meta = useMemo(
    () => tables.find((t) => t.name === activeTable),
    [tables, activeTable]
  );

  // Load the table metadata once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/tables`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: TableMeta[] = await res.json();
        setTables(data);
        if (data.length) setActiveTable(data[0].name);
      } catch (e) {
        setError(`Failed to load table metadata: ${errMsg(e)}`);
      }
    })();
  }, []);

  const supportsFilters = FILTER_TABLES.includes(activeTable);

  // Fetch a page of rows for the selected table (server-side paginated + searched + filtered)
  const fetchRows = useCallback(async (
    table: string,
    pageNum: number,
    term: string,
    season: string,
    round: string,
  ) => {
    if (!table) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (term.trim()) params.set('search', term.trim());
      if (season) params.set('season', season);
      if (round) params.set('round', round);
      const res = await fetch(`${BACKEND_URL}/admin/${table}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (e) {
      setError(`Failed to load ${table}: ${errMsg(e)}`);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input so each keystroke doesn't hit the API
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to the first page whenever the table, search, or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTable, debouncedSearch, filterSeason, filterRound]);

  // (Re)load rows when table, page, search, or filters change
  useEffect(() => {
    if (activeTable) fetchRows(activeTable, page, debouncedSearch, filterSeason, filterRound);
  }, [activeTable, page, debouncedSearch, filterSeason, filterRound, fetchRows]);

  // Load distinct seasons for the active filterable table
  useEffect(() => {
    if (!supportsFilters) {
      setSeasons([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/${activeTable}/distinct/season`);
        const data = await res.json();
        setSeasons(Array.isArray(data) ? data.map(String) : []);
      } catch {
        setSeasons([]);
      }
    })();
  }, [activeTable, supportsFilters]);

  // Load distinct rounds, narrowed to the selected season when one is set
  useEffect(() => {
    if (!supportsFilters) {
      setRounds([]);
      return;
    }
    (async () => {
      try {
        const qs = filterSeason ? `?season=${encodeURIComponent(filterSeason)}` : '';
        const res = await fetch(`${BACKEND_URL}/admin/${activeTable}/distinct/round${qs}`);
        const data = await res.json();
        setRounds(Array.isArray(data) ? data.map(String) : []);
      } catch {
        setRounds([]);
      }
    })();
  }, [activeTable, filterSeason, supportsFilters]);

  const selectTable = (name: string) => {
    setSearch('');
    setDebouncedSearch('');
    setFilterSeason('');
    setFilterRound('');
    setActiveTable(name);
  };

  const reload = () => fetchRows(activeTable, page, debouncedSearch, filterSeason, filterRound);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Columns shown in the form (everything except server-managed/auto ones)
  const formColumns = useMemo(
    () => (meta ? meta.columns.filter((c) => !c.auto) : []),
    [meta]
  );

  const openCreate = () => {
    if (!meta) return;
    const blank: Record<string, string> = {};
    formColumns.forEach((c) => (blank[c.name] = ''));
    setForm(blank);
    setEditing({});
    setIsNew(true);
    setFormError(null);
  };

  const openEdit = (row: Row) => {
    if (!meta) return;
    const filled: Record<string, string> = {};
    formColumns.forEach((c) => (filled[c.name] = toInputString(row[c.name])));
    setForm(filled);
    setEditing(row);
    setIsNew(false);
    setFormError(null);
  };

  const closeModal = () => {
    setEditing(null);
    setForm({});
    setFormError(null);
  };

  // Build the JSON body from the form, omitting empty optional fields
  const buildPayload = () => {
    const payload: Record<string, unknown> = {};
    formColumns.forEach((c) => {
      const raw = form[c.name];
      if (raw === undefined) return;
      // On create, skip empty PK so the server auto-generates it
      if (isNew && c.isPk && raw.trim() === '') return;
      if (raw === '' && !c.required) {
        payload[c.name] = null;
        return;
      }
      payload[c.name] = raw;
    });
    return payload;
  };

  const handleSave = async () => {
    if (!meta) return;
    setSaving(true);
    setFormError(null);
    const payload = buildPayload();
    const pkValue = editing ? String(editing[meta.pk]) : '';
    const url = isNew
      ? `${BACKEND_URL}/admin/${meta.name}`
      : `${BACKEND_URL}/admin/${meta.name}/${encodeURIComponent(pkValue)}`;
    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      log(`${isNew ? 'Created' : 'Updated'} ${meta.name} record (${data[meta.pk] ?? pkValue})`);
      closeModal();
      reload();
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!meta) return;
    const pkValue = String(row[meta.pk]);
    if (!window.confirm(`Delete ${meta.name} record "${pkValue}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/${meta.name}/${encodeURIComponent(pkValue)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      log(`Deleted ${meta.name} record (${pkValue})`);
      // If we just deleted the last row on a page beyond the first, step back
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else reload();
    } catch (e) {
      setError(`Delete failed: ${errMsg(e)}`);
    }
  };

  const columns = meta?.columns ?? [];

  return (
    <section className="admin-panel db-table-panel crud-panel">
      {/* Table selector */}
      <div className="crud-table-tabs">
        {tables.map((t) => (
          <button
            key={t.name}
            className={`crud-table-tab ${t.name === activeTable ? 'active' : ''}`}
            onClick={() => selectTable(t.name)}
          >
            {labelize(t.name)}
          </button>
        ))}
      </div>

      <div className="table-controls">
        <input
          type="text"
          className="table-search-input"
          placeholder={`Search ${meta ? labelize(meta.name) : ''}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {supportsFilters && (
          <div className="crud-filters">
            <select
              className="crud-filter-select"
              value={filterSeason}
              onChange={(e) => {
                setFilterSeason(e.target.value);
                setFilterRound('');
              }}
            >
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="crud-filter-select"
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
            >
              <option value="">All rounds</option>
              {rounds.map((r) => (
                <option key={r} value={r}>Round {r}</option>
              ))}
            </select>
          </div>
        )}
        <div className="crud-controls-right">
          <span className="crud-row-count">{total} record{total === 1 ? '' : 's'}</span>
          <button className="admin-text-btn" onClick={reload}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="admin-primary-btn" onClick={openCreate} disabled={!meta}>
            + New Record
          </button>
        </div>
      </div>

      {error && <div className="crud-error-banner">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading {activeTable} records...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table crud-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.name}>
                    {labelize(c.name)}
                    {c.isPk && <span className="crud-pk-badge">PK</span>}
                  </th>
                ))}
                <th className="crud-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={String(row[meta!.pk])}>
                    {columns.map((c) => (
                      <td key={c.name} className={c.type === 'integer' ? 'right-cell font-mono' : ''}>
                        <span className="crud-cell-value" title={displayValue(row[c.name])}>
                          {displayValue(row[c.name])}
                        </span>
                      </td>
                    ))}
                    <td className="crud-actions-col">
                      <div className="crud-row-actions">
                        <button className="crud-icon-btn edit" onClick={() => openEdit(row)}>Edit</button>
                        <button className="crud-icon-btn delete" onClick={() => handleDelete(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-table-cell">
                    {debouncedSearch || filterSeason || filterRound
                      ? 'No records match the current filters.'
                      : 'No records in this table yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="crud-pagination">
          <button
            className="admin-text-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span className="crud-page-info">
            Page {page} of {totalPages}
            <span className="crud-page-range">
              {' · '}
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
          </span>
          <button
            className="admin-text-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {editing && meta && (
        <div className="crud-modal-overlay" onClick={closeModal}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h3>{isNew ? 'New' : 'Edit'} {labelize(meta.name)} record</h3>
              <button className="crud-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="crud-modal-body">
              {formColumns.map((c) => {
                const pkLocked = c.isPk && !isNew;
                return (
                  <label key={c.name} className="crud-field">
                    <span className="crud-field-label">
                      {labelize(c.name)}
                      {c.required && <em className="crud-req">*</em>}
                      <span className="crud-field-type">{c.type}{c.isPk ? ' · pk' : ''}</span>
                    </span>
                    <input
                      className="crud-field-input"
                      type={c.type === 'integer' ? 'number' : 'text'}
                      value={form[c.name] ?? ''}
                      disabled={pkLocked}
                      placeholder={
                        c.isPk && isNew
                          ? 'leave blank to auto-generate'
                          : c.type === 'text[]'
                          ? 'comma-separated values'
                          : ''
                      }
                      onChange={(e) => setForm((f) => ({ ...f, [c.name]: e.target.value }))}
                    />
                  </label>
                );
              })}
            </div>

            {formError && <div className="crud-error-banner crud-modal-error">{formError}</div>}

            <div className="crud-modal-foot">
              <button className="admin-text-btn" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : isNew ? 'Create Record' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CrudManager;
