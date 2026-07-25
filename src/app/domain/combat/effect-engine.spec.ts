import { describe, expect, it } from 'vitest';
import {
  applyEffectToHero,
  decayEffects,
  getDotEffects,
  hasEffect,
} from './effect-engine';
import type { Hero } from '../../models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';

function makeHero(): Hero {
  const stats = DEFAULT_STATS_BY_CLASS.warrior;
  return {
    id: 'w1',
    name: 'W',
    classId: 'warrior',
    teamId: 'alliance',
    slotIndex: 0,
    stats: { ...stats },
    resources: { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS.warrior,
    effects: [
      {
        id: 'b1',
        kind: 'bleed',
        remainingTurns: 2,
        potency: 8,
        sourceHeroId: 'e1',
      },
      {
        id: 'st1',
        kind: 'stun',
        remainingTurns: 1,
        potency: 0,
        sourceHeroId: 'e1',
      },
    ],
    isAlive: true,
    initiative: stats.speed,
  };
}

describe('effect-engine', () => {
  it('detects stun and bleed dots', () => {
    const hero = makeHero();
    expect(hasEffect(hero, 'stun')).toBe(true);
    expect(getDotEffects(hero).map((e) => e.kind)).toEqual(['bleed']);
  });

  it('decays durations and removes expired', () => {
    const hero = makeHero();
    const first = decayEffects(hero);
    expect(first.expired.map((e) => e.kind)).toEqual(['stun']);
    expect(first.hero.effects).toHaveLength(1);
    expect(first.hero.effects[0].remainingTurns).toBe(1);

    const second = decayEffects(first.hero);
    expect(second.expired.map((e) => e.kind)).toEqual(['bleed']);
    expect(second.hero.effects).toHaveLength(0);
  });

  it('stacks shield potency and keeps max duration', () => {
    let hero = makeHero();
    hero = { ...hero, effects: [] };
    hero = applyEffectToHero(
      hero,
      { kind: 'shield', durationTurns: 2, potency: 40 },
      'p1',
      'fx1',
    );
    hero = applyEffectToHero(
      hero,
      { kind: 'shield', durationTurns: 3, potency: 20 },
      'p1',
      'fx2',
    );
    const shield = hero.effects.find((e) => e.kind === 'shield')!;
    expect(shield.potency).toBe(60);
    expect(shield.remainingTurns).toBe(3);
  });
});
