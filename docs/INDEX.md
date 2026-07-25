# Epic Arena — Главный промпт генерации проекта

> **Как использовать этот пакет:** вставь содержимое этого файла (INDEX.md) в начало диалога с кодовым агентом, затем укажи: «Прочитай и строго выполни документы `docs/01` → `docs/09` и оба appendix в указанном порядке. Генерируй полный код приложения без сокращений.»

---

## 0. Роль и миссия

Ты — **Senior Angular Architect** и **Game Designer**. Твоя задача — **с нуля** создать полноценную, расширенную, готовую к продакшену игру-симулятор:

**«Epic Arena: Пошаговый RPG Auto-Battler»**

на **последнем стабильном Angular (22+ на момент генерации)**.

Не спрашивай разрешения «начать с MVP». Выдай **полный рабочий проект**: все файлы, все интерфейсы героев/скиллов/эффектов, весь боевой цикл с инициативой, все формулы урона (броня, крит, уклонение, щит), полный ИИ ходов по классам, движок баффов/дебаффов, конструктор команд, плеер симуляции на Signals, анимации маркеров урона/хила, combat log с раскраской, UI Dark Fantasy / Cyberpunk RPG, тесты из пакета документов. Выжми максимум из контекста. Не жалей токенов. Пиши шедевр.

Этот INDEX — точка входа. Детальные требования — в связанных документах ниже. При конфликте: **более специфичный документ побеждает**; жёсткие правила из §1 этого файла **неотменяемы**.

---

## 1. ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ КОДА (БЕЗ ИСКЛЮЧЕНИЙ)

1. **ПИШИ КОД ПОЛНОСТЬЮ.** Любые сокращения, комментарии вида `// ...`, `// TODO`, `// аналогично`, `/* rest of file */`, `...existing code...` **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**. Напиши каждый класс, каждый интерфейс, каждый тип эффекта и каждый шаг расчёта боя от начала до конца. Если файлы получаются гигантскими — пиши их целиком, не жалей токены.
2. **Только современный Angular:**
   - Standalone-компоненты (`standalone: true` явно, если CLI ещё требует).
   - **Angular Signals** для реактивного состояния боя (`signal`, `computed`, `effect`, `linkedSignal`). **Запрещены** `BehaviorSubject` / `Subject` для UI/боевого состояния.
   - Новый Control Flow: `@if`, `@for` (с обязательным `track`), `@switch`, `@let`. **Запрещены** `*ngIf`, `*ngFor`, `*ngSwitch`.
   - `input()`, `output()`, `model()` вместо `@Input` / `@Output` декораторов.
   - `inject()` для DI.
   - **Zoneless** change detection (как в новых приложениях Angular 21+/22+). Не опирайся на Zone.js для обновления UI.
   - `ChangeDetectionStrategy.OnPush` (дефолт новых приложений — не отключай).
3. **Разделяй логику:** интерфейсы/модели отдельно, формулы урона / эффекты / ИИ отдельно, `BattleEngineService` отдельно, `HeroFactoryService` отдельно, UI-компоненты отдельно, stores (signals) отдельно. UI **не** считает броню, криты и длительность баффов.
4. **UI — DOM-дашборд**, не Canvas-мир. Боевое поле, карточки героев, лог и плеер — standalone-компоненты. Floating damage/heal markers — CSS/keyframes анимации. **Запрещены** Three.js, Babylon, WebGL-фреймворки, Chart.js, D3, Plotly.
5. **Боевая механика обязательна:** инициатива по Speed, базовые атаки + 2 уникальных умения на класс, ИИ принятия решений, DoT / Stun / Slow / Haste / Shield, формулы из [appendix-b-formulas.md](appendix-b-formulas.md). Числа и дефолты — из [appendix-a-defaults.md](appendix-a-defaults.md).
6. **Запрещены заглушки:** пустые методы, `return 0`, fake heroes, Lorem Ipsum в UI, `console.log` вместо логики, «потом допишем».
7. **Тесты обязательны** минимум для: damage formulas (armor / magic resist / crit / dodge / shield absorb), initiative ordering, effect tick & duration decay, AI skill selection sanity (см. [07-features-extended.md](07-features-extended.md), [09-acceptance-criteria.md](09-acceptance-criteria.md)).
8. **i18n RU/EN** через signal-словарь (не `@angular/localize` build-time), см. [07-features-extended.md](07-features-extended.md).
9. **Структура файлов** должна соответствовать [08-file-checklist.md](08-file-checklist.md). Не пропускай файлы из чеклиста. Минимальный каркас из брифа пользователя **обязан** присутствовать:
   - `src/app/models/rpg.interfaces.ts`
   - `src/app/services/battle-engine.service.ts`
   - `src/app/services/hero-factory.service.ts`
   - `src/app/components/arena-board/arena-board.component.ts`
   - `src/app/components/combat-log/combat-log.component.ts`
   - `src/app/components/game-director/game-director.component.ts`
   Дополнительные файлы из чеклиста (domain/, state/, i18n/, specs) — тоже обязательны.
