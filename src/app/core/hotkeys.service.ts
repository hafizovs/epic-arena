import { DestroyRef, Injectable, inject } from '@angular/core';
import { BattleStore } from '../features/battle/battle.store';
import { RosterStore } from '../features/roster/roster.store';
import { UiStore } from './ui/ui.store';
import { BattleEngineService } from '../features/battle/battle-engine.service';
import { CombatSchedulerService } from '../features/battle/combat-scheduler.service';
import { HeroFactoryService } from '../features/roster/hero-factory.service';

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiStore);
  private readonly battleStore = inject(BattleStore);
  private readonly rosterStore = inject(RosterStore);
  private readonly scheduler = inject(CombatSchedulerService);
  private readonly engine = inject(BattleEngineService);
  private readonly heroFactory = inject(HeroFactoryService);
  private attached = false;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
    }

    const key = event.key;
    const phase = this.battleStore.phase();

    if (key === 'Escape') {
      this.ui.closeHelp();
      return;
    }
    if (key === 'h' || key === 'H') {
      event.preventDefault();
      this.ui.toggleHelp();
      return;
    }
    if (key === 't' || key === 'T') {
      event.preventDefault();
      this.ui.toggleTheme();
      return;
    }
    if (key === 'g' || key === 'G') {
      event.preventDefault();
      this.ui.toggleLocale();
      return;
    }
    if (key === ' ' || key === 'Spacebar') {
      event.preventDefault();
      if (phase === 'running') {
        this.scheduler.pause();
      } else if (phase === 'setup' || phase === 'paused') {
        void this.scheduler.play();
      }
      return;
    }
    if (key === 'n' || key === 'N') {
      event.preventDefault();
      this.scheduler.step();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      if (phase === 'setup' || phase === 'paused') {
        void this.scheduler.play();
      }
      return;
    }
    if (key === 'r' || key === 'R') {
      if (phase !== 'setup') {
        return;
      }
      event.preventDefault();
      const size = Math.max(
        this.rosterStore.alliance().length,
        this.rosterStore.horde().length,
        3,
      );
      this.heroFactory.resetNamePool();
      const alliance = this.heroFactory.createRandomTeam('alliance', size);
      const horde = this.heroFactory.createRandomTeam('horde', size);
      this.rosterStore.setBoth(alliance, horde);
      this.battleStore.setTeams(
        alliance.map((h) => this.heroFactory.cloneHeroFullResources(h)),
        horde.map((h) => this.heroFactory.cloneHeroFullResources(h)),
      );
      return;
    }
    if (key === 'Backspace' || key === '0') {
      event.preventDefault();
      this.scheduler.stop();
      this.engine.reset();
    }
  };

  init(): void {
    if (this.attached) {
      return;
    }
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', this.onKeyDown);
      this.attached = false;
    });
  }
}
