import { Injectable, computed, signal } from '@angular/core';
import {
  ANIMATION_SPEED_DEFAULT,
  DEFAULT_RNG_SEED,
  MAX_LOG_EVENTS,
  MARKER_TTL_MS,
} from '../../core/constants/battle.constants';
import type {
  BattlePhase,
  CombatEvent,
  FloatingMarker,
  Hero,
  TeamId,
} from '../../core/models/rpg.interfaces';

@Injectable({ providedIn: 'root' })
export class BattleStore {
  readonly phase = signal<BattlePhase>('setup');
  readonly round = signal(1);
  readonly alliance = signal<Hero[]>([]);
  readonly horde = signal<Hero[]>([]);
  readonly turnQueue = signal<string[]>([]);
  readonly activeHeroId = signal<string | null>(null);
  readonly winnerTeamId = signal<TeamId | null>(null);
  readonly events = signal<CombatEvent[]>([]);
  readonly markers = signal<FloatingMarker[]>([]);
  readonly animationSpeed = signal(ANIMATION_SPEED_DEFAULT);
  readonly rngSeed = signal(DEFAULT_RNG_SEED);
  readonly hitTokens = signal<Record<string, number>>({});

  readonly allHeroes = computed(() => [
    ...this.alliance(),
    ...this.horde(),
  ]);

  readonly aliveAllianceCount = computed(
    () => this.alliance().filter((h) => h.isAlive).length,
  );
  readonly aliveHordeCount = computed(
    () => this.horde().filter((h) => h.isAlive).length,
  );

  setPhase(phase: BattlePhase): void {
    this.phase.set(phase);
  }

  setRound(round: number): void {
    this.round.set(round);
  }

  setTeams(alliance: Hero[], horde: Hero[]): void {
    this.alliance.set(alliance);
    this.horde.set(horde);
  }

  setHeroes(heroes: Hero[]): void {
    this.alliance.set(heroes.filter((h) => h.teamId === 'alliance'));
    this.horde.set(heroes.filter((h) => h.teamId === 'horde'));
  }

  setTurnQueue(queue: string[]): void {
    this.turnQueue.set(queue);
  }

  setActiveHeroId(id: string | null): void {
    this.activeHeroId.set(id);
  }

  setWinner(teamId: TeamId | null): void {
    this.winnerTeamId.set(teamId);
  }

  appendEvents(events: CombatEvent[]): void {
    if (events.length === 0) {
      return;
    }
    this.events.update((current) => {
      const merged = [...current, ...events];
      if (merged.length <= MAX_LOG_EVENTS) {
        return merged;
      }
      return merged.slice(merged.length - MAX_LOG_EVENTS);
    });
  }

  clearEvents(): void {
    this.events.set([]);
  }

  addMarkers(markers: FloatingMarker[]): void {
    if (markers.length === 0) {
      return;
    }
    this.markers.update((current) => [...current, ...markers]);
    for (const marker of markers) {
      if (
        marker.variant === 'damage' ||
        marker.variant === 'crit' ||
        marker.variant === 'heal'
      ) {
        this.hitTokens.update((tokens) => ({
          ...tokens,
          [marker.heroId]: (tokens[marker.heroId] ?? 0) + 1,
        }));
      }
    }
  }

  removeMarker(id: string): void {
    this.markers.update((current) => current.filter((m) => m.id !== id));
  }

  pruneExpiredMarkers(now = Date.now()): void {
    this.markers.update((current) =>
      current.filter((m) => now - m.createdAt < MARKER_TTL_MS),
    );
  }

  clearMarkers(): void {
    this.markers.set([]);
  }

  setAnimationSpeed(speed: number): void {
    this.animationSpeed.set(speed);
  }

  setRngSeed(seed: number): void {
    this.rngSeed.set(seed);
  }

  resetRuntime(): void {
    this.phase.set('setup');
    this.round.set(1);
    this.turnQueue.set([]);
    this.activeHeroId.set(null);
    this.winnerTeamId.set(null);
    this.events.set([]);
    this.markers.set([]);
    this.hitTokens.set({});
  }
}
