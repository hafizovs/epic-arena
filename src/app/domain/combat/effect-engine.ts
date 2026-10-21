import type {
  ActiveEffect,
  Hero,
  SkillEffectSpec,
} from '../../core/models/rpg.interfaces';

export function hasEffect(hero: Hero, kind: ActiveEffect['kind']): boolean {
  return hero.effects.some((e) => e.kind === kind);
}

export function getTauntForcedTargetId(hero: Hero): string | null {
  const taunt = hero.effects.find((e) => e.kind === 'taunt' && e.forcedTargetHeroId);
  return taunt?.forcedTargetHeroId ?? null;
}

export function cloneHero(hero: Hero): Hero {
  return {
    ...hero,
    stats: { ...hero.stats },
    resources: { ...hero.resources },
    skills: hero.skills.map((s) => ({
      ...s,
      cost: { ...s.cost },
      scaling: { ...s.scaling },
      effects: s.effects.map((e) => ({ ...e })),
    })),
    effects: hero.effects.map((e) => ({ ...e })),
  };
}

export function applyEffectToHero(
  hero: Hero,
  spec: SkillEffectSpec,
  sourceHeroId: string,
  effectId: string,
  forcedTargetHeroId?: string,
): Hero {
  const next = cloneHero(hero);

  if (spec.kind === 'shield') {
    const existing = next.effects.find((e) => e.kind === 'shield');
    if (existing) {
      existing.potency += spec.potency;
      existing.remainingTurns = Math.max(
        existing.remainingTurns,
        spec.durationTurns,
      );
      existing.sourceHeroId = sourceHeroId;
      return next;
    }
  }

  if (spec.kind === 'taunt' || spec.kind === 'stun' || spec.kind === 'slow' || spec.kind === 'haste' || spec.kind === 'bleed' || spec.kind === 'poison') {
    const existingIndex = next.effects.findIndex((e) => e.kind === spec.kind);
    if (existingIndex >= 0 && spec.kind !== 'bleed' && spec.kind !== 'poison') {
      const existing = next.effects[existingIndex];
      next.effects[existingIndex] = {
        ...existing,
        remainingTurns: Math.max(existing.remainingTurns, spec.durationTurns),
        potency: spec.potency,
        sourceHeroId,
        forcedTargetHeroId:
          spec.kind === 'taunt' ? forcedTargetHeroId : existing.forcedTargetHeroId,
      };
      return next;
    }
  }

  const effect: ActiveEffect = {
    id: effectId,
    kind: spec.kind,
    remainingTurns: spec.durationTurns,
    potency: spec.potency,
    sourceHeroId,
  };
  if (spec.kind === 'taunt' && forcedTargetHeroId) {
    effect.forcedTargetHeroId = forcedTargetHeroId;
  }
  next.effects = [...next.effects, effect];
  return next;
}

export interface DecayResult {
  hero: Hero;
  expired: ActiveEffect[];
}

export function decayEffects(hero: Hero): DecayResult {
  const expired: ActiveEffect[] = [];
  const remaining: ActiveEffect[] = [];
  for (const effect of hero.effects) {
    const nextTurns = effect.remainingTurns - 1;
    if (nextTurns <= 0) {
      expired.push(effect);
    } else {
      remaining.push({ ...effect, remainingTurns: nextTurns });
    }
  }
  return {
    hero: { ...hero, effects: remaining },
    expired,
  };
}

export function stripTauntsPointingTo(
  heroes: Hero[],
  deadHeroId: string,
): Hero[] {
  return heroes.map((hero) => ({
    ...hero,
    effects: hero.effects.filter(
      (e) => !(e.kind === 'taunt' && e.forcedTargetHeroId === deadHeroId),
    ),
  }));
}

export function getDotEffects(hero: Hero): ActiveEffect[] {
  return hero.effects.filter((e) => e.kind === 'bleed' || e.kind === 'poison');
}
