import type { Hero, SkillTargetMode } from '../../models/rpg.interfaces';
import { ratio } from '../math/percent';
import { getTauntForcedTargetId } from './effect-engine';

function livingEnemies(actor: Hero, all: Hero[]): Hero[] {
  return all
    .filter((h) => h.isAlive && h.teamId !== actor.teamId)
    .sort((a, b) => a.slotIndex - b.slotIndex);
}

function livingAllies(actor: Hero, all: Hero[]): Hero[] {
  return all
    .filter((h) => h.isAlive && h.teamId === actor.teamId)
    .sort((a, b) => a.slotIndex - b.slotIndex);
}

function lowestHpEnemy(actor: Hero, all: Hero[]): Hero[] {
  const enemies = livingEnemies(actor, all);
  if (enemies.length === 0) {
    return [];
  }
  enemies.sort((a, b) => {
    if (a.resources.hp !== b.resources.hp) {
      return a.resources.hp - b.resources.hp;
    }
    return a.slotIndex - b.slotIndex;
  });
  return [enemies[0]];
}

function lowestHpAlly(actor: Hero, all: Hero[]): Hero[] {
  const allies = livingAllies(actor, all);
  if (allies.length === 0) {
    return [];
  }
  allies.sort((a, b) => {
    const ra = ratio(a.resources.hp, a.stats.maxHp);
    const rb = ratio(b.resources.hp, b.stats.maxHp);
    if (ra !== rb) {
      return ra - rb;
    }
    if (a.id === actor.id) {
      return -1;
    }
    if (b.id === actor.id) {
      return 1;
    }
    return a.slotIndex - b.slotIndex;
  });
  return [allies[0]];
}

export function resolveTargets(
  mode: SkillTargetMode,
  actor: Hero,
  allHeroes: Hero[],
  preferredTargetIds: string[] = [],
): Hero[] {
  switch (mode) {
    case 'self':
      return actor.isAlive ? [actor] : [];
    case 'singleEnemy': {
      if (preferredTargetIds.length > 0) {
        const preferred = allHeroes.find(
          (h) => h.id === preferredTargetIds[0] && h.isAlive && h.teamId !== actor.teamId,
        );
        if (preferred) {
          return [preferred];
        }
      }
      return lowestHpEnemy(actor, allHeroes);
    }
    case 'lowestHpEnemy':
      return lowestHpEnemy(actor, allHeroes);
    case 'lowestHpAlly':
      return lowestHpAlly(actor, allHeroes);
    case 'allEnemies':
      return livingEnemies(actor, allHeroes);
    case 'allAllies':
      return livingAllies(actor, allHeroes);
    case 'taunterOrLowestHpEnemy': {
      const forcedId = getTauntForcedTargetId(actor);
      if (forcedId) {
        const forced = allHeroes.find((h) => h.id === forcedId && h.isAlive);
        if (forced) {
          return [forced];
        }
      }
      return lowestHpEnemy(actor, allHeroes);
    }
    default:
      return [];
  }
}

export function highestThreatEnemy(actor: Hero, all: Hero[]): Hero | null {
  const enemies = livingEnemies(actor, all);
  if (enemies.length === 0) {
    return null;
  }
  enemies.sort((a, b) => {
    const threatA = Math.max(a.stats.physicalAttack, a.stats.magicalPower);
    const threatB = Math.max(b.stats.physicalAttack, b.stats.magicalPower);
    if (threatB !== threatA) {
      return threatB - threatA;
    }
    return a.slotIndex - b.slotIndex;
  });
  return enemies[0];
}

export function fastestEnemy(actor: Hero, all: Hero[]): Hero | null {
  const enemies = livingEnemies(actor, all);
  if (enemies.length === 0) {
    return null;
  }
  enemies.sort((a, b) => {
    if (b.stats.speed !== a.stats.speed) {
      return b.stats.speed - a.stats.speed;
    }
    return a.slotIndex - b.slotIndex;
  });
  return enemies[0];
}
