import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { I18nService } from '../../i18n.service';
import { BattleEngineService } from '../../../features/battle/battle-engine.service';
import { CombatSchedulerService } from '../../../features/battle/combat-scheduler.service';
import { UiStore } from '../../ui/ui.store';

@Component({
  selector: 'ea-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly ui = inject(UiStore);
  private readonly engine = inject(BattleEngineService);
  private readonly scheduler = inject(CombatSchedulerService);

  reset(): void {
    this.scheduler.stop();
    this.engine.reset();
  }

  toggleTheme(): void {
    this.ui.toggleTheme();
  }

  toggleLang(): void {
    this.ui.toggleLocale();
  }

  openHelp(): void {
    this.ui.openHelp();
  }
}
