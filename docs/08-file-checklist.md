# 08 — File Checklist

Генератор **обязан** создать каждый файл из списка. Отмечай мысленно ☑. Пропуск файла = провал DoD.

Рядом с путём — краткое содержание (1–2 предложения). Код внутри файла — **полный**, без сокращений.

---

## 8.1 Project root / Angular scaffold

| # | Path | Content |
|---|------|---------|
| 1 | `package.json` | Имя `epic-arena`, scripts start/build/test; tailwind deps если выбран Tailwind |
| 2 | `angular.json` | project config, styles `src/styles.scss` |
| 3 | `tsconfig.json` | base TS config |
| 4 | `tsconfig.app.json` | app TS config |
| 5 | `tsconfig.spec.json` | spec TS config |
| 6 | `src/index.html` | title Epic Arena, fonts Cinzel/Rajdhani/JetBrains Mono, root element |
| 7 | `src/main.ts` | bootstrapApplication |
| 8 | `src/styles.scss` | CSS variables Dark Fantasy, reset, full viewport, marker keyframes |
| 9 | `README.md` | install, start, test, hotkeys, overview |
| 10 | `tailwind.config.js` / эквивалент | **только если** выбран Tailwind — полный конфиг content/theme |

---

## 8.2 App shell

| # | Path | Content |
|---|------|---------|
| 11 | `src/app/app.config.ts` | zoneless providers |
| 12 | `src/app/app.component.ts` | thin host → game-director |
| 13 | `src/app/app.component.html` | `<ea-game-director />` |
| 14 | `src/app/app.component.scss` | full-height host |

---

## 8.3 Models (канон брифа)

| # | Path | Content |
|---|------|---------|
| 15 | `src/app/models/rpg.interfaces.ts` | Hero, Skill, Effect/ActiveEffect, CombatEvent, BattleState + связанные типы |

---

## 8.4 Core constants

| # | Path | Content |
|---|------|---------|
| 16 | `src/app/core/constants/battle.constants.ts` | team size, speeds, delays, caps |
| 17 | `src/app/core/constants/hero-stats.constants.ts` | DEFAULT_STATS_BY_CLASS |
| 18 | `src/app/core/constants/skill.constants.ts` | all skills all classes |
| 19 | `src/app/core/constants/effect.constants.ts` | potencies / deltas |
| 20 | `src/app/core/constants/ui.constants.ts` | log/card UI numbers |
| 21 | `src/app/core/constants/name-pools.constants.ts` | alliance/horde name pools |

---

## 8.5 Core models (модульные)

| # | Path | Content |
|---|------|---------|
| 22 | `src/app/core/models/hero-class.model.ts` | HeroClassId |
| 23 | `src/app/core/models/team-id.model.ts` | TeamId |
| 24 | `src/app/core/models/damage-type.model.ts` | DamageType |
| 25 | `src/app/core/models/effect-kind.model.ts` | EffectKind |
| 26 | `src/app/core/models/combat-event-kind.model.ts` | CombatEventKind |
| 27 | `src/app/core/models/battle-phase.model.ts` | BattlePhase |
| 28 | `src/app/core/models/floating-marker.model.ts` | FloatingMarker |
| 29 | `src/app/core/models/theme.model.ts` | ThemeId |
| 30 | `src/app/core/models/locale.model.ts` | LocaleId |

---

## 8.6 Domain combat / AI / math

| # | Path | Content |
|---|------|---------|
| 31 | `src/app/domain/combat/damage.formulas.ts` | full damage/heal pipeline |
| 32 | `src/app/domain/combat/damage.formulas.spec.ts` | formula tests |
| 33 | `src/app/domain/combat/initiative.ts` | initiative score + sort |
| 34 | `src/app/domain/combat/initiative.spec.ts` | initiative tests |
| 35 | `src/app/domain/combat/targeting.ts` | targetMode resolver |
| 36 | `src/app/domain/combat/skill-resolver.ts` | apply skill fully |
| 37 | `src/app/domain/combat/effect-engine.ts` | tick + decay |
| 38 | `src/app/domain/combat/effect-engine.spec.ts` | effect tests |
| 39 | `src/app/domain/ai/hero-ai.ts` | dispatcher |
| 40 | `src/app/domain/ai/warrior-ai.ts` | warrior decisions |
| 41 | `src/app/domain/ai/mage-ai.ts` | mage decisions |
| 42 | `src/app/domain/ai/archer-ai.ts` | archer decisions |
| 43 | `src/app/domain/ai/priest-ai.ts` | priest decisions |
| 44 | `src/app/domain/ai/warrior-ai.spec.ts` | warrior AI tests |
| 45 | `src/app/domain/ai/mage-ai.spec.ts` | mage AI tests |
| 46 | `src/app/domain/ai/priest-ai.spec.ts` | priest AI tests |
| 47 | `src/app/domain/math/clamp.ts` | clamp/lerp |
| 48 | `src/app/domain/math/rng.ts` | mulberry32 + RandomSource |
| 49 | `src/app/domain/math/percent.ts` | percent helpers |

