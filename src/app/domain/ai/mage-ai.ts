import type { ActionIntent, Hero } from '../../models/rpg.interfaces';
import { hasEffect } from '../combat/effect-engine';
import { fastestEnemy } from '../combat/targeting';
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

function lowestEnemyId(enemies: Hero[]): string[] {
  const sorted = [...enemies].sort((a, b) => {
    if (a.resources.hp !== b.resources.hp) {
      return a.resources.hp - b.resources.hp;
    }
    return a.slotIndex - b.slotIndex;
  });
  return sorted.length ? [sorted[0].id] : [];
}

export function chooseMageAction(view: AiBattleView): ActionIntent {
  const { actor, enemies } = view;
  const fullMana = actor.resources.mana === actor.stats.maxMana;

  if (fullMana && canPay(actor, 'mage.fireball') && enemies.length > 0) {
    return {
      actorHeroId: actor.id,
      skillId: 'mage.fireball',
      targetHeroIds: enemies.map((e) => e.id),
    };
  }

  const fastest = fastestEnemy(actor, view.allHeroes);
  if (
    fastest &&
    canPay(actor, 'mage.frostbolt') &&
    !hasEffect(fastest, 'slow')
  ) {
    return {
      actorHeroId: actor.id,
      skillId: 'mage.frostbolt',
      targetHeroIds: [fastest.id],
    };
  }

  if (enemies.length >= 2 && canPay(actor, 'mage.fireball')) {
    return {
      actorHeroId: actor.id,
      skillId: 'mage.fireball',
      targetHeroIds: enemies.map((e) => e.id),
    };
  }

  return {
    actorHeroId: actor.id,
    skillId: basicId(actor),
    targetHeroIds: lowestEnemyId(enemies),
  };
}
