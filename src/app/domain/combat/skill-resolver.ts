import type {
  ActionIntent,
  ActiveEffect,
  CombatEvent,
  FloatingMarker,
  Hero,
  Skill,
  SkillEffectSpec,
} from '../../core/models/rpg.interfaces';
import type { RandomSource } from '../math/rng';
import {
  computeRawPower,
  resolveDamageHit,
  resolveHeal,
} from './damage.formulas';
import {
  applyEffectToHero,
  cloneHero,
} from './effect-engine';
import { resolveTargets } from './targeting';

export interface SkillResolveContext {
  round: number;
  sequence: number;
  locale: 'ru' | 'en';
  formatMessage: (
    key: string,
    params: Record<string, string | number>,
  ) => string;
  nextId: (prefix: string) => string;
  markerText: (
    variant: FloatingMarker['variant'],
    value?: number,
  ) => string;
}

export interface SkillResolveResult {
  heroes: Hero[];
  events: CombatEvent[];
  markers: FloatingMarker[];
  sequence: number;
}

function findHero(heroes: Hero[], id: string): Hero | undefined {
  return heroes.find((h) => h.id === id);
}

function replaceHero(heroes: Hero[], updated: Hero): Hero[] {
  return heroes.map((h) => (h.id === updated.id ? updated : h));
}

function canPay(actor: Hero, skill: Skill): boolean {
  return actor.resources.mana >= skill.cost.mana;
}

function getBasicSkill(actor: Hero): Skill {
  const basic = actor.skills.find((s) => s.isBasicAttack);
  if (!basic) {
    throw new Error(`Hero ${actor.id} has no basic attack`);
  }
  return basic;
}

function pushEvent(
  events: CombatEvent[],
  ctx: SkillResolveContext,
  partial: Omit<CombatEvent, 'id' | 'at' | 'round' | 'messageText'> & {
    messageText?: string;
  },
): CombatEvent {
  const messageText =
    partial.messageText ??
    ctx.formatMessage(partial.messageKey, partial.messageParams ?? {});
  const event: CombatEvent = {
    id: ctx.nextId('evt'),
    at: ctx.sequence,
    round: ctx.round,
    kind: partial.kind,
    actorHeroId: partial.actorHeroId,
    targetHeroIds: partial.targetHeroIds,
    skillId: partial.skillId,
    messageKey: partial.messageKey,
    messageParams: partial.messageParams,
    messageText,
    colorToken: partial.colorToken,
    numericValue: partial.numericValue,
    meta: partial.meta,
  };
  events.push(event);
  ctx.sequence += 1;
  return event;
}

function applyChance(
  spec: SkillEffectSpec,
  rng: RandomSource,
): boolean {
  const chance = spec.chance ?? 1;
  return rng.next() < chance;
}

