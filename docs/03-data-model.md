# 03 — Data Model & Units

Все интерфейсы ниже реализуй **буквально**. Числовые диапазоны и дефолты — в [appendix-a-defaults.md](appendix-a-defaults.md); скопируй значения в `*.constants.ts` без «примерно».

Канонический файл агрегата типов: `src/app/models/rpg.interfaces.ts` (обязан существовать и экспортировать публичные типы боя).

---

## 3.1 Единицы

| Величина | Единица | Пояснение |
|----------|---------|-----------|
| HP / Max HP | hit points | целые; clamp ≥ 0 |
| Mana / Max Mana | mana points | целые; clamp ≥ 0 |
| Speed | initiative points | выше = раньше в очереди |
| Physical Attack / Magical Power | flat power | вход формул урона |
| Armor / Magic Resist | percent 0…75 (soft cap) | % снижения соответствующего урона |
| Crit Chance / Dodge Chance | fraction 0…1 | вероятности |
| Crit Multiplier | multiplier ≥ 1 | например 1.5 = +50% |
| Effect duration | turns | уменьшается в конце хода носителя |
| Shield absorb | hit points pool | расход до HP |
| Animation speed | multiplier 0.5…4 | только UI scheduler |
| Round | integer ≥ 1 | инкремент при полном цикле инициативы |

---

## 3.2 Идентификаторы и enum/union типы

```ts
export type TeamId = 'alliance' | 'horde';

export type HeroClassId = 'warrior' | 'mage' | 'archer' | 'priest';

export type DamageType = 'physical' | 'magical' | 'true' | 'heal';

export type EffectKind =
  | 'bleed'
  | 'poison'
  | 'stun'
  | 'slow'
  | 'haste'
  | 'taunt'
  | 'shield';

export type SkillTargetMode =
  | 'self'
  | 'singleEnemy'
  | 'lowestHpEnemy'
  | 'lowestHpAlly'
  | 'allEnemies'
  | 'allAllies'
  | 'taunterOrLowestHpEnemy';

export type CombatEventKind =
  | 'roundStart'
  | 'turnStart'
  | 'skill'
  | 'basicAttack'
  | 'damage'
  | 'heal'
  | 'miss'
  | 'crit'
  | 'effectApply'
  | 'effectTick'
  | 'effectExpire'
  | 'stunSkip'
  | 'death'
  | 'battleStart'
  | 'battleEnd'
  | 'system';

export type BattlePhase = 'setup' | 'running' | 'paused' | 'finished';
```

---

## 3.3 Skill

```ts
export interface SkillCost {
  mana: number;
}

export interface SkillScaling {
  /** Доля от physicalAttack (0..n) */
  physicalCoefficient: number;
  /** Доля от magicalPower (0..n) */
  magicalCoefficient: number;
  /** Плоский бонус урона/хила */
  flatPower: number;
}

export interface SkillEffectSpec {
  kind: EffectKind;
  durationTurns: number;
  /** Для DoT — урон за тик; для shield — absorb; для slow/haste — delta Speed */
  potency: number;
  chance?: number; // 0..1, default 1
}

export interface Skill {
  id: string;
  nameKey: string;          // i18n key
  classId: HeroClassId;
  descriptionKey: string;
  damageType: DamageType;   // heal для исцеления
  targetMode: SkillTargetMode;
  cost: SkillCost;
  scaling: SkillScaling;
  effects: SkillEffectSpec[];
  /** Базовая атака класса — true; ульты/умения — false */
  isBasicAttack: boolean;
  /** AoE флаг для UI/лога (должен совпадать с allEnemies/allAllies) */
  isAoe: boolean;
}
```

---

## 3.4 Effect (runtime instance на герое)

```ts
export interface ActiveEffect {
  id: string;                 // unique instance id
  kind: EffectKind;
  remainingTurns: number;
  potency: number;
  sourceHeroId: string;
  /** Для taunt — id героя, которого обязаны атаковать */
  forcedTargetHeroId?: string;
}
```

---

## 3.5 Hero

```ts
export interface HeroStats {
  maxHp: number;
  maxMana: number;
  speed: number;
  physicalAttack: number;
  magicalPower: number;
  /** 0..100 UI; в формулах /100 */
  armorPercent: number;
  magicResistPercent: number;
  critChance: number;         // 0..1
  critMultiplier: number;     // e.g. 1.75
  dodgeChance: number;        // 0..1
}

export interface HeroResources {
  hp: number;
  mana: number;
}

export interface Hero {
  id: string;
  name: string;
  nameKey?: string;          // опционально, если имя из словаря
  classId: HeroClassId;
  teamId: TeamId;
  slotIndex: number;          // 0..4
  stats: HeroStats;
  resources: HeroResources;
  skills: Skill[];            // basic + 2 unique (ровно 3)
  effects: ActiveEffect[];
  isAlive: boolean;
  /** Текущий initiative score в раунде (может модифицироваться haste/slow) */
  initiative: number;
}
```

