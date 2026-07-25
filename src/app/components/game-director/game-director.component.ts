import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ArenaBoardComponent } from '../arena-board/arena-board.component';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { HelpOverlayComponent } from '../help-overlay/help-overlay.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { TeamBuilderComponent } from '../team-builder/team-builder.component';
import { TimePlayerComponent } from '../time-player/time-player.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { DEFAULT_TEAM_SIZE } from '../../core/constants/battle.constants';
import { HotkeysService } from '../../services/hotkeys.service';
import { HeroFactoryService } from '../../services/hero-factory.service';
import { BattleStore } from '../../state/battle.store';
import { RosterStore } from '../../state/roster.store';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'ea-game-director',
  standalone: true,
  imports: [
    ToolbarComponent,
    TeamBuilderComponent,
    ArenaBoardComponent,
    TimePlayerComponent,
    CombatLogComponent,
    StatusBarComponent,
    HelpOverlayComponent,
  ],
  templateUrl: './game-director.component.html',
  styleUrl: './game-director.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDirectorComponent {
  private readonly heroFactory = inject(HeroFactoryService);
  private readonly rosterStore = inject(RosterStore);
  private readonly battleStore = inject(BattleStore);
  private readonly ui = inject(UiStore);
  private readonly hotkeys = inject(HotkeysService);

  constructor() {
    this.hotkeys.init();
    const { alliance, horde } =
      this.heroFactory.createDefaultBattleRosters(DEFAULT_TEAM_SIZE);
    this.rosterStore.setBoth(alliance, horde);
    this.battleStore.setTeams(
      alliance.map((h) => this.heroFactory.cloneHeroFullResources(h)),
      horde.map((h) => this.heroFactory.cloneHeroFullResources(h)),
    );

    effect(() => {
      document.documentElement.dataset['theme'] = this.ui.theme();
    });
  }
}
