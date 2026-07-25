import { describe, expect, it } from 'vitest';
import { choosePriestAction } from './priest-ai';
import type { Hero } from '../../models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';

function priest(): Hero {
  const stats = DEFAULT_STATS_BY_CLASS.priest;
  return {
    id: 'p1',
    name: 'Priest',
    classId: 'priest',
    teamId: 'alliance',
    slotIndex: 0,
    stats: { ...stats },
    resources: { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.priest,
    effects: [],
    isAlive: true,
    initiative: stats.speed,
  };
}

function ally(id: string, hp: number): Hero {
  const stats = DEFAULT_STATS_BY_CLASS.warrior;
  return {
    id,
    name: id,
    classId: 'warrior',
    teamId: 'alliance',
    slotIndex: 1,
    stats: { ...stats },
    resources: { hp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.warrior,
    effects: [],
    isAlive: hp > 0,
    initiative: stats.speed,
  };
}

function foe(): Hero {
  const stats = DEFAULT_STATS_BY_CLASS.mage;
  return {
    id: 'e1',
    name: 'Enemy',
    classId: 'mage',
    teamId: 'horde',
    slotIndex: 0,
    stats: { ...stats },
    resources: { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.mage,
    effects: [],
    isAlive: true,
    initiative: stats.speed,
  };
}

describe('priest-ai', () => {
  it('heals ally below 50% hp', () => {
    const actor = priest();
    const wounded = ally('w1', 40);
    const intent = choosePriestAction({
      actor,
      allies: [actor, wounded],
      enemies: [foe()],
      allHeroes: [actor, wounded, foe()],
      round: 2,
    });
    expect(intent.skillId).toBe('priest.heal');
    expect(intent.targetHeroIds).toEqual(['w1']);
  });

  it('may attack when allies are healthy', () => {
    const actor = priest();
    const healthy = ally('w1', 160);
    const intent = choosePriestAction({
      actor,
      allies: [actor, healthy],
      enemies: [foe()],
      allHeroes: [actor, healthy, foe()],
      round: 2,
    });
    expect(intent.skillId).toBe('priest.basic_attack');
  });
});
