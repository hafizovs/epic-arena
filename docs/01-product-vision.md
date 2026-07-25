# 01 — Product Vision & UX

Документ обязателен к исполнению целиком. Генератор кода не имеет права упрощать сценарии или выкидывать панели.

---

## 1.1 Продукт

| Поле | Значение |
|------|----------|
| Название | **Epic Arena** |
| Подзаголовок (RU) | Пошаговый RPG Auto-Battler |
| Подзаголовок (EN) | Turn-Based RPG Auto-Battler |
| Тип | SPA, интерактивный симулятор боя / игровой дашборд |
| Платформа | Современный desktop Chrome/Firefox/Edge; mobile — usable (панели collapsible / stacked), desktop — primary |
| Рендер | DOM + CSS animations (карточки героев, floating markers, combat log) |
| Игровой уровень | Auto-battler 3–5v3–5, 4 класса, инициатива, скиллы, ИИ, buff/debuff engine |

**Ценность:** дать зрелищный, математически прозрачный пошаговый auto-battler, где игрок собирает команды Альянса и Орды, запускает симуляцию и видит каждый расчёт — от брони и крита до DoT и щитов — в арене и в цветном combat log.

**Аудитория:** любители RPG / auto-battler, геймдизайнеры, изучающие combat systems, разработчики Angular Signals, которым нужен нетривиальный stateful demo.

---

## 1.2 Информационная архитектура экрана

Один главный экран (без роутинга страниц), композиция через `GameDirectorComponent`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Epic Arena | theme | lang | help | reset                        │
├──────────────────────────────────────────────────────────────────────────┤
│ Team Builder (pre-battle)  ИЛИ  скрыт после старта / сворачиваемый       │
│  Alliance slots 1..N  |  [Random Teams] [Start]  |  Horde slots 1..N     │
├──────────────────────────────────┬───────────────────────────────────────┤
│                                  │                                       │
│   ALLIANCE (left)                │   HORDE (right)                       │
│   hero cards                     │   hero cards                          │
│   HP / Mana / effects            │   HP / Mana / effects                 │
│   floating markers               │   floating markers                    │
│                                  │                                       │
│              ARENA BOARD                                                 │
├──────────────────────────────────┴───────────────────────────────────────┤
│ Time Player: ▶ Play | ⏸ Pause | ⏭ Step | Speed 0.5×────●────4×           │
├──────────────────────────────────────────────────────────────────────────┤
│ Combat Log (scroll, auto-bottom) — colored events                        │
└──────────────────────────────────────────────────────────────────────────┘
│ Status: round | active hero | phase | winner (if ended)                  │
```

- Арена занимает центральную полосу; слева Альянс, справа Орда (визуальное разделение: вертикальный «разлом» / VS-маркер).
- Combat Log — нижняя панель **или** правая колонка на широких экранах (`≥ 1400px`): высота/ширина фиксированы, внутренний скролл.
- Team Builder виден до первого «Запустить бой»; после старта — collapsible «Пересобрать команды» (сброс боя обязателен перед новой сборкой).
- Z-index: arena (0) < panels (10) < floating markers (20) < drawers/modals/help (30).

---

## 1.3 Визуальный язык — Dark Fantasy / Cyberpunk RPG

Тема по умолчанию: **dark** (Dark Fantasy Dashboard). Светлая тема панелей — переключатель (арена остаётся тёмной).

CSS variables (обязательные имена в `styles.scss` или `@theme` / `:root` при Tailwind):

```scss
:root,
[data-theme='dark'] {
  --ea-bg-deep: #0a0b10;
  --ea-bg-panel: #12131c;
  --ea-bg-panel-elevated: #1a1c28;
  --ea-bg-arena: #0e1018;
  --ea-border: #2a2f45;
  --ea-text: #e8e6f0;
  --ea-text-muted: #8b90a8;
  --ea-accent: #c9a227;        /* runic gold — не purple */
  --ea-accent-2: #3ecfcf;      /* cyber teal */
  --ea-alliance: #3d7eff;
  --ea-horde: #e85d3d;
  --ea-damage: #ff4d5a;
  --ea-heal: #3ecf6a;
  --ea-buff: #4da3ff;
  --ea-debuff: #c77dff;
  --ea-crit: #ffb020;
  --ea-mana: #5b8cff;
  --ea-hp: #e04040;
  --ea-shield: #d4c4a8;
  --ea-grid: rgba(201, 162, 39, 0.06);
  --ea-glow: rgba(62, 207, 207, 0.22);
  --ea-font-display: 'Cinzel', 'Palatino Linotype', serif;
  --ea-font-ui: 'Rajdhani', 'Segoe UI', sans-serif;
  --ea-font-mono: 'JetBrains Mono', 'Consolas', monospace;
}

