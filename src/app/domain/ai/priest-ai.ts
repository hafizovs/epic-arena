import type { ActionIntent, Hero } from '../../core/models/rpg.interfaces';
import { getTauntForcedTargetId, hasEffect } from '../combat/effect-engine';
import { ratio } from '../math/percent';
import type { AiBattleView } from './hero-ai';

function canPay(actor: Hero, skillId: string): boolean {
  const skill = actor.skills.find((s) => s.id === skillId);
  if (!skill) {
    return false;
  }
  return actor.resources.mana >= skill.cost.mana;
}

function basicId(actor: Hero): string {
  return actor.skills.find((s) => s.isBasicAttack)!.id;
}

function lowestAlly(allies: Hero[]): Hero | null {
  const sorted = [...allies].sort((a, b) => {
    const ra = ratio(a.resources.hp, a.stats.maxHp);
    const rb = ratio(b.resources.hp, b.stats.maxHp);
    if (ra !== rb) {
      return ra - rb;
    }
    return a.slotIndex - b.slotIndex;
  });
  return sorted[0] ?? null;
}

function lowestEnemy(actor: Hero, enemies: Hero[]): string[] {
  const forced = getTauntForcedTargetId(actor);
  if (forced && enemies.some((e) => e.id === forced)) {
    return [forced];
  }
  const sorted = [...enemies].sort((a, b) => {
    if (a.resources.hp !== b.resources.hp) {
      return a.resources.hp - b.resources.hp;
    }
    return a.slotIndex - b.slotIndex;
  });
  return sorted.length ? [sorted[0].id] : [];
}

export function choosePriestAction(view: AiBattleView): ActionIntent {
  const { actor, allies, enemies } = view;
  const lowest = lowestAlly(allies);

  if (lowest) {
    const hpRatio = ratio(lowest.resources.hp, lowest.stats.maxHp);
    if (hpRatio < 0.5 && canPay(actor, 'priest.heal')) {
      return {
        actorHeroId: actor.id,
        skillId: 'priest.heal',
        targetHeroIds: [lowest.id],
      };
    }
    if (
      hpRatio < 0.7 &&
      !hasEffect(lowest, 'shield') &&
      canPay(actor, 'priest.shield')
    ) {
      return {
        actorHeroId: actor.id,
        skillId: 'priest.shield',
        targetHeroIds: [lowest.id],
      };
    }
  }

  return {
    actorHeroId: actor.id,
    skillId: basicId(actor),
    targetHeroIds: lowestEnemy(actor, enemies),
  };
}