10. **Стили:** тема **Dark Fantasy / Cyberpunk RPG**. Допустимы **Tailwind CSS** *или* чистый SCSS + CSS variables. Если выбираешь Tailwind — настрой его полностью (конфиг, content paths, утилиты) без TODO. Если SCSS — используй CSS variables из [01-product-vision.md](01-product-vision.md). Не смешивай хаотично оба подхода в одном компоненте.
11. **Интерфейс** оформляй как стильный игровой дашборд тёмной фэнтезийной темы (Dark Fantasy / Cyberpunk RPG): глубокие фоны, акцентные неон/рунические тона, карточки героев с HP/Mana bars и иконками эффектов.

---

## 2. Порядок чтения и выполнения документов

Выполняй **строго по порядку**. Не начинай UI, пока не зафиксированы модели и боевой движок.

| Шаг | Документ | Что сделать |
|-----|----------|-------------|
| 1 | [01-product-vision.md](01-product-vision.md) | Понять продукт, UX арены, journeys, хоткеи, a11y, визуальный язык |
| 2 | [02-architecture.md](02-architecture.md) | Создать скелет Angular-проекта и папок |
| 3 | [03-data-model.md](03-data-model.md) + [appendix-a-defaults.md](appendix-a-defaults.md) | Hero, Skill, Effect, CombatEvent, BattleState, классы, команды |
| 4 | [04-battle-engine.md](04-battle-engine.md) + [appendix-b-formulas.md](appendix-b-formulas.md) | Инициатива, скиллы, урон, ИИ, статусы, цикл раунда |
| 5 | [05-arena-visuals.md](05-arena-visuals.md) | Карточки героев, bars, floating markers, анимации |
| 6 | [06-ui-panels.md](06-ui-panels.md) | Game Director, Team Builder, Time Player, Combat Log |
| 7 | [07-features-extended.md](07-features-extended.md) | Random teams, i18n, hotkeys, theme, тесты |
| 8 | [08-file-checklist.md](08-file-checklist.md) | Сверка: все файлы существуют и полны |
| 9 | [09-acceptance-criteria.md](09-acceptance-criteria.md) | Прогнать DoD / приёмку |

---

## 3. Краткий функциональный объём (обязателен целиком)

### Ядро боевого движка
- Автоматический пошаговый бой между двумя командами: **Альянс** (слева) и **Орда** (справа), по **3–5 героев** в каждой.
- Классы: **Воин**, **Маг**, **Лучник**, **Жрец** — у каждого строгие физ/маг параметры (HP, Mana, Speed, Physical Attack, Magical Power, Armor %, Magic Resist %, Crit Chance, Crit Multiplier, Dodge Chance).
- У каждого класса: **базовая атака** + **2 уникальных умения** (Воин: «Провокация», «Мощный удар»; Маг: «Огненный шар» AoE, «Ледяная стрела» Slow; Жрец: «Исцеление», «Щит»; Лучник: см. [appendix-a-defaults.md](appendix-a-defaults.md)).
- ИИ хода оценивает ситуацию: Жрец хилит союзника с низким HP; Маг при полной мане бьёт заклинанием; Воин бьёт врагов с наименьшим HP или под таунтом и т.д. (полный decision tree — в документе 04).
- Движок статусов: Bleed / Poison (DoT), Stun, Slow / Haste (влияние на инициативу), Shield (абсорб входящего урона до HP).

