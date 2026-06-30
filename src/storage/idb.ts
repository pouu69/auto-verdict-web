/**
 * Minimal promise-based IndexedDB helper (no external dependency).
 * One database `autoverdict` with two object stores keyed by `carId`,
 * mirroring the Android Room database (`saved_cars`, `cache`).
 */

const DB_NAME = 'autoverdict';
const DB_VERSION = 1;

export const STORE_SAVED = 'saved_cars';
export const STORE_CACHE = 'cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SAVED)) {
        db.createObjectStore(STORE_SAVED, { keyPath: 'carId' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'carId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const objectStore = tx.objectStore(store);
    let result: T;
    Promise.resolve(fn(objectStore))
      .then((r) => {
        // r may be an IDBRequest result already resolved or a direct value
        result = r as T;
      })
      .catch(reject);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export const idb = {
  async getAll<T>(store: string): Promise<T[]> {
    const db = await openDb();
    const tx = db.transaction(store, 'readonly');
    return promisify<T[]>(tx.objectStore(store).getAll() as IDBRequest<T[]>);
  },

  async get<T>(store: string, key: string): Promise<T | undefined> {
    const db = await openDb();
    const tx = db.transaction(store, 'readonly');
    return promisify<T | undefined>(tx.objectStore(store).get(key) as IDBRequest<T | undefined>);
  },

  async put<T>(store: string, value: T): Promise<void> {
    await withStore<IDBValidKey>(store, 'readwrite', (s) => s.put(value as unknown as object));
  },

  async delete(store: string, key: string): Promise<void> {
    await withStore<undefined>(store, 'readwrite', (s) => s.delete(key));
  },

  async clear(store: string): Promise<void> {
    await withStore<undefined>(store, 'readwrite', (s) => s.clear());
  },

  async count(store: string): Promise<number> {
    const db = await openDb();
    const tx = db.transaction(store, 'readonly');
    return promisify<number>(tx.objectStore(store).count());
  },
};