export function resolveSkill(
  intent: ActionIntent,
  heroesIn: Hero[],
  rng: RandomSource,
  ctx: SkillResolveContext,
): SkillResolveResult {
  let heroes = heroesIn.map(cloneHero);
  const events: CombatEvent[] = [];
  const markers: FloatingMarker[] = [];

  let actor = findHero(heroes, intent.actorHeroId);
  if (!actor || !actor.isAlive) {
    return { heroes, events, markers, sequence: ctx.sequence };
  }

  let skill =
    actor.skills.find((s) => s.id === intent.skillId) ??
    getBasicSkill(actor);

  if (!canPay(actor, skill)) {
    skill = getBasicSkill(actor);
    pushEvent(events, ctx, {
      kind: 'system',
      actorHeroId: actor.id,
      messageKey: 'log.system.manaFallback',
      messageParams: { actor: actor.name },
      colorToken: 'system',
    });
  }

  actor = {
    ...actor,
    resources: {
      ...actor.resources,
      mana: Math.max(0, actor.resources.mana - skill.cost.mana),
    },
  };
  heroes = replaceHero(heroes, actor);

  const targets = resolveTargets(
    skill.targetMode,
    actor,
    heroes,
    intent.targetHeroIds,
  );

  pushEvent(events, ctx, {
    kind: skill.isBasicAttack ? 'basicAttack' : 'skill',
    actorHeroId: actor.id,
    targetHeroIds: targets.map((t) => t.id),
    skillId: skill.id,
    messageKey: skill.isAoe ? 'log.skill.aoe' : 'log.skill.cast',
    messageParams: {
      round: ctx.round,
      actor: actor.name,
      classId: actor.classId,
      skill: skill.id,
      targets: targets.map((t) => t.name).join(', '),
    },
    colorToken: 'system',
  });

  const isDamageSkill =
    skill.damageType === 'physical' ||
    skill.damageType === 'magical' ||
    skill.damageType === 'true';
  const isHealSkill = skill.damageType === 'heal';
  const isEffectOnly =
    skill.id === 'priest.shield' ||
    (skill.scaling.physicalCoefficient === 0 &&
      skill.scaling.magicalCoefficient === 0 &&
      skill.scaling.flatPower === 0 &&
      skill.effects.length > 0 &&
      !isDamageSkill);

  for (const target of targets) {
    let currentTarget = findHero(heroes, target.id);
    if (!currentTarget || !currentTarget.isAlive) {
      continue;
    }

    if (isHealSkill && skill.id !== 'priest.shield') {
      const heal = resolveHeal(currentTarget, skill.scaling, actor);
      heroes = replaceHero(heroes, heal.updatedTarget);
      pushEvent(events, ctx, {
        kind: 'heal',
        actorHeroId: actor.id,
        targetHeroIds: [currentTarget.id],
        skillId: skill.id,
        messageKey: 'log.heal',
        messageParams: {
          round: ctx.round,
          actor: actor.name,
          target: currentTarget.name,
          amount: heal.healAmount,
        },
        colorToken: 'heal',
        numericValue: heal.healAmount,
      });
      markers.push({
        id: ctx.nextId('mk'),
        heroId: currentTarget.id,
        text: ctx.markerText('heal', heal.healAmount),
        variant: 'heal',
        createdAt: Date.now(),
      });
      currentTarget = heal.updatedTarget;
    } else if (isDamageSkill && !(isEffectOnly && skill.id === 'warrior.taunt' && skill.scaling.physicalCoefficient === 0)) {
      const raw = computeRawPower(
        skill.scaling,
        actor.stats.physicalAttack,
        actor.stats.magicalPower,
      );
      const hit = resolveDamageHit(
        {
          actor,
          target: currentTarget,
          damageType: skill.damageType,
          rawPower: raw,
        },
        rng,
      );
      heroes = replaceHero(heroes, hit.updatedTarget);
      currentTarget = hit.updatedTarget;

      if (hit.wasDodge) {
        pushEvent(events, ctx, {
          kind: 'miss',
          actorHeroId: actor.id,
          targetHeroIds: [target.id],
          skillId: skill.id,
          messageKey: 'log.miss',
          messageParams: {
            round: ctx.round,
            actor: actor.name,
            target: target.name,
          },
          colorToken: 'miss',
          meta: { wasDodge: true },
        });
        markers.push({
          id: ctx.nextId('mk'),
          heroId: target.id,
          text: ctx.markerText('miss'),
          variant: 'miss',
          createdAt: Date.now(),
        });
      } else {
        pushEvent(events, ctx, {
          kind: hit.wasCrit ? 'crit' : 'damage',
          actorHeroId: actor.id,
          targetHeroIds: [target.id],
          skillId: skill.id,
          messageKey: hit.wasCrit ? 'log.damage.crit' : 'log.damage',
          messageParams: {
            round: ctx.round,
            actor: actor.name,
            target: target.name,
            damage: hit.finalDamage,
            mitigated: hit.mitigated,
            absorbed: hit.absorbedByShield,
            type: skill.damageType,
          },
          colorToken: hit.wasCrit ? 'crit' : 'damage',
          numericValue: hit.finalDamage,
          meta: {
            rawDamage: Math.floor(hit.rawBeforeMitigation + 1e-9),
            mitigated: hit.mitigated,
            wasCrit: hit.wasCrit,
            absorbedByShield: hit.absorbedByShield,
          },
        });
        if (hit.finalDamage > 0 || hit.absorbedByShield > 0) {
          const shown = hit.finalDamage > 0 ? hit.finalDamage : hit.absorbedByShield;
          markers.push({
            id: ctx.nextId('mk'),
            heroId: target.id,
            text: ctx.markerText(hit.wasCrit ? 'crit' : 'damage', shown),
            variant: hit.wasCrit ? 'crit' : 'damage',
            createdAt: Date.now(),
          });
        }
        if (!hit.updatedTarget.isAlive) {
          pushEvent(events, ctx, {
            kind: 'death',
            actorHeroId: actor.id,
            targetHeroIds: [target.id],
            messageKey: 'log.death',
            messageParams: { target: target.name, round: ctx.round },
            colorToken: 'system',
          });
        }
      }
    }

    for (const spec of skill.effects) {
      currentTarget = findHero(heroes, target.id);
      if (!currentTarget || !currentTarget.isAlive) {
        break;
      }
      if (!applyChance(spec, rng)) {
        continue;
      }
      const forced =
        spec.kind === 'taunt' ? actor.id : undefined;
      const updated = applyEffectToHero(
        currentTarget,
        spec,
        actor.id,
        ctx.nextId('fx'),
        forced,
      );
      heroes = replaceHero(heroes, updated);
      const isBuff =
        spec.kind === 'shield' || spec.kind === 'haste';
      pushEvent(events, ctx, {
        kind: 'effectApply',
        actorHeroId: actor.id,
        targetHeroIds: [target.id],
        skillId: skill.id,
        messageKey: `log.effect.apply.${spec.kind}`,
        messageParams: {
          round: ctx.round,
          actor: actor.name,
          target: target.name,
          turns: spec.durationTurns,
          potency: spec.potency,
        },
        colorToken: isBuff ? 'buff' : 'debuff',
      });
      markers.push({
        id: ctx.nextId('mk'),
        heroId: target.id,
        text: ctx.markerText(isBuff ? 'buff' : 'debuff'),
        variant: isBuff ? 'buff' : 'debuff',
        createdAt: Date.now(),
      });
    }
  }

  // Taunt skill still deals its scaled damage — already handled if physicalCoefficient > 0
  if (skill.id === 'warrior.taunt') {
    for (const target of targets) {
      const currentTarget = findHero(heroes, target.id);
      if (!currentTarget) {
        continue;
      }
      // Ensure taunt applied even if damage path skipped effect somehow
      if (!currentTarget.effects.some((e) => e.kind === 'taunt' && e.forcedTargetHeroId === actor.id)) {
        const updated = applyEffectToHero(
          currentTarget,
          { kind: 'taunt', durationTurns: 2, potency: 0 },
          actor.id,
          ctx.nextId('fx'),
          actor.id,
        );
        heroes = replaceHero(heroes, updated);
      }
    }
  }

  return { heroes, events, markers, sequence: ctx.sequence };
}

