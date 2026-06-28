/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from './adminAuth';
import { generateTriviaFacts } from '../lib/trivia';
import Loader from '../components/Loader';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

interface TriviaRow {
  id: string;
  body: string;
  sort_order: number | null;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Dedicated editor for the homepage ticker trivia lines. Talks to the generic
 * admin CRUD endpoints for the whitelisted `trivia` table, and can pull
 * auto-generated suggestions from recent race activity.
 */
const TriviaManager: React.FC<{ onLog?: (msg: string) => void }> = ({ onLog }) => {
  const [rows, setRows] = useState<TriviaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const log = (msg: string) => onLog?.(msg);

  const fetchTrivia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/trivia?limit=500`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const payload = await res.json();
      const data: TriviaRow[] = (payload.data || []).slice().sort(
        (a: TriviaRow, b: TriviaRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      setRows(data);
    } catch (e) {
      setError(errMsg(e));
      log(`Trivia: failed to load — ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrivia();
  }, []);

  // Local edits to a row's body before saving.
  const setRowBody = (id: string, body: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, body } : r)));

  const saveRow = async (row: TriviaRow) => {
    setSavingId(row.id);
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/trivia/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: row.body, sort_order: row.sort_order ?? 0 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      log(`Trivia: saved line ${row.id}`);
    } catch (e) {
      setError(errMsg(e));
      log(`Trivia: save failed — ${errMsg(e)}`);
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm('Delete this trivia line?')) return;
    setSavingId(id);
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/trivia/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Delete failed (${res.status})`);
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      log(`Trivia: deleted line ${id}`);
    } catch (e) {
      setError(errMsg(e));
      log(`Trivia: delete failed — ${errMsg(e)}`);
    } finally {
      setSavingId(null);
    }
  };

  const createLine = async (body: string) => {
    const text = body.trim();
    if (!text) return;
    setCreating(true);
    try {
      const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order ?? 0), -1) + 1;
      const res = await authFetch(`${BACKEND_URL}/admin/trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, sort_order: nextOrder }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Create failed (${res.status})`);
      }
      const created: TriviaRow = await res.json();
      setRows((prev) => [...prev, created]);
      setNewBody('');
      log(`Trivia: added new line`);
    } catch (e) {
      setError(errMsg(e));
      log(`Trivia: create failed — ${errMsg(e)}`);
    } finally {
      setCreating(false);
    }
  };

  // Move a line up/down by swapping sort_order with its neighbour, persisting both.
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[index];
    const b = rows[target];
    const aOrder = a.sort_order ?? index;
    const bOrder = b.sort_order ?? target;
    const reordered = [...rows];
    reordered[index] = { ...b, sort_order: aOrder };
    reordered[target] = { ...a, sort_order: bOrder };
    reordered.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
    setRows(reordered);
    await Promise.all([
      saveRow({ ...a, sort_order: bOrder }),
      saveRow({ ...b, sort_order: aOrder }),
    ]);
  };

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const existing = new Set(rows.map((r) => r.body.trim().toUpperCase()));
      const facts = await generateTriviaFacts();
      setSuggestions(facts.filter((f) => !existing.has(f.trim().toUpperCase())));
      log(`Trivia: generated ${facts.length} suggestions from recent activity`);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <section className="admin-panel db-table-panel">
      <div className="admin-panel-head">
        <div>
          <p className="admin-kicker">Homepage Ticker</p>
          <h3>Trivia Lines</h3>
        </div>
        <button className="admin-primary-btn" onClick={fetchTrivia} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <p className="panel-p-desc" style={{ margin: '0 0 16px' }}>
        These short lines scroll across the homepage ticker, in order. Leave the list empty
        to fall back to auto-generated facts from the latest race and standings.
      </p>

      {error && (
        <div className="trivia-error" style={{ color: '#ff6b6b', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Add new line */}
      <div className="trivia-add-row" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          className="table-search-input"
          style={{ flex: 1 }}
          placeholder="Write a new trivia line…"
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createLine(newBody);
          }}
        />
        <button
          className="admin-primary-btn"
          disabled={creating || !newBody.trim()}
          onClick={() => createLine(newBody)}
        >
          {creating ? 'Adding…' : 'Add Line'}
        </button>
      </div>

      {loading ? (
        <Loader label="Loading trivia lines" accent="#e0c47d" />
      ) : rows.length === 0 ? (
        <p className="empty-table-cell" style={{ padding: '20px 0' }}>
          No trivia set. The ticker is showing auto-generated facts. Add a line above or pull
          suggestions below.
        </p>
      ) : (
        <div className="trivia-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="trivia-item"
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <span style={{ opacity: 0.5, fontFamily: 'monospace', minWidth: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button className="admin-text-btn" disabled={i === 0} onClick={() => move(i, -1)}>
                  ▲
                </button>
                <button
                  className="admin-text-btn"
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ▼
                </button>
              </div>
              <input
                type="text"
                className="table-search-input"
                style={{ flex: 1 }}
                value={row.body}
                onChange={(e) => setRowBody(row.id, e.target.value)}
              />
              <button
                className="admin-primary-btn"
                disabled={savingId === row.id}
                onClick={() => saveRow(row)}
              >
                {savingId === row.id ? '…' : 'Save'}
              </button>
              <button
                className="admin-text-btn"
                disabled={savingId === row.id}
                onClick={() => deleteRow(row.id)}
                style={{ color: '#ff6b6b' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions from recent activity */}
      <div className="trivia-suggestions" style={{ marginTop: 28 }}>
        <div className="admin-panel-head">
          <div>
            <p className="admin-kicker">Auto-generated</p>
            <h3>Suggestions from recent activity</h3>
          </div>
          <button
            className="admin-primary-btn"
            onClick={loadSuggestions}
            disabled={loadingSuggestions}
          >
            {loadingSuggestions ? 'Generating…' : 'Generate Suggestions'}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(224,196,125,0.06)',
                  border: '1px solid rgba(224,196,125,0.18)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                <span style={{ flex: 1 }}>{s}</span>
                <button className="admin-text-btn" onClick={() => createLine(s)}>
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TriviaManager;
