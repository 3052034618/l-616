interface StorageValue<P> {
  state: P;
  version: number;
}

type Serializer<T> = (state: T) => string;
type Deserializer<T> = (str: string) => T;

function defaultSerialize<T>(state: T): string {
  return JSON.stringify(state, (_, value) => {
    if (value instanceof Date) {
      return { __type__: 'Date', value: value.toISOString() };
    }
    return value;
  });
}

function defaultDeserialize<T>(str: string): T {
  return JSON.parse(str, (_, value) => {
    if (value && typeof value === 'object' && value.__type__ === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
}

export interface PersistOptions<T, P extends Partial<T>> {
  name: string;
  partialize?: (state: T) => P;
  serialize?: Serializer<StorageValue<P>>;
  deserialize?: Deserializer<StorageValue<P>>;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => P;
}

const STORAGE_PREFIX = 'inno-mgmt:';

export function persist<T, P extends Partial<T> = Partial<T>>(
  config: (set: any, get: any, api: any) => T,
  options: PersistOptions<T, P>
) {
  const {
    name,
    partialize = (state) => state as unknown as P,
    serialize = defaultSerialize as Serializer<StorageValue<P>>,
    deserialize = defaultDeserialize as Deserializer<StorageValue<P>>,
    version = 0,
    migrate,
  } = options;

  const storageKey = STORAGE_PREFIX + name;

  return (set: any, get: any, api: any) => {
    const hydratedState = config(
      (...args: any[]) => {
        set(...args);
        try {
          const state = get();
          const partialState = partialize(state);
          const storageValue: StorageValue<P> = {
            state: partialState,
            version,
          };
          localStorage.setItem(storageKey, serialize(storageValue));
        } catch (e) {
          console.warn(`[persist] Failed to save state for ${name}:`, e);
        }
      },
      get,
      api
    );

    try {
      const storageValue = localStorage.getItem(storageKey);
      if (storageValue) {
        const parsed = deserialize(storageValue);
        if (parsed && typeof parsed === 'object') {
          let persistedState = parsed.state;
          const persistedVersion = parsed.version ?? 0;

          if (persistedVersion !== version && migrate) {
            persistedState = migrate(persistedState, persistedVersion);
          }

          if (persistedState && typeof persistedState === 'object') {
            const hasNonEmptyData = Object.values(persistedState).some((val) => {
              if (Array.isArray(val)) return val.length > 0;
              if (val === null || val === undefined) return false;
              if (typeof val === 'object') return Object.keys(val as object).length > 0;
              return true;
            });

            if (hasNonEmptyData) {
              Object.assign(hydratedState, persistedState);
            } else {
              console.log(`[persist] Skipping empty state for ${name}, using mock data`);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[persist] Failed to restore state for ${name}:`, e);
    }

    return hydratedState;
  };
}

export function clearPersistedState(name: string): void {
  localStorage.removeItem(STORAGE_PREFIX + name);
}

export function clearAllPersistedState(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

export function hasPersistedState(name: string): boolean {
  return localStorage.getItem(STORAGE_PREFIX + name) !== null;
}
