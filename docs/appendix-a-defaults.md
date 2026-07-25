# Appendix A — Defaults, Ranges & Seed Data

Справочник чисел. Реализации копируют значения в `core/constants/*` **без округления «на глаз»**.

---

## A.1 Бой / плеер

| Константа | Значение |
|-----------|----------|
| `MIN_TEAM_SIZE` | 3 |
| `MAX_TEAM_SIZE` | 5 |
| `DEFAULT_TEAM_SIZE` | 3 |
| `ANIMATION_SPEED_MIN` | 0.5 |
| `ANIMATION_SPEED_MAX` | 4 |
| `ANIMATION_SPEED_DEFAULT` | 1 |
| `BASE_STEP_DELAY_MS` | 700 |
| `ARMOR_SOFT_CAP_PERCENT` | 75 |
| `MAGIC_RESIST_SOFT_CAP_PERCENT` | 75 |
| `MAX_LOG_EVENTS` | 500 |
| `MARKER_TTL_MS` | 1200 |
| `LOG_AUTO_SCROLL_THRESHOLD_PX` | 48 |
| `HERO_CARD_MIN_WIDTH_PX` | 160 |
| Default `rngSeed` | 42 |

---

## A.2 Эффекты (дефолтные potency)

| Константа | Значение | Смысл |
|-----------|----------|--------|
| `BLEED_DEFAULT_POTENCY` | 8 | DoT physical / tick |
| `POISON_DEFAULT_POTENCY` | 6 | DoT magical / tick |
| `STUN_DEFAULT_TURNS` | 1 | пропуск хода |
| `SLOW_SPEED_DELTA` | −15 | к initiative/speed |
| `HASTE_SPEED_DELTA` | +15 | к initiative/speed |
| `SHIELD_DEFAULT_ABSORB` | 40 | absorb pool |
| `TAUNT_DEFAULT_TURNS` | 2 | forced target |

---

## A.3 Базовые статы классов (`DEFAULT_STATS_BY_CLASS`)

Все проценты брони/MR — в **процентах 0…100** (в формулах делить на 100). Crit/Dodge — **доли 0…1**.

### Warrior (Воин)

| Stat | Value |
|------|-------|
| maxHp | 160 |
| maxMana | 60 |
| speed | 28 |
| physicalAttack | 28 |
| magicalPower | 6 |
| armorPercent | 28 |
| magicResistPercent | 12 |
| critChance | 0.12 |
| critMultiplier | 1.75 |
| dodgeChance | 0.06 |

### Mage (Маг)

| Stat | Value |
|------|-------|
| maxHp | 95 |
| maxMana | 120 |
| speed | 32 |
| physicalAttack | 8 |
| magicalPower | 34 |
| armorPercent | 8 |
| magicResistPercent | 22 |
| critChance | 0.14 |
| critMultiplier | 1.85 |
| dodgeChance | 0.05 |

### Archer (Лучник)

| Stat | Value |
|------|-------|
| maxHp | 110 |
| maxMana | 80 |
| speed | 40 |
| physicalAttack | 26 |
| magicalPower | 10 |
| armorPercent | 14 |
| magicResistPercent | 10 |
| critChance | 0.22 |
| critMultiplier | 2.0 |
| dodgeChance | 0.14 |

### Priest (Жрец)

| Stat | Value |
|------|-------|
| maxHp | 120 |
| maxMana | 110 |
| speed | 30 |
| physicalAttack | 10 |
| magicalPower | 28 |
| armorPercent | 12 |
| magicResistPercent | 20 |
| critChance | 0.08 |
| critMultiplier | 1.5 |
| dodgeChance | 0.05 |

Стартовые `resources.hp = maxHp`, `resources.mana = maxMana`.

---

## A.4 Скиллы по классам

Имена ниже — RU; EN ключи в i18n. Id — стабильные строки.

### Warrior

#### Basic — `warrior.basic_attack`
| Field | Value |
|-------|-------|
| name RU | Удар мечом |
| damageType | physical |
| targetMode | taunterOrLowestHpEnemy |
| mana | 0 |
| physicalCoefficient | 1.0 |
| magicalCoefficient | 0 |
| flatPower | 0 |
| effects | [] |
| isBasicAttack | true |
| isAoe | false |

#### Unique 1 — `warrior.taunt` («Провокация»)
| Field | Value |
|-------|-------|
| damageType | physical (0 dmg допустим) |
| targetMode | singleEnemy (AI выбирает highest threat) |
| mana | 15 |
| physicalCoefficient | 0.35 |
| magicalCoefficient | 0 |
| flatPower | 0 |
| effects | `{ kind: 'taunt', durationTurns: 2, potency: 0 }` |
| isBasicAttack | false |
| isAoe | false |

#### Unique 2 — `warrior.power_strike` («Мощный удар»)
| Field | Value |
|-------|-------|
| damageType | physical |
| targetMode | taunterOrLowestHpEnemy |
| mana | 20 |
| physicalCoefficient | 1.55 |
| magicalCoefficient | 0 |
| flatPower | 8 |
| effects | `{ kind: 'stun', durationTurns: 1, potency: 0, chance: 0.35 }` |
| isBasicAttack | false |
| isAoe | false |

---

### Mage

#### Basic — `mage.basic_attack`
| Field | Value |
|-------|-------|
| name RU | Магическая стрела |
| damageType | magical |
| targetMode | lowestHpEnemy |
| mana | 0 |
| physicalCoefficient | 0 |
| magicalCoefficient | 0.85 |
| flatPower | 0 |
| isBasicAttack | true |
| isAoe | false |

