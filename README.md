# 🎮 Seedhe Maut — Naamcheen · Game Design Document

> A complete, buildable **Game Design Document (GDD)** for a 16-bit side-scrolling beat-em-up inspired by the *Naamcheen* music video by Seedhe Maut.

---

## 📄 Document

👉 **[Read the full GDD →](./GDD.md)**

---

## 🕹️ Game Overview

| Field | Detail |
|---|---|
| **Genre** | Side-scrolling Beat-Em-Up / Action Platformer |
| **Art Style** | 16-bit Pixel Art |
| **Players** | 1P Solo (Tag-Team Swap) or 2P Local Co-Op |
| **Stages** | 3 (Dusk Rooftops → Metro Train → Concert Arena) |
| **Playable Characters** | CALM, ENCORE + unlockable MO, SEZ |
| **Boss** | Mutant Noobda (3-phase fight with Co-Op QTE finisher) |

---

## 🌐 Play Immediately in Your Browser!

You don't need Godot or any game engine installed! You can run the entire 16-bit beat-em-up in any modern web browser:

1. Navigate to the `web/` folder.
2. Double-click or open **`web/index.html`** in Chrome, Edge, Brave, or Firefox.
3. Select **CALM** or **ENCORE** and start fighting across all 3 stages!

### 🎮 Controls

| Action | Key / Input |
|---|---|
| **Move** | `A` / `D` or `Arrow Keys` |
| **Jump** | `W` or `Up Arrow` (Calm has **Double Jump**) |
| **Tactical Roll** | `S` or `Down Arrow` (Encore) |
| **Attack / Fire** | `J` (Katana combo / SMG bursts / Minigun) |
| **Special Attack** | `K` (Crimson Dash-Slash / Incendiary Grenade) |
| **Tag Swap** | `L` (Instant switch between Calm & Encore) |
| **QTE Trigger** | `X` (Press during slow-mo QTE sequences) |

---

## 📦 Repository Structure

```
seedhe-maut-naamcheen-gdd/
├── GDD.md                         # Complete Game Design Document
├── README.md                      # Overview & setup instructions
├── web/                           # 🌐 Instant Playable Web Game (HTML5 Canvas + WebAudio)
│   ├── index.html                 # Main web container & CRT overlay
│   ├── style.css                  # Retro arcade styling & animations
│   └── game.js                    # Complete engine, characters, enemies & boss logic
└── godot_project/                 # Godot 4 (GDScript) Engine Version
```
    ├── project.godot              # 384x216 pixel-art setup, layers & inputs
    ├── scripts/
    │   ├── autoloads/
    │   │   ├── game_manager.gd    # Score formula, lives, rank calculation (S/A/B/C)
    │   │   ├── combo_manager.gd   # Dynamic combo meter, timeouts & multipliers
    │   │   ├── screen_effects.gd  # Hit-stop (40/70ms), screen shake trauma, tints
    │   │   └── audio_manager.gd   # 8-voice SFX pool & BGM crossfading
    │   └── components/
    │       ├── hitbox.gd          # Configurable damage, knockback & hit-stop
    │       └── hurtbox.gd         # Invincibility frames (0.8s) & blink tweening
    └── scenes/
        ├── characters/
        │   ├── calm.gd            # 3-hit combo, deflect parry, dash-slash
        │   ├── encore.gd          # 8-dir SMG burst, roll, grenade, minigun
        │   └── projectile.gd      # Directional / homing missile physics
        ├── enemies/
        │   ├── street_grunt.gd    # Baton swing FSM & HP drops
        │   ├── pistol_thug.gd     # 0.8s laser sight telegraph FSM
        │   ├── shield_bruiser.gd  # Frontal block, flanking stun, berserk mode
        │   ├── hp_pickup.gd       # Sine-wave bobbing heal pickup
        │   └── wave_spawner.gd    # Multi-wave spawner & sequencing
        ├── stages/
        │   ├── stage_1.gd         # Section 1A -> 1B -> 1C director
        │   ├── parallax_manager.gd# 5-layer background parallax system
        │   └── qte_manager.gd     # Stage 1C Katana Frenzy & Co-Op Finisher QTEs
        └── ui/
            ├── hud.gd             # HP/Special bars, combo popups, boss bars
            └── dialogue_box.gd    # Retro typewriter dialogue system
```

---

## ⚡ Quick Start with Godot 4

1. Download or open **Godot 4.2+**.
2. Click **Import** and select `godot_project/project.godot`.
3. Hit **Play (F5)** to run the vertical slice.

---

## ⚡ Inspired By

[Seedhe Maut — Naamcheen (Official Music Video)](https://www.youtube.com/watch?v=Seedhe-Maut-Naamcheen)

---

*GDD v1.0 — All systems subject to revision during playtesting.*
