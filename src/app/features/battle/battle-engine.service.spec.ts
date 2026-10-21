import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { BattleEngineService } from './battle-engine.service';
import { HeroFactoryService } from '../roster/hero-factory.service';
import { I18nService } from '../../core/i18n.service';
import { BattleStore } from './battle.store';
import { RosterStore } from '../roster/roster.store';
import { UiStore } from '../../core/ui/ui.store';
import { DEFAULT_STATS_BY_CLASS } from '../../core/constants/hero-stats.constants';
import { SKILLS_BY_CLASS } from '../../core/constants/skill.constants';
import type { Hero } from '../../core/models/rpg.interfaces';

function makeHero(
  id: string,
  teamId: 'alliance' | 'horde',
  classId: Hero['classId'],
  slotIndex: number,
  overrides: Partial<Hero> = {},
): Hero {
  const stats = { ...DEFAULT_STATS_BY_CLASS[classId], ...(overrides.stats ?? {}) };
  return {
    id,
    name: id,
    classId,
    teamId,
    slotIndex,
    stats,
    resources: overrides.resources ?? { hp: stats.maxHp, mana: stats.maxMana },
    skills: SKILLS_BY_CLASS[classId],
    effects: overrides.effects ?? [],
    isAlive: (overrides.resources?.hp ?? stats.maxHp) > 0,
    initiative: stats.speed,
  };
}

describe('BattleEngineService', () => {
  let engine: BattleEngineService;
  let battle: BattleStore;
  let roster: RosterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        BattleEngineService,
        HeroFactoryService,
        I18nService,
        BattleStore,
        RosterStore,
        UiStore,
      ],
    });
    engine = TestBed.inject(BattleEngineService);
    battle = TestBed.inject(BattleStore);
    roster = TestBed.inject(RosterStore);
  });

  it('reaches victory when one team is wiped', () => {
    const alliance = [
      makeHero('a0', 'alliance', 'warrior', 0, {
        stats: {
          ...DEFAULT_STATS_BY_CLASS.warrior,
          speed: 100,
          physicalAttack: 200,
          critChance: 0,
          dodgeChance: 0,
        },
      }),
      makeHero('a1', 'alliance', 'warrior', 1, {
        stats: {
          ...DEFAULT_STATS_BY_CLASS.warrior,
          speed: 99,
          physicalAttack: 200,
          critChance: 0,
          dodgeChance: 0,
        },
      }),
      makeHero('a2', 'alliance', 'warrior', 2, {
        stats: {
          ...DEFAULT_STATS_BY_CLASS.warrior,
          speed: 98,
          physicalAttack: 200,
          critChance: 0,
          dodgeChance: 0,
        },
      }),
    ];
    const horde = [
      makeHero('h0', 'horde', 'mage', 0, {
        resources: { hp: 1, mana: 0 },
        stats: {
          ...DEFAULT_STATS_BY_CLASS.mage,
          speed: 1,
          dodgeChance: 0,
          armorPercent: 0,
          magicResistPercent: 0,
        },
      }),
      makeHero('h1', 'horde', 'mage', 1, {
        resources: { hp: 1, mana: 0 },
        stats: {
          ...DEFAULT_STATS_BY_CLASS.mage,
          speed: 1,
          dodgeChance: 0,
          armorPercent: 0,
          magicResistPercent: 0,
        },
      }),
      makeHero('h2', 'horde', 'mage', 2, {
        resources: { hp: 1, mana: 0 },
        stats: {
          ...DEFAULT_STATS_BY_CLASS.mage,
          speed: 1,
          dodgeChance: 0,
          armorPercent: 0,
          magicResistPercent: 0,
        },
      }),
    ];
    roster.setBoth(alliance, horde);
    engine.prepareFromRoster(alliance, horde);
    engine.start();

    let guard = 0;
    while (battle.phase() !== 'finished' && guard < 200) {
      engine.advanceOneStep();
      guard += 1;
    }

    expect(battle.phase()).toBe('finished');
    expect(battle.winnerTeamId()).toBe('alliance');
  });

  it('skips turn when hero is stunned', () => {
    const alliance = [
      makeHero('a0', 'alliance', 'warrior', 0, {
        effects: [
          {
            id: 'stun1',
            kind: 'stun',
            remainingTurns: 1,
            potency: 0,
            sourceHeroId: 'h0',
          },
        ],
        stats: { ...DEFAULT_STATS_BY_CLASS.warrior, speed: 100 },
      }),
      makeHero('a1', 'alliance', 'mage', 1, {
        stats: { ...DEFAULT_STATS_BY_CLASS.mage, speed: 1 },
      }),
      makeHero('a2', 'alliance', 'priest', 2, {
        stats: { ...DEFAULT_STATS_BY_CLASS.priest, speed: 1 },
      }),
    ];
    const horde = [
      makeHero('h0', 'horde', 'warrior', 0, {
        stats: { ...DEFAULT_STATS_BY_CLASS.warrior, speed: 1 },
      }),
      makeHero('h1', 'horde', 'mage', 1, {
        stats: { ...DEFAULT_STATS_BY_CLASS.mage, speed: 1 },
      }),
      makeHero('h2', 'horde', 'archer', 2, {
        stats: { ...DEFAULT_STATS_BY_CLASS.archer, speed: 1 },
      }),
    ];
    roster.setBoth(alliance, horde);
    engine.prepareFromRoster(alliance, horde);
    engine.start();

    const stunnedAlliance = battle.alliance().map((h, i) =>
      i === 0
        ? {
            ...h,
            effects: [
              {
                id: 'stun1',
                kind: 'stun' as const,
                remainingTurns: 1,
                potency: 0,
                sourceHeroId: 'h0',
              },
            ],
          }
        : h,
    );
    battle.setTeams(stunnedAlliance, battle.horde());
    battle.setTurnQueue([stunnedAlliance[0].id]);
    engine.advanceOneStep();

    const stunEvents = battle.events().filter((e) => e.kind === 'stunSkip');
    expect(stunEvents.length).toBeGreaterThan(0);
  });
});
