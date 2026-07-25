import {
  HASTE_SPEED_DELTA,
  SLOW_SPEED_DELTA,
} from '../../core/constants/effect.constants';
import type { Hero } from '../../models/rpg.interfaces';

export function tieBreakerEpsilon(heroId: string): number {
  let hash = 0;
  for (let i = 0; i < heroId.length; i += 1) {
    hash = (hash * 31 + heroId.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1e6;
}

export function computeInitiative(hero: Hero): number {
  let delta = 0;
  const hasHaste = hero.effects.some((e) => e.kind === 'haste');
  const hasSlow = hero.effects.some((e) => e.kind === 'slow');
  if (hasHaste) {
    delta += HASTE_SPEED_DELTA;
  }
  if (hasSlow) {
    delta += SLOW_SPEED_DELTA;
  }
  return hero.stats.speed + delta + tieBreakerEpsilon(hero.id);
}

export function computeSpeedScore(hero: Hero): number {
  let delta = 0;
  if (hero.effects.some((e) => e.kind === 'haste')) {
    delta += HASTE_SPEED_DELTA;
  }
  if (hero.effects.some((e) => e.kind === 'slow')) {
    delta += SLOW_SPEED_DELTA;
  }
  return hero.stats.speed + delta;
}

export function buildTurnQueue(heroes: Hero[]): string[] {
  const living = heroes.filter((h) => h.isAlive);
  const scored = living.map((hero) => ({
    hero,
    speedScore: computeSpeedScore(hero),
    epsilon: tieBreakerEpsilon(hero.id),
  }));

  scored.sort((a, b) => {
    if (b.speedScore !== a.speedScore) {
      return b.speedScore - a.speedScore;
    }
    if (a.hero.teamId !== b.hero.teamId) {
      return a.hero.teamId === 'alliance' ? -1 : 1;
    }
    if (a.hero.slotIndex !== b.hero.slotIndex) {
      return a.hero.slotIndex - b.hero.slotIndex;
    }
    return b.epsilon - a.epsilon;
  });

  return scored.map((entry) => entry.hero.id);
}

export function withUpdatedInitiatives(heroes: Hero[]): Hero[] {
  return heroes.map((hero) => ({
    ...hero,
    initiative: computeInitiative(hero),
  }));
}
