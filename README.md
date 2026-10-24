## Live demo

https://hafizovs.github.io/epic-arena/

# Epic Arena

Turn-based RPG auto-battler on Angular 22+ (Signals, zoneless, Dark Fantasy UI).

## About

Epic Arena is a turn-based RPG auto-battler on Angular 22+ with Signals, zoneless change detection, and a Dark Fantasy UI. You field Alliance and Horde teams of 3–5 heroes and watch initiative combat resolve class skills, defenses, and status effects. Playback runs play, pause, step, and speed, and the shell switches language and theme.

## Capabilities

- Alliance and Horde teams of 3–5 heroes (Warrior, Mage, Archer, Priest)
- Initiative by Speed, a basic attack, and two skills per class
- Armor, magic resistance, crit, dodge, shield, damage over time, stun, slow, and taunt
- Per-class AI, a combat log, and floating markers
- Player: Play / Pause / Step / speed 0.5×–4×
- RU/EN, dark/light theme, and hotkeys

## Functionality

- Randomize teams on the setup screen (`R`), then start or resume with Enter
- Play or pause with Space, step with `N`, and reset with Backspace or `0`
- Watch the combat log and floating markers as the class AI uses skills
- Toggle theme (`T`) and language (`G`); open help with `H` and close it with Esc

## Start

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Tests

```bash
npm test
```

## Features

- Alliance / Horde teams of 3–5 heroes (Warrior, Mage, Archer, Priest)
- Initiative by Speed, a basic attack, and 2 skills per class
- Armor / MR / crit / dodge / shield / DoT / Stun / Slow / Taunt
- Per-class AI, combat log, floating markers
- Player: Play / Pause / Step / speed 0.5×–4×
- i18n RU/EN, dark/light theme, hotkeys

## Hotkeys

| Key | Action |
|---------|----------|
| Space | Play / Pause |
| N | Step |
| R | Random teams (setup) |
| Enter | Start / Resume |
| Backspace / 0 | Reset |
| T | Theme |
| G | Language |
| H | Help |
| Esc | Close help |

Product specification: `../docs/`.
