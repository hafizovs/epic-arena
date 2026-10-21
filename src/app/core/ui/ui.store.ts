import { Injectable, signal } from '@angular/core';
import type { LocaleId } from '../models/locale.model';
import type { ThemeId } from '../models/theme.model';

@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly theme = signal<ThemeId>('dark');
  readonly locale = signal<LocaleId>('ru');
  readonly helpOpen = signal(false);

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: ThemeId): void {
    this.theme.set(theme);
  }

  toggleLocale(): void {
    this.locale.update((l) => (l === 'ru' ? 'en' : 'ru'));
  }

  setLocale(locale: LocaleId): void {
    this.locale.set(locale);
  }

  openHelp(): void {
    this.helpOpen.set(true);
  }

  closeHelp(): void {
    this.helpOpen.set(false);
  }

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }
}
