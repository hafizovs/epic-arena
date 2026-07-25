# 07 — Extended Features

Все фичи этого документа **обязательны**. Не помечай их optional в коде.

---

## 7.1 Random Teams & Roster tools

### Random
`HeroFactoryService.createRandomTeam(teamId, size)`:
1. Для каждого слота выбрать случайный `HeroClassId` (равномерно).
2. Создать героя со статами класса и уникальным именем из пула.
3. Гарантировать, что в команде размера ≥ 4 по возможности есть хотя бы 1 damager и не все жрецы — мягкое правило: если все 3+ жрецы, перегенерировать последний слот в warrior/mage/archer.

### Manual
Смена класса в builder пересоздаёт героя.

### Persist within session
Пока страница открыта, Reset восстанавливает **текущий roster** (классы/имена), а не обязательно новый random. Кнопка Random — явная пересборка.

---

## 7.2 i18n (signal-словари)

### Файлы
- `i18n/locale.type.ts` — `LocaleId = 'ru' | 'en'`
- `i18n/i18n.keys.ts` — union всех ключей **или** const object
- `i18n/ru.ts` / `i18n/en.ts` — словари
- `services/i18n.service.ts` — `locale = signal`, `t(key, params?)`

### Требования
1. Default locale: `ru`.
2. Все видимые строки UI через `t()`.
3. Имена скиллов/классов/эффектов — ключи.
4. Combat log: форматирование через ключи + params (`{round}`, `{actor}`, `{skill}`, `{damage}`, `{mitigated}`…).
5. Переключение `G` мгновенно обновляет UI; **новые** log events на новом языке; старые могут остаться на языке момента записи (канон: хранить `messageText` на момент события + keys для optional re-format; минимум — корректный текст на текущем locale в момент записи).

Минимальные группы ключей: `toolbar.*`, `builder.*`, `player.*`, `status.*`, `class.*`, `skill.*`, `effect.*`, `log.*`, `help.*`, `theme.*`.

---

## 7.3 Hotkeys

`HotkeysService` слушает `window:keydown` (через host listener в director или injectable с `DestroyRef`).

Таблица — из [01-product-vision.md](01-product-vision.md) §1.5. Игнорируй, если target — input/select/textarea/contenteditable.

---

## 7.4 Theme toggle

- `ui.theme: 'dark' | 'light'`
- Пиши `data-theme` на `document.documentElement`.
- Арена остаётся тёмной; панели следуют теме.

---

## 7.5 Unit tests (обязательные)

Создай и добейся зелёного прогона:

| Файл | Что покрыть |
|------|-------------|
| `domain/combat/damage.formulas.spec.ts` | armor mitigation, MR, crit multiply, dodge miss, shield absorb, heal clamp |
| `domain/combat/initiative.spec.ts` | sort by speed desc; haste/slow deltas; stable ties |
| `domain/combat/effect-engine.spec.ts` | DoT tick; duration decay; expire remove; stun present |
| `domain/ai/priest-ai.spec.ts` | heals ally below 50%; otherwise may attack |
| `domain/ai/mage-ai.spec.ts` | full mana → prefers fireball |
| `domain/ai/warrior-ai.spec.ts` | focuses lowest HP / respects taunt |
| `services/battle-engine.service.spec.ts` | start → steps → victory when one team dead; stunned hero skips |

RNG в тестах — детерминированный stub.

---

## 7.6 README проекта

В корне приложения `README.md`:
- Описание Epic Arena
- `npm install` / `npm start` / `npm test`
- Кратко: хоткеи, классы, ссылка на `docs/` пакета промпта (если docs копируются рядом — укажи путь `../docs` или встроенную копию)

---

## 7.7 Quality gates

Перед завершением генерации:
1. Нет `TODO` / `...` / `as any` без нужды (допустим точечный cast с комментаем-обоснованием, не заглушкой).
2. Нет `*ngIf` / `*ngFor` / `BehaviorSubject` для state.
3. Все файлы из [08-file-checklist.md](08-file-checklist.md) существуют.
4. Сценарии [09-acceptance-criteria.md](09-acceptance-criteria.md) выполнимы вручную.
