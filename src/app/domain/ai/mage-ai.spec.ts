import { describe, expect, it } from 'vitest';
import { chooseMageAction } from './mage-ai';
import type { Hero } from '../../models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';

function mage(mana: number): Hero {
  const stats = DEFAULT_STATS_BY_CLASS.mage;
  return {
    id: 'm1',
    name: 'Mage',
    classId: 'mage',
    teamId: 'alliance',
    slotIndex: 0,
    stats: { ...stats },
    resources: { hp: stats.maxHp, mana },
    skills: SKILLS_BY_CLASS.mage,
    effects: [],
    isAlive: true,
    initiative: stats.speed,
  };
}

function enemy(id: string, speed: number, slot = 0): Hero {
  const stats = { ...DEFAULT_STATS_BY_CLASS.warrior, speed };
  return {
    id,
    name: id,
    classId: 'warrior',
    teamId: 'horde',
    slotIndex: slot,
    stats,
    resources: { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.warrior,
    effects: [],
    isAlive: true,
    initiative: speed,
  };
}

describe('mage-ai', () => {
  it('prefers fireball at full mana', () => {
    const actor = mage(120);
    const enemies = [enemy('e1', 20), enemy('e2', 25, 1)];
    const intent = chooseMageAction({
      actor,
      allies: [actor],
      enemies,
      allHeroes: [actor, ...enemies],
      round: 2,
    });
    expect(intent.skillId).toBe('mage.fireball');
  });
});
