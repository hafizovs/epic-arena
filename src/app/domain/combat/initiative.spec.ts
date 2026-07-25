import { describe, expect, it } from 'vitest';
import {
  buildTurnQueue,
  computeInitiative,
} from './initiative';
import type { Hero } from '../../models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';
import {
  HASTE_SPEED_DELTA,
  SLOW_SPEED_DELTA,
} from '../../core/constants/effect.constants';

function hero(
  id: string,
  teamId: 'alliance' | 'horde',
  speed: number,
  slotIndex: number,
  effects: Hero['effects'] = [],
): Hero {
  const stats = { ...DEFAULT_STATS_BY_CLASS.warrior, speed };
  return {
    id,
    name: id,
    classId: 'warrior',
    teamId,
    slotIndex,
    stats,
    resources: { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.warrior,
    effects,
    isAlive: true,
    initiative: speed,
  };
}

describe('initiative', () => {
  it('sorts by speed descending', () => {
    const heroes = [
      hero('slow', 'alliance', 10, 0),
      hero('fast', 'horde', 40, 0),
      hero('mid', 'alliance', 25, 1),
    ];
    expect(buildTurnQueue(heroes)).toEqual(['fast', 'mid', 'slow']);
  });

  it('applies haste and slow deltas', () => {
    const base = hero('same', 'alliance', 30, 0);
    const hasted = hero('same', 'alliance', 30, 0, [
      {
        id: '1',
        kind: 'haste',
        remainingTurns: 1,
        potency: 15,
        sourceHeroId: 'x',
      },
    ]);
    const slowed = hero('same', 'alliance', 30, 0, [
      {
        id: '2',
        kind: 'slow',
        remainingTurns: 1,
        potency: 15,
        sourceHeroId: 'x',
      },
    ]);
    expect(computeInitiative(hasted) - computeInitiative(base)).toBeCloseTo(
      HASTE_SPEED_DELTA,
      10,
    );
    expect(computeInitiative(slowed) - computeInitiative(base)).toBeCloseTo(
      SLOW_SPEED_DELTA,
      10,
    );
  });

  it('breaks equal speed with alliance first then slotIndex', () => {
    const heroes = [
      hero('h0', 'horde', 30, 0),
      hero('a1', 'alliance', 30, 1),
      hero('a0', 'alliance', 30, 0),
    ];
    expect(buildTurnQueue(heroes)).toEqual(['a0', 'a1', 'h0']);
  });
});