#### Unique 1 — `mage.fireball` («Огненный шар»)
| Field | Value |
|-------|-------|
| damageType | magical |
| targetMode | allEnemies |
| mana | 40 |
| physicalCoefficient | 0 |
| magicalCoefficient | 1.1 |
| flatPower | 6 |
| effects | `{ kind: 'poison', durationTurns: 2, potency: 6, chance: 0.25 }` (опциональный burn-as-poison; **канон:** без poison на fireball — чистый AoE; **не вешай poison**, оставь effects `[]`) |
| isBasicAttack | false |
| isAoe | true |

> Канон fireball: `effects: []` (чистый AoE урон).

#### Unique 2 — `mage.frostbolt` («Ледяная стрела»)
| Field | Value |
|-------|-------|
| damageType | magical |
| targetMode | singleEnemy |
| mana | 25 |
| physicalCoefficient | 0 |
| magicalCoefficient | 1.0 |
| flatPower | 4 |
| effects | `{ kind: 'slow', durationTurns: 2, potency: 15 }` (potency = \|SLOW_SPEED_DELTA\|) |
| isBasicAttack | false |
| isAoe | false |

---

### Archer

#### Basic — `archer.basic_attack`
| Field | Value |
|-------|-------|
| name RU | Выстрел |
| damageType | physical |
| targetMode | taunterOrLowestHpEnemy |
| mana | 0 |
| physicalCoefficient | 1.0 |
| magicalCoefficient | 0 |
| flatPower | 0 |
| isBasicAttack | true |
| isAoe | false |

#### Unique 1 — `archer.puncturing_shot` («Пробивающий выстрел»)
| Field | Value |
|-------|-------|
| damageType | physical |
| targetMode | taunterOrLowestHpEnemy |
| mana | 18 |
| physicalCoefficient | 1.2 |
| magicalCoefficient | 0 |
| flatPower | 4 |
| effects | `{ kind: 'bleed', durationTurns: 3, potency: 8 }` |
| isBasicAttack | false |
| isAoe | false |

#### Unique 2 — `archer.volley` («Град стрел»)
| Field | Value |
|-------|-------|
| damageType | physical |
| targetMode | allEnemies |
| mana | 30 |
| physicalCoefficient | 0.75 |
| magicalCoefficient | 0 |
| flatPower | 2 |
| effects | [] |
| isBasicAttack | false |
| isAoe | true |

---

### Priest

#### Basic — `priest.basic_attack`
| Field | Value |
|-------|-------|
| name RU | Удар посохом |
| damageType | magical |
| targetMode | lowestHpEnemy |
| mana | 0 |
| physicalCoefficient | 0 |
| magicalCoefficient | 0.7 |
| flatPower | 0 |
| isBasicAttack | true |
| isAoe | false |

#### Unique 1 — `priest.heal` («Исцеление»)
| Field | Value |
|-------|-------|
| damageType | heal |
| targetMode | lowestHpAlly |
| mana | 28 |
| physicalCoefficient | 0 |
| magicalCoefficient | 1.15 |
| flatPower | 12 |
| effects | [] |
| isBasicAttack | false |
| isAoe | false |

#### Unique 2 — `priest.shield` («Щит»)
| Field | Value |
|-------|-------|
| damageType | heal (0) / support |
| targetMode | lowestHpAlly |
| mana | 22 |
| physicalCoefficient | 0 |
| magicalCoefficient | 0 |
| flatPower | 0 |
| effects | `{ kind: 'shield', durationTurns: 3, potency: 40 }` |
| isBasicAttack | false |
| isAoe | false |

Для shield-скилла resolver наносит 0 урона/хила и только вешает эффект (допустимо также дать tiny heal `flatPower: 5` — **канон: только shield effect**).

---

## A.5 Пулы имён

### Alliance (примеры; минимум 12)
Араторн, Элария, Тирион, Лиандра, Годфри, Селена, Борин, Мираэль, Кадгар (альянс-вариант: Мерлин не использовать), Роланд, Изольда, Фенрис

Полный канон-пул (скопируй):

```
Aratorn, Elarya, Tyrion, Liandra, Godfrey, Selene, Borin, Mirael, Roland, Isolde, Fenris, Aldric,
Valeria, Cedric, Rowena, Gareth
```

RU отображение может совпадать с транслитом или иметь локализованные формы в i18n; **допустимо** хранить отображаемые имена как есть в фабрике + locale-independent proper names.

### Horde (минимум 12)

```
Kel'Thas, Garrosh, Zul'ra, Nazgrel, Akama, Magatha, Drok, Syrena, Thrak, Varkul, Hexa, Grommash,
Saura, Orgrin, Nyxara, Kargath
```

Не повторяй имя внутри одного боя, пока пул не исчерпан.

---

## A.6 UI дефолты

| Параметр | Значение |
|----------|----------|
| theme | `dark` |
| locale | `ru` |
| phase on boot | `setup` |
| helpOpen | `false` |
| teams on boot | random 3v3 via factory |

---

## A.7 AI thresholds

| Правило | Значение |
|---------|----------|
| Priest heal if ally `hp/maxHp` | `< 0.50` |
| Priest shield if ally `hp/maxHp` | `< 0.70` и нет shield |
| Mage fireball if `mana === maxMana` | prefer fireball |
| Mage fireball if enemies alive | `≥ 2` и хватает маны |
| Warrior taunt preference | round `=== 1` или нет активного taunt от союзников на врагах |
| Archer volley if enemies alive | `≥ 2` |
| Archer puncturing if target has no bleed | prefer apply bleed |