export function applyDotTicks(
  actor: Hero,
  heroesIn: Hero[],
  rng: RandomSource,
  ctx: SkillResolveContext,
): SkillResolveResult {
  let heroes = heroesIn.map(cloneHero);
  const events: CombatEvent[] = [];
  const markers: FloatingMarker[] = [];
  let current = findHero(heroes, actor.id);
  if (!current) {
    return { heroes, events, markers, sequence: ctx.sequence };
  }

  const dots = current.effects.filter(
    (e): e is ActiveEffect => e.kind === 'bleed' || e.kind === 'poison',
  );

  for (const dot of dots) {
    current = findHero(heroes, actor.id);
    if (!current || !current.isAlive) {
      break;
    }
    const source =
      findHero(heroes, dot.sourceHeroId) ?? current;
    const damageType = dot.kind === 'bleed' ? 'physical' : 'magical';
    const hit = resolveDamageHit(
      {
        actor: source,
        target: current,
        damageType,
        rawPower: dot.potency,
        skipDodge: true,
        skipCrit: true,
      },
      rng,
    );
    heroes = replaceHero(heroes, hit.updatedTarget);
    current = hit.updatedTarget;
    pushEvent(events, ctx, {
      kind: 'effectTick',
      actorHeroId: source.id,
      targetHeroIds: [actor.id],
      messageKey: `log.effect.tick.${dot.kind}`,
      messageParams: {
        round: ctx.round,
        target: actor.name,
        damage: hit.finalDamage,
        absorbed: hit.absorbedByShield,
      },
      colorToken: 'damage',
      numericValue: hit.finalDamage,
      meta: {
        mitigated: hit.mitigated,
        absorbedByShield: hit.absorbedByShield,
      },
    });
    if (hit.finalDamage > 0) {
      markers.push({
        id: ctx.nextId('mk'),
        heroId: actor.id,
        text: ctx.markerText('damage', hit.finalDamage),
        variant: 'damage',
        createdAt: Date.now(),
      });
    }
    if (!hit.updatedTarget.isAlive) {
      pushEvent(events, ctx, {
        kind: 'death',
        targetHeroIds: [actor.id],
        messageKey: 'log.death',
        messageParams: { target: actor.name, round: ctx.round },
        colorToken: 'system',
      });
      break;
    }
  }

  return { heroes, events, markers, sequence: ctx.sequence };
}
