import { describe, expect, it } from 'vitest';
import {
  computeRawPower,
  resolveDamageHit,
  resolveHeal,
} from './damage.formulas';
import { SequenceRandomSource } from '../math/rng';
import type { Hero } from '../../models/rpg.interfaces';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';

function makeHero(
  partial: Partial<Hero> & Pick<Hero, 'id' | 'classId' | 'teamId'>,
): Hero {
  const stats = {
    ...DEFAULT_STATS_BY_CLASS[partial.classId],
    ...(partial.stats ?? {}),
  };
  return {
    name: partial.name ?? 'Hero',
    slotIndex: partial.slotIndex ?? 0,
    skills: partial.skills ?? SKILLS_BY_CLASS[partial.classId],
    effects: partial.effects ?? [],
    isAlive: partial.isAlive ?? true,
    initiative: partial.initiative ?? stats.speed,
    resources: partial.resources ?? { hp: stats.maxHp, mana: stats.maxMana },
    stats,
    id: partial.id,
    classId: partial.classId,
    teamId: partial.teamId,
  };
}

describe('damage.formulas', () => {
  it('applies armor mitigation for physical damage', () => {
    const actor = makeHero({ id: 'a', classId: 'warrior', teamId: 'alliance' });
    const target = makeHero({
      id: 'b',
      classId: 'mage',
      teamId: 'horde',
      stats: { ...DEFAULT_STATS_BY_CLASS.mage, armorPercent: 50, dodgeChance: 0 },
    });
    const rng = new SequenceRandomSource([0.99, 0.99]);
    const result = resolveDamageHit(
      {
        actor,
        target,
        damageType: 'physical',
        rawPower: 100,
        skipDodge: true,
        skipCrit: true,
      },
      rng,
    );
    expect(result.mitigated).toBe(50);
    expect(result.finalDamage).toBe(50);
  });

  it('applies magic resist for magical damage', () => {
    const actor = makeHero({ id: 'a', classId: 'mage', teamId: 'alliance' });
    const target = makeHero({
      id: 'b',
      classId: 'warrior',
      teamId: 'horde',
      stats: {
        ...DEFAULT_STATS_BY_CLASS.warrior,
        magicResistPercent: 25,
        dodgeChance: 0,
      },
    });
    const rng = new SequenceRandomSource([0.99]);
    const result = resolveDamageHit(
      {
        actor,
        target,
        damageType: 'magical',
        rawPower: 80,
        skipDodge: true,
        skipCrit: true,
      },
      rng,
    );
    expect(result.mitigated).toBe(20);
    expect(result.finalDamage).toBe(60);
  });

  it('multiplies crit damage', () => {
    const actor = makeHero({
      id: 'a',
      classId: 'archer',
      teamId: 'alliance',
      stats: {
        ...DEFAULT_STATS_BY_CLASS.archer,
        critChance: 1,
        critMultiplier: 2,
      },
    });
    const target = makeHero({
      id: 'b',
      classId: 'mage',
      teamId: 'horde',
      stats: { ...DEFAULT_STATS_BY_CLASS.mage, armorPercent: 0, dodgeChance: 0 },
    });
    const rng = new SequenceRandomSource([0]);
    const result = resolveDamageHit(
      {
        actor,
        target,
        damageType: 'physical',
        rawPower: 40,
        skipDodge: true,
      },
      rng,
    );
    expect(result.wasCrit).toBe(true);
    expect(result.finalDamage).toBe(80);
  });

  it('returns miss on dodge', () => {
    const actor = makeHero({ id: 'a', classId: 'warrior', teamId: 'alliance' });
    const target = makeHero({
      id: 'b',
      classId: 'archer',
      teamId: 'horde',
      stats: { ...DEFAULT_STATS_BY_CLASS.archer, dodgeChance: 1 },
    });
    const rng = new SequenceRandomSource([0]);
    const result = resolveDamageHit(
      {
        actor,
        target,
        damageType: 'physical',
        rawPower: 50,
      },
      rng,
    );
    expect(result.wasDodge).toBe(true);
    expect(result.finalDamage).toBe(0);
  });

  it('absorbs damage with shield before HP', () => {
    const actor = makeHero({ id: 'a', classId: 'warrior', teamId: 'alliance' });
    const target = makeHero({
      id: 'b',
      classId: 'priest',
      teamId: 'horde',
      stats: { ...DEFAULT_STATS_BY_CLASS.priest, armorPercent: 0, dodgeChance: 0 },
      effects: [
        {
          id: 'sh1',
          kind: 'shield',
          remainingTurns: 3,
          potency: 30,
          sourceHeroId: 'x',
        },
      ],
    });
    const rng = new SequenceRandomSource([0.99]);
    const result = resolveDamageHit(
      {
        actor,
        target,
        damageType: 'physical',
        rawPower: 50,
        skipDodge: true,
        skipCrit: true,
      },
      rng,
    );
    expect(result.absorbedByShield).toBe(30);
    expect(result.finalDamage).toBe(20);
    expect(result.updatedTarget.effects.some((e) => e.kind === 'shield')).toBe(
      false,
    );
  });

  it('clamps heal to maxHp', () => {
    const actor = makeHero({ id: 'a', classId: 'priest', teamId: 'alliance' });
    const target = makeHero({
      id: 'b',
      classId: 'warrior',
      teamId: 'alliance',
      resources: { hp: 150, mana: 60 },
    });
    const heal = resolveHeal(
      target,
      { physicalCoefficient: 0, magicalCoefficient: 0, flatPower: 40 },
      actor,
    );
    expect(heal.healAmount).toBe(40);
    expect(heal.updatedTarget.resources.hp).toBe(160);
  });

  it('computes raw power from scaling', () => {
    expect(
      computeRawPower(
        { physicalCoefficient: 1.5, magicalCoefficient: 0.5, flatPower: 4 },
        20,
        10,
      ),
    ).toBe(39);
  });
});
