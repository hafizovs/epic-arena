# 02 — Architecture (Angular 22+)

Создай приложение строго по этой архитектуре. Не сваливай формулы боя и ИИ в компоненты. Не используй NgRx/Akita — только Signals stores.

---

## 2.1 Стек и bootstrap

1. Создай проект Angular **latest stable ≥ 22**, standalone, SCSS, **без SSR**, без routing (предпочтительно **без** `@angular/router`).
2. Включи **zoneless** (дефолт новых приложений). Не добавляй `zone.js` обратно.
3. Prefix: `ea`.
4. Точка входа: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
5. `app.config.ts`: `provideZonelessChangeDetection()` (или эквивалент актуального API). Анимации floating markers — CSS keyframes; `provideAnimations()` не обязателен.
6. Если используешь Tailwind — добавь официальную интеграцию для Angular/PostCSS полностью (конфиг, content globs, base styles). Если SCSS — глобальные CSS variables из документа 01.

---

## 2.2 Дерево каталогов (обязательное)

Минимальный каркас из брифа **обязан** существовать. Доменный слой расширяет его до продакшен-структуры:

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts

    models/
      rpg.interfaces.ts          # Hero, Skill, Effect, CombatEvent, BattleState (+ реэкспорт/агрегация)

    core/
      constants/
        battle.constants.ts
        hero-stats.constants.ts
        skill.constants.ts
        effect.constants.ts
        ui.constants.ts
      models/
        hero-class.model.ts
        team-id.model.ts
        damage-type.model.ts
        effect-kind.model.ts
        skill-id.model.ts
        combat-event-kind.model.ts
        battle-phase.model.ts
        floating-marker.model.ts
        theme.model.ts
        locale.model.ts

    domain/
      combat/
        damage.formulas.ts
        initiative.ts
        targeting.ts
        skill-resolver.ts
        effect-engine.ts
      ai/
        hero-ai.ts
        warrior-ai.ts
        mage-ai.ts
        archer-ai.ts
        priest-ai.ts
      math/
        clamp.ts
        rng.ts
        percent.ts

    state/
      battle.store.ts
      roster.store.ts
      ui.store.ts

    services/
      battle-engine.service.ts
      hero-factory.service.ts
      combat-scheduler.service.ts
      hotkeys.service.ts
      i18n.service.ts

    components/
      game-director/
        game-director.component.ts
        game-director.component.html
        game-director.component.scss
      arena-board/
        arena-board.component.ts
        arena-board.component.html
        arena-board.component.scss
      hero-card/
        hero-card.component.ts
        hero-card.component.html
        hero-card.component.scss
      floating-markers/
        floating-markers.component.ts
        floating-markers.component.html
        floating-markers.component.scss
      combat-log/
        combat-log.component.ts
        combat-log.component.html
        combat-log.component.scss
      team-builder/
        team-builder.component.ts
        team-builder.component.html
        team-builder.component.scss
      time-player/
        time-player.component.ts
        time-player.component.html
        time-player.component.scss
      toolbar/
        toolbar.component.ts
        toolbar.component.html
        toolbar.component.scss
      status-bar/
        status-bar.component.ts
        status-bar.component.html
        status-bar.component.scss
      help-overlay/
        help-overlay.component.ts
        help-overlay.component.html
        help-overlay.component.scss

    i18n/
      locale.type.ts
      i18n.keys.ts
      ru.ts
      en.ts

    # unit tests рядом с domain / services (см. 08)
