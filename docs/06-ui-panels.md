# 06 — UI Panels

Все панели — standalone components, Signals, control flow `@if`/`@for`. Строки UI — только через `I18nService.t(...)`. Стили — Tailwind **или** SCSS + CSS variables из [01-product-vision.md](01-product-vision.md).

---

## 6.1 Toolbar (`ea-toolbar`)

Элементы слева направо:

1. Brand: **Epic Arena** (display font, крупнее соседних контролов).
2. Spacer.
3. Button **Reset** — сброс боя к setup / full resources.
4. Button **Theme** (`T`).
5. Button **Lang** (`G`) — показывает `RU`/`EN`.
6. Button **Help** (`H`).

Требования:
- `aria-label` на каждой кнопке.
- Высота toolbar 52px; sticky top.
- i18n keys: `toolbar.reset`, `toolbar.theme`, `toolbar.lang`, `toolbar.help`.

---

## 6.2 Game Director (`ea-game-director`)

Корневой компонент приложения (кроме optional thin `AppComponent` wrapper).

Ответственность:
- Скомпоновать toolbar, team builder, arena, time player, combat log, status, help.
- Пробросить команды в services/stores.
- На старте вызвать `heroFactory.createDefaultBattleRosters()` и положить в roster/battle store.

Не содержать формулы урона.

---

## 6.3 Team Builder (`ea-team-builder`)

Виден в `setup` и collapsible после старта.

### Controls
1. Для каждой стороны (Alliance / Horde):
   - Список слотов 1…N.
   - В каждом слоте: `<select>` класса (`warrior|mage|archer|priest`) + read-only имя + мини-превью статов.
   - Кнопки **+ слот** / **− слот** (clamp 3…5).
2. Кнопка **«Сгенерировать случайные команды»** — обе стороны.
3. Кнопка **«Запустить бой»** — активна, если обе команды валидны.

### Поведение
- Смена класса слота → `heroFactory.createHero(...)` с тем же slotIndex/teamId, новое имя если класс сменился.
- Random → полностью новые составы.
- Во время `running`/`paused` controls disabled; показать hint «Сначала сбросьте бой».
- После `finished` — предложить Reset / New battle.

i18n: `builder.title`, `builder.random`, `builder.start`, `builder.addSlot`, `builder.removeSlot`, `builder.alliance`, `builder.horde`, `class.*`.

---

## 6.4 Time Player (`ea-time-player`)

Элементы:
1. **Запустить бой / Продолжить** (Play) — если `setup`/`paused`/`finished?` → из setup стартует бой; из paused — resume; из finished — disabled.
2. **Пауза** — только при `running`.
3. **Следующий шаг** — при `running`/`paused` (и опционально сразу после start).
4. Range slider скорости: `0.5 … 4`, step `0.25` или `0.1`.
5. Числовая индикация: `×1.0`.

Связь:
- Play → `scheduler.play()` / `engine.start()`
- Pause → `scheduler.pause()` + `phase = paused`
- Step → `scheduler.step()` → `engine.advanceOneStep()`
- Speed → `battleStore.animationSpeed.set(v)` (clamp)

`aria-pressed` для Play/Pause. Slider: `aria-valuemin/max/now`.

---

## 6.5 Combat Log (`ea-combat-log`)

- Список `events` через `@for (e of events; track e.id)`.
- Класс цвета по `e.colorToken` → CSS mapping.
- Автоскролл вниз при новом событии, если пользователь у низа (`LOG_AUTO_SCROLL_THRESHOLD_PX`).
- Empty state: «Ожидание боя…» / «Waiting for battle…».
- Заголовок панели: «Лог боя» / «Combat Log».
- `role="log"` + `aria-live="polite"`.

Форматирование времени/раунда уже внутри `messageText`; дополнительно можно показать badge kind.

---

## 6.6 Status Bar (`ea-status-bar`)

Постоянно видно:
- Round number
- Phase (локализовано)
- Active hero name (или «—»)
- Winner (если finished)
- Team sizes alive/total (например `3/3 vs 2/3`)

---

## 6.7 Help Overlay (`ea-help-overlay`)

- Список хоткеев из документа 01.
- Краткое описание классов и цели игры (2–3 предложения).
- Закрытие: Esc, кнопка, click backdrop.
- Focus trap желателен; минимум — focus на close button при открытии.

---

## 6.8 Состояния disabled

| Phase | Play | Pause | Step | Builder edit | Random |
|-------|------|-------|------|--------------|--------|
| setup | Start enabled | off | off (или dry-run запрещён) | on | on |
| running | off / shows Pause | on | on | off | off |
| paused | on (Resume) | off | on | off | off |
| finished | off | off | off | off | off |

Reset доступен всегда после ухода из чистого первого setup (и в finished).

---

## 6.9 App shell layout CSS

Рекомендуемая сетка:

```scss
.ea-shell {
  display: grid;
  grid-template-rows: auto auto 1fr auto minmax(160px, 28vh) auto;
  min-height: 100dvh;
}
```

На широких экранах лог можно вынести в правую колонку:

```scss
@media (min-width: 1400px) {
  .ea-main {
    display: grid;
    grid-template-columns: 1fr 360px;
  }
}
```

Реализуй один полный responsive вариант без сломанных overlap.
