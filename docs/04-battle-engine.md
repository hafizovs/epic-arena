# 04 — Battle Engine

Реализуй боевой движок **точно** по этому документу и [appendix-b-formulas.md](appendix-b-formulas.md). Не заменяй инициативу случайным порядком. Не пропускай статусы, ИИ или детали лога.

Главный оркестратор: `src/app/services/battle-engine.service.ts`.

---

## 4.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/combat/initiative.ts` | Расчёт initiative score, сортировка очереди |
| `domain/combat/damage.formulas.ts` | Armor / MR / crit / dodge / shield absorb |
| `domain/combat/targeting.ts` | Разрешение targetMode → список целей |
| `domain/combat/skill-resolver.ts` | Применение скилла: стоимость маны, урон/хил, эффекты |
| `domain/combat/effect-engine.ts` | Tick DoT в начале хода, decay длительности в конце |
| `domain/ai/hero-ai.ts` | Диспетчер ИИ по classId |
| `domain/ai/warrior-ai.ts` | Таунт / мощный удар / basic / focus low HP |
| `domain/ai/mage-ai.ts` | Fireball при полной мане / Frostbolt / basic |
| `domain/ai/archer-ai.ts` | Фокус, bleed, multi-shot логика |
| `domain/ai/priest-ai.ts` | Heal low ally / Shield / basic |
| `services/battle-engine.service.ts` | Цикл раунда/хода, победа, лог, markers |
| `services/hero-factory.service.ts` | Дефолтные герои классов |
| `services/combat-scheduler.service.ts` | Play/Pause/Step + speed delays |

---

## 4.2 Жизненный цикл боя

### `prepareFromRoster(alliance, horde)`
1. Валидируй размеры команд ∈ `[3, 5]`, равны или независимы (допустимы разные размеры 3 vs 5).
2. Клонируй героев в runtime state: full HP/Mana, `effects = []`, `isAlive = true`.
3. `phase = 'setup'` → после `start()` станет `running`/`paused`.
4. Очисти `events`, `markers`, `winnerTeamId`, `round = 1`.
5. Построй начальную `turnQueue`.

### `start()`
1. Если phase `finished` — запрещено (нужен reset).
2. Запиши `battleStart` в лог.
3. `phase = 'running'` (scheduler включает автоцикл) или оставь `paused`, если вызван только prepare — **канон:** `start()` ставит `running`.

### `advanceOneStep()` — атомарный шаг
Один шаг = **один ход одного героя** (включая start-of-turn effects и end-of-turn decay), либо системный переход раунда, если очередь пуста.

Алгоритм:

```
if phase == finished: return

if turnQueue empty:
  round += 1
  log roundStart
  rebuildTurnQueueFromLivingHeroes()
  if turnQueue empty: resolveDrawOrError; return

activeHeroId = turnQueue.shift()
actor = getHero(activeHeroId)
if !actor.isAlive: return advanceOneStep() // skip dead; или не класть мёртвых в очередь

log turnStart(actor)

// 1) Start-of-turn effects
applyStartOfTurnEffects(actor)  // bleed/poison damage; may kill
if !actor.isAlive:
  log death
  checkVictory(); return

// 2) Stun check
if hasEffect(actor, 'stun'):
  log stunSkip
  endOfTurn(actor)  // decay durations including stun
  checkVictory(); return

// 3) AI intent
intent = HeroAI.choose(actor, battleSnapshot)

// 4) Resolve skill
resolveSkill(intent)  // mana, targets, damage/heal, apply effects, markers, logs
checkDeaths()

// 5) End of turn
endOfTurn(actor)  // duration-- ; remove expired; haste/slow already reflected via initiative rebuild next round OR dynamic re-score — см. 4.3

checkVictory()
```

### Победа
Команда проиграла, если нет живых героев (`isAlive`). Если обе мертвы после DoT — ничья: `winnerTeamId = null`, event `battleEnd` с ключом draw. Иначе `winnerTeamId` победителя; `phase = 'finished'`.

---