Жёсткие инварианты:
- `resources.hp` ∈ `[0, stats.maxHp]`
- `resources.mana` ∈ `[0, stats.maxMana]`
- `isAlive === (resources.hp > 0)`
- `skills.length === 3` (1 basic + 2 unique)
- `slotIndex` уникален внутри команды

---

## 3.6 CombatEvent (лог)

```ts
export interface CombatEvent {
  id: string;
  at: number;                 // monotonic sequence
  round: number;
  kind: CombatEventKind;
  actorHeroId?: string;
  targetHeroIds?: string[];
  skillId?: string;
  /** Уже локализованная или template-ready строка; предпочтительно messageKey + params */
  messageKey: string;
  messageParams?: Record<string, string | number>;
  /** Готовый fallback текст на языке UI (генерируется сервисом) */
  messageText: string;
  colorToken: 'damage' | 'heal' | 'buff' | 'debuff' | 'crit' | 'system' | 'miss';
  numericValue?: number;      // урон/хил для UI
  meta?: {
    rawDamage?: number;
    mitigated?: number;
    wasCrit?: boolean;
    wasDodge?: boolean;
    absorbedByShield?: number;
  };
}
```

---

## 3.7 Floating marker

```ts
export interface FloatingMarker {
  id: string;
  heroId: string;
  text: string;               // "-45 КРИТ!" / "+30" / "MISS"
  variant: 'damage' | 'heal' | 'crit' | 'miss' | 'buff' | 'debuff';
  createdAt: number;
}
```

---

## 3.8 BattleState

```ts
export interface TeamRoster {
  teamId: TeamId;
  heroIds: string[];          // ordered by slotIndex
}

export interface BattleState {
  phase: BattlePhase;
  round: number;
  alliance: Hero[];
  horde: Hero[];
  /** Плоский индекс id → hero для O(1); можно computed из массивов */
  turnQueue: string[];        // hero ids alive ordered by initiative desc
  activeHeroId: string | null;
  winnerTeamId: TeamId | null;
  events: CombatEvent[];
  markers: FloatingMarker[];
  animationSpeed: number;     // 0.5..4
  rngSeed: number;
}
```

Также допустим store-сплит: `RosterStore` (составы в setup) + `BattleStore` (runtime). Тогда `BattleState` остаётся каноном снимка для движка.

---

## 3.9 ActionIntent (выход ИИ)

```ts
export interface ActionIntent {
  actorHeroId: string;
  skillId: string;
  targetHeroIds: string[];
}
```

ИИ **не** мутирует героев — только возвращает `ActionIntent`. Резолв делает `skill-resolver` / engine.

---

## 3.10 Константы (файлы)

### `core/constants/battle.constants.ts`

```ts
export const MIN_TEAM_SIZE = 3;
export const MAX_TEAM_SIZE = 5;
export const DEFAULT_TEAM_SIZE = 3;
export const ANIMATION_SPEED_MIN = 0.5;
export const ANIMATION_SPEED_MAX = 4;
export const ANIMATION_SPEED_DEFAULT = 1;
export const BASE_STEP_DELAY_MS = 700;
export const ARMOR_SOFT_CAP_PERCENT = 75;
export const MAGIC_RESIST_SOFT_CAP_PERCENT = 75;
export const MAX_LOG_EVENTS = 500;
export const MARKER_TTL_MS = 1200;
```

### `core/constants/hero-stats.constants.ts`

Экспортируй `DEFAULT_STATS_BY_CLASS: Record<HeroClassId, HeroStats>` — значения из Appendix A.

### `core/constants/skill.constants.ts`

Описания всех скиллов всех классов (id, scaling, effects, costs) — из Appendix A.

### `core/constants/effect.constants.ts`

```ts
export const BLEED_DEFAULT_POTENCY = 8;
export const POISON_DEFAULT_POTENCY = 6;
export const STUN_DEFAULT_TURNS = 1;
export const SLOW_SPEED_DELTA = -15;
export const HASTE_SPEED_DELTA = 15;
export const SHIELD_DEFAULT_ABSORB = 40;
export const TAUNT_DEFAULT_TURNS = 2;
```

### `core/constants/ui.constants.ts`

```ts
export const LOG_AUTO_SCROLL_THRESHOLD_PX = 48;
export const HERO_CARD_MIN_WIDTH_PX = 160;
```

---

## 3.11 Имена героев (пулы)

`HeroFactoryService` выбирает имена из пулов Appendix A без повторов внутри одного боя (пока пул не исчерпан; затем допускаются суффиксы `#2`).

Классы RU/EN labels — через i18n (`class.warrior` и т.д.).

---

## 3.12 Сериализация / иммутабельность

- При каждом шаге обновляй героев **иммутабельно** (map → new objects) либо через явные copy-helpers — Signals должны получать новые ссылки на изменённые сущности.
- Не храни методы на `Hero`. Вся логика — в domain/services.
