import type { ActionIntent, Hero } from '../../models/rpg.interfaces';
import { hasEffect, getTauntForcedTargetId } from '../combat/effect-engine';
import { highestThreatEnemy } from '../combat/targeting';
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

function focusTargetIds(actor: Hero, enemies: Hero[]): string[] {
  const forced = getTauntForcedTargetId(actor);
  if (forced && enemies.some((e) => e.id === forced && e.isAlive)) {
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

function shouldTaunt(view: AiBattleView): boolean {
  if (!canPay(view.actor, 'warrior.taunt')) {
    return false;
  }
  if (view.round === 1) {
    return true;
  }
  const anyTauntOnEnemies = view.enemies.some((enemy) =>
    enemy.effects.some(
      (e) =>
        e.kind === 'taunt' &&
        view.allies.some((ally) => ally.id === e.forcedTargetHeroId),
    ),
  );
  return !anyTauntOnEnemies;
}

export function chooseWarriorAction(view: AiBattleView): ActionIntent {
  const { actor, enemies } = view;
  if (shouldTaunt(view)) {
    const threat = highestThreatEnemy(actor, view.allHeroes);
    if (threat) {
      return {
        actorHeroId: actor.id,
        skillId: 'warrior.taunt',
        targetHeroIds: [threat.id],
      };
    }
  }

  const targets = focusTargetIds(actor, enemies);
  if (canPay(actor, 'warrior.power_strike')) {
    return {
      actorHeroId: actor.id,
      skillId: 'warrior.power_strike',
      targetHeroIds: targets,
    };
  }

  return {
    actorHeroId: actor.id,
    skillId: basicId(actor),
    targetHeroIds: targets,
  };
}

export function warriorFocusesLowestOrTaunt(
  actor: Hero,
  enemies: Hero[],
): string | null {
  const ids = focusTargetIds(actor, enemies);
  return ids[0] ?? null;
}

export function enemyHasTauntFromAllies(
  enemies: Hero[],
  allies: Hero[],
): boolean {
  return enemies.some((enemy) =>
    enemy.effects.some(
      (e) =>
        e.kind === 'taunt' &&
        allies.some((ally) => ally.id === e.forcedTargetHeroId),
    ),
  );
}

export { hasEffect };
