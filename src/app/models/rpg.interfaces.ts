import type { HeroClassId } from '../core/models/hero-class.model';
import type { TeamId } from '../core/models/team-id.model';
import type { DamageType } from '../core/models/damage-type.model';
import type { EffectKind } from '../core/models/effect-kind.model';
import type { CombatEventKind } from '../core/models/combat-event-kind.model';
import type { BattlePhase } from '../core/models/battle-phase.model';
import type { FloatingMarker } from '../core/models/floating-marker.model';
import type { ThemeId } from '../core/models/theme.model';
import type { LocaleId } from '../core/models/locale.model';

export type {
  HeroClassId,
  TeamId,
  DamageType,
  EffectKind,
  CombatEventKind,
  BattlePhase,
  FloatingMarker,
  ThemeId,
  LocaleId,
};

export type SkillTargetMode =
  | 'self'
  | 'singleEnemy'
  | 'lowestHpEnemy'
  | 'lowestHpAlly'
  | 'allEnemies'
  | 'allAllies'
  | 'taunterOrLowestHpEnemy';

export interface SkillCost {
  mana: number;
}

export interface SkillScaling {
  physicalCoefficient: number;
  magicalCoefficient: number;
  flatPower: number;
}

export interface SkillEffectSpec {
  kind: EffectKind;
  durationTurns: number;
  potency: number;
  chance?: number;
}

export interface Skill {
  id: string;
  nameKey: string;
  classId: HeroClassId;
  descriptionKey: string;
  damageType: DamageType;
  targetMode: SkillTargetMode;
  cost: SkillCost;
  scaling: SkillScaling;
  effects: SkillEffectSpec[];
  isBasicAttack: boolean;
  isAoe: boolean;
}

export interface ActiveEffect {
  id: string;
  kind: EffectKind;
  remainingTurns: number;
  potency: number;
  sourceHeroId: string;
  forcedTargetHeroId?: string;
}

export interface HeroStats {
  maxHp: number;
  maxMana: number;
  speed: number;
  physicalAttack: number;
  magicalPower: number;
  armorPercent: number;
  magicResistPercent: number;
  critChance: number;
  critMultiplier: number;
  dodgeChance: number;
}

export interface HeroResources {
  hp: number;
  mana: number;
}

export interface Hero {
  id: string;
  name: string;
  nameKey?: string;
  classId: HeroClassId;
  teamId: TeamId;
  slotIndex: number;
  stats: HeroStats;
  resources: HeroResources;
  skills: Skill[];
  effects: ActiveEffect[];
  isAlive: boolean;
  initiative: number;
}

export interface CombatEvent {
  id: string;
  at: number;
  round: number;
  kind: CombatEventKind;
  actorHeroId?: string;
  targetHeroIds?: string[];
  skillId?: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  messageText: string;
  colorToken: 'damage' | 'heal' | 'buff' | 'debuff' | 'crit' | 'system' | 'miss';
  numericValue?: number;
  meta?: {
    rawDamage?: number;
    mitigated?: number;
    wasCrit?: boolean;
    wasDodge?: boolean;
    absorbedByShield?: number;
  };
}

export interface TeamRoster {
  teamId: TeamId;
  heroIds: string[];
}

export interface BattleState {
  phase: BattlePhase;
  round: number;
  alliance: Hero[];
  horde: Hero[];
  turnQueue: string[];
  activeHeroId: string | null;
  winnerTeamId: TeamId | null;
  events: CombatEvent[];
  markers: FloatingMarker[];
  animationSpeed: number;
  rngSeed: number;
}

export interface ActionIntent {
  actorHeroId: string;
  skillId: string;
  targetHeroIds: string[];
}
