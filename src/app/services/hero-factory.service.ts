import { Injectable, inject } from '@angular/core';
import { DEFAULT_TEAM_SIZE } from '../core/constants/battle.constants';
import { DEFAULT_STATS_BY_CLASS } from '../core/constants/hero-stats.constants';
import {
  ALLIANCE_NAMES,
  HORDE_NAMES,
} from '../core/constants/name-pools.constants';
import { SKILLS_BY_CLASS } from '../core/constants/skill.constants';
import type { HeroClassId } from '../core/models/hero-class.model';
import type { TeamId } from '../core/models/team-id.model';
import type { Hero } from '../models/rpg.interfaces';
import {
  Mulberry32RandomSource,
  type RandomSource,
} from '../domain/math/rng';
import { computeInitiative } from '../domain/combat/initiative';
import { BattleStore } from '../state/battle.store';

const CLASSES: HeroClassId[] = ['warrior', 'mage', 'archer', 'priest'];
const DAMAGER_CLASSES: HeroClassId[] = ['warrior', 'mage', 'archer'];

@Injectable({ providedIn: 'root' })
export class HeroFactoryService {
  private readonly battleStore = inject(BattleStore);
  private uidCounter = 0;
  private usedNames = new Set<string>();

  private nextUid(): string {
    this.uidCounter += 1;
    return String(this.uidCounter);
  }

  private pickName(teamId: TeamId, rng: RandomSource): string {
    const pool = teamId === 'alliance' ? ALLIANCE_NAMES : HORDE_NAMES;
    const available = pool.filter((n) => !this.usedNames.has(n));
    const source = available.length > 0 ? available : [...pool];
    const index = Math.floor(rng.next() * source.length);
    let name = source[index] ?? source[0];
    if (this.usedNames.has(name)) {
      let suffix = 2;
      while (this.usedNames.has(`${name}#${suffix}`)) {
        suffix += 1;
      }
      name = `${name}#${suffix}`;
    }
    this.usedNames.add(name);
    return name;
  }

  private randomClass(rng: RandomSource): HeroClassId {
    const index = Math.floor(rng.next() * CLASSES.length);
    return CLASSES[index];
  }

  resetNamePool(): void {
    this.usedNames.clear();
  }

  createHero(
    classId: HeroClassId,
    teamId: TeamId,
    slotIndex: number,
    name?: string,
    rng?: RandomSource,
  ): Hero {
    const random = rng ?? new Mulberry32RandomSource(this.battleStore.rngSeed());
    const stats = { ...DEFAULT_STATS_BY_CLASS[classId] };
    const skills = SKILLS_BY_CLASS[classId].map((skill) => ({
      ...skill,
      cost: { ...skill.cost },
      scaling: { ...skill.scaling },
      effects: skill.effects.map((e) => ({ ...e })),
    }));
    const displayName = name ?? this.pickName(teamId, random);
    const hero: Hero = {
      id: `${teamId}-${classId}-${slotIndex}-${this.nextUid()}`,
      name: displayName,
      classId,
      teamId,
      slotIndex,
      stats,
      resources: { hp: stats.maxHp, mana: stats.maxMana },
      skills,
      effects: [],
      isAlive: true,
      initiative: 0,
    };
    hero.initiative = computeInitiative(hero);
    return hero;
  }

  createRandomTeam(teamId: TeamId, size: number, rng?: RandomSource): Hero[] {
    const random =
      rng ?? new Mulberry32RandomSource(this.battleStore.rngSeed() + (teamId === 'alliance' ? 1 : 7));
    const heroes: Hero[] = [];
    for (let slot = 0; slot < size; slot += 1) {
      let classId = this.randomClass(random);
      if (slot === size - 1 && size >= 3) {
        const allPriests = heroes.every((h) => h.classId === 'priest') && classId === 'priest';
        if (allPriests) {
          classId = DAMAGER_CLASSES[Math.floor(random.next() * DAMAGER_CLASSES.length)];
        }
      }
      heroes.push(this.createHero(classId, teamId, slot, undefined, random));
    }
    return heroes;
  }

  createDefaultBattleRosters(size = DEFAULT_TEAM_SIZE): {
    alliance: Hero[];
    horde: Hero[];
  } {
    this.resetNamePool();
    const rng = new Mulberry32RandomSource(this.battleStore.rngSeed());
    const alliance = this.createRandomTeam('alliance', size, rng);
    const horde = this.createRandomTeam('horde', size, rng);
    return { alliance, horde };
  }

  cloneHeroFullResources(hero: Hero): Hero {
    return {
      ...hero,
      stats: { ...hero.stats },
      resources: { hp: hero.stats.maxHp, mana: hero.stats.maxMana },
      skills: hero.skills.map((s) => ({
        ...s,
        cost: { ...s.cost },
        scaling: { ...s.scaling },
        effects: s.effects.map((e) => ({ ...e })),
      })),
      effects: [],
      isAlive: true,
      initiative: computeInitiative({ ...hero, effects: [] }),
    };
  }
}