### Интерфейс
- **Боевая Арена:** левая команда vs правая; карточки героев с HP/Mana bars и иконками баффов/дебаффов; floating markers (`-45 КРИТ!`, `+30`).
- **Плеер симуляции (Signals):** «Запустить бой», «Пауза», «Следующий шаг», ползунок скорости анимации **0.5× … 4×**.
- **Combat Log:** подробный цветной отчёт каждого действия (урон — красный, хил — зелёный, бафф — синий).
- **Конструктор команд:** «Сгенерировать случайные команды» или ручной выбор классов в слоты 1…N для обеих сторон.

### Расширения (обязательны)
- Hotkeys, Dark Fantasy theme (+ light panels toggle), i18n RU/EN, unit-тесты формул/ИИ/эффектов.

---

## 4. Технологический стек (зафиксировано)

| Область | Выбор |
|---------|--------|
| Framework | Angular **latest stable ≥ 22** |
| Components | Standalone only |
| State | Signals stores (`providedIn: 'root'` или feature) |
| CD | Zoneless + OnPush |
| Rendering | DOM + CSS animations (карточки, markers, log) |
| Forms controls | native + signals / `model()` |
| Styling | Tailwind CSS **или** SCSS + CSS variables (Dark Fantasy / Cyberpunk RPG) |
| i18n | Signal-словари `ru.ts` / `en.ts` + `I18nService.t(key)` |
| Tests | Стандартный test runner CLI проекта (Vitest или Jest) |
| Package manager | npm |
| Language UI default | `ru` |

**Команда старта проекта (ориентир):**

```bash
npx @angular/cli@latest new epic-arena --routing=false --style=scss --ssr=false
cd epic-arena
```

Имя приложения в `package.json` / title: **Epic Arena**. Селектор префикс: `ea`.

---

## 5. Definition of Done (кратко)

Приложение **готово**, только если:

1. `ng serve` / `npm start` запускает игру без ошибок.
2. Конструктор команд позволяет случайно сгенерировать или вручную набрать 3–5 героев на сторону.
3. «Запустить бой» запускает автопошаговый цикл; «Пауза» останавливает; «Следующий шаг» выполняет ровно один ход/тик.
4. Слайдер скорости 0.5×–4× меняет задержку между шагами через Signals.
5. Очередь ходов строится по Speed / инициативе; Stun пропускает ход; Slow/Haste влияют на порядок.
6. Урон учитывает броню / маг. сопротивление / крит / уклонение / щит; DoT тикает в начале хода.
7. ИИ классов выбирает скиллы осмысленно (Жрец хилит, Маг кастует при мане, Воин фокусит low HP / taunted).
8. Арена показывает обе команды, bars, иконки эффектов; floating markers появляются при уроне/хиле/крите.
9. Combat Log пишет подробные цветные записи на каждое действие.
10. i18n RU↔EN, theme toggle, hotkeys — работают.
11. Unit-тесты формул / initiative / effects / AI проходят.
12. В исходниках **нет** `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state, Three.js.
13. Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%.
14. Все пункты [09-acceptance-criteria.md](09-acceptance-criteria.md) отмечены как выполненные.

Полный текст приёмки — в документе 09.

---

## 6. Стиль ответа генератора

1. Сначала создай структуру проекта и доменный слой (модели → формулы / эффекты / ИИ → stores → services).
2. Затем `BattleEngineService` + `HeroFactoryService`, затем UI (Game Director → Arena → Log → Team Builder → Player), затем i18n и тесты.
3. Каждый файл выводи **целиком** с путём.
4. После завершения — кратко перечисли, как запустить и как проверить ключевые сценарии из §5.
5. Не предлагай «упростить бой». Не заменяй инициативу случайным порядком. Не пропускай статусы, ИИ или combat log.

---

## 7. Начни сейчас

Прочитай [01-product-vision.md](01-product-vision.md) и приступай к генерации полного проекта **Epic Arena** согласно всему пакету `docs/`.

**Начинай генерацию. Напиши этот проект как Senior Angular Architect и Game Designer.**
