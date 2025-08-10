// src/app/features/amiibos/amiibos.store.ts
import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { Amiibo } from '../../app-models';

type AmiiboState = {
  amiibos: Amiibo[];
  query: string;
  series: string;
  updatedAt?: number | null; // timestamp du dernier refresh
};

const initialState: AmiiboState = {
  amiibos: [],
  query: '',
  series: '',
  updatedAt: null,
};

const STORAGE_KEY = 'amiibros:v1';

function sortByName(data: Amiibo[]): Amiibo[] {
  return [...data].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

export const AmiiboStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ amiibos, query, series }) => ({
    seriesOptions: computed(() => {
      const set = new Set(
        amiibos()
          .map((a) => a.series)
          .filter(Boolean)
      );
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }),
    filtered: computed(() => {
      const q = query().toLowerCase();
      const s = series().toLowerCase();
      return amiibos().filter(
        (a) =>
          (a.name.toLowerCase().includes(q) ||
            a.series.toLowerCase().includes(q)) &&
          a.series.toLowerCase().includes(s)
      );
    }),
  })),

  withMethods((store) => {
    const http = inject(HttpClient);

    const persist = (data: Amiibo[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      patchState(store, { updatedAt: Date.now() });
    };

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Amiibo[];
        patchState(store, { amiibos: sortByName(parsed) });
      } catch {
        /* ignore */
      }
    };

    const fetchFromNetwork = () => http.get<Amiibo[]>('amiibros.json');

    const replaceIfChanged = (incoming: Amiibo[]) => {
      const current = store.amiibos();
      const next = sortByName(incoming);

      // remplace uniquement si différent
      if (JSON.stringify(current) !== JSON.stringify(next)) {
        patchState(store, { amiibos: next });
        persist(next);
      }
    };

    return {
      bootstrap() {
        loadFromStorage();
        fetchFromNetwork().subscribe({
          next: replaceIfChanged,
          error: () => {},
        });
      },

      setQuery(value: string) {
        patchState(store, { query: value });
      },
      setSeries(value: string) {
        patchState(store, { series: value });
      },

      refresh() {
        fetchFromNetwork().subscribe({
          next: replaceIfChanged,
          error: () => {
            /* noop */
          },
        });
      },
    };
  }),

  // Auto-load au démarrage
  withHooks((store) => ({
    onInit() {
      store.bootstrap();
    },
  }))
);
