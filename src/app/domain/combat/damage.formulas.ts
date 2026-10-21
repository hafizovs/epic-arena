import {
  ARMOR_SOFT_CAP_PERCENT,
  MAGIC_RESIST_SOFT_CAP_PERCENT,
} from '../../core/constants/battle.constants';
import type {
  ActiveEffect,
  DamageType,
  Hero,
  SkillScaling,
} from '../../core/models/rpg.interfaces';
import { clamp } from '../math/clamp';
import type { RandomSource } from '../math/rng';

export interface DamageHitInput {
  actor: Hero;
  target: Hero;
  damageType: DamageType;
  rawPower: number;
  skipDodge?: boolean;
  skipCrit?: boolean;
}

export interface DamageHitResult {
  finalDamage: number;
  rawBeforeMitigation: number;
  mitigated: number;
  wasCrit: boolean;
  wasDodge: boolean;
  absorbedByShield: number;
  updatedTarget: Hero;
}

export interface HealResult {
  healAmount: number;
  updatedTarget: Hero;
}

export function computeRawPower(
  scaling: SkillScaling,
  physicalAttack: number,
  magicalPower: number,
): number {
  return (
    scaling.physicalCoefficient * physicalAttack +
    scaling.magicalCoefficient * magicalPower +
    scaling.flatPower
  );
}

function absorbWithShields(
  damage: number,
  effects: ActiveEffect[],
): { remaining: number; absorbed: number; effects: ActiveEffect[] } {
  let remaining = damage;
  let absorbed = 0;
  const nextEffects: ActiveEffect[] = [];

  for (const effect of effects) {
    if (effect.kind !== 'shield' || remaining <= 0) {
      nextEffects.push({ ...effect });
      continue;
    }
    const take = Math.min(effect.potency, remaining);
    const nextPotency = effect.potency - take;
    remaining -= take;
    absorbed += take;
    if (nextPotency > 0) {
      nextEffects.push({ ...effect, potency: nextPotency });
    }
  }

  return { remaining, absorbed, effects: nextEffects };
}

export function resolveDamageHit(
  input: DamageHitInput,
  rng: RandomSource,
): DamageHitResult {
  const { actor, target, damageType } = input;

  if (
    !input.skipDodge &&
    (damageType === 'physical' || damageType === 'magical') &&
    rng.next() < target.stats.dodgeChance
  ) {
    return {
      finalDamage: 0,
      rawBeforeMitigation: 0,
      mitigated: 0,
      wasCrit: false,
      wasDodge: true,
      absorbedByShield: 0,
      updatedTarget: { ...target, effects: target.effects.map((e) => ({ ...e })) },
    };
  }

  let raw = input.rawPower;
  let wasCrit = false;
  if (
    !input.skipCrit &&
    damageType !== 'heal' &&
    rng.next() < actor.stats.critChance
  ) {
    raw = raw * actor.stats.critMultiplier;
    wasCrit = true;
  }

  const capA = clamp(target.stats.armorPercent, 0, ARMOR_SOFT_CAP_PERCENT);
  const capR = clamp(
    target.stats.magicResistPercent,
    0,
    MAGIC_RESIST_SOFT_CAP_PERCENT,
  );

  let mitigatedAmount = 0;
  let afterMitigation = raw;
  if (damageType === 'physical') {
    mitigatedAmount = raw * (capA / 100);
    afterMitigation = raw - mitigatedAmount;
  } else if (damageType === 'magical') {
    mitigatedAmount = raw * (capR / 100);
    afterMitigation = raw - mitigatedAmount;
  } else if (damageType === 'true') {
    mitigatedAmount = 0;
    afterMitigation = raw;
  }

  afterMitigation = Math.max(0, afterMitigation);

  const shieldPass = absorbWithShields(afterMitigation, target.effects);
  const finalDamage = Math.floor(shieldPass.remaining + 1e-9);
  const hp = Math.max(0, target.resources.hp - finalDamage);
  const isAlive = hp > 0;

  return {
    finalDamage,
    rawBeforeMitigation: raw,
    mitigated: Math.floor(mitigatedAmount + 1e-9),
    wasCrit,
    wasDodge: false,
    absorbedByShield: Math.floor(shieldPass.absorbed + 1e-9),
    updatedTarget: {
      ...target,
      resources: { ...target.resources, hp },
      effects: shieldPass.effects,
      isAlive,
    },
  };
}

export function resolveHeal(
  target: Hero,
  scaling: SkillScaling,
  actor: Hero,
): HealResult {
  const raw = computeRawPower(
    scaling,
    actor.stats.physicalAttack,
    actor.stats.magicalPower,
  );
  const healAmount = Math.floor(raw + 1e-9);
  const hp = Math.min(target.stats.maxHp, target.resources.hp + healAmount);
  return {
    healAmount,
    updatedTarget: {
      ...target,
      resources: { ...target.resources, hp },
      isAlive: hp > 0,
    },
  };
}
