import { Component, HostBinding, effect, inject, signal } from '@angular/core';
import { AmiiboStore } from './amiibos.store';

const THEME_KEY = 'amiibros:theme';

@Component({
  selector: 'app-amiibos',
  templateUrl: './amiibos.html',
  styles: [
    `
      /* Thème local au composant */
      :host {
        display: block;
        color-scheme: light dark;

        /* Clair par défaut */
        --bg: #ffffff;
        --text: #0b1020;
        --muted: #374151;
        --surface: #ffffff;
        --border: #e5e7eb;
        --accent: #8b5cf6;

        background: var(--bg);
        color: var(--text);
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --bg: #0b1020;
          --text: #e5e7eb;
          --muted: #9ca3af;
          --surface: #111827;
          --border: #27324a;
        }
      }

      .page {
        padding: 1rem;
      }

      .page h1 {
        font-size: clamp(1.2rem, 2.5vw, 1.8rem);
        margin: 0 0 0.75rem;
      }

      .toolbar {
        display: grid;
        gap: 0.75rem;
        align-items: center;
        grid-template-columns: 1fr max-content; /* mobile */
        grid-template-areas:
          'search refresh'
          'series series';
      }
      .search {
        grid-area: search;
      }
      .series {
        grid-area: series;
      }
      .refresh {
        grid-area: refresh;
      }

      @media (min-width: 640px) {
        .toolbar {
          grid-template-columns: 2fr 1fr max-content;
          grid-template-areas: 'search series refresh';
        }
      }
      @media (min-width: 1024px) {
        .toolbar {
          grid-template-columns: 3fr 1fr max-content;
        }
      }

      .control,
      .btn {
        width: 100%;
        min-height: 44px;
        padding: 0.65rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
        color: var(--text);
        font: inherit;
      }
      .control::placeholder {
        color: var(--muted);
        opacity: 0.9;
      }
      .btn {
        cursor: pointer;
        white-space: nowrap;
      }
      .btn:hover {
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
      }
      .btn:active {
        transform: translateY(1px);
      }
      .btn:focus-visible,
      .control:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .grid {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      }
      @media (min-width: 480px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }
      }
      @media (min-width: 768px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.5rem;
      }
      .card img {
        width: 100%;
        border-radius: 8px;
        display: block;
      }
      .card h2 {
        font-size: clamp(0.95rem, 1.2vw, 1.05rem);
        margin: 0.45rem 0 0.15rem;
      }
      .card p {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .toast {
        position: fixed;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
        padding: 0.6rem 0.9rem;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: end;
      }
      .btn.toggle {
        width: auto;
        padding: 0.55rem 0.7rem;
        line-height: 1;
      }

      :host[data-theme='light'] {
        color-scheme: light;
        --bg: #ffffff;
        --text: #0b1020;
        --muted: #374151;
        --surface: #ffffff;
        --border: #e5e7eb;
        --accent: #8b5cf6;
      }
      :host[data-theme='dark'] {
        color-scheme: dark;
        --bg: #0b1020;
        --text: #e5e7eb;
        --muted: #9ca3af;
        --surface: #111827;
        --border: #27324a;
        --accent: #8b5cf6;
      }
    `,
  ],
})
export class AmiibosComponent {
  store = inject(AmiiboStore);

  // --- Thème ---
  theme = signal<null | 'light' | 'dark'>(null);

  @HostBinding('attr.data-theme')
  get dataTheme() {
    return this.theme();
  }

  // --- Toast ---
  showToast = signal(false);
  toastMsg = signal('');
  private lastSeen = 0;

  constructor() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') this.theme.set(saved);
    } catch {}

    effect(() => {
      const changedAt = this.store.updatedAt?.();
      if (changedAt && changedAt > this.lastSeen) {
        this.lastSeen = changedAt;
        this.toastMsg.set('Collection mise à jour');
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 2500);
      }
    });
  }

  refresh() {
    this.store.refresh();
  }

  toggleTheme() {
    const sysDark =
      window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    const curr = this.theme();

    const next: 'light' | 'dark' = curr
      ? curr === 'dark'
        ? 'light'
        : 'dark'
      : sysDark
      ? 'light'
      : 'dark';

    this.theme.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }
}
