import { Injectable, computed, inject } from '@angular/core';
import type { I18nKey } from './i18n/i18n.keys';
import { EN } from './i18n/en';
import { RU } from './i18n/ru';
import { UiStore } from './ui/ui.store';
import type { LocaleId } from './i18n/locale.type';

const DICTS: Record<LocaleId, Record<I18nKey, string>> = {
  ru: RU,
  en: EN,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly ui = inject(UiStore);

  readonly locale = computed(() => this.ui.locale());

  t(key: I18nKey | string, params?: Record<string, string | number>): string {
    const dict = DICTS[this.ui.locale()];
    let template = (dict as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        template = template.replaceAll(`{${paramKey}}`, String(value));
      }
    }
    return template;
  }

  skillName(skillId: string): string {
    return this.t(`skill.${skillId}` as I18nKey);
  }

  className(classId: string): string {
    return this.t(`class.${classId}` as I18nKey);
  }

  effectName(kind: string): string {
    return this.t(`effect.${kind}` as I18nKey);
  }
}
