import { describe, expect, it } from 'vitest';
import { chooseWarriorAction } from './warrior-ai';
import type { Hero } from '../../core/models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';

function make(
  id: string,
  teamId: 'alliance' | 'horde',
  classId: Hero['classId'],
  hp: number,
  extras: Partial<Hero> = {},
): Hero {
  const stats = { ...DEFAULT_STATS_BY_CLASS[classId] };
  return {
    id,
    name: id,
    classId,
    teamId,
    slotIndex: extras.slotIndex ?? 0,
    stats,
    resources: { hp, mana: extras.resources?.mana ?? stats.maxMana },
    skills: SKILLS_BY_CLASS[classId],
    effects: extras.effects ?? [],
    isAlive: hp > 0,
    initiative: stats.speed,
    ...extras,
  };
}

describe('warrior-ai', () => {
  it('focuses lowest HP enemy when not taunting', () => {
    const actor = make('w', 'alliance', 'warrior', 160, {
      resources: { hp: 160, mana: 0 },
    });
    const low = make('e1', 'horde', 'mage', 20);
    const high = make('e2', 'horde', 'mage', 90, { slotIndex: 1 });
    const intent = chooseWarriorAction({
      actor,
      allies: [actor],
      enemies: [high, low],
      allHeroes: [actor, high, low],
      round: 5,
    });
    expect(intent.skillId).toBe('warrior.basic_attack');
    expect(intent.targetHeroIds).toEqual(['e1']);
  });

  it('respects taunt forced target', () => {
    const actor = make('w', 'alliance', 'warrior', 160, {
      resources: { hp: 160, mana: 0 },
      effects: [
        {
          id: 't',
          kind: 'taunt',
          remainingTurns: 1,
          potency: 0,
          sourceHeroId: 'tank',
          forcedTargetHeroId: 'tank',
        },
      ],
    });
    const tank = make('tank', 'horde', 'warrior', 100);
    const low = make('e1', 'horde', 'mage', 10, { slotIndex: 1 });
    const intent = chooseWarriorAction({
      actor,
      allies: [actor],
      enemies: [tank, low],
      allHeroes: [actor, tank, low],
      round: 5,
    });
    expect(intent.targetHeroIds).toEqual(['tank']);
  });
});
