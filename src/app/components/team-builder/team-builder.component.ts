import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
} from '../../core/constants/battle.constants';
import type { HeroClassId } from '../../core/models/hero-class.model';
import type { TeamId } from '../../core/models/team-id.model';
import { BattleEngineService } from '../../services/battle-engine.service';
import { CombatSchedulerService } from '../../services/combat-scheduler.service';
import { HeroFactoryService } from '../../services/hero-factory.service';
import { I18nService } from '../../services/i18n.service';
import { BattleStore } from '../../state/battle.store';
import { RosterStore } from '../../state/roster.store';

@Component({
  selector: 'ea-team-builder',
  standalone: true,
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent {
  readonly i18n = inject(I18nService);
  readonly roster = inject(RosterStore);
  readonly battle = inject(BattleStore);
  private readonly factory = inject(HeroFactoryService);
  private readonly engine = inject(BattleEngineService);
  private readonly scheduler = inject(CombatSchedulerService);

  readonly classes: HeroClassId[] = ['warrior', 'mage', 'archer', 'priest'];

  readonly editable = computed(() => this.battle.phase() === 'setup');
  readonly collapsed = computed(
    () =>
      this.roster.builderCollapsed() && this.battle.phase() !== 'setup',
  );

  syncPreview(): void {
    if (this.battle.phase() !== 'setup') {
      return;
    }
    this.battle.setTeams(
      this.roster.alliance().map((h) => this.factory.cloneHeroFullResources(h)),
      this.roster.horde().map((h) => this.factory.cloneHeroFullResources(h)),
    );
  }

  changeClass(teamId: TeamId, slotIndex: number, classId: HeroClassId): void {
    if (!this.editable()) {
      return;
    }
    const hero = this.factory.createHero(classId, teamId, slotIndex);
    this.roster.replaceHero(teamId, slotIndex, hero);
    this.syncPreview();
  }

  onClassSelect(teamId: TeamId, slotIndex: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as HeroClassId;
    this.changeClass(teamId, slotIndex, value);
  }

  addSlot(teamId: TeamId): void {
    if (!this.editable()) {
      return;
    }
    const list =
      teamId === 'alliance' ? this.roster.alliance() : this.roster.horde();
    if (list.length >= MAX_TEAM_SIZE) {
      return;
    }
    const hero = this.factory.createHero('warrior', teamId, list.length);
    this.roster.setTeam(teamId, [...list, hero]);
    this.syncPreview();
  }

  removeSlot(teamId: TeamId): void {
    if (!this.editable()) {
      return;
    }
    const list =
      teamId === 'alliance' ? this.roster.alliance() : this.roster.horde();
    if (list.length <= MIN_TEAM_SIZE) {
      return;
    }
    const next = list.slice(0, -1);
    this.roster.setTeam(teamId, next);
    this.syncPreview();
  }

  randomize(): void {
    if (!this.editable()) {
      return;
    }
    const size = Math.max(
      this.roster.alliance().length,
      this.roster.horde().length,
      MIN_TEAM_SIZE,
    );
    this.factory.resetNamePool();
    const alliance = this.factory.createRandomTeam('alliance', size);
    const horde = this.factory.createRandomTeam('horde', size);
    this.roster.setBoth(alliance, horde);
    this.syncPreview();
  }

  startBattle(): void {
    if (!this.roster.isValid()) {
      return;
    }
    void this.scheduler.play();
  }

  expandBuilder(): void {
    this.scheduler.stop();
    this.engine.reset();
    this.roster.setBuilderCollapsed(false);
  }
}
