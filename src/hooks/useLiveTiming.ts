import { deepMerge, LiveQueue, parseLiveMessage, safeKey, validateLiveValue } from '../lib/liveData';
import { authFetch } from '../lib/auth';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
  /** Recording offset the session actually starts at — the transport bar is
   *  anchored here so it represents the session, not the raw recording. */
  startOffsetMs?: number;
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
  const queueRef = useRef(new LiveQueue());
  const delayRef = useRef(delayMs);

  useEffect(() => {
    delayRef.current = Number.isFinite(delayMs) ? Math.max(0, Math.min(delayMs, 300_000)) : 0;
  }, [delayMs]);

  useEffect(() => {
    const queue = queueRef.current;
    let source = new EventSource(`${BACKEND_URL}/live/stream`);
    let closed = false;

    let retry: ReturnType<typeof setTimeout> | undefined;
    // On overflow/malformed data, discard deltas and reconnect for a full snapshot.
    const recover = () => {
      source.close();
      queue.clear();
      topicsRef.current = {};
      setState(s => ({ ...s, topics: {}, status: 'error', streamOpen: false }));
      if (!closed && !retry) retry = setTimeout(() => {
        retry = undefined;
        if (!closed) {
          source = new EventSource(`${BACKEND_URL}/live/stream`);
          attach();
        }
      }, 5000);
    };
    const listen = (name: string, handler: (data: any, bytes: number) => void) => {
      source.addEventListener(name, event => {
        if (closed) return;
        try {
          const text = (event as MessageEvent).data;
          handler(parseLiveMessage(text), text.length * 2);
        } catch { recover(); }
      });
    };
    const validStatus = (status: unknown): status is LiveStatus =>
      ['idle', 'connecting', 'connected', 'error'].includes(String(status));
    const checkReplay = (replay: any) => {
      if (replay == null) return;
      if (typeof replay.path !== 'string' || typeof replay.name !== 'string' ||
          !['speed', 'offsetMs', 'durationMs'].every(key => Number.isFinite(replay[key]) && replay[key] >= 0)) {
        throw new Error('Invalid replay state');
      }
    };
    const attach = () => {
      source.onopen = () => setState((s) => ({ ...s, streamOpen: true }));
      source.onerror = () => setState((s) => ({ ...s, streamOpen: false }));

      listen('snapshot', (snap) => {
        if (!snap || !validStatus(snap.status) || !snap.topics || typeof snap.topics !== 'object' || Array.isArray(snap.topics) || Object.keys(snap.topics).length > 128) throw new Error('Invalid snapshot');
        checkReplay(snap.replay);
        queue.clear();
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
      listen('replay', (progress) => {
        checkReplay(progress);
        setState((s) => ({ ...s, replay: progress || null }));
      });

      listen('update', ({ topic, data }, bytes) => {
        if (typeof topic !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(topic) || !safeKey(topic)) throw new Error('Invalid topic');
        queue.push({ receivedAt: Date.now(), topic, data, bytes });
      });

      listen('status', ({ status, simulated }) => {
        if (!validStatus(status)) throw new Error('Invalid status');
        setState((s) => ({ ...s, status, simulated: !!simulated }));
      });

    };
    attach();

    // Drain the buffer 5x/sec, applying every update older than the delay.
    // Compressed topics (CarData/Position) are full snapshots, not deltas.
    const flush = setInterval(() => {
      if (closed) return;
      const due = Date.now() - delayRef.current;
      let applied = false;
      try {
        for (const { topic, data } of queue.drain(due)) {
          if (!Object.hasOwn(topicsRef.current, topic) && Object.keys(topicsRef.current).length >= 128) throw new Error('Too many topics');
          topicsRef.current = {
            ...topicsRef.current,
            [topic]:
              topic === 'CarData' || topic === 'Position'
                ? data
                : deepMerge(topicsRef.current[topic], data),
          };
          applied = true;
        }
        if (applied) {
          validateLiveValue(topicsRef.current);
          setState((s) => ({ ...s, topics: topicsRef.current }));
        }
      } catch { recover(); }
    }, 200);

    return () => {
      closed = true;
      clearInterval(flush);
      clearTimeout(retry);
      queue.clear();
      source.close();
    };
  }, []);

  const setSimulation = useCallback(async (on: boolean) => {
    try {
      await authFetch(`${BACKEND_URL}/live/simulate/${on ? 'start' : 'stop'}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to toggle live timing simulation:', err);
    }
  }, []);

  const startReplay = useCallback(async (path: string, name: string, speed = 1) => {
    const res = await authFetch(`${BACKEND_URL}/live/replay/start`, {
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
    await authFetch(`${BACKEND_URL}/live/replay/${action}`, {
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