---

## 8.7 State stores

| # | Path | Content |
|---|------|---------|
| 50 | `src/app/state/battle.store.ts` | phase, heroes, queue, events, markers, speed, winner |
| 51 | `src/app/state/roster.store.ts` | setup compositions |
| 52 | `src/app/state/ui.store.ts` | theme, locale, helpOpen |

---

## 8.8 Services (канон брифа + scheduler)

| # | Path | Content |
|---|------|---------|
| 53 | `src/app/services/battle-engine.service.ts` | сердце боя: раунды, ходы, скиллы, лог |
| 54 | `src/app/services/battle-engine.service.spec.ts` | victory / stun skip integration |
| 55 | `src/app/services/hero-factory.service.ts` | генерация героев классов |
| 56 | `src/app/services/combat-scheduler.service.ts` | play/pause/step + speed delays |
| 57 | `src/app/services/hotkeys.service.ts` | keyboard bindings |
| 58 | `src/app/services/i18n.service.ts` | signal dictionaries |

---

## 8.9 Components (канон брифа + UI)

| # | Path | Content |
|---|------|---------|
| 59 | `src/app/components/game-director/game-director.component.ts` | корневой wiring |
| 60 | `src/app/components/game-director/game-director.component.html` | layout shell |
| 61 | `src/app/components/game-director/game-director.component.scss` | shell grid |
| 62 | `src/app/components/arena-board/arena-board.component.ts` | поле боя |
| 63 | `src/app/components/arena-board/arena-board.component.html` | left/right teams |
| 64 | `src/app/components/arena-board/arena-board.component.scss` | arena atmosphere |
| 65 | `src/app/components/hero-card/hero-card.component.ts` | карточка героя |
| 66 | `src/app/components/hero-card/hero-card.component.html` | bars, icons, portrait |
| 67 | `src/app/components/hero-card/hero-card.component.scss` | card styles |
| 68 | `src/app/components/floating-markers/floating-markers.component.ts` | markers host |
| 69 | `src/app/components/floating-markers/floating-markers.component.html` | marker list |
| 70 | `src/app/components/floating-markers/floating-markers.component.scss` | float animation |
| 71 | `src/app/components/combat-log/combat-log.component.ts` | лог + autoscroll |
| 72 | `src/app/components/combat-log/combat-log.component.html` | event list |
| 73 | `src/app/components/combat-log/combat-log.component.scss` | color tokens |
| 74 | `src/app/components/team-builder/team-builder.component.ts` | конструктор |
| 75 | `src/app/components/team-builder/team-builder.component.html` | slots UI |
| 76 | `src/app/components/team-builder/team-builder.component.scss` | builder styles |
| 77 | `src/app/components/time-player/time-player.component.ts` | play/pause/step/speed |
| 78 | `src/app/components/time-player/time-player.component.html` | controls |
| 79 | `src/app/components/time-player/time-player.component.scss` | player styles |
| 80 | `src/app/components/toolbar/toolbar.component.ts` | brand + toggles |
| 81 | `src/app/components/toolbar/toolbar.component.html` | toolbar row |
| 82 | `src/app/components/toolbar/toolbar.component.scss` | toolbar styles |
| 83 | `src/app/components/status-bar/status-bar.component.ts` | round/phase/winner |
| 84 | `src/app/components/status-bar/status-bar.component.html` | status content |
| 85 | `src/app/components/status-bar/status-bar.component.scss` | status styles |
| 86 | `src/app/components/help-overlay/help-overlay.component.ts` | help modal |
| 87 | `src/app/components/help-overlay/help-overlay.component.html` | hotkeys list |
| 88 | `src/app/components/help-overlay/help-overlay.component.scss` | overlay styles |

---

## 8.10 i18n

| # | Path | Content |
|---|------|---------|
| 89 | `src/app/i18n/locale.type.ts` | LocaleId |
| 90 | `src/app/i18n/i18n.keys.ts` | keys union/const |
| 91 | `src/app/i18n/ru.ts` | полный русский словарь |
| 92 | `src/app/i18n/en.ts` | полный английский словарь |

---

## 8.11 Правила полноты

- Каждый `.ts` компонент содержит полный template (inline или `.html`) и стили.
- Каждый skill класса описан в constants и обрабатывается resolver + AI.
- Нет пустых файлов-заглушек.
- Если генератор добавляет вспомогательные файлы сверх списка — это разрешено; **удалять** файлы из списка — нельзя.
