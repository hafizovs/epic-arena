import { Injectable, inject } from '@angular/core';
import {
  ANIMATION_SPEED_MAX,
  ANIMATION_SPEED_MIN,
  DEFAULT_RNG_SEED,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
} from '../core/constants/battle.constants';
import { chooseAction } from '../domain/ai/hero-ai';
import {
  buildTurnQueue,
  withUpdatedInitiatives,
} from '../domain/combat/initiative';
import {
  decayEffects,
  hasEffect,
  stripTauntsPointingTo,
} from '../domain/combat/effect-engine';
import {
  applyDotTicks,
  resolveSkill,
} from '../domain/combat/skill-resolver';
import { clamp } from '../domain/math/clamp';
import {
  Mulberry32RandomSource,
  type RandomSource,
} from '../domain/math/rng';
import type {
  CombatEvent,
  FloatingMarker,
  Hero,
  TeamId,
} from '../models/rpg.interfaces';
import type { I18nKey } from '../i18n/i18n.keys';
import { BattleStore } from '../state/battle.store';
import { RosterStore } from '../state/roster.store';
import { HeroFactoryService } from './hero-factory.service';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class BattleEngineService {
  private readonly battleStore = inject(BattleStore);
  private readonly rosterStore = inject(RosterStore);
  private readonly heroFactory = inject(HeroFactoryService);
  private readonly i18n = inject(I18nService);

  private rng: RandomSource = new Mulberry32RandomSource(DEFAULT_RNG_SEED);
  private sequence = 0;
  private idCounter = 0;

  private nextId(prefix: string): string {
    this.idCounter += 1;
    return `${prefix}-${this.idCounter}`;
  }

  private formatMessage(
    key: string,
    params: Record<string, string | number>,
  ): string {
    const enriched = { ...params };
    if (typeof params['skill'] === 'string') {
      enriched['skillName'] = this.i18n.skillName(params['skill']);
    }
    if (typeof params['type'] === 'string') {
      const typeKey = params['type'];
      enriched['type'] =
        typeKey === 'physical'
          ? this.i18n.locale() === 'ru'
            ? 'физ.'
            : 'phys.'
          : typeKey === 'magical'
            ? this.i18n.locale() === 'ru'
              ? 'маг.'
              : 'mag.'
            : String(typeKey);
    }
    return this.i18n.t(key as I18nKey, enriched);
  }

  private markerText(
    variant: FloatingMarker['variant'],
    value?: number,
  ): string {
    switch (variant) {
      case 'damage':
        return `-${value ?? 0}`;
      case 'crit':
        return `-${value ?? 0} ${this.i18n.t('marker.crit')}`;
      case 'heal':
        return `+${value ?? 0}`;
      case 'miss':
        return this.i18n.t('marker.miss');
      case 'buff':
        return this.i18n.t('marker.buff.shield');
      case 'debuff':
        return this.i18n.t('marker.debuff.generic');
      default:
        return '';
    }
  }

  private pushSystemEvent(
    kind: CombatEvent['kind'],
    messageKey: I18nKey,
    params: Record<string, string | number>,
    colorToken: CombatEvent['colorToken'] = 'system',
  ): void {
    const event: CombatEvent = {
      id: this.nextId('evt'),
      at: this.sequence,
      round: this.battleStore.round(),
      kind,
      messageKey,
      messageParams: params,
      messageText: this.formatMessage(messageKey, params),
      colorToken,
    };
    this.sequence += 1;
    this.battleStore.appendEvents([event]);
  }

  prepareFromRoster(alliance: Hero[], horde: Hero[]): void {
    if (
      alliance.length < MIN_TEAM_SIZE ||
      alliance.length > MAX_TEAM_SIZE ||
      horde.length < MIN_TEAM_SIZE ||
      horde.length > MAX_TEAM_SIZE
    ) {
      throw new Error('Invalid team sizes');
    }

    const preparedAlliance = alliance.map((h) =>
      this.heroFactory.cloneHeroFullResources(h),
    );
    const preparedHorde = horde.map((h) =>
      this.heroFactory.cloneHeroFullResources(h),
    );
    const withInit = withUpdatedInitiatives([
      ...preparedAlliance,
      ...preparedHorde,
    ]);
    const a = withInit.filter((h) => h.teamId === 'alliance');
    const h = withInit.filter((h) => h.teamId === 'horde');

    this.rng = new Mulberry32RandomSource(this.battleStore.rngSeed());
    this.sequence = 0;
    this.idCounter = 0;
    this.battleStore.resetRuntime();
    this.battleStore.setTeams(a, h);
    this.battleStore.setTurnQueue(buildTurnQueue([...a, ...h]));
    this.battleStore.setPhase('setup');
  }

  start(): void {
    if (this.battleStore.phase() === 'finished') {
      return;
    }
    if (this.battleStore.phase() === 'setup') {
      const alliance = this.rosterStore.alliance();
      const horde = this.rosterStore.horde();
      this.prepareFromRoster(alliance, horde);
      this.pushSystemEvent('battleStart', 'log.battleStart', {});
      this.rosterStore.setBuilderCollapsed(true);
    }
    this.battleStore.setPhase('running');
  }

  pause(): void {
    if (this.battleStore.phase() === 'running') {
      this.battleStore.setPhase('paused');
    }
  }

  resume(): void {
    if (this.battleStore.phase() === 'paused') {
      this.battleStore.setPhase('running');
    }
  }

  setSpeed(speed: number): void {
    const clamped = clamp(speed, ANIMATION_SPEED_MIN, ANIMATION_SPEED_MAX);
    this.battleStore.setAnimationSpeed(clamped);
  }

  reset(): void {
    const alliance = this.rosterStore.alliance();
    const horde = this.rosterStore.horde();
    this.prepareFromRoster(alliance, horde);
    this.rosterStore.setBuilderCollapsed(false);
  }

  private getAllHeroes(): Hero[] {
    return [...this.battleStore.alliance(), ...this.battleStore.horde()];
  }

  private commitHeroes(heroes: Hero[]): void {
    let result = heroes;
    for (const dead of heroes.filter((h) => !h.isAlive)) {
      result = stripTauntsPointingTo(result, dead.id);
    }
    this.battleStore.setHeroes(withUpdatedInitiatives(result));
  }

  private checkVictory(): boolean {
    const allianceAlive = this.battleStore.alliance().some((h) => h.isAlive);
    const hordeAlive = this.battleStore.horde().some((h) => h.isAlive);

    if (allianceAlive && hordeAlive) {
      return false;
    }

    let winner: TeamId | null = null;
    if (allianceAlive && !hordeAlive) {
      winner = 'alliance';
    } else if (hordeAlive && !allianceAlive) {
      winner = 'horde';
    }

    this.battleStore.setWinner(winner);
    this.battleStore.setPhase('finished');
    this.battleStore.setActiveHeroId(null);

    if (winner) {
      this.pushSystemEvent('battleEnd', 'log.battleEnd.win', {
        winner: this.i18n.t(
          winner === 'alliance' ? 'arena.alliance' : 'arena.horde',
        ),
      });
    } else {
      this.pushSystemEvent('battleEnd', 'log.battleEnd.draw', {});
    }
    return true;
  }

  private makeCtx() {
    return {
      round: this.battleStore.round(),
      sequence: this.sequence,
      locale: this.i18n.locale(),
      formatMessage: (key: string, params: Record<string, string | number>) =>
        this.formatMessage(key, params),
      nextId: (prefix: string) => this.nextId(prefix),
      markerText: (variant: FloatingMarker['variant'], value?: number) =>
        this.markerText(variant, value),
    };
  }

  advanceOneStep(): void {
    if (this.battleStore.phase() === 'finished') {
      return;
    }
    if (this.battleStore.phase() === 'setup') {
      return;
    }

    let queue = [...this.battleStore.turnQueue()];
    let heroes = this.getAllHeroes();

    if (queue.length === 0) {
      const nextRound = this.battleStore.round() + 1;
      this.battleStore.setRound(nextRound);
      heroes = withUpdatedInitiatives(heroes);
      this.commitHeroes(heroes);
      queue = buildTurnQueue(heroes);
      this.battleStore.setTurnQueue(queue);
      this.pushSystemEvent('roundStart', 'log.roundStart', {
        round: nextRound,
      });
      if (queue.length === 0) {
        this.checkVictory();
        return;
      }
      return;
    }

    const activeId = queue.shift()!;
    this.battleStore.setTurnQueue(queue);
    this.battleStore.setActiveHeroId(activeId);

    let actor = heroes.find((h) => h.id === activeId);
    if (!actor || !actor.isAlive) {
      return;
    }

    this.pushSystemEvent('turnStart', 'log.turnStart', {
      round: this.battleStore.round(),
      actor: actor.name,
    });

    const ctx = this.makeCtx();
    const dotResult = applyDotTicks(actor, heroes, this.rng, ctx);
    this.sequence = dotResult.sequence;
    heroes = dotResult.heroes;
    this.battleStore.appendEvents(dotResult.events);
    this.battleStore.addMarkers(dotResult.markers);
    this.commitHeroes(heroes);

    actor = heroes.find((h) => h.id === activeId);
    if (!actor || !actor.isAlive) {
      this.checkVictory();
      return;
    }

    const currentActor = actor;

    if (hasEffect(currentActor, 'stun')) {
      this.pushSystemEvent('stunSkip', 'log.stunSkip', {
        round: this.battleStore.round(),
        actor: currentActor.name,
      });
      const decay = decayEffects(currentActor);
      heroes = heroes.map((h) =>
        h.id === currentActor.id ? decay.hero : h,
      );
      for (const expired of decay.expired) {
        this.pushSystemEvent('effectExpire', 'log.effect.expire', {
          round: this.battleStore.round(),
          target: currentActor.name,
          effect: this.i18n.effectName(expired.kind),
        });
      }
      this.commitHeroes(heroes);
      this.checkVictory();
      return;
    }

    const allies = heroes.filter(
      (h) => h.teamId === currentActor.teamId && h.isAlive,
    );
    const enemies = heroes.filter(
      (h) => h.teamId !== currentActor.teamId && h.isAlive,
    );
    const intent = chooseAction({
      actor: currentActor,
      allies,
      enemies,
      allHeroes: heroes,
      round: this.battleStore.round(),
    });

    const skillCtx = this.makeCtx();
    const resolved = resolveSkill(intent, heroes, this.rng, skillCtx);
    this.sequence = resolved.sequence;
    heroes = resolved.heroes;
    this.battleStore.appendEvents(resolved.events);
    this.battleStore.addMarkers(resolved.markers);

    const afterActor = heroes.find((h) => h.id === activeId);
    if (afterActor) {
      const decay = decayEffects(afterActor);
      heroes = heroes.map((h) => (h.id === afterActor.id ? decay.hero : h));
      for (const expired of decay.expired) {
        this.pushSystemEvent('effectExpire', 'log.effect.expire', {
          round: this.battleStore.round(),
          target: afterActor.name,
          effect: this.i18n.effectName(expired.kind),
        });
      }
    }

    this.commitHeroes(heroes);
    this.battleStore.pruneExpiredMarkers();
    this.checkVictory();
  }
}