```

Допускается объединять мелкие model-файлы **только если** публичный API и содержимое `models/rpg.interfaces.ts` полностью покрывают типы из документа 03. Предпочтительно держать `rpg.interfaces.ts` как канонический агрегат, а `core/models/*` — как модульные определения, реэкспортируемые агрегатом.

---

## 2.3 Слои ответственности

| Слой | Ответственность | Запрещено |
|------|-----------------|-----------|
| `models` / `core/models` | Типы, enum/union, интерфейсы | Логика боя |
| `domain/combat` | Чистые функции: урон, инициатива, скиллы, эффекты | Angular DI, DOM |
| `domain/ai` | Выбор скилла/цели по состоянию боя | Мутация store напрямую (возвращают ActionIntent) |
| `domain/math` | clamp, RNG, percent helpers | UI |
| `state/*` | Signals: roster, battle snapshot, UI flags | Формулы урона |
| `services/battle-engine` | Оркестрация раунда/хода, вызов domain, запись лога | HTML шаблоны |
| `services/hero-factory` | Создание героев классов со статами и скиллами | Рендер |
| `services/combat-scheduler` | Play/Pause/Step таймеры на Signals + `animationSpeed` | Расчёт урона |
| `components/*` | Отображение + команды пользователя | Математика брони/крита |

---

## 2.4 Поток данных боя

```
User (Play / Step)
    → CombatSchedulerService
        → BattleEngineService.advanceOneStep()
            → domain: start-of-turn effects (DoT)
            → domain AI: choose skill + targets
            → domain skill-resolver + damage formulas + effect-engine
            → BattleStore signals update (heroes, log, markers, phase)
                → ArenaBoard / HeroCard / CombatLog / StatusBar (computed views)
```

Правила:
1. Компоненты читают `battleStore` через `inject()` и signals/`computed`.
2. Единственный писатель боевого состояния во время симуляции — `BattleEngineService` (через store API).
3. Floating markers живут в store как transient list с `id` + TTL; UI удаляет по `animationend` **или** scheduler чистит по времени — реализуй один полный путь без утечек.

---

## 2.5 Композиция UI

`AppComponent` → `ea-game-director` (корневой игровой shell).

`GameDirectorComponent` связывает:
- `ea-toolbar`
- `ea-team-builder`
- `ea-arena-board` (внутри — `@for` по командам → `ea-hero-card` + `ea-floating-markers`)
- `ea-time-player`
- `ea-combat-log`
- `ea-status-bar`
- `ea-help-overlay`

Не размещай боевую логику в `GameDirector` — только wiring команд (`start`, `pause`, `step`, `setSpeed`, `randomize`, `reset`).

---

## 2.6 Именование и селекторы

| Сущность | Правило |
|----------|---------|
| Selector | `ea-<kebab-name>` |
| Class | `EaPascalCaseComponent` / `BattleEngineService` |
| Signal fields | camelCase (`animationSpeed`, `combatLog`) |
| i18n keys | dot.notation (`player.play`, `log.damage.physical`) |
| Skill ids | string union / const (`warrior.power_strike`) |

---

## 2.7 Асинхронность плеера

`CombatSchedulerService`:
- Держит `playing = signal(false)`, `animationSpeed = signal(1)`.
- При play запускает цикл: `await delay(baseMs / speed)` → `engine.advanceOneStep()` → проверка `phase !== 'finished'`.
- Используй `AbortController` или generation token, чтобы pause/reset отменяли pending delay.
- **Не** используй `setInterval` без защиты от overlap; предпочтителен последовательный async-loop.
- Step вызывает `advanceOneStep()` один раз синхронно (или microtask), без ожидания delay.

Базовая задержка: `BASE_STEP_DELAY_MS` из appendix A (по умолчанию 700 ms при 1×).

---

## 2.8 Тестовая стратегия (архитектурно)

- Чистые функции `domain/**` тестируй без TestBed.
- `BattleEngineService` — с фиксированным RNG seed (инжектируемый `RngService` или передаваемый `RandomSource`).
- Компоненты — smoke/harness по желанию; **обязательны** domain + engine specs из документа 07/09.

---

## 2.9 Зависимости

Разрешено:
- Angular platform packages
- Tailwind (опционально) + PostCSS tooling
- Dev: test runner CLI

Запрещено:
- NgRx, Akita, Elf
- RxJS как замена Signals для UI/battle state (RxJS в HTTP не нужен)
- Three.js / Babylon / Chart.js / D3 / Plotly
- Готовые game engines (Phaser и т.п.)
