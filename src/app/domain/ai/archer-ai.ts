import type { ActionIntent, Hero } from '../../core/models/rpg.interfaces';
import { getTauntForcedTargetId, hasEffect } from '../combat/effect-engine';
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

function focusTarget(actor: Hero, enemies: Hero[]): Hero | null {
  const forced = getTauntForcedTargetId(actor);
  if (forced) {
    const found = enemies.find((e) => e.id === forced && e.isAlive);
    if (found) {
      return found;
    }
  }
  const sorted = [...enemies].sort((a, b) => {
    if (a.resources.hp !== b.resources.hp) {
      return a.resources.hp - b.resources.hp;
    }
    return a.slotIndex - b.slotIndex;
  });
  return sorted[0] ?? null;
}

export function chooseArcherAction(view: AiBattleView): ActionIntent {
  const { actor, enemies } = view;
  const target = focusTarget(actor, enemies);

  if (
    target &&
    canPay(actor, 'archer.puncturing_shot') &&
    !hasEffect(target, 'bleed')
  ) {
    return {
      actorHeroId: actor.id,
      skillId: 'archer.puncturing_shot',
      targetHeroIds: [target.id],
    };
  }

  if (enemies.length >= 2 && canPay(actor, 'archer.volley')) {
    return {
      actorHeroId: actor.id,
      skillId: 'archer.volley',
      targetHeroIds: enemies.map((e) => e.id),
    };
  }

  if (target && canPay(actor, 'archer.puncturing_shot')) {
    return {
      actorHeroId: actor.id,
      skillId: 'archer.puncturing_shot',
      targetHeroIds: [target.id],
    };
  }

  return {
    actorHeroId: actor.id,
    skillId: basicId(actor),
    targetHeroIds: target ? [target.id] : [],
  };
}
