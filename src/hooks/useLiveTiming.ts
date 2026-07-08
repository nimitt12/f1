/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

/** Relay connection status reported by the backend. */
export type LiveStatus = 'idle' | 'connecting' | 'connected' | 'error';

/** Transport state of an archived-session replay, when one is running. */
export interface ReplayState {
  path: string;
  name: string;
  speed: number;
  paused: boolean;
  loading: boolean;
  offsetMs: number;
  durationMs: number;
}

export interface LiveTimingState {
  /** Latest merged value per feed topic (TimingData, DriverList, ...). */
  topics: Record<string, any>;
  /** Upstream (backend → F1) connection status. */
  status: LiveStatus;
  /** Browser → backend SSE connection health. */
  streamOpen: boolean;
  /** True when the backend is replaying the demo simulator. */
  simulated: boolean;
  /** Archived-session replay in progress, or null for live/demo. */
  replay: ReplayState | null;
}

/**
 * Merge an F1 feed delta into the current value — mirrors the backend's
 * semantics exactly: objects merge key-by-key recursively, everything else
 * replaces, and array patches arrive as objects keyed by stringified index.
 */
const deepMerge = (base: any, patch: any): any => {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  if (Array.isArray(base)) {
    const next = base.slice();
    for (const [key, value] of Object.entries(patch)) {
      const idx = Number(key);
      if (Number.isInteger(idx)) next[idx] = deepMerge(next[idx], value);
    }
    return next;
  }
  const target: Record<string, any> = base && typeof base === 'object' ? { ...base } : {};
  for (const [key, value] of Object.entries(patch)) {
    target[key] = deepMerge(target[key], value);
  }
  return target;
};

interface QueuedUpdate {
  receivedAt: number;
  topic: string;
  data: any;
}

/**
 * Subscribes to the backend's live timing SSE stream and exposes the merged
 * session state. Supports an optional broadcast-sync delay: updates are
 * buffered client-side and applied `delayMs` after arrival so the timing
 * screen can be lined up with a TV feed.
 */
export const useLiveTiming = (delayMs: number) => {
  const [state, setState] = useState<LiveTimingState>({
    topics: {},
    status: 'idle',
    streamOpen: false,
    simulated: false,
    replay: null,
  });

  const topicsRef = useRef<Record<string, any>>({});
  const queueRef = useRef<QueuedUpdate[]>([]);
  const delayRef = useRef(delayMs);

  useEffect(() => {
    delayRef.current = delayMs;
  }, [delayMs]);

  useEffect(() => {
    const source = new EventSource(`${BACKEND_URL}/live/stream`);
    let closed = false;

    source.onopen = () => setState((s) => ({ ...s, streamOpen: true }));
    source.onerror = () => setState((s) => ({ ...s, streamOpen: false }));

    source.addEventListener('snapshot', (e) => {
      const snap = JSON.parse((e as MessageEvent).data);
      queueRef.current = [];
      topicsRef.current = snap.topics || {};
      setState({
        topics: topicsRef.current,
        status: snap.status,
        streamOpen: true,
        simulated: !!snap.simulated,
        replay: snap.replay || null,
      });
    });

    // Replay transport progress — applied immediately (never delay-buffered)
    // so the scrubber tracks the backend clock.
    source.addEventListener('replay', (e) => {
      const progress = JSON.parse((e as MessageEvent).data);
      setState((s) => ({ ...s, replay: progress || null }));
    });

    source.addEventListener('update', (e) => {
      const { topic, data } = JSON.parse((e as MessageEvent).data);
      queueRef.current.push({ receivedAt: Date.now(), topic, data });
    });

    source.addEventListener('status', (e) => {
      const { status, simulated } = JSON.parse((e as MessageEvent).data);
      setState((s) => ({ ...s, status, simulated: !!simulated }));
    });

    // Drain the buffer 5x/sec, applying every update older than the delay.
    // Compressed topics (CarData/Position) are full snapshots, not deltas.
    const flush = setInterval(() => {
      if (closed) return;
      const due = Date.now() - delayRef.current;
      let applied = false;
      while (queueRef.current.length > 0 && queueRef.current[0].receivedAt <= due) {
        const { topic, data } = queueRef.current.shift()!;
        topicsRef.current = {
          ...topicsRef.current,
          [topic]:
            topic === 'CarData' || topic === 'Position'
              ? data
              : deepMerge(topicsRef.current[topic], data),
        };
        applied = true;
      }
      if (applied) setState((s) => ({ ...s, topics: topicsRef.current }));
    }, 200);

    return () => {
      closed = true;
      clearInterval(flush);
      source.close();
    };
  }, []);

  const setSimulation = useCallback(async (on: boolean) => {
    try {
      await fetch(`${BACKEND_URL}/live/simulate/${on ? 'start' : 'stop'}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to toggle live timing simulation:', err);
    }
  }, []);

  const startReplay = useCallback(async (path: string, name: string, speed = 1) => {
    const res = await fetch(`${BACKEND_URL}/live/replay/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name, speed }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Replay failed to start');
  }, []);

  return { ...state, setSimulation, startReplay };
};

/** Fire a replay transport action (stop/pause/resume/speed/seek). */
export const replayControl = async (
  action: 'stop' | 'pause' | 'resume' | 'speed' | 'seek',
  body?: Record<string, unknown>,
): Promise<void> => {
  try {
    await fetch(`${BACKEND_URL}/live/replay/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error(`Replay ${action} failed:`, err);
  }
};

/** Fetch a season's archived meetings/sessions from the backend proxy. */
export const fetchArchiveIndex = async (year: number): Promise<any> => {
  const res = await fetch(`${BACKEND_URL}/live/archive/${year}`);
  if (!res.ok) throw new Error(`No archive available for ${year}`);
  return res.json();
};
