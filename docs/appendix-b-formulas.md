# Appendix B — Formulas & Algorithms

Справочник формул. Реализации — в `domain/combat/**` и AI согласно [04-battle-engine.md](04-battle-engine.md).

---

## B.1 Обозначения

| Symbol | Meaning |
|--------|---------|
| \(P_{\mathrm{phys}}\) | `physicalAttack` |
| \(P_{\mathrm{mag}}\) | `magicalPower` |
| \(c_p, c_m\) | physical/magical coefficients скилла |
| \(F\) | `flatPower` |
| \(A\) | `armorPercent` (0…100) |
| \(R\) | `magicResistPercent` (0…100) |
| \(p_{\mathrm{crit}}\) | `critChance` |
| \(m_{\mathrm{crit}}\) | `critMultiplier` |
| \(p_{\mathrm{dodge}}\) | `dodgeChance` |
| \(S\) | shield absorb remaining |
| \(I\) | initiative score |

---

## B.2 Базовая мощность скилла (raw before mitigation)

\[
\mathrm{raw}_0 = c_p \cdot P_{\mathrm{phys}} + c_m \cdot P_{\mathrm{mag}} + F
\]

Округляй до целого через `Math.floor(raw + 1e-9)` после всех множителей (или `Math.round` — **канон: Math.floor** на финальном HP delta).

Для heal используется та же формула; результат — величина лечения.

---

## B.3 Dodge

Только если `damageType ∈ {physical, magical}` и это атакующий hit (не heal, не pure effect-only):

```
if next() < target.dodgeChance:
  return { damage: 0, wasDodge: true }
```

DoT ticks **не** проверяют dodge повторно.

---

## B.4 Crit

```
raw = raw0
wasCrit = false
if damageType != heal and next() < actor.critChance:
  raw = raw * actor.critMultiplier
  wasCrit = true
```

---

## B.5 Mitigation

```
capA = clamp(armorPercent, 0, ARMOR_SOFT_CAP_PERCENT)
capR = clamp(magicResistPercent, 0, MAGIC_RESIST_SOFT_CAP_PERCENT)

if damageType == physical:
  mitigatedAmount = raw * (capA / 100)
  afterMitigation = raw - mitigatedAmount
else if damageType == magical:
  mitigatedAmount = raw * (capR / 100)
  afterMitigation = raw - mitigatedAmount
else if damageType == true:
  mitigatedAmount = 0
  afterMitigation = raw
```

`afterMitigation = max(0, afterMitigation)`.

---

## B.6 Shield absorb

Пусть `shields` — активные эффекты kind=`shield` (канон: stack potency в одном или нескольких эффектах).

```
remaining = afterMitigation
absorbed = 0
for shield in shields (stable order):
  if remaining <= 0: break
  take = min(shield.potency, remaining)
  shield.potency -= take
  remaining -= take
  absorbed += take
  if shield.potency <= 0: mark shield for removal
applyHpDamage(remaining)
```

Лог обязан упоминать `absorbed`, если > 0.

---

## B.7 Применение HP / Mana

```
# damage
hp = max(0, hp - finalDamage)
if hp == 0: isAlive = false

# heal
hp = min(maxHp, hp + healAmount)

# mana cost
mana = max(0, mana - cost)
```

---

## B.8 Initiative

```
delta = 0
if hasEffect(haste): delta += HASTE_SPEED_DELTA * countHasteStacksCanonical
if hasEffect(slow):  delta += SLOW_SPEED_DELTA   # already negative constant

# Канон стаков: один haste и один slow эффект; delta суммируется по наличию kind
I = stats.speed + hasteDelta + slowDelta + tieBreakerEpsilon(hero.id)

sort living heroes by I DESC, then team alliance-first, then slotIndex ASC
```

`tieBreakerEpsilon`: стабильный малый вклад, например `hash(id) % 1000 / 1e6`, без RNG.

---

## B.9 Start-of-turn DoT

Для каждого эффекта bleed/poison на actor в начале хода:

```
if kind == bleed:
  applyDamagePipeline(source=effect.sourceHeroId or actor, target=actor,
                      raw=potency, type=physical, skipDodge=true, skipCrit=true)
if kind == poison:
  applyDamagePipeline(..., type=magical, skipDodge=true, skipCrit=true)
log effectTick
```

Если после DoT `hp == 0` — death event, ход прерывается (скилл не кастуется).

---

## B.10 End-of-turn duration decay

```
for effect in actor.effects:
  effect.remainingTurns -= 1
  if effect.remainingTurns <= 0:
    remove effect
    log effectExpire
```

Stun, истёкший в конце хода, больше не блокирует **следующий** ход.

---

## B.11 Targeting algorithms

| Mode | Результат |
|------|-----------|
| `self` | `[actor]` |
| `singleEnemy` | выбранный AI/engine враг (жив) |
| `lowestHpEnemy` | min hp среди живых врагов; tie → min slotIndex |
| `lowestHpAlly` | min hp/maxHp среди живых союзников (включая self); tie → self предпочтительнее, иначе min slot |
| `allEnemies` | все живые враги, sort slotIndex |
| `allAllies` | все живые союзники |
| `taunterOrLowestHpEnemy` | если на actor есть taunt.forcedTarget и тот жив → `[forced]`; иначе lowestHpEnemy |

---

## B.12 AI decision pseudocode

### Priest

```
allies = living allies sorted by hpRatio asc
lowest = allies[0]
if lowest.hpRatio < 0.5 and canPay(heal):
  return heal(lowest)
if lowest.hpRatio < 0.7 and !hasShield(lowest) and canPay(shield):
  return shield(lowest)
return basic(lowestHpEnemy / taunt)
```

### Mage

```
if mana == maxMana and canPay(fireball):
  return fireball
fastestEnemy = max speed among enemies
if canPay(frostbolt) and !hasSlow(fastestEnemy):
  return frostbolt(fastestEnemy)
if livingEnemies >= 2 and canPay(fireball):
  return fireball
return basic(lowestHpEnemy)
```

### Warrior

```
target = taunterOrLowestHpEnemy(actor)
if shouldTaunt(state) and canPay(taunt):
  return taunt(highestThreatEnemy)
if canPay(power_strike):
  return power_strike(target)
return basic(target)
```

### Archer

```
target = taunterOrLowestHpEnemy(actor)
if canPay(puncturing_shot) and !hasBleed(target):
  return puncturing_shot(target)
if livingEnemies >= 2 and canPay(volley):
  return volley
if canPay(puncturing_shot):
  return puncturing_shot(target)
return basic(target)
```

---

## B.13 Scheduler delay

```
delayMs = BASE_STEP_DELAY_MS / animationSpeed
# animationSpeed in [0.5, 4]
# example: 1x → 700ms; 2x → 350ms; 0.5x → 1400ms
```

---

## B.14 Marker text

| Case | RU | EN |
|------|----|----|
| damage | `-{n}` | `-{n}` |
| crit | `-{n} КРИТ!` | `-{n} CRIT!` |
| heal | `+{n}` | `+{n}` |
| miss | `ПРОМАХ` | `MISS` |

---

## B.15 Invariants (assert в тестах)

1. `0 ≤ hp ≤ maxHp`, `0 ≤ mana ≤ maxMana`
2. Мёртвый герой не находится в `turnQueue`
3. `finalDamage ≥ 0`, `heal ≥ 0`
4. Armor/MR soft caps соблюдаются
5. После `battleEnd` `advanceOneStep` no-op
6. Mana не уходит ниже 0 при касте
