# 05 — Arena Visuals & Animations

Документ описывает визуализацию боевого поля. Рендер — **DOM + CSS**, не Canvas. Генератор обязан реализовать карточки, bars, иконки эффектов и floating markers полностью.

---

## 5.1 Arena Board (`ea-arena-board`)

### Layout
- Desktop: CSS grid / flex — две колонки (`alliance` | `horde`) с центральным VS-разделителем.
- Каждая колонка: вертикальный стек карточек по `slotIndex`.
- Заголовок команды: «Альянс» / «Орда» с цветом `--ea-alliance` / `--ea-horde`.
- Активный герой хода: заметный outline / glow (`--ea-accent-2`), атрибут `data-active="true"`.
- Мёртвый герой: grayscale + opacity 0.45 + overlay «Павший»; bars на 0; маркеры больше не спавнятся.

### Responsive
- `< 900px`: колонки стеком (Alliance сверху, Horde снизу), VS становится горизонтальным разделителем.
- Карточки не должны сжиматься ниже `HERO_CARD_MIN_WIDTH_PX` без горизонтального скролла колонки.

### Binding
- Входы: `alliance = input<Hero>()`, `horde = input<Hero>()`, `activeHeroId`, `markers`.
- Либо inject `BattleStore` напрямую — допустимо; тогда inputs не обязательны. Выбери **один** стиль и держи его консистентно во всех дочерних компонентах.

---

## 5.2 Hero Card (`ea-hero-card`)

Обязательные элементы карточки:

1. **Имя** (display font) + **класс** (badge).
2. **Портрет-плейсхолдор**: stylized CSS/SVG silhouettes по классу (воин/маг/лучник/жрец) — не стоковые фото, не пустой серый квадрат без формы.
3. **HP bar**: ширина `% = hp/maxHp`; цвет `--ea-hp`; текст `current/max`.
4. **Mana bar**: `% = mana/maxMana`; цвет `--ea-mana`; текст `current/max`.
5. **Effect icons row**: иконка на каждый `ActiveEffect.kind` + tooltip/title с remainingTurns.
6. **Speed / ATK / MAG** мини-статы (компактно, muted) — минимум Speed и ключевой power класса.

Состояния:
- `data-team="alliance|horde"`
- `data-alive="true|false"`
- `data-active="true|false"`
- `data-class="warrior|mage|archer|priest"`

Анимация получения урона: краткий flash/shake (CSS class на 300ms), триггер по появлению damage marker для `heroId` **или** по input `hitToken` из store.

---

## 5.3 Floating Markers (`ea-floating-markers`)

Над карточкой героя — absolute-слой маркеров.

| Variant | Пример текста | Цвет |
|---------|---------------|------|
| `damage` | `-45` | `--ea-damage` |
| `crit` | `-45 КРИТ!` / `-45 CRIT!` | `--ea-crit` |
| `heal` | `+30` | `--ea-heal` |
| `miss` | `MISS` / `ПРОМАХ` | `--ea-text-muted` |
| `buff` | `SHIELD` / `ЩИТ` | `--ea-buff` |
| `debuff` | `STUN` / `ОГЛУШЕНИЕ` | `--ea-debuff` |

Анимация (обязательна):
1. Появление: `translateY(0) → translateY(-28px)`, `opacity 1 → 0`, duration ~ `MARKER_TTL_MS`.
2. Несколько маркеров стакаются со смещением по X (±6–12px), чтобы не слипались.
3. После анимации marker удаляется из store.

Реализация: CSS `@keyframes ea-float-marker`. Не оставляй markers навсегда.

---

## 5.4 Effect icons

Минимум SVG/CSS для каждого `EffectKind`:

| Kind | Визуал (описание) |
|------|-------------------|
| bleed | капля / красная иконка |
| poison | пузырь / ядовитый ромб |
| stun | вспышка / звёзды |
| slow | снежинка / стрелка вниз |
| haste | стрелка вверх / молния |
| taunt | щит-магнит / кулак |
| shield | щит |

Показ `remainingTurns` маленькой цифрой на иконке.

---

## 5.5 VS Divider & Atmosphere

- Центральный разделитель с текстом `VS` / рунической линией.
- Фон арены: глубокий градиент + subtle noise/grid (`--ea-grid`), без плоского `#000` единственного цвета.
- Лёгкий vignette допустим.
- Не использовать purple glow как основной бренд-эффект; акцент — gold + teal.

---

## 5.6 Motion budget (минимум 2–3 intentional motions)

Обязательные движения:
1. Floating damage/heal markers.
2. Active-hero glow pulse (subtle).
3. HP bar width transition (`transition: width 200–300ms`).

Опционально (если делаешь — полностью): card entrance при старте боя, log row fade-in.

---

## 5.7 Performance

- `@for (hero of heroes; track hero.id)`.
- Не пересоздавай все карточки при каждом marker tick — markers отдельным слоем.
- Ограничь `events` до `MAX_LOG_EVENTS` (trim с головы).

---

## 5.8 Запрещено

- Inset «картинка в карточке-медиа» как единственный hero без bars.
- Отсутствие markers при уроне/хиле.
- Canvas/WebGL для арены.
- Emoji-спам вместо иконок эффектов (единичный символ в debug — запрещён в прод UI).
