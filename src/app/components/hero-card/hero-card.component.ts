import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { FloatingMarker, Hero } from '../../models/rpg.interfaces';
import { FloatingMarkersComponent } from '../floating-markers/floating-markers.component';
import { I18nService } from '../../services/i18n.service';
import { BattleStore } from '../../state/battle.store';
import { HERO_CARD_MIN_WIDTH_PX } from '../../core/constants/ui.constants';

@Component({
  selector: 'ea-hero-card',
  standalone: true,
  imports: [FloatingMarkersComponent],
  templateUrl: './hero-card.component.html',
  styleUrl: './hero-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCardComponent {
  readonly hero = input.required<Hero>();
  readonly active = input(false);
  readonly hitToken = input(0);
  readonly markers = input<FloatingMarker[]>([]);

  readonly i18n = inject(I18nService);
  private readonly battle = inject(BattleStore);

  readonly shaking = signal(false);
  readonly minWidth = HERO_CARD_MIN_WIDTH_PX;

  readonly heroMarkers = computed(() =>
    this.markers().filter((m) => m.heroId === this.hero().id),
  );

  readonly hpPercent = computed(() => {
    const h = this.hero();
    return Math.max(0, Math.min(100, (h.resources.hp / h.stats.maxHp) * 100));
  });

  readonly manaPercent = computed(() => {
    const h = this.hero();
    if (h.stats.maxMana <= 0) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(100, (h.resources.mana / h.stats.maxMana) * 100),
    );
  });

  readonly powerLabel = computed(() => {
    const h = this.hero();
    if (h.classId === 'mage' || h.classId === 'priest') {
      return `MAG ${h.stats.magicalPower}`;
    }
    return `ATK ${h.stats.physicalAttack}`;
  });

  constructor() {
    effect(() => {
      const token = this.hitToken();
      if (token > 0) {
        this.shaking.set(true);
        window.setTimeout(() => this.shaking.set(false), 300);
      }
    });
  }

  onMarkerDone(id: string): void {
    this.battle.removeMarker(id);
  }

  effectTitle(kind: string, turns: number): string {
    return `${this.i18n.effectName(kind)} (${turns})`;
  }
}
