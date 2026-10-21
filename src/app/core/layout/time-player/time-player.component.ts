import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  ANIMATION_SPEED_MAX,
  ANIMATION_SPEED_MIN,
} from '../../constants/battle.constants';
import { CombatSchedulerService } from '../../../features/battle/combat-scheduler.service';
import { I18nService } from '../../i18n.service';
import { BattleStore } from '../../../features/battle/battle.store';

@Component({
  selector: 'ea-time-player',
  standalone: true,
  templateUrl: './time-player.component.html',
  styleUrl: './time-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimePlayerComponent {
  readonly i18n = inject(I18nService);
  readonly battle = inject(BattleStore);
  readonly scheduler = inject(CombatSchedulerService);

  readonly min = ANIMATION_SPEED_MIN;
  readonly max = ANIMATION_SPEED_MAX;

  readonly canPlay = computed(() => {
    const phase = this.battle.phase();
    return phase === 'setup' || phase === 'paused';
  });

  readonly canPause = computed(() => this.battle.phase() === 'running');

  readonly canStep = computed(() => {
    const phase = this.battle.phase();
    return phase === 'running' || phase === 'paused';
  });

  readonly playLabel = computed(() => {
    if (this.battle.phase() === 'paused') {
      return this.i18n.t('player.resume');
    }
    return this.i18n.t('player.play');
  });

  play(): void {
    void this.scheduler.play();
  }

  pause(): void {
    this.scheduler.pause();
  }

  step(): void {
    this.scheduler.step();
  }

  onSpeed(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.scheduler.setSpeed(value);
  }
}
