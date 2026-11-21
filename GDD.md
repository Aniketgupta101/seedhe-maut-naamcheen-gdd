# 🎮 Game Design Document (GDD)
## Seedhe Maut — *Naamcheen*
### Beat-Em-Up / Brawler · 16-bit Pixel Art · 1–2 Players

---

> [!NOTE]
> **Document Version:** 1.0 · **Date:** November 2026 · **Genre:** Side-scrolling Beat-Em-Up / Action Platformer
> This GDD is a full buildable architecture document mapping every system, screen, character mechanic, enemy AI, level beat, and boss phase derived from the *Naamcheen* music video.

---

## Table of Contents

1. [Core Game Loop & Progression Flow](#1-core-game-loop--progression-flow)
2. [Character Roster & Combat Mechanics](#2-character-roster--combat-mechanics)
3. [HUD, Controls & Game Feel](#3-hud-controls--game-feel-juice)
4. [End-to-End Level & Encounter Blueprint](#4-end-to-end-level--encounter-blueprint)
   - [Stage 1 — Dusk Rooftops & Construction Cranes](#stage-1--dusk-rooftops--construction-cranes)
   - [Stage 2 — Sunset Metro Train & Helicopter Chase](#stage-2--sunset-metro-train--helicopter-chase)
   - [Stage 3 — Live Concert Arena / Boss Fight](#stage-3--live-concert-arena--boss-fight-mutant-noobda)
5. [Enemy Roster & AI Behavior](#5-enemy-roster--ai-behavior-table)
6. [Post-Game, Scoring & Replayability](#6-post-game-scoring--replayability)
7. [Technical Architecture Notes](#7-technical-architecture-notes)

---

## 1. Core Game Loop & Progression Flow

```
┌──────────────────────────────┐
│      Boot / Title Screen     │  Animated pixel-art logo, looping Naamcheen beat
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Mode Select                 │
│  ○ 1P Solo (Tag-Team Swap)   │  AI partner follows; hot-swap via [L / C]
│  ○ 2P Local Co-Op            │  Both chars on screen simultaneously
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Character Select            │
│  ● CALM      [Unlocked]      │
│  ● ENCORE    [Unlocked]      │
│  ○ MO        [Locked 🔒]     │  Unlocked after Story Clear
│  ○ SEZ       [Locked 🔒]     │  Unlocked after Story Clear
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  STAGE 1 — Dusk Rooftops & Construction      │
│  Cranes                                      │
│    1A: Rooftop Entry (intro combat)          │
│    1B: Crane & Gap Platforming               │
│    1C: Noobda Taunt Cutscene + Katana QTE ◄──┤ Mid-Stage Event
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  STAGE 2 — Sunset Metro Train                │
│    2A: Train Car Rush (auto-scroll)          │
│    2B: Minigun Pickup + Attack Helicopter ◄──┤ Mini-Boss
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  STAGE 3 — Concert Arena Boss                │
│    Phase 1: 100% → 50% HP                   │
│    Phase 2: 50% → 15% HP                    │
│    Finisher: Co-Op QTE Cinematic ◄───────────┤ Boss Defeated
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  Stage Clear Screen                          │
│  Rank & Score Summary (S / A / B / C)       │
│  Unlocks: Mo, Sez, Boss Rush, Hardcore Mode  │
└──────────────────────────────────────────────┘
```

### Drop-In Co-Op Mechanic
- **At any point** during 1P Solo, a second player can press **START** to drop in as the standby character, converting the session to 2P Co-Op.
- Dropping out demotes P2's character back to AI-follower mode.

---

## 2. Character Roster & Combat Mechanics

### Input Mapping Reference

| Action | Keyboard | Gamepad |
|---|---|---|
| Light Attack | `J` | `Z` / `□` |
| Heavy / Special | `K` | `X` / `△` |
| Jump | `W` / `↑` | `A` / `✕` |
| Dodge / Roll | `S` + direction | `B` + direction |
| Tag-Swap (1P only) | `L` | `RB` |
| Interact / QTE | `X` / `Space` | `□` prompt |
| 8-Dir Aim (Encore) | Arrow Keys | Left Stick |

---

### 2.1 CALM — Close-Range Assassin

```
┌────────────────────────────────────────────────────────────────┐
│  CALM                              HP: 100   Special Meter: ███░░ │
│  Archetype: Close-Range Assassin                               │
├────────────────────┬───────────────────────────────────────────┤
│  Attack            │  Description                              │
├────────────────────┼───────────────────────────────────────────┤
│  3-Hit Katana      │  [J,J,J] Fast horizontal slash →          │
│  Combo             │  upward cleave → crimson crescent wave    │
│                    │  Combo window: 500ms between inputs        │
├────────────────────┼───────────────────────────────────────────┤
│  Crimson           │  [K] Invulnerable horizontal dash-slash   │
│  Dash-Slash        │  through enemy hitboxes. Applies:         │
│  (Special)         │  BLEED (5 dmg/s × 3s) + STUN (0.6s)      │
├────────────────────┼───────────────────────────────────────────┤
│  Bullet Deflect    │  [J, timed] Parry window on swing         │
│  (Passive)         │  animation (8-frame window). Reflects     │
│                    │  enemy pistol rounds back as 30-dmg bolt. │
├────────────────────┼───────────────────────────────────────────┤
│  Double Jump       │  [W, W] Second jump extends arc;          │
│  (Passive)         │  used to reach speaker platforms          │
│                    │  during Stage 3 Hyper Beam phase.         │
└────────────────────┴───────────────────────────────────────────┘
```

**Damage Values:**

| Move | Damage | Properties |
|---|---|---|
| Slash 1 | 8 dmg | Fast startup |
| Slash 2 | 10 dmg | Launches light enemies |
| Crescent Wave | 15 dmg | Projectile, pierces 3 enemies |
| Crimson Dash-Slash | 35 dmg | Invulnerable, bleed + stun |
| Deflected Bullet | 30 dmg | Homing to nearest enemy |

---

### 2.2 ENCORE — Ranged Gunslinger

```
┌────────────────────────────────────────────────────────────────┐
│  ENCORE                            HP: 100   Special Meter: ███░░ │
│  Archetype: Ranged Gunslinger                                  │
├────────────────────┬───────────────────────────────────────────┤
│  Attack            │  Description                              │
├────────────────────┼───────────────────────────────────────────┤
│  Dual SMGs         │  [J] Rapid-fire 3-round burst.            │
│                    │  8-directional aim with arrow keys.        │
│                    │  Can fire while running or airborne.      │
├────────────────────┼───────────────────────────────────────────┤
│  Incendiary        │  [K] Drops incendiary grenade;            │
│  Grenade (Special) │  3s fuse, AoE burn radius = 80px.        │
│                    │  Upgrades to MINIGUN pickup in Stage 2.   │
├────────────────────┼───────────────────────────────────────────┤
│  Tactical Roll     │  [S + dir] Low-profile roll dodge.        │
│  (Passive)         │  I-frames: 12 frames during roll.         │
│                    │  Recharge: 1.5s cooldown.                 │
└────────────────────┴───────────────────────────────────────────┘
```

**Minigun Upgrade (Stage 2 Crate Pick-up):**
- Replaces SMG for remainder of Stage 2
- Unlimited ammo, sustained fire
- Knockback force: pushes enemies 60px per hit
- Effective vs. Attack Helicopter: 15 dmg/frame during hover window
- Dropped after helicopter defeated (Encore reverts to SMGs in Stage 3)

**Damage Values:**

| Move | Damage | Properties |
|---|---|---|
| SMG Burst (3 rds) | 5×3 = 15 dmg | Rapid, pierces weak armor |
| Incendiary Grenade | 25 dmg + 10 burn | AoE radius 80px |
| Minigun (per frame) | 15 dmg | Continuous, high knockback |

---

### 2.3 MO — Heavy Brawler *(Unlockable)*

```
┌────────────────────────────────────────────────────────────────┐
│  MO                               HP: 125   Special Meter: ████░ │
│  Archetype: Heavy Brawler   [🔒 Unlocked after Story Clear]    │
├────────────────────┬───────────────────────────────────────────┤
│  Attack            │  Description                              │
├────────────────────┼───────────────────────────────────────────┤
│  4-Hit Street      │  [J,J,J,J] Jab → Hook → Uppercut →       │
│  Combo             │  Ground Slam. High knockback on final hit. │
├────────────────────┼───────────────────────────────────────────┤
│  Seismic Stomp     │  [K] AoE shockwave from both feet.        │
│  (Special)         │  Launches all nearby enemies airborne.    │
│                    │  Radius: 120px. Juggles for follow-up.    │
├────────────────────┼───────────────────────────────────────────┤
│  Super Armor       │  Heavy wind-up animations (K) absorb 1   │
│  (Passive)         │  hit without interrupt. +25% max HP.      │
└────────────────────┴───────────────────────────────────────────┘
```

| Move | Damage | Properties |
|---|---|---|
| Jab | 6 dmg | Fast |
| Hook | 10 dmg | Stagger |
| Uppercut | 14 dmg | Launch |
| Ground Slam | 20 dmg | Knockback, creates dust AoE |
| Seismic Stomp | 40 dmg | AoE 120px, launches airborne |

---

### 2.4 SEZ — Tactical Support *(Unlockable)*

```
┌────────────────────────────────────────────────────────────────┐
│  SEZ                              HP: 100   Special Meter: ████░ │
│  Archetype: Tactical Support  [🔒 Unlocked after Story Clear]   │
├────────────────────┬───────────────────────────────────────────┤
│  Attack            │  Description                              │
├────────────────────┼───────────────────────────────────────────┤
│  Sonic Blaster     │  [J] 3-way spread shot. Wide arc.         │
│                    │  Staggers crowd of enemies.               │
├────────────────────┼───────────────────────────────────────────┤
│  Bass Drop Turret  │  [K] Places explosive beat-mine.          │
│  / Mine (Special)  │  Detonates on enemy proximity (30px).     │
│                    │  Max 2 mines active simultaneously.       │
├────────────────────┼───────────────────────────────────────────┤
│  Hover Dash        │  [S + dir in air] Brief airborne dash.    │
│  (Passive)         │  Extends aerial positioning.              │
│                    │  Combo timer +2s extended duration.       │
└────────────────────┴───────────────────────────────────────────┘
```

| Move | Damage | Properties |
|---|---|---|
| Sonic Blaster (3 shots) | 12×3 = 36 dmg (max) | 3-way spread, stagger |
| Bass Drop Mine | 50 dmg | AoE on trigger, delayed |

---

### Character Select Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                   ★  SELECT YOUR FIGHTER  ★                     │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│    CALM      │    ENCORE    │   M O  🔒    │    S E Z  🔒       │
│  [Portrait]  │  [Portrait]  │  [Silhouette]│  [Silhouette]      │
│              │              │              │                    │
│ ⚔ Katana    │ 🔫 Dual SMG  │ 👊 Brawler   │ 🔊 Support         │
│ ★★★★☆ PWR  │ ★★★☆☆ PWR  │ ★★★★★ PWR  │ ★★★☆☆ PWR         │
│ ★☆☆☆☆ RNG  │ ★★★★☆ RNG  │ ★☆☆☆☆ RNG  │ ★★★★☆ RNG         │
│ ★★★★★ SPD  │ ★★★☆☆ SPD  │ ★★☆☆☆ SPD  │ ★★★★☆ SPD         │
└──────────────┴──────────────┴──────────────┴────────────────────┘
│         [P1 CONFIRM: J]       [P2 CONFIRM: NUMPAD 1]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. HUD, Controls & Game Feel ("Juice")

### 3.1 HUD Layout — Full Screen Breakdown

```
┌───────────────────────────────────────────────────────────────┐
│ [P1 PORTRAIT][HP ████████░░][SP ████░░░]  TIMER  [HP ████░░░][PORTRAIT P2] │
│  CALM  Katana Icon                12x HIT!         SMG Icon   ENCORE      │
│                                                                           │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ BOSS HP [████████████████░░░░] ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                            ☠ MUTANT NOOBDA                               │
│                                                                           │
│                                                                           │
│           [GAME WORLD — Enemies, Players, Environment]                   │
│                                                                           │
│                                                                           │
└───────────────────────────────────────────────────────────────┘
```

**HUD Element Specifications:**

| Element | Position | Details |
|---|---|---|
| P1 Portrait | Top-Left | 32×32 pixel art, flashes red on damage |
| P1 HP Bar | Top-Left | Angled `-15°` bar, 100 HP max, red fill |
| P1 Special Meter | Top-Left (below HP) | Segments; fills via combo hits |
| P1 Weapon Icon | Top-Left (bottom) | `Katana` / `SMG` / `Minigun` pixel icon |
| Combo Counter | Top-Center | `12x HIT!` — fades after 3s no-combo |
| Stage Timer | Top-Center | `MM:SS` countdown |
| Boss HP Bar | Top-Center (boss rooms) | Named bar, appears on boss trigger |
| P2 Portrait | Top-Right | Shows `PRESS START` if 2P slot open |
| P2 HP / Weapon | Top-Right | Mirror of P1 layout |

---

### 3.2 Combat Feel Rules

| System | Value | Trigger |
|---|---|---|
| **Hit-Stop** | `40ms` freeze | Katana finisher (3rd hit crescent wave) |
| **Hit-Stop** | `70ms` freeze | Explosive barrel detonation |
| **Screen Shake** | `3px trauma` | Minigun sustained fire |
| **Screen Shake** | `6px trauma` | Helicopter missile impact |
| **Screen Shake** | `8px trauma` | Boss slam (Meteor Leap) |
| **I-Frames** | `0.8s` flashing invulnerability | On taking any damage |
| **Knockback** | `40px` push | Standard melee hit |
| **Knockback** | `80px` push | Special / Heavy attacks |
| **Particle FX** | Crimson slash trails | Calm's dash-slash |
| **Particle FX** | Muzzle flash + shell eject | Encore SMG / Minigun |
| **Screen Tint** | Crimson vignette | QTE activation |
| **Time Scale** | `0.2×` slow-mo | During QTE prompt window |
| **Camera Zoom** | `1.15×` zoom-in | Boss phase transitions |

---

### 3.3 Combo Meter Logic

```
Combo State Machine:
  [NO COMBO]
     │ — First hit lands
     ▼
  [ACTIVE COMBO] — counter increments each hit
     │ — 3s no-hit timer expires
     ▼
  [COMBO BROKEN] — final count locked for scoring
     │ — Score multiplier applied to tally
     ▼
  [NO COMBO]

Multipliers:
  1–9x   → ×1.0 score
  10–19x → ×1.5 score
  20–29x → ×2.0 score
  30x+   → ×3.0 score (MAX COMBO rank bonus)
  
SEZ passive extends active window by +2s.
```

---

## 4. End-to-End Level & Encounter Blueprint

---

### STAGE 1 — Dusk Rooftops & Construction Cranes

#### Environment Specification

| Layer | Element | Scroll Speed |
|---|---|---|
| Background (far) | Deep purple/orange sky gradient | 0.1× (slowest) |
| Background (mid) | Distant city tower silhouettes | 0.3× |
| Background (near) | Neon billboard flickers, water towers | 0.6× |
| Foreground (play) | Rooftops, AC units, satellite dishes, scaffolding | 1.0× |
| Foreground (vfx) | Dust motes, ember sparks rising | 1.2× |

**Color Palette:** Deep violet `#2D1B69` → warm amber `#FF6B35` → crimson `#C62828`

---

#### Section 1A — Rooftop Entry

**Purpose:** Tutorial / Intro combat. Teaches basic controls.

**Enemy Waves:**

```
Wave 1: 3× Street Grunt (baton) — spawn from left & right edges
Wave 2: 2× Street Grunt + 1× Pistol Gunner (rear-spawn, elevated box)
Wave 3: 4× Street Grunt + 2× Pistol Gunner — clears section gate
```

**Interactive Props:**
- 🛢 **Explosive Barrels** (HP: 1 hit): Placed near enemy clusters at `x=240`, `x=480`, `x=720`.
  - Detonation radius: 100px
  - Chain reaction if 2 barrels within 80px
  - Sound cue: sizzle → `boom` with `70ms` hit-stop
- 📦 **Crates**: Destructible. 30% chance to drop `+10 HP` pickup.

**Teaching Moment:**
- First barrel placed adjacent to 3 grunts clustered near it.
- Pistol Gunner intro: red laser sight `→` aim telegraph for `0.8s` before firing.
- Text callout appears: `"AIM FOR THE RED!"` on first laser sight appearance.

---

#### Section 1B — Crane & Gap Platforming

**Layout:**

```
[Rooftop A] ──gap──► [I-Beam 1] ──gap──► [Rooftop B] ──gap──► [I-Beam 2]
                       (swinging)                              (static)
                           │                                       │
                     [Rope-Drop Thugs]                    [Jetpack Thugs ambush]
```

**Platform Physics:**
- I-Beam 1: Swings on sine wave, amplitude ±40px, period 3s
- I-Beam 2: Static, narrower — requires precise landing
- Falling off a gap: **-10 HP**, respawn via grappling hook animation (0.5s)

**Enemy Introductions:**
- **Jetpack Thug** (airborne): Hovers and fires downward; must be hit while jumping or by Calm's crescent wave.
- **Rope-Drop Thug**: Rappels from crane overhead mid-jump, surprise attack; short stun window on landing.

**Hazards:**
- Rotating crane arm sweeps across upper third of screen every 8s — signals with warning shadow + horn sound.

---

#### Section 1C — Cutscene & QTE Frenzy

**Trigger:** Player reaches far-right edge of Section 1B.

**Cutscene Sequence (Dialogue Box — Retro Style):**

```
╔════════════════════════════════╗
║  NOOBDA                        ║
║  [Villain portrait, smirking]  ║
╠════════════════════════════════╣
║  "So you actually made it.     ║
║   Impressive for two           ║
║   amateurs. Let's see how      ║
║   you handle THIS..."          ║
╚════════════════════════════════╝
```

- Noobda appears on adjacent ledge, gestures dramatically.
- 15+ enemy grunts flood the screen from both sides.
- **QTE Sequence initiates:**

**QTE Mechanic — Full Flow:**

```
NORMAL GAMEPLAY
     │
     ▼ [15+ enemies spawn]
TIME SCALE → 0.2× (slow-mo)
SCREEN → Crimson vignette overlay
     │
     ▼ [Flashing prompt appears center-screen]
  ╔═══════════════╗
  ║  PRESS  [X]  ║   ← 2.5 second window
  ╚═══════════════╝
     │
  ┌──┴───────────────────┐
  │                      │
SUCCESS                FAIL
  │                      │
Cinematic QTE         Enemies activate normally
  │                      │ (no punishment beyond combat)
  ▼
CALM teleports in 5 red slash trails L→R
Each trail = instant-kill frame on 3 enemies
15 kills, crimson explosion particles
TIME SCALE → 1.0× (resume)
STAGE 1 COMPLETE banner drops
```

---

### STAGE 2 — Sunset Metro Train & Helicopter Chase

#### Environment Specification

| Layer | Element | Scroll Speed |
|---|---|---|
| Sky BG | Warm gradient sunset, clouds | 0.05× |
| City BG | Building skyline rushing R→L | 0.4× |
| Power Lines | Overhead wire cables scrolling | 0.8× |
| Train Cars | Moving foreground play surface | 1.0× (auto-scroll) |
| Foreground | Sparks from tracks, dust | 1.3× |

**Auto-Scroll Rules:**
- Train always moves right-to-left at 240px/s
- Players cannot move left of screen `x=60` (pushed by scroll)
- Gaps between carriages: 20px wide, trigger damage zone

---

#### Section 2A — Train Car Rush

**Enemy Waves (Drop-from-sky spawning):**

```
Carriage 1: 4× Street Grunt (drop down from bridge overhang)
Carriage 2: 2× Street Grunt + 2× Pistol Thug (rooftop drops)
Carriage 3: 2× SHIELD BRUISER — first appearance
            → Tutorial text: "FLANK THEM!" (Calm dash or Encore explosive)
Carriage 4: Mixed wave: 3× Grunt + 1× Heavy Gunner (turret, back carriage)
Carriage 5: (Transition zone) — gap hazard, Rope-Drop Thugs mid-gap
```

**Shield Bruiser First Encounter Design:**
- Bruiser walks slowly forward blocking gunfire.
- Callout: Calm AI partner auto-dashes behind if 1P is Encore; teaching moment for P1 to rotate behind.
- Destroying a Bruiser drops `+15 HP` pickup (guaranteed).

---

#### Section 2B — Minigun Crate & Attack Helicopter

**Crate Event:**

```
[Helicopter cargo hook descends]
     │
     ▼
Crate drops on Center Carriage roof (x=400)
Flashing icon: 🔫 MINIGUN
     │
Encore approaches → auto-equip cutscene (0.5s)
Encore portrait icon updates to Minigun pixel art
HUD weapon icon: [MINIGUN ∞ ammo]
```

---

#### Mini-Boss: NOOBDA'S RED ATTACK HELICOPTER

**Entity Specification:**

```
HP: 300
Hitbox: Center fuselage only (60×40px)
Position: Floats at y=100 (mid-background layer)
Weak to: Minigun sustained fire (15 dmg/frame)
         Calm deflected missiles (60 dmg each)
```

**Attack Pattern State Machine:**

```
[IDLE HOVER] ──────────────────────────────────────────────────────────┐
     │                                                                  │
     ├─ 3s hover window → Minigun fire opportunity                      │
     │                                                                  │
     ▼                                                                  │
[ATTACK PHASE 1: SWEEP] ←────────────────────────── 50% HP threshold  │
  - Red telegraph line sweeps across train roof (L→R, 2s)             │
  - Players: JUMP or ROLL over line                                    │
  - Duration: 2.5s                                                     │
     │                                                                  │
     ▼                                                                  │
[ATTACK PHASE 2: MISSILES]                                             │
  - Fires 3 homing missiles in sequence, 0.5s apart                   │
  - Each missile: 20 dmg on hit                                        │
  - Missile HP: 10 (can be shot down with SMG)                        │
  - Calm can deflect missile with timed [J] → 60 dmg to chopper       │
     │                                                                  │
     ▼                                                                  │
[RETREAT / REPOSITION] → 2s fly-off, return from other side           │
     │                                                                  │
     └──────────────────────────────────────────────────────────────────┘
```

**Phase Thresholds:**

| HP Range | Behavior Change |
|---|---|
| 300–200 HP | Standard pattern above |
| 200–100 HP | Sweep line speed +40%; fires 2 sweeps consecutively |
| 100–0 HP | Missiles fire in rapid triple-volley; hover window shrinks to 1.5s |

**Defeat Sequence:**
- Helicopter explodes in layered orange/black pixel explosion (3 frames, 500ms)
- Carriage it crashes onto collapses (brief platform hazard)
- Screen flash → fade to black → **Stage 3 concert venue transition cutscene**

---

### STAGE 3 — Live Concert Arena / Boss Fight: MUTANT NOOBDA

#### Environment Specification

```
[Concert Stage Layout — Top-Down View]
                    
  [Speaker Stack L]  [Main Stage Platform]  [Speaker Stack R]
       ↑                      ↑                       ↑
  Climbable          Primary fight zone           Climbable
  platform           (ground level)               platform
  
  [Silhouetted crowd — foreground overlay, non-interactive]
  
Spotlights: 4 sweeping beams, looping L→R
Strobe: 120ms on/off during Phase 2
Giant Screen BG: Renders Noobda's face during boss fight
```

**Color Palette Shifts by Phase:**

| Phase | Lighting | Palette |
|---|---|---|
| Pre-fight | Warm amber stage lights | `#FFB347`, `#FF6B35` |
| Phase 1 | Standard stage blues/yellows | `#1A1A2E`, `#E0E0FF` |
| Phase 2 | Intense red/purple strobes | `#C62828`, `#6A0DAD` |
| Finisher | White flash → pixel explosion | `#FFFFFF` |

---

#### Pre-Fight Cutscene

```
╔════════════════════════════════════════╗
║  NOOBDA                                ║
║  [Cornered on stage, backed to amp]    ║
╠════════════════════════════════════════╣
║  "You think this ends here?            ║
║   I am NAAMCHEEN. I am                 ║
║   UNSTOPPABLE."                        ║
╚════════════════════════════════════════╝

[Noobda pulls glowing green mutagen vial]
[Drinks it — full-screen animation]
[Body begins expanding, pixels glitching]
[Monster roar — screen shake 8px]
[BOSS HEALTH BAR APPEARS: ☠ MUTANT NOOBDA]
```

---

#### Boss Phase 1 — 100% to 50% HP

**Active Attacks:**

**① Meteor Leap Slam**
```
Trigger: Every 8–10s (randomized)
Animation: Noobda crouches → leaps off-screen (top)
Target Reticle: Red circle tracks player position for 1.5s
Crash Down: Boss lands on reticle location
Shockwave: Low ground wave, 60px wide, L & R from impact
Damage: Impact 30 dmg; Shockwave 15 dmg
Avoid: JUMP at moment of impact (shockwave is ground-level only)
Cooldown: 3s vulnerable window after landing (punish opportunity)
```

**② Mutant Dash Charge**
```
Trigger: Every 12–15s
Telegraph: Noobda faces target → roar animation (1s) → flashes RED
Charge: Horizontal dash, full stage width, 0.6s duration
Damage: 25 dmg on contact
Avoid: Jump or dodge perpendicular to charge path
After charge: 1.5s stumble cooldown (punish opportunity)
```

---

#### Boss Phase 2 — 50% to 15% HP

**Phase Transition:**
- HP crosses 50% → screen flashes white → 0.5s cinematic zoom on Noobda
- Lighting shifts to red/purple strobes
- All attack cooldowns reduced by 25%
- New attacks added to rotation:

**③ Hyper Energy Beam**
```
Trigger: Every 20s (Phase 2 only)
Telegraph: Noobda rears back, chest/mouth glows white (2s charge)
           Warning text: "GET TO THE PLATFORMS!"
Beam: Massive horizontal beam, covers ground level L→R (1.5s duration)
      Damage per frame: 5 dmg (potential 100+ dmg if caught full)
Avoid: 
  Option A — Double Jump above beam
  Option B — Climb Speaker Stack platforms (climb via jump at stack base)
Vulnerable window: 1.5s after beam (boss staggers)
```

**④ Minion Reinforcements (at 35% HP — one-time event)**
```
Trigger: First time HP crosses 35% threshold
Spawn: 2–3 Street Grunts fall from rigging above stage
Purpose: Health pickup delivery — each grunt drops +20 HP on defeat
Design note: Forces player to split attention; Noobda continues attacking
```

---

#### Boss Finisher — Co-Op QTE (at 15% HP)

```
HP CROSSES 15%
     │
     ▼
Noobda staggers to one knee — large stagger animation
TIME SCALE → 0.3× slow-mo
SCREEN → white rim-light vignette

╔══════════════════════════════════════════╗
║                                          ║
║    ⚡  PRESS [X] — CO-OP FINISHER  ⚡    ║
║          3  2  1 ... countdown           ║
╚══════════════════════════════════════════╝

SUCCESS → Cinematic triggers:
  [ENCORE] raises Minigun → fires continuous hail at Noobda
           Noobda pinned in place, shaking under impact
           Duration: 3s firing sequence
  
  [CALM]   leaps from Speaker Stack R (slow-mo arc)
           Katana gleams white → downward slam
           Final hit-stop: 200ms freeze
           Noobda explodes into 64×64 pixel particle burst
           
  SCREEN WIPE → white → Stage Clear

FAIL (timeout) → 
  Noobda recovers, restores to 20% HP, Phase 2 resumes
  QTE re-triggers next time HP reaches 15%
```

---

## 5. Enemy Roster & AI Behavior Table

| Enemy Type | HP | Speed | Attack | Counterplay | Drop |
|---|---|---|---|---|---|
| **Street Grunt** | 20 HP | Med | Walks toward player; baton swing at ≤80px range | Any basic combo or SMG burst | 10% — `+5 HP` |
| **Pistol Thug** | 25 HP | Slow | Stops at ~200px; `0.8s` laser telegraph; fires 1 shot (10 dmg) | Deflect with Calm or close gap | 15% — `+5 HP` |
| **Jetpack Thug** | 30 HP | Air | Hovers, fires down; lands if HP ≤ 50% | Hit airborne (Calm wave / Encore burst) | 10% — `+5 HP` |
| **Rope-Drop Thug** | 25 HP | Air→Ground | Rappels from above; brief stun on landing | Attack during landing window (0.6s) | 10% — `+5 HP` |
| **Shield Bruiser** | 60 HP | Slow | Blocks all frontal projectiles; advances + shield bash | Flank (Calm dash-slash) or explosive | 100% — `+15 HP` |
| **Heavy Gunner** | 80 HP | Stationary | 5-round spread burst every 3s; fixed turret position | Jump over spread; punish during 2s reload | 100% — `+10 HP` |
| **Attack Chopper** | 300 HP | Air | Sweep gun line + homing missiles; 3s hover window | Minigun during hover; Calm deflects missiles | Stage boss drop |
| **Mutant Noobda** | 600 HP | Variable | Leap slam, charge, beam, minion summons | Phase-dependent (see §4) | Story completion |

### Enemy AI State Machines

**Street Grunt:**
```
[WANDER] → detect player ≤ 300px → [CHASE] → reach ≤ 80px → [ATTACK]
  [ATTACK] → baton swing (0.5s animation) → [COOLDOWN 0.8s] → [CHASE]
  [HIT] → flinch 0.3s → resume prior state
  [HP=0] → [DEATH] particle burst, drop check
```

**Pistol Thug:**
```
[WANDER] → detect player → [RETREAT to 200px range] → [AIM 0.8s]
  → [FIRE] → [COOLDOWN 1.5s] → [AIM]
  [Player closes < 100px] → [PANIC RETREAT] → try re-establish range
  [HIT during AIM] → [FLINCH] → [AIM reset]
```

**Shield Bruiser:**
```
[ADVANCE with shield] → player in front → [BLOCK projectiles passively]
  → reach ≤ 100px → [BASH 60px push, 15 dmg]
  [Flanked (player behind)] → [STUNNED 0.5s, shield drops]
  [HP ≤ 30] → [BERSERK: speed +50%, shield dropped permanently]
```

---

## 6. Post-Game, Scoring & Replayability

### Stage Clear Screen Layout

```
╔═══════════════════════════════════════════════════════╗
║           ✦  STAGE CLEAR  ✦                           ║
╠═══════════════════════════════════════════════════════╣
║  CHARACTER: CALM + ENCORE                             ║
╠════════════════════╤══════════════════════════════════╣
║  TIME BONUS        │  2:34 clear → +5,000 pts         ║
║  MAX COMBO         │  27× combo  → +13,500 pts        ║
║  ENEMIES DEFEATED  │  48 / 50    → +24,000 pts        ║
║  DAMAGE TAKEN      │  35 HP      → +7,500 pts (bonus) ║
╠════════════════════╧══════════════════════════════════╣
║                                                       ║
║            TOTAL SCORE:   50,000                      ║
║                                                       ║
║            RANK:  ★ A ★                              ║
╚═══════════════════════════════════════════════════════╝
```

### Rank Thresholds

| Rank | Score Range | Criteria |
|---|---|---|
| **S** | 70,000+ pts | Near-perfect run; <20 HP damage taken |
| **A** | 50,000–69,999 | Strong combo, fast clear |
| **B** | 30,000–49,999 | Average performance |
| **C** | <30,000 | Completion only; no bonus requirements met |

### Scoring Formula

```
TOTAL = (Enemies × 500) 
      + (MaxCombo × 500) 
      + (TimeBonus: 10,000 − [seconds_over_par × 100]) 
      + (DamageBonusPool: 10,000 − [damage_taken × 285])
      
Where DamageBonusPool minimum is 0 (never penalizes below 0)
```

---

### Unlock Tree

```
[STORY CLEAR — Any difficulty]
        │
        ├──► UNLOCK: Mo (Character Select)
        ├──► UNLOCK: Sez (Character Select)
        ├──► UNLOCK: Boss Rush Mode
        └──► UNLOCK: Hardcore Arcade Mode

[BOSS RUSH MODE]
  All 2 mini-bosses + Mutant Noobda back-to-back
  No stage traversal; boss HP restored between fights
  Leaderboard: Time Attack scoring

[HARDCORE ARCADE MODE]
  1 Credit / 3 Lives total (no continues)
  No I-frame recovery (take full damage in bursts)
  Enemy HP +25%, attack speed +20%
  S-Rank: Special "NAAMCHEEN" title unlocked
```

---

## 7. Technical Architecture Notes

### Engine Recommendations

| System | Implementation |
|---|---|
| **Engine** | Godot 4.x (GDScript) or Unity 2D (C#) |
| **Resolution** | Native 384×216 (16:9, 16-bit pixel scale) |
| **Display** | Upscaled 1920×1080 with nearest-neighbor filtering |
| **Frame Rate** | 60 FPS target; physics at 60 Hz |
| **Renderer** | 2D with sprite layers; parallax via `CanvasLayer` groups |

### Core Systems Checklist

```
[ ] Entity Component System (ECS) for all fighters + enemies
[ ] State Machine (FSM) per entity (Idle/Walk/Attack/Hurt/Die)
[ ] Combo Timer (global singleton, resets per player)
[ ] Hit Detection: Hitbox/Hurtbox separate collision layers
[ ] Screen Shake: Camera trauma system (additive, decays over 0.3s)
[ ] Hit-Stop: Global time scale dip via Engine.time_scale or FixedUpdate pause
[ ] Parallax Manager: 5–7 scroll layers with individual speed multipliers
[ ] QTE Manager: Time-scale controller + input window + outcome branches
[ ] AI Behavior: Per-enemy FSM with shared Perception radius system
[ ] Save System: JSON save (unlocks, hi-scores per stage)
[ ] Audio: 16-bit SFX bank; dynamic music layering per stage section
```

### Audio Design Notes

| Trigger | Sound Design |
|---|---|
| Katana hit (light) | Metallic "tshhk" — short, 8-bit layered |
| Katana hit (finisher) | "SLASH" — longer attack + sub-bass punch |
| SMG burst | "dak-dak-dak" — rapid 8-bit sample |
| Minigun fire | Continuous roar; pitch shift on spin-up/down |
| Explosion barrel | "BOOM" — sub-bass impact, bit-crushed |
| Boss slam | Deep 808-style impact + stadium reverb |
| QTE success | Rising synth sting + crowd cheer sample |
| BGM | Dynamic: Stage 1 lo-fi → Stage 2 high-energy → Stage 3 concert mix |

---

> [!TIP]
> **Recommended First Build Target:** Implement Stage 1 Sections 1A–1B with Calm + Encore as a vertical slice. This validates the combo system, parallax, enemy FSMs, and QTE pipeline before authoring Stages 2–3.

> [!IMPORTANT]
> **Co-Op Drop-In:** The drop-in co-op system requires the second player's character to maintain an independent HP/Special meter from tick 0 even in 1P mode. Store both states simultaneously to avoid re-initialization bugs on drop-in.

---

*GDD v1.0 — Seedhe Maut: Naamcheen — All systems subject to revision during playtesting.*
