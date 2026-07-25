import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_TEAM_SIZE } from '../core/constants/battle.constants';
import type { Hero, TeamId } from '../models/rpg.interfaces';

@Injectable({ providedIn: 'root' })
export class RosterStore {
  readonly alliance = signal<Hero[]>([]);
  readonly horde = signal<Hero[]>([]);
  readonly teamSize = signal(DEFAULT_TEAM_SIZE);
  readonly builderCollapsed = signal(false);

  readonly isValid = computed(() => {
    const a = this.alliance().length;
    const h = this.horde().length;
    return a >= 3 && a <= 5 && h >= 3 && h <= 5;
  });

  setTeam(teamId: TeamId, heroes: Hero[]): void {
    if (teamId === 'alliance') {
      this.alliance.set(heroes);
    } else {
      this.horde.set(heroes);
    }
  }

  setBoth(alliance: Hero[], horde: Hero[]): void {
    this.alliance.set(alliance);
    this.horde.set(horde);
  }

  replaceHero(teamId: TeamId, slotIndex: number, hero: Hero): void {
    const update = (list: Hero[]) =>
      list.map((h) => (h.slotIndex === slotIndex ? hero : h));
    if (teamId === 'alliance') {
      this.alliance.update(update);
    } else {
      this.horde.update(update);
    }
  }

  setBuilderCollapsed(value: boolean): void {
    this.builderCollapsed.set(value);
  }
}