[data-theme='light'] {
  --ea-bg-deep: #e8eaf0;
  --ea-bg-panel: #f4f5f9;
  --ea-bg-panel-elevated: #ffffff;
  --ea-border: #c5cad8;
  --ea-text: #14161f;
  --ea-text-muted: #5a6078;
  --ea-accent: #9a7b1a;
  --ea-accent-2: #1a8f8f;
  --ea-alliance: #1a56db;
  --ea-horde: #c44a2e;
  --ea-damage: #c62828;
  --ea-heal: #1b8a45;
  --ea-buff: #1565c0;
  --ea-debuff: #7b1fa2;
  --ea-crit: #c77c00;
  --ea-mana: #2949a8;
  --ea-hp: #b71c1c;
  --ea-shield: #8a7a5c;
  --ea-grid: rgba(154, 123, 26, 0.08);
  --ea-glow: rgba(26, 143, 143, 0.12);
}
```

Шрифты подключить через Google Fonts (Cinzel + Rajdhani + JetBrains Mono) в `index.html`. Фон арены всегда тёмный (`--ea-bg-arena`), даже в light theme панелей.

**Запрещено:** purple/indigo градиенты как бренд, Inter/Roboto/Arial как единственный стек, emoji в UI-кнопках (иконки эффектов — SVG/CSS glyphs, не emoji-кластеры).

Brand в toolbar: слово **Epic Arena** крупнее соседних контролов (hero-level brand signal, не мелкий nav-текст).

---

## 1.4 User Journeys (обязательные сценарии)

### J1 — Первый запуск / обзор
1. Пользователь открывает приложение.
2. Тема: **dark**. Locale: **ru**.
3. Состояние: **setup** (бой ещё не идёт). Плеер disabled до готовности команд.
4. По умолчанию уже сгенерированы случайные команды по **3 героя** на сторону (Альянс / Орда) через `HeroFactoryService`.
5. Арена показывает карточки обеих команд с полными HP/Mana; лог пуст (empty state).
6. Brand **Epic Arena** виден в toolbar.

### J2 — Конструктор команд
1. Пользователь меняет класс в слоте (select: Воин / Маг / Лучник / Жрец) → фабрика пересоздаёт героя с дефолтными статами и скиллами класса.
2. Можно добавить слот (до 5) или убрать (минимум 3) на каждую сторону.
3. Кнопка **«Сгенерировать случайные команды»** полностью пересобирает обе стороны (классы + имена из пула appendix A).
4. Пока бой `idle`/`setup` — изменения применяются мгновенно. Во время `running`/`paused` — изменения заблокированы (или требуют Reset).

### J3 — Автобой
1. Кнопка **«Запустить бой»** → `BattleEngineService.start()`; phase = `running`.
2. Движок циклически выполняет ходы по инициативе с задержкой, зависящей от `animationSpeed` (0.5×…4×).
3. На каждом шаге обновляются Signals: HP, Mana, effects, log, activeHeroId, round.
4. Floating markers всплывают над карточками при уроне / хиле / крите / miss.
5. Бой заканчивается, когда все герои одной стороны мертвы (`hp <= 0`); показывается победитель в status + запись в лог.

### J4 — Пауза и пошаговый режим
1. **Пауза** останавливает автоцикл; состояние боя сохраняется.
2. **Следующий шаг** выполняет ровно один turn-tick (или один атомарный шаг движка — см. 04), даже на паузе.
3. Можно снова нажать Play для продолжения автоцикла.
4. Speed slider меняет только задержку автоцикла; Step не зависит от speed (мгновенный шаг + UI settle).

### J5 — Чтение Combat Log
1. Каждое действие пишет подробную строку (пример ниже).
2. Цвета: damage → `--ea-damage`, heal → `--ea-heal`, buff → `--ea-buff`, debuff → `--ea-debuff`, system/round → muted/accent.
3. Лог автоскроллится вниз при новых записях; если пользователь прокрутил вверх — не форсить scroll, пока не вернётся к низу (sticky-bottom с флагом `isPinnedToBottom`).

Пример записи (RU):

> `[Раунд 3] Воин Араторн применяет «Мощный удар» по Магу Кель'тас. Нанесено 52 физ. урона (12 заблокировано броней). Маг Кель'тас оглушён на 1 ход!`

### J6 — Смена языка и темы
1. Lang RU↔EN мгновенно переводит UI-строки и шаблоны лога через `t(key)` / formatters.
2. Theme dark↔light меняет CSS variables панелей; арена остаётся тёмной.

### J7 — Reset
1. Reset / «Новый бой» возвращает phase в `setup`, очищает лог, восстанавливает HP/Mana/effects текущих составов (или предлагает пересобрать — **обязательно** восстановить живых героев с full resources из текущего roster).

---

## 1.5 Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Space` | Play / Pause toggle (если команды готовы) |
| `N` | Следующий шаг (Step) |
| `R` | Random teams (только в setup) |
| `Enter` | Запустить бой (из setup) / Resume |
| `Backspace` / `0` | Reset боя |
| `T` | Theme toggle |
| `G` | Language RU↔EN |
| `H` | Help overlay с хоткеями |
| `Esc` | Закрыть help / drawers |

Хоткеи не срабатывают, если фокус в `<input>`, `<select>`, `<textarea>`.

---

## 1.6 Accessibility

- Все кнопки плеера и builder имеют `aria-label` (через i18n).
- Play/Pause: `aria-pressed`.
- Карточки героев: `role="group"` + `aria-label` с именем, классом, HP.
- HP/Mana bars: `role="progressbar"` + `aria-valuenow/min/max`.
- Combat log: `role="log"` + `aria-live="polite"`.
- Контраст текста на тёмном фоне ≥ WCAG AA для основного UI-текста.
- Focus visible на интерактивных элементах (не `outline: none` без замены).

---

## 1.7 Состояния приложения (product-level)

| Phase | Описание |
|-------|----------|
| `setup` | Сборка команд, бой не начат |
| `running` | Автоцикл ходов |
| `paused` | Автоцикл остановлен; Step доступен |
| `finished` | Есть победитель; Play disabled до Reset |

Переходы строго через store / `BattleEngineService` — UI только вызывает команды.

---

## 1.8 Что запрещено в UX

- Карточки в hero-зоне без bars / без имени класса.
- Скрытый combat log «для экономии места» на desktop ≥ 1200px.
- Автобой без возможности Step/Pause.
- Случайный порядок ходов вместо Speed/инициативы.
- Заглушки скиллов («Skill 1») без имён и эффектов.
- Purple-on-white / terracotta-cream / broadsheet газетный layout как визуальный дефолт.