## 4.3 Инициатива и очередь

### Базовый score
Для живого героя:

\[
I = S_{\mathrm{base}} + \Delta_{\mathrm{haste/slow}} + \varepsilon
\]

где:
- \(S_{\mathrm{base}} =\) `stats.speed`
- \(\Delta = +\mathrm{HASTE\_SPEED\_DELTA}\) за каждый активный haste, суммарно; аналогично slow (отрицательный)
- \(\varepsilon\) — крошечный tie-breaker из RNG или стабильный hash от `hero.id`, чтобы порядок был детерминирован при равном Speed

Сортировка: **по убыванию** \(I\`. При полном равенстве — сначала Alliance, затем Horde; внутри команды — меньший `slotIndex`.

### Когда пересчитывать
1. В начале каждого раунда — полная пересборка очереди всех живых.
2. Haste/Slow, наложенные **внутри** раунда, влияют на **следующую** пересборку раунда (простая и честная модель). Документируй это в логе при apply.

Альтернатива (допустима, если реализована полностью): динамический initiative bar (CTB). **Канон пакета — turn queue per round** как выше. Не смешивай обе модели.

---

## 4.4 Формулы урона (кратко; детали — Appendix B)

1. **Dodge** (только physical & magical damaging hits, не heal/true): если `random() < target.dodgeChance` → miss, урон 0, лог miss + marker `MISS`.
2. **Raw power** из scaling скилла (Appendix B).
3. **Crit**: если `random() < actor.critChance` → `raw *= critMultiplier`, флаг crit.
4. **Mitigation**:
   - physical: `mitigated = raw * (1 - clamp(armorPercent,0,75)/100)`
   - magical: аналогично magicResistPercent
   - true: без mitigation
5. **Shield absorb**: сначала снимается с эффекта `shield.potency` (суммарно по всем shield stacks — реализуй как отдельные эффекты или один агрегированный; **канон: один shield effect**, повторный shield обновляет max(oldRemaining, new) **или** стакает potency — выбери **stack potency**, duration = max durations).
6. Остаток идёт в HP; HP clamp ≥ 0.

Heal: `amount = scaling`; не критует по умолчанию; не уходит выше maxHp; лог heal + зелёный marker.

---

## 4.5 Применение скилла

`skill-resolver.ts`:

1. Найти skill по id у actor; проверить `actor.resources.mana >= cost.mana`.
2. Если маны не хватает — ИИ не должен выбирать этот скилл; если всё же вызвали — fallback на basic attack (и system log).
3. Списать ману.
4. `targeting.resolve(skill.targetMode, actor, state)` → targets (только alive, кроме self если мёртв — невозможно).
5. Для каждой цели:
   - если damage → формула урона
   - если heal → формула хила
   - применить `skill.effects` с учетом `chance`
6. Записать подробные CombatEvent(s). Допускается 1 skill event + N damage/heal events **или** один агрегированный — **канон:** skill event + отдельные damage/heal/effect events для читаемого лога.

### Taunt
Эффект `taunt` на цели (враге): `forcedTargetHeroId = actor.id`. Пока taunt активен на цели, ИИ/targeting single-enemy атак этой цели **обязан** выбирать `forcedTargetHeroId`, если тот жив. Если таунтер мёртв — taunt снимается.

### Stun
На носителе: пропуск хода (см. шаг 2).

### Slow / Haste
Меняют initiative delta (constants).

### Bleed / Poison
DoT в `applyStartOfTurnEffects`: урон `potency` типа physical (bleed) / magical (poison) **без** повторного dodge (уже «висит»), но **с** armor/MR по типу и **со** shield absorb. Лог `effectTick`.

---

## 4.6 ИИ ходов (обязательные правила)

Диспетчер `hero-ai.ts` делегирует в class AI. Каждый AI возвращает `ActionIntent`.

### Общие правила
1. Рассматривай только скиллы, на которые хватает маны; иначе basic.
2. Цели — только живые.
3. Никогда не хили врагов и не баффай врагов (кроме дебаффов/урона).

### Воин (`warrior-ai.ts`)
1. Если есть враг без taunt от этого воина и скилл «Провокация» доступен по мане **и** (ворrior — единственный фронтлайн **или** round ≤ 2 **или** союзник-жрец жив) — можно таунтить врага с **наибольшим** physicalAttack/magicalPower (опаснейшая цель). Простая эвристика: таунт, если `round === 1` или у команды нет активного taunt на врагах.
2. Иначе если «Мощный удар» доступен — бить `lowestHpEnemy` (или taunter forced target, если actor сам под таунтом — воины редко таунтятся; если actor имеет taunt effect на себе — атаковать `forcedTargetHeroId`).
3. Иначе basic по lowest HP enemy / forced taunt target.
4. **Всегда** при выборе single enemy: приоритет `forcedTargetHeroId` если actor под taunt; иначе lowest HP alive enemy.

### Маг (`mage-ai.ts`)
1. Если `mana === maxMana` (полная мана) и «Огненный шар» доступен — AoE fireball по всем врагам.
2. Иначе если есть враг с высоким speed и нет slow — «Ледяная стрела» по самому быстрому врагу.
3. Иначе если fireball доступен по мане и живых врагов ≥ 2 — fireball.
4. Иначе basic по lowest HP enemy.

### Лучник (`archer-ai.ts`)
1. Если есть скилл с bleed и цель без bleed — применить на lowest HP или highest physical threat.
2. Если AoE/multi доступен и врагов ≥ 2 — AoE.
3. Иначе basic / power shot в lowest HP.
4. Учитывать taunt forced target.

### Жрец (`priest-ai.ts`)
1. Найти союзника с минимальным `hp/maxHp` среди живых.
2. Если отношение `< 0.5` и «Исцеление» доступно — heal этого союзника.
3. Иначе если есть союзник без shield и `hp/maxHp < 0.7` и «Щит» доступен — shield на него (приоритет lowest HP).
4. Иначе если все союзники > 0.5 HP — basic attack по lowest HP enemy.
5. Никогда не skip ход без действия.

Полные id скиллов и пороги — Appendix A. Реализуй ветвления **полностью** в коде, без «упрощённого random skill».

---

## 4.7 Hero Factory

`hero-factory.service.ts`:

```ts
createHero(classId, teamId, slotIndex, name?: string): Hero
createRandomTeam(teamId, size): Hero[]
createDefaultBattleRosters(size = DEFAULT_TEAM_SIZE): { alliance: Hero[]; horde: Hero[] }
```

Каждый герой получает:
- stats из `DEFAULT_STATS_BY_CLASS`
- skills: basic + 2 unique класса из `skill.constants`
- уникальный `id` (`alliance-warrior-0-${uid}` и т.п.)
- имя из пула

---

## 4.8 Лог — требования к тексту

Генератор сообщений (в engine или `CombatLogFormatter`) обязан уметь собирать строки вида:

> `[Раунд 3] Воин Араторн применяет «Мощный удар» по Магу Кель'тас. Нанесено 52 физ. урона (12 заблокировано броней). Маг Кель'тас оглушён на 1 ход!`

Включай: round, имена, класс (опционально), имя скилла, числа урона/мититгации, крит, miss, наложенные эффекты, смерти.

i18n: `messageKey` + params; `messageText` — уже отформатированная строка текущего locale.

---

## 4.9 RNG

Все случайности (crit, dodge, effect chance, random teams, name pick) идут через инжектируемый источник:

```ts
export abstract class RandomSource {
  abstract next(): number; // [0, 1)
}
```

Дефолт: mulberry32/xorshift от `rngSeed`. В тестах — stub с заданной последовательностью.

---

## 4.10 Запрещено в движке

- Пропуск DoT «чтобы упростить»
- Игнорирование маны
- Атаки мёртвых целей
- Мутация статистики `stats.*` в бою (только resources/effects/initiative)
- Прямой DOM access
- `BehaviorSubject` для battle state
