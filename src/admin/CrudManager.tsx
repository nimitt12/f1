/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { authFetch } from './adminAuth';
import Loader from '../components/Loader';

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

  // Spreadsheet UX state
  const [fullscreen, setFullscreen] = useState(false);
  const [editCell, setEditCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null); // `${rowId}::${col}`
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // When true, the next input blur is a programmatic move (Enter/Tab/Esc) and
  // should NOT trigger a save — we've already handled it.
  const skipBlurRef = useRef(false);
  const newRowFirstInput = useRef<HTMLInputElement | null>(null);

  // Table for which we've already applied the "default to latest season/round"
  // behaviour. Reset on every fresh table open so re-entering re-defaults, but
  // left alone afterwards so the user can switch to "All" without it snapping back.
  const autoFilterTableRef = useRef<string | null>(null);

  // Highest value in a list of numeric-ish strings (latest season / round)
  const latestOf = (list: string[]) =>
    list.slice().sort((a, b) => Number(b) - Number(a))[0];

  const log = useCallback((msg: string) => onLog?.(msg), [onLog]);

  const meta = useMemo(
    () => tables.find((t) => t.name === activeTable),
    [tables, activeTable]
  );

  // Load the table metadata once
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${BACKEND_URL}/admin/tables`);
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
      const res = await authFetch(`${BACKEND_URL}/admin/${table}?${params.toString()}`);
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
        const res = await authFetch(`${BACKEND_URL}/admin/${activeTable}/distinct/season`);
        const data = await res.json();
        const list = Array.isArray(data) ? data.map(String) : [];
        setSeasons(list);
        // On a fresh open of this table, default to the latest season. The round
        // default is applied once rounds load for it (see rounds effect below).
        if (autoFilterTableRef.current !== activeTable && list.length) {
          setFilterSeason(latestOf(list));
        }
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
        const res = await authFetch(`${BACKEND_URL}/admin/${activeTable}/distinct/round${qs}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data.map(String) : [];
        setRounds(list);
        // Finish the fresh-open default: once the (auto-selected latest) season's
        // rounds are in, default to the latest round and mark this table done so
        // later season/round changes are left to the user.
        if (autoFilterTableRef.current !== activeTable && filterSeason) {
          if (list.length) setFilterRound(latestOf(list));
          autoFilterTableRef.current = activeTable;
        }
      } catch {
        setRounds([]);
      }
    })();
  }, [activeTable, filterSeason, supportsFilters]);

  // Esc exits fullscreen (unless a cell is being edited)
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editCell) setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, editCell]);

  const selectTable = (name: string) => {
    setSearch('');
    setDebouncedSearch('');
    setFilterSeason('');
    setFilterRound('');
    autoFilterTableRef.current = null; // re-apply latest-season/round default on open
    setEditCell(null);
    setNewRow({});
    setActiveTable(name);
  };

  const reload = () => fetchRows(activeTable, page, debouncedSearch, filterSeason, filterRound);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = meta?.columns ?? [];
  const pk = meta?.pk ?? 'id';
  // Columns the user can edit inline on an existing row (PK is immutable, auto cols are server-managed)
  const editableCols = useMemo(() => columns.filter((c) => !c.auto && !c.isPk), [columns]);
  // Columns shown in the "new record" row (PK included — blank means auto-generate)
  const newRowCols = useMemo(() => columns.filter((c) => !c.auto), [columns]);

  // ---- Inline cell editing -------------------------------------------------

  const openCell = (rowId: string, col: string, value: string) => {
    setEditCell({ rowId, col });
    setEditValue(value);
  };

  const commitCell = async (rowId: string, col: string, rawValue: string) => {
    if (!meta) return;
    const row = rows.find((r) => String(r[meta.pk]) === rowId);
    if (!row) return;
    const colMeta = columns.find((c) => c.name === col);
    if (rawValue === toInputString(row[col])) return; // unchanged -> no request

    const payloadVal = rawValue === '' && !colMeta?.required ? null : rawValue;
    const key = `${rowId}::${col}`;
    setSavingKey(key);
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/${meta.name}/${encodeURIComponent(rowId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [col]: payloadVal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Merge the server's row back so derived columns (updated_at) refresh too
      setRows((rs) => rs.map((r) => (String(r[meta.pk]) === rowId ? { ...r, ...data } : r)));
      log(`Updated ${meta.name} (${rowId}) · ${col}`);
    } catch (e) {
      setError(`Update failed: ${errMsg(e)}`);
      reload(); // re-sync from server on failure
    } finally {
      setSavingKey(null);
    }
  };

  const moveTo = (rowIdx: number, colIdx: number) => {
    const targetRow = rows[rowIdx];
    const targetCol = editableCols[colIdx];
    if (!targetRow || !targetCol) {
      setEditCell(null);
      return;
    }
    openCell(String(targetRow[pk]), targetCol.name, toInputString(targetRow[targetCol.name]));
  };

  const onCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: string, col: string) => {
    const rowIdx = rows.findIndex((r) => String(r[pk]) === rowId);
    const colIdx = editableCols.findIndex((c) => c.name === col);

    if (e.key === 'Enter') {
      e.preventDefault();
      skipBlurRef.current = true;
      commitCell(rowId, col, editValue);
      moveTo(rowIdx + 1, colIdx); // down
    } else if (e.key === 'Tab') {
      e.preventDefault();
      skipBlurRef.current = true;
      commitCell(rowId, col, editValue);
      if (e.shiftKey) {
        if (colIdx > 0) moveTo(rowIdx, colIdx - 1);
        else moveTo(rowIdx - 1, editableCols.length - 1);
      } else {
        if (colIdx < editableCols.length - 1) moveTo(rowIdx, colIdx + 1);
        else moveTo(rowIdx + 1, 0);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      skipBlurRef.current = true;
      setEditCell(null);
    }
  };

  const onCellBlur = (rowId: string, col: string) => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    commitCell(rowId, col, editValue);
    setEditCell(null);
  };

  // ---- New record row ------------------------------------------------------

  const createRecord = async () => {
    if (!meta) return;
    // Nothing typed yet
    const hasInput = newRowCols.some((c) => (newRow[c.name] ?? '').trim() !== '');
    if (!hasInput) return;

    const payload: Record<string, unknown> = {};
    newRowCols.forEach((c) => {
      const raw = (newRow[c.name] ?? '').trim();
      if (c.isPk && raw === '') return; // auto-generate
      if (raw === '' && !c.required) {
        payload[c.name] = null;
        return;
      }
      if (raw === '') return;
      payload[c.name] = raw;
    });

    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/${meta.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      log(`Created ${meta.name} record (${data[meta.pk] ?? ''})`);
      setNewRow({});
      reload();
      newRowFirstInput.current?.focus();
    } catch (e) {
      setError(`Create failed: ${errMsg(e)}`);
    } finally {
      setCreating(false);
    }
  };

  const onNewRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createRecord();
    }
  };

  const focusNewRow = () => {
    newRowFirstInput.current?.focus();
    newRowFirstInput.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const handleDelete = async (row: Row) => {
    if (!meta) return;
    const pkValue = String(row[meta.pk]);
    if (!window.confirm(`Delete ${meta.name} record "${pkValue}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/${meta.name}/${encodeURIComponent(pkValue)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      log(`Deleted ${meta.name} record (${pkValue})`);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else reload();
    } catch (e) {
      setError(`Delete failed: ${errMsg(e)}`);
    }
  };

  // ---- Render --------------------------------------------------------------

  const renderEditableCell = (row: Row, c: ColumnMeta) => {
    const rowId = String(row[pk]);
    const isEditing = editCell?.rowId === rowId && editCell?.col === c.name;
    const isSaving = savingKey === `${rowId}::${c.name}`;
    const numeric = c.type === 'integer';
    const cls = numeric ? 'crud-grid-cell right-cell font-mono' : 'crud-grid-cell';

    if (isEditing) {
      return (
        <td key={c.name} className={`${cls} editing`}>
          <input
            autoFocus
            className="crud-cell-input"
            type={numeric ? 'number' : 'text'}
            value={editValue}
            placeholder={c.type === 'text[]' ? 'comma-separated' : ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => onCellKeyDown(e, rowId, c.name)}
            onBlur={() => onCellBlur(rowId, c.name)}
          />
        </td>
      );
    }

    return (
      <td
        key={c.name}
        className={`${cls} editable ${isSaving ? 'saving' : ''}`}
        onClick={() => openCell(rowId, c.name, toInputString(row[c.name]))}
        title="Click to edit"
      >
        <span className="crud-cell-value">{displayValue(row[c.name])}</span>
      </td>
    );
  };

  const panelClass =
    'admin-panel db-table-panel crud-panel' + (fullscreen ? ' crud-fullscreen' : '');

  return (
    <section className={panelClass}>
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
          <button className="admin-text-btn" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? '✕ Exit' : '⤢ Fullscreen'}
          </button>
          <button className="admin-primary-btn" onClick={focusNewRow} disabled={!meta}>
            + New Record
          </button>
        </div>
      </div>

      {error && <div className="crud-error-banner">{error}</div>}

      {loading ? (
        <Loader label={`Loading ${activeTable} records`} accent="#e0c47d" />
      ) : (
        <div className="table-wrapper crud-grid-wrapper">
          <table className="admin-table crud-table crud-grid">
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
              {rows.map((row) => (
                <tr key={String(row[pk])}>
                  {columns.map((c) =>
                    c.auto || c.isPk ? (
                      <td
                        key={c.name}
                        className={`crud-grid-cell readonly ${c.type === 'integer' ? 'right-cell font-mono' : ''}`}
                        title={c.isPk ? 'Primary key (read-only)' : 'Auto-managed (read-only)'}
                      >
                        <span className="crud-cell-value">{displayValue(row[c.name])}</span>
                      </td>
                    ) : (
                      renderEditableCell(row, c)
                    )
                  )}
                  <td className="crud-actions-col">
                    <div className="crud-row-actions">
                      <button className="crud-icon-btn delete" onClick={() => handleDelete(row)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-table-cell">
                    {debouncedSearch || filterSeason || filterRound
                      ? 'No records match the current filters.'
                      : 'No records yet — add one in the row below.'}
                  </td>
                </tr>
              )}

              {/* Spreadsheet-style "new record" row */}
              {meta && (
                <tr className="crud-new-row">
                  {columns.map((c) => {
                    if (c.auto) {
                      return (
                        <td key={c.name} className="crud-grid-cell readonly">
                          <span className="crud-new-auto">auto</span>
                        </td>
                      );
                    }
                    const isFirst = c.name === newRowCols[0]?.name;
                    return (
                      <td key={c.name} className={`crud-grid-cell ${c.type === 'integer' ? 'right-cell' : ''}`}>
                        <input
                          ref={isFirst ? newRowFirstInput : undefined}
                          className="crud-cell-input new"
                          type={c.type === 'integer' ? 'number' : 'text'}
                          value={newRow[c.name] ?? ''}
                          placeholder={
                            c.isPk ? 'auto' : c.required ? `${labelize(c.name)} *` : labelize(c.name)
                          }
                          onChange={(e) => setNewRow((r) => ({ ...r, [c.name]: e.target.value }))}
                          onKeyDown={onNewRowKeyDown}
                        />
                      </td>
                    );
                  })}
                  <td className="crud-actions-col">
                    <button
                      className="crud-icon-btn add"
                      onClick={createRecord}
                      disabled={creating}
                      title="Add record (or press Enter)"
                    >
                      {creating ? '…' : '+ Add'}
                    </button>
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
    </section>
  );
};

export default CrudManager;
