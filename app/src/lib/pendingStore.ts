import type { KeyValueStorage } from '@/data/types';

/**
 * A small set of JSON records in secure storage: one key per record plus an
 * index of the keys, because secure storage cannot list what it holds. Used
 * for requests that must be repeatable with the same id after a timeout or a
 * cold start. Writes are queued so two records never race on the index.
 */
export function createPendingStore<T>(storage: KeyValueStorage, indexKey: string, prefix: string) {
  // Secure storage keys may hold letters, digits, ".", "-" and "_" only.
  const keyFor = (...parts: string[]) => `${prefix}.${parts.map((p) => p.replace(/[^A-Za-z0-9_-]/g, '_')).join('.')}`;

  const readIndex = async (): Promise<string[]> => {
    try {
      const raw = await storage.get(indexKey);
      const keys = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(keys) ? keys.filter((k): k is string => typeof k === 'string') : [];
    } catch {
      return [];
    }
  };
  const read = async (key: string): Promise<T | null> => {
    try {
      const raw = await storage.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  let queue: Promise<unknown> = Promise.resolve();
  const inTurn = <R,>(work: () => Promise<R>): Promise<R> => {
    const run = queue.then(work, work);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    keyFor,
    get: (key: string) => inTurn(() => read(key)),
    list: () =>
      inTurn(async () => {
        const records = await Promise.all((await readIndex()).map(read));
        return records.filter((r): r is Awaited<T> & {} => r != null);
      }),
    /** Create or change one record. `change` gets what is stored, or null. */
    put: (key: string, change: (current: T | null) => T) =>
      inTurn(async () => {
        const next = change(await read(key));
        await storage.set(key, JSON.stringify(next));
        const index = await readIndex();
        if (!index.includes(key)) await storage.set(indexKey, JSON.stringify([...index, key]));
        return next;
      }),
    remove: (key: string) =>
      inTurn(async () => {
        await storage.remove(key);
        const index = await readIndex();
        if (index.includes(key)) await storage.set(indexKey, JSON.stringify(index.filter((k) => k !== key)));
      }),
  };
}
