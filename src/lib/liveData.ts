/* eslint-disable @typescript-eslint/no-explicit-any */
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
export const safeKey = (key: string) => !forbidden.has(key);

export const parseLiveMessage = (text: string): any => {
  if (text.length > 8_000_000) throw new Error('Live message too large');
  const value = JSON.parse(text);
  validateLiveValue(value);
  return value;
};

// Apply the same budget after merging: individually small deltas can otherwise
// grow the retained session indefinitely.
export const validateLiveValue = (value: any): void => {
  let nodes = 0;
  let characters = 0;
  const check = (item: any, depth: number) => {
    if (++nodes > 200_000 || depth > 32) throw new Error('Live message too complex');
    if (typeof item === 'string') characters += item.length;
    if (characters > 8_000_000) throw new Error('Live state too large');
    if (item && typeof item === 'object') {
      for (const [key, child] of Object.entries(item)) {
        if (!safeKey(key)) throw new Error('Unsafe live data key');
        characters += key.length;
        check(child, depth + 1);
      }
    }
  };
  check(value, 0);
};

export const deepMerge = (base: any, patch: any, depth = 0): any => {
  if (depth > 32) throw new Error('Live delta too deep');
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  if (Array.isArray(base)) {
    const next = base.slice();
    for (const [key, value] of Object.entries(patch)) {
      if (!/^(0|[1-9]\d*)$/.test(key)) continue;
      const index = Number(key);
      if (index < 100_000) next[index] = deepMerge(next[index], value, depth + 1);
    }
    return next;
  }
  const target = base && typeof base === 'object' ? { ...base } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (!safeKey(key)) continue;
    target[key] = deepMerge(Object.hasOwn(target, key) ? target[key] : undefined, value, depth + 1);
  }
  return target;
};

interface QueuedUpdate {
  receivedAt: number;
  topic: string;
  data: any;
  bytes: number;
}

export class LiveQueue {
  private updates: QueuedUpdate[] = [];
  private bytes = 0;

  push(update: QueuedUpdate) {
    if (this.updates.length >= 10_000 || this.bytes + update.bytes > 16_000_000) {
      throw new Error('Live buffer full; reconnect for a fresh snapshot');
    }
    this.updates.push(update);
    this.bytes += update.bytes;
  }

  drain(due: number): QueuedUpdate[] {
    let count = 0;
    while (count < this.updates.length && this.updates[count].receivedAt <= due) count++;
    const ready = this.updates.splice(0, count);
    for (const update of ready) this.bytes -= update.bytes;
    return ready;
  }

  clear() {
    this.updates = [];
    this.bytes = 0;
  }
}
