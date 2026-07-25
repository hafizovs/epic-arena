import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { BattleStore } from '../../state/battle.store';

@Component({
  selector: 'ea-status-bar',
  standalone: true,
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  readonly battle = inject(BattleStore);
  readonly i18n = inject(I18nService);

  readonly phaseLabel = computed(() =>
    this.i18n.t(`phase.${this.battle.phase()}` as 'phase.setup'),
  );

  readonly activeName = computed(() => {
    const id = this.battle.activeHeroId();
    if (!id) {
      return '—';
    }
    const hero = this.battle.allHeroes().find((h) => h.id === id);
    return hero?.name ?? '—';
  });

  readonly winnerLabel = computed(() => {
    if (this.battle.phase() !== 'finished') {
      return '';
    }
    const winner = this.battle.winnerTeamId();
    if (!winner) {
      return this.i18n.t('status.draw');
    }
    return this.i18n.t(
      winner === 'alliance' ? 'arena.alliance' : 'arena.horde',
    );
  });

  readonly aliveLabel = computed(() => {
    const aAlive = this.battle.aliveAllianceCount();
    const hAlive = this.battle.aliveHordeCount();
    const aTotal = this.battle.alliance().length;
    const hTotal = this.battle.horde().length;
    return `${aAlive}/${aTotal} vs ${hAlive}/${hTotal}`;
  });
}
