/**
 * SEEDHE MAUT - NAAMCHEEN // PRODUCTION 16-BIT WEB BRAWLER
 * Full authentic asset integration (Calm, Encore, Grunts, Pistol Thugs, Shields, Chopper, Mutant Noobda)
 */

// --- 1. ASSET LOADER ---
const ASSETS = {
  // Background Scenarios
  bgStage1: new Image(),
  bgStage2: new Image(),
  bgStage3: new Image(),
  titleBg: new Image(),
  
  // High-Res Character Dialogue Portraits
  portraitCalm: new Image(),
  portraitEncore: new Image(),
  portraitNoobda: new Image(),
  
  // Real In-Game Extracted Character & Enemy Sprites
  spriteCalm: new Image(),
  spriteCalmAttack: new Image(),
  spriteEncore: new Image(),
  spriteEncoreShoot: new Image(),
  spriteEnemyGrunt: new Image(),
  spriteEnemyPistol: new Image(),
  spriteEnemyShield: new Image(),
  spriteChopper: new Image(),
  spriteMutantNoobda: new Image()
};

function loadGameAssets() {
  ASSETS.bgStage1.src = 'assets/bg_stage1.jpg';
  ASSETS.bgStage2.src = 'assets/bg_stage2.jpg';
  ASSETS.bgStage3.src = 'assets/bg_stage3.jpg';
  ASSETS.titleBg.src = 'assets/title_bg.jpg';
  ASSETS.portraitCalm.src = 'assets/portrait_calm.jpg';
  ASSETS.portraitEncore.src = 'assets/portrait_encore.jpg';
  ASSETS.portraitNoobda.src = 'assets/portrait_noobda.jpg';

  ASSETS.spriteCalm.src = 'sprites/sprite_calm.png';
  ASSETS.spriteCalmAttack.src = 'sprites/sprite_calm_attack.png';
  ASSETS.spriteEncore.src = 'sprites/sprite_encore.png';
  ASSETS.spriteEncoreShoot.src = 'sprites/sprite_encore_shoot.png';
  ASSETS.spriteEnemyGrunt.src = 'sprites/sprite_enemy_grunt.png';
  ASSETS.spriteEnemyPistol.src = 'sprites/sprite_enemy_pistol.png';
  ASSETS.spriteEnemyShield.src = 'sprites/sprite_enemy_shield.png';
  ASSETS.spriteChopper.src = 'sprites/sprite_chopper.png';
  ASSETS.spriteMutantNoobda.src = 'sprites/sprite_mutant_noobda.png';
}
loadGameAssets();

// --- 2. 16-BIT RETRO SYNTHESIZER ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.isPlayingBGM = false;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startMusicLoop();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'square', duration = 0.1, gainVal = 0.15) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playSlash() {
    this.playTone(340, 'sawtooth', 0.08, 0.25);
    setTimeout(() => this.playTone(180, 'triangle', 0.1, 0.2), 30);
  }

  playFinisherSlash() {
    this.playTone(460, 'sawtooth', 0.12, 0.35);
    setTimeout(() => this.playTone(90, 'triangle', 0.25, 0.45), 40);
  }

  playSMG() {
    this.playTone(650 + Math.random() * 200, 'square', 0.04, 0.12);
  }

  playMinigun() {
    this.playTone(220 + Math.random() * 150, 'sawtooth', 0.05, 0.2);
  }

  playExplosion() {
    this.playTone(70, 'square', 0.35, 0.4);
    setTimeout(() => this.playTone(35, 'triangle', 0.45, 0.5), 50);
  }

  playDeflect() {
    this.playTone(950, 'sine', 0.1, 0.35);
    setTimeout(() => this.playTone(1500, 'sine', 0.15, 0.35), 30);
  }

  playHit() {
    this.playTone(120, 'triangle', 0.06, 0.25);
  }

  startMusicLoop() {
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    
    // Naamcheen drill groove pattern
    const bass = [55, 55, 55, 65, 55, 55, 73, 69];
    const melody = [220, 261, 293, 329, 293, 261, 220, 196];
    
    setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const bFreq = bass[this.step % bass.length];
      const mFreq = melody[(this.step * 2) % melody.length];
      
      this.playTone(bFreq, 'sawtooth', 0.16, 0.14);
      if (this.step % 2 === 0) {
        this.playTone(mFreq, 'square', 0.1, 0.06);
      }
      if (this.step % 2 === 1) {
        this.playTone(850 + Math.random() * 350, 'triangle', 0.03, 0.05);
      }
      this.step++;
    }, 190);
  }
}

const audio = new SoundController();

// --- 3. CANVAS & ENGINE SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const VIEW_W = 480;
const VIEW_H = 270;
const SCALE = 2;

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  audio.init();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

let screenShakeTrauma = 0;
let hitStopFrames = 0;
let timeScale = 1.0;
const camera = { x: 0, y: 0 };
const particles = [];

function addSpark(x, y, color = '#ff0055', count = 6, speed = 3) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.04,
      color,
      size: Math.random() * 2.5 + 1
    });
  }
}

function addTextParticle(x, y, text, color = '#ffeb3b') {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -2,
    life: 1.0,
    decay: 0.03,
    color,
    text,
    isText: true
  });
}

// --- 4. PROJECTILE SYSTEM ---
class Projectile {
  constructor(x, y, vx, vy, damage, isPlayer, isMissile = false, color = '#00e5ff') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.isMissile = isMissile;
    this.color = color;
    this.radius = isMissile ? 6 : 3;
    this.active = true;
    this.life = 180;
  }

  update() {
    this.x += this.vx * timeScale;
    this.y += this.vy * timeScale;
    this.life--;
    if (this.life <= 0) this.active = false;
    
    if (this.isMissile && Math.random() > 0.3) {
      addSpark(this.x, this.y, '#ff5722', 1, 1);
    }
  }

  draw(g) {
    g.fillStyle = this.color;
    g.beginPath();
    g.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    g.fill();
  }
}

// --- 5. PLAYER CONTROLLER (CALM & ENCORE) ---
class Player {
  constructor() {
    this.charType = 'calm';
    this.x = 80;
    this.y = 190;
    this.vx = 0;
    this.vy = 0;
    this.w = 26;
    this.h = 42;
    this.facing = 1;
    this.hp = 100;
    this.maxHp = 100;
    this.special = 40;
    this.maxSpecial = 100;
    this.isGrounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.invulnerableTimer = 0;
    
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.attackTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollCooldown = 0;

    this.hasMinigun = false;
    this.shootCooldown = 0;
  }

  swapChar() {
    this.charType = this.charType === 'calm' ? 'encore' : 'calm';
    this.maxJumps = this.charType === 'calm' ? 2 : 1;
    addTextParticle(this.x, this.y - 25, `SWAP: ${this.charType.toUpperCase()}`, '#00e5ff');
    addSpark(this.x, this.y, '#00e5ff', 14, 4);
    audio.playTone(520, 'sine', 0.1, 0.25);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.isDashing || this.isRolling) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 45;
    screenShakeTrauma = Math.min(1.0, screenShakeTrauma + 0.45);
    addSpark(this.x, this.y, '#ff1744', 10, 3.5);
    addTextParticle(this.x, this.y - 15, `-${amount}`, '#ff1744');
    audio.playHit();
    gameState.damageTaken += amount;
    
    if (this.hp <= 0) {
      gameState.gameOver(false);
    }
  }

  update(stage) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.rollCooldown > 0) this.rollCooldown--;
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.attackTimer > 0) this.attackTimer--;
    
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) this.comboStep = 0;
    }

    if (this.special < this.maxSpecial && Math.random() < 0.04) {
      this.special += 1;
    }

    if (this.isDashing) {
      this.dashTimer--;
      this.vx = this.facing * 9.0;
      this.vy = 0;
      addSpark(this.x, this.y + 10, '#ff0055', 3, 2.5);
      if (this.dashTimer <= 0) this.isDashing = false;
    } else if (this.isRolling) {
      this.rollTimer--;
      this.vx = this.facing * 6.5;
      if (this.rollTimer <= 0) this.isRolling = false;
    } else {
      const moveSpd = this.charType === 'calm' ? 3.6 : 3.2;
      if (keys['a'] || keys['arrowleft']) {
        this.vx = -moveSpd;
        this.facing = -1;
      } else if (keys['d'] || keys['arrowright']) {
        this.vx = moveSpd;
        this.facing = 1;
      } else {
        this.vx *= 0.65;
      }

      // Jump
      if (keys['w'] || keys['arrowup']) {
        if (!this.jumpKeyHeld) {
          this.jumpKeyHeld = true;
          if (this.isGrounded || this.jumpCount < this.maxJumps) {
            this.vy = -7.5;
            this.jumpCount++;
            this.isGrounded = false;
            audio.playTone(320, 'triangle', 0.1, 0.15);
            addSpark(this.x, this.y + this.h / 2, '#fff', 3, 2);
          }
        }
      } else {
        this.jumpKeyHeld = false;
      }

      // Roll (Encore)
      if ((keys['s'] || keys['arrowdown']) && this.charType === 'encore' && this.rollCooldown <= 0) {
        this.isRolling = true;
        this.rollTimer = 16;
        this.rollCooldown = 55;
        this.invulnerableTimer = 22;
        audio.playTone(160, 'triangle', 0.1, 0.2);
      }

      // Tag Swap (L)
      if (keys['l']) {
        if (!this.swapKeyHeld) {
          this.swapKeyHeld = true;
          this.swapChar();
        }
      } else {
        this.swapKeyHeld = false;
      }

      // Attack (J)
      if (keys['j']) {
        if (this.charType === 'calm') {
          if (!this.attackKeyHeld) {
            this.attackKeyHeld = true;
            this.executeKatanaCombo(stage);
          }
        } else {
          this.executeGunslingerShot(stage);
        }
      } else {
        this.attackKeyHeld = false;
      }

      // Special (K)
      if (keys['k']) {
        if (!this.specialKeyHeld) {
          this.specialKeyHeld = true;
          this.executeSpecial(stage);
        }
      } else {
        this.specialKeyHeld = false;
      }
    }

    if (!this.isDashing) {
      this.vy += 0.42;
    }
    this.x += this.vx * timeScale;
    this.y += this.vy * timeScale;

    // Platform Collisions
    const floorY = stage.getFloorY(this.x);
    if (this.y + this.h / 2 >= floorY) {
      this.y = floorY - this.h / 2;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
    } else {
      this.isGrounded = false;
    }

    // Gap Fall
    if (this.y > 260) {
      this.takeDamage(15);
      this.x = Math.max(50, this.x - 120);
      this.y = 170;
      this.vy = 0;
      addTextParticle(this.x, this.y - 15, 'GAP FALL! -15 HP', '#ff1744');
    }

    if (this.x < 30) this.x = 30;
    if (this.x > stage.length - 40) this.x = stage.length - 40;
  }

  executeKatanaCombo(stage) {
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 35;
    this.attackTimer = 14;
    
    const hitBox = {
      x: this.x + this.facing * 24,
      y: this.y,
      radius: 32,
      damage: this.comboStep === 3 ? 30 : 15
    };

    addSpark(hitBox.x, hitBox.y, '#ff0055', 8, 3.5);
    
    // Parry / Deflect
    for (let p of stage.projectiles) {
      if (!p.isPlayer && Math.hypot(p.x - hitBox.x, p.y - hitBox.y) < hitBox.radius + 15) {
        p.isPlayer = true;
        p.vx = this.facing * 10;
        p.vy = (Math.random() - 0.5) * 2;
        p.color = '#00e5ff';
        p.damage = 40;
        audio.playDeflect();
        addSpark(p.x, p.y, '#ffd700', 12, 4);
        addTextParticle(p.x, p.y - 10, 'BULLET PARRY!', '#ffd700');
        hitStopFrames = 3;
      }
    }

    let hitAny = false;
    stage.enemies.forEach(e => {
      if (Math.hypot(e.x - hitBox.x, e.y - hitBox.y) < hitBox.radius + e.w / 2) {
        e.takeDamage(hitBox.damage, this.facing);
        hitAny = true;
      }
    });

    if (stage.boss && Math.hypot(stage.boss.x - hitBox.x, stage.boss.y - hitBox.y) < hitBox.radius + 40) {
      stage.boss.takeDamage(hitBox.damage);
      hitAny = true;
    }

    if (hitAny) {
      gameState.addHit();
      this.special = Math.min(this.maxSpecial, this.special + 7);
      if (this.comboStep === 3) {
        audio.playFinisherSlash();
        hitStopFrames = 4;
        screenShakeTrauma = 0.35;
        stage.projectiles.push(new Projectile(this.x, this.y, this.facing * 8.0, 0, 22, true, false, '#ff0055'));
      } else {
        audio.playSlash();
        hitStopFrames = 2;
      }
    } else {
      audio.playSlash();
    }
  }

  executeGunslingerShot(stage) {
    if (this.shootCooldown > 0) return;
    this.attackTimer = 10;
    
    if (this.hasMinigun) {
      this.shootCooldown = 4;
      stage.projectiles.push(new Projectile(this.x + this.facing * 20, this.y - 2, this.facing * 12, (Math.random() - 0.5) * 1.5, 18, true, false, '#ffd700'));
      audio.playMinigun();
      screenShakeTrauma = Math.min(0.4, screenShakeTrauma + 0.08);
      this.special = Math.min(this.maxSpecial, this.special + 1);
    } else {
      this.shootCooldown = 12;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          stage.projectiles.push(new Projectile(this.x + this.facing * 16, this.y - 2, this.facing * 9.0, (Math.random() - 0.5) * 1, 10, true, false, '#00e5ff'));
          audio.playSMG();
          this.special = Math.min(this.maxSpecial, this.special + 2);
        }, i * 40);
      }
    }
  }

  executeSpecial(stage) {
    if (this.special < 30) {
      addTextParticle(this.x, this.y - 15, 'METER LOW!', '#ff1744');
      return;
    }

    this.special -= 30;

    if (this.charType === 'calm') {
      this.isDashing = true;
      this.dashTimer = 16;
      this.invulnerableTimer = 22;
      screenShakeTrauma = 0.55;
      hitStopFrames = 4;
      audio.playFinisherSlash();
      addTextParticle(this.x, this.y - 15, 'CRIMSON DASH-SLASH!', '#ff0055');

      stage.enemies.forEach(e => {
        if (Math.abs(e.y - this.y) < 30 && (e.x - this.x) * this.facing > 0 && Math.abs(e.x - this.x) < 160) {
          e.takeDamage(50, this.facing);
          gameState.addHit();
        }
      });
      if (stage.boss && Math.abs(stage.boss.x - this.x) < 160) {
        stage.boss.takeDamage(50);
        gameState.addHit();
      }
    } else {
      addTextParticle(this.x, this.y - 15, 'INCENDIARY GRENADE!', '#ff9800');
      audio.playTone(360, 'sawtooth', 0.2, 0.25);
      const gx = this.x + this.facing * 90;
      const gy = this.y;
      
      setTimeout(() => {
        audio.playExplosion();
        screenShakeTrauma = 0.75;
        hitStopFrames = 6;
        addSpark(gx, gy, '#ff5722', 30, 7);
        addSpark(gx, gy, '#ffeb3b', 20, 5);

        stage.enemies.forEach(e => {
          if (Math.hypot(e.x - gx, e.y - gy) < 85) {
            e.takeDamage(65, Math.sign(e.x - gx));
            gameState.addHit();
          }
        });
        if (stage.boss && Math.hypot(stage.boss.x - gx, stage.boss.y - gy) < 95) {
          stage.boss.takeDamage(65);
          gameState.addHit();
        }
      }, 400);
    }
  }

  draw(g) {
    if (this.invulnerableTimer % 4 > 2) return;
    
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Shadow
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 3, 14, 5, 0, 0, Math.PI * 2);
    g.fill();

    // RENDER AUTHENTIC EXTRACTED SPRITE
    g.save();
    g.translate(rx, ry);
    if (this.facing < 0) {
      g.scale(-1, 1);
    }

    if (this.charType === 'calm') {
      const spr = (this.attackTimer > 0 && ASSETS.spriteCalmAttack.complete) 
        ? ASSETS.spriteCalmAttack 
        : ASSETS.spriteCalm;
        
      if (spr.complete) {
        g.drawImage(spr, -24, -26, 48, 52);
      } else {
        g.fillStyle = '#00e5ff';
        g.fillRect(-10, -20, 20, 40);
      }
    } else {
      const spr = (this.attackTimer > 0 && ASSETS.spriteEncoreShoot.complete) 
        ? ASSETS.spriteEncoreShoot 
        : ASSETS.spriteEncore;

      if (spr.complete) {
        g.drawImage(spr, -24, -26, 48, 52);
      } else {
        g.fillStyle = '#ffd700';
        g.fillRect(-10, -20, 20, 40);
      }
    }
    g.restore();
  }
}

// --- 6. ENEMY ROSTER (GRUNT, PISTOL THUG, SHIELD BRUISER) ---
class Enemy {
  constructor(x, y, type = 'grunt') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.facing = -1;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.attackTimer = 0;
    this.aimLaserTimer = 0;

    if (type === 'grunt') {
      this.hp = 25;
      this.w = 24;
      this.h = 42;
      this.speed = 1.4;
      this.damage = 10;
    } else if (type === 'pistol') {
      this.hp = 30;
      this.w = 24;
      this.h = 42;
      this.speed = 1.0;
      this.damage = 12;
    } else if (type === 'shield') {
      this.hp = 70;
      this.w = 28;
      this.h = 44;
      this.speed = 0.7;
      this.damage = 16;
      this.shieldUp = true;
    }
  }

  takeDamage(amount, hitDir) {
    if (this.type === 'shield' && this.shieldUp && hitDir !== this.facing) {
      addTextParticle(this.x, this.y - 15, 'SHIELD BLOCKED!', '#ffd700');
      addSpark(this.x, this.y, '#ffd700', 8, 3);
      audio.playTone(800, 'square', 0.05, 0.15);
      this.shieldUp = false;
      setTimeout(() => this.shieldUp = true, 750);
      return;
    }

    this.hp -= amount;
    this.vx = hitDir * 3.5;
    addSpark(this.x, this.y, '#ff0055', 6, 2.5);
    addTextParticle(this.x, this.y - 10, `-${amount}`, '#fff');
    audio.playHit();

    if (this.hp <= 0) {
      this.active = false;
      gameState.kills++;
      addSpark(this.x, this.y, '#ff0055', 16, 4.5);
    }
  }

  update(player, stage) {
    const dist = Math.abs(player.x - this.x);
    this.facing = Math.sign(player.x - this.x) || -1;

    if (this.type === 'grunt') {
      if (dist > 25) {
        this.x += this.facing * this.speed * timeScale;
      } else {
        this.attackTimer++;
        if (this.attackTimer >= 45) {
          this.attackTimer = 0;
          player.takeDamage(this.damage);
        }
      }
    } else if (this.type === 'pistol') {
      if (dist < 120) {
        this.x -= this.facing * this.speed * timeScale;
      } else if (dist > 220) {
        this.x += this.facing * this.speed * timeScale;
      } else {
        this.aimLaserTimer++;
        if (this.aimLaserTimer >= 50) {
          this.aimLaserTimer = 0;
          stage.projectiles.push(new Projectile(this.x, this.y - 4, this.facing * 5.8, 0, this.damage, false, false, '#ff1744'));
          audio.playTone(700, 'sawtooth', 0.05, 0.12);
        }
      }
    } else if (this.type === 'shield') {
      if (dist > 28) {
        this.x += this.facing * this.speed * timeScale;
      } else {
        this.attackTimer++;
        if (this.attackTimer >= 50) {
          this.attackTimer = 0;
          player.takeDamage(this.damage);
        }
      }
    }

    this.x += this.vx * timeScale;
    this.vx *= 0.8;
  }

  draw(g) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    if (this.type === 'pistol' && this.aimLaserTimer > 20) {
      g.strokeStyle = 'rgba(255, 23, 68, 0.8)';
      g.lineWidth = 1;
      g.setLineDash([4, 2]);
      g.beginPath();
      g.moveTo(rx, ry - 4);
      g.lineTo(rx + this.facing * 180, ry - 4);
      g.stroke();
      g.setLineDash([]);
    }

    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 2, 12, 4, 0, 0, Math.PI * 2);
    g.fill();

    // RENDER EXTRACTED ENEMY SPRITES
    g.save();
    g.translate(rx, ry);
    if (this.facing < 0) {
      g.scale(-1, 1);
    }

    let spr = ASSETS.spriteEnemyGrunt;
    if (this.type === 'pistol') spr = ASSETS.spriteEnemyPistol;
    if (this.type === 'shield') spr = ASSETS.spriteEnemyShield;

    if (spr.complete) {
      g.drawImage(spr, -22, -26, 44, 52);
    } else {
      g.fillStyle = '#7e57c2';
      g.fillRect(-10, -20, 20, 40);
    }

    g.restore();
  }
}

// Stage 2 Helicopter Mini-Boss
class ChopperBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 300;
    this.maxHp = 300;
    this.active = true;
    this.timer = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    addSpark(this.x, this.y, '#ff1744', 8, 3.5);
    addTextParticle(this.x, this.y - 15, `-${amount}`, '#ff9800');
    audio.playHit();
    if (this.hp <= 0) {
      this.active = false;
      audio.playExplosion();
      screenShakeTrauma = 1.0;
      addSpark(this.x, this.y, '#ff5722', 45, 8);
    }
  }

  update(player, stage) {
    this.timer++;
    this.x = camera.x + 360 + Math.sin(this.timer * 0.05) * 45;
    this.y = 80 + Math.cos(this.timer * 0.04) * 22;

    if (this.timer % 85 === 0) {
      audio.playTone(250, 'square', 0.2, 0.25);
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      stage.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * 3.6, Math.sin(angle) * 3.6, 20, false, true, '#ff5722'));
    }

    if (this.timer % 130 === 0) {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          stage.projectiles.push(new Projectile(this.x - 20, this.y + 10, -5.5, 2 + i * 0.4, 12, false, false, '#ffeb3b'));
          audio.playTone(550, 'sawtooth', 0.04, 0.12);
        }, i * 60);
      }
    }
  }

  draw(g) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    if (ASSETS.spriteChopper.complete) {
      g.drawImage(ASSETS.spriteChopper, rx - 70, ry - 35, 140, 70);
    } else {
      g.fillStyle = '#b71c1c';
      g.fillRect(rx - 35, ry - 16, 70, 28);
    }
  }
}

// Stage 3 Mutant Noobda Boss
class MutantNoobda {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 600;
    this.maxHp = 600;
    this.active = true;
    this.w = 44;
    this.h = 60;
    this.facing = -1;
    this.timer = 0;
    this.state = 'idle';
    this.beamTimer = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    addSpark(this.x, this.y, '#e91e63', 7, 3);
    addTextParticle(this.x, this.y - 20, `-${amount}`, '#ff0055');
    audio.playHit();
    if (this.hp <= 90 && !gameState.qteTriggered) {
      gameState.triggerQTE();
    }
  }

  update(player, stage) {
    this.timer++;
    this.facing = Math.sign(player.x - this.x) || -1;

    if (this.state === 'idle') {
      if (this.timer % 120 === 0) {
        const rand = Math.random();
        if (rand < 0.4) {
          this.state = 'charge';
          this.chargeTimer = 40;
          audio.playTone(180, 'sawtooth', 0.3, 0.3);
        } else if (rand < 0.75) {
          this.state = 'leap';
          this.leapTimer = 50;
        } else if (this.hp < 300) {
          this.state = 'beam';
          this.beamTimer = 60;
          audio.playTone(300, 'sawtooth', 0.5, 0.4);
        }
      }
    } else if (this.state === 'charge') {
      this.chargeTimer--;
      this.x += this.facing * 4.6 * timeScale;
      if (Math.abs(player.x - this.x) < 32 && Math.abs(player.y - this.y) < 32) {
        player.takeDamage(24);
      }
      if (this.chargeTimer <= 0) this.state = 'idle';
    } else if (this.state === 'leap') {
      this.leapTimer--;
      if (this.leapTimer === 25) {
        this.x = player.x;
        audio.playExplosion();
        screenShakeTrauma = 0.85;
        addSpark(this.x, this.y + this.h / 2, '#9c27b0', 28, 6.5);
        stage.projectiles.push(new Projectile(this.x, this.y + 15, -4.8, 0, 18, false, false, '#9c27b0'));
        stage.projectiles.push(new Projectile(this.x, this.y + 15, 4.8, 0, 18, false, false, '#9c27b0'));
      }
      if (this.leapTimer <= 0) this.state = 'idle';
    } else if (this.state === 'beam') {
      this.beamTimer--;
      if (this.beamTimer > 15 && this.beamTimer < 45) {
        if (Math.abs(player.y - this.y) < 25 && (player.x - this.x) * this.facing > 0 && Math.abs(player.x - this.x) < 240) {
          player.takeDamage(5);
        }
      }
      if (this.beamTimer <= 0) this.state = 'idle';
    }
  }

  draw(g) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    if (this.state === 'beam' && this.beamTimer > 15 && this.beamTimer < 45) {
      g.fillStyle = 'rgba(233, 30, 99, 0.85)';
      g.fillRect(rx + (this.facing > 0 ? 10 : -240), ry - 6, 240, 12);
      g.fillStyle = '#ffffff';
      g.fillRect(rx + (this.facing > 0 ? 10 : -240), ry - 2, 240, 4);
    }

    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 2, 22, 7, 0, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(rx, ry);
    if (this.facing > 0) {
      g.scale(-1, 1);
    }

    if (ASSETS.spriteMutantNoobda.complete) {
      g.drawImage(ASSETS.spriteMutantNoobda, -36, -36, 72, 72);
    } else {
      g.fillStyle = '#4a148c';
      g.fillRect(-20, -30, 40, 60);
    }
    g.restore();
  }
}

// --- 7. STAGE BLUEPRINT & PARALLAX ---
class StageBlueprint {
  constructor(stageNum) {
    this.stageNum = stageNum;
    this.length = stageNum === 1 ? 1600 : (stageNum === 2 ? 1400 : 960);
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.initEnemies();
  }

  getFloorY(x) {
    if (this.stageNum === 1) {
      if (x > 500 && x < 610) return 320;
      if (x > 1050 && x < 1170) return 320;
      return 210;
    } else if (this.stageNum === 2) {
      return 200;
    } else {
      return 210;
    }
  }

  initEnemies() {
    if (this.stageNum === 1) {
      this.enemies.push(new Enemy(260, 200, 'grunt'));
      this.enemies.push(new Enemy(360, 200, 'grunt'));
      this.enemies.push(new Enemy(460, 200, 'pistol'));
      this.enemies.push(new Enemy(740, 200, 'grunt'));
      this.enemies.push(new Enemy(840, 200, 'shield'));
      this.enemies.push(new Enemy(980, 200, 'pistol'));
      this.enemies.push(new Enemy(1260, 200, 'grunt'));
      this.enemies.push(new Enemy(1340, 200, 'grunt'));
      this.enemies.push(new Enemy(1420, 200, 'shield'));
    } else if (this.stageNum === 2) {
      this.enemies.push(new Enemy(280, 190, 'grunt'));
      this.enemies.push(new Enemy(440, 190, 'shield'));
      this.enemies.push(new Enemy(620, 190, 'pistol'));
      this.boss = new ChopperBoss(600, 80);
    } else if (this.stageNum === 3) {
      this.boss = new MutantNoobda(400, 190);
    }
  }

  drawParallax(g) {
    if (this.stageNum === 1) {
      if (ASSETS.bgStage1.complete) {
        g.drawImage(ASSETS.bgStage1, 0, 0, VIEW_W, VIEW_H);
      } else {
        const grad = g.createLinearGradient(0, 0, 0, VIEW_H);
        grad.addColorStop(0, '#1a0e36');
        grad.addColorStop(0.5, '#4a154b');
        grad.addColorStop(1, '#ff6b35');
        g.fillStyle = grad;
        g.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      // Rooftop Walkways & Gap Platforms
      g.fillStyle = '#1c132f';
      g.fillRect(0 - camera.x, 210 - camera.y, 500, 70);
      g.fillRect(610 - camera.x, 210 - camera.y, 440, 70);
      g.fillRect(1170 - camera.x, 210 - camera.y, 430, 70);

      g.fillStyle = '#ff0055';
      g.fillRect(0 - camera.x, 210 - camera.y, 500, 3);
      g.fillRect(610 - camera.x, 210 - camera.y, 440, 3);
      g.fillRect(1170 - camera.x, 210 - camera.y, 430, 3);

    } else if (this.stageNum === 2) {
      if (ASSETS.bgStage2.complete) {
        g.drawImage(ASSETS.bgStage2, 0, 0, VIEW_W, VIEW_H);
      } else {
        const grad = g.createLinearGradient(0, 0, 0, VIEW_H);
        grad.addColorStop(0, '#bf360c');
        grad.addColorStop(0.6, '#ff8f00');
        grad.addColorStop(1, '#ffeb3b');
        g.fillStyle = grad;
        g.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      g.fillStyle = '#263238';
      g.fillRect(0 - camera.x, 200 - camera.y, this.length, 80);
      g.fillStyle = '#ffd700';
      g.fillRect(0 - camera.x, 200 - camera.y, this.length, 3);

    } else {
      if (ASSETS.bgStage3.complete) {
        g.drawImage(ASSETS.bgStage3, 0, 0, VIEW_W, VIEW_H);
      } else {
        g.fillStyle = '#0d081a';
        g.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      g.fillStyle = 'rgba(0, 229, 255, 0.16)';
      g.beginPath();
      g.moveTo(VIEW_W / 2, 0);
      g.lineTo(VIEW_W / 2 - 130 + Math.sin(Date.now() * 0.003) * 110, VIEW_H);
      g.lineTo(VIEW_W / 2 + 130 + Math.sin(Date.now() * 0.003) * 110, VIEW_H);
      g.fill();

      g.fillStyle = '#1b122e';
      g.fillRect(0 - camera.x, 210 - camera.y, this.length, 70);
      g.fillStyle = '#00e5ff';
      g.fillRect(0 - camera.x, 210 - camera.y, this.length, 3);
    }
  }
}

// --- 8. STATE MANAGER ---
class GameState {
  constructor() {
    this.stageNum = 1;
    this.stage = null;
    this.player = null;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.kills = 0;
    this.damageTaken = 0;
    this.startTime = 0;
    this.state = 'menu';
    this.qteTriggered = false;
  }

  startRun(charType = 'calm') {
    this.stageNum = 1;
    this.score = 0;
    this.kills = 0;
    this.maxCombo = 0;
    this.damageTaken = 0;
    this.startTime = Date.now();
    this.player = new Player();
    this.player.charType = charType;
    this.player.maxJumps = charType === 'calm' ? 2 : 1;
    this.stage = new StageBlueprint(this.stageNum);
    this.state = 'playing';
    this.qteTriggered = false;
    
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('stage-clear-banner').classList.add('hidden');

    setTimeout(() => {
      this.triggerDialogue(
        'NOOBDA',
        'So you two actually showed up. You think you run this city? We will bury you right here on these roofs.',
        'assets/portrait_noobda.jpg'
      );
    }, 500);
  }

  addHit() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTimer = 90;
    const multiplier = this.combo >= 30 ? 3.0 : (this.combo >= 20 ? 2.0 : (this.combo >= 10 ? 1.5 : 1.0));
    this.score += Math.round(50 * multiplier);
  }

  triggerDialogue(speaker, text, avatarSrc, callback) {
    this.state = 'dialogue';
    const box = document.getElementById('dialogue-box');
    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');
    const avatarImg = document.getElementById('dialogue-avatar-img');
    
    box.classList.remove('hidden');
    speakerEl.innerText = speaker;
    textEl.innerText = text;
    if (avatarSrc) avatarImg.src = avatarSrc;

    const onAdvance = (e) => {
      if (e.key === ' ' || e.key.toLowerCase() === 'j') {
        window.removeEventListener('keydown', onAdvance);
        box.classList.add('hidden');
        this.state = 'playing';
        if (callback) callback();
      }
    };
    window.addEventListener('keydown', onAdvance);
  }

  triggerQTE() {
    this.qteTriggered = true;
    this.state = 'qte';
    timeScale = 0.2;
    const qteEl = document.getElementById('qte-prompt');
    const bar = document.getElementById('qte-progress');
    qteEl.classList.remove('hidden');

    let timeLeft = 100;
    const interval = setInterval(() => {
      timeLeft -= 2;
      bar.style.width = `${timeLeft}%`;
      if (timeLeft <= 0) {
        clearInterval(interval);
        qteEl.classList.add('hidden');
        timeScale = 1.0;
        this.state = 'playing';
      }
    }, 25);

    const onQTE = (e) => {
      if (e.key.toLowerCase() === 'x') {
        window.removeEventListener('keydown', onQTE);
        clearInterval(interval);
        qteEl.classList.add('hidden');
        timeScale = 1.0;
        this.state = 'playing';
        
        audio.playFinisherSlash();
        audio.playExplosion();
        screenShakeTrauma = 1.0;
        hitStopFrames = 15;
        this.stage.boss.hp = 0;
        this.stage.boss.active = false;
        setTimeout(() => this.gameOver(true), 1200);
      }
    };
    window.addEventListener('keydown', onQTE);
  }

  nextStage() {
    this.stageNum++;
    if (this.stageNum > 3) {
      this.gameOver(true);
      return;
    }

    const banner = document.getElementById('stage-clear-banner');
    const title = document.getElementById('stage-clear-title');
    const sub = document.getElementById('stage-clear-sub');
    
    banner.classList.remove('hidden');
    title.innerText = `STAGE ${this.stageNum - 1} CLEARED!`;
    sub.innerText = this.stageNum === 2 ? 'BOARDING SUNSET METRO TRAIN...' : 'ENTERING LIVE CONCERT ARENA...';
    
    audio.playTone(600, 'triangle', 0.3, 0.3);

    setTimeout(() => {
      banner.classList.add('hidden');
      this.stage = new StageBlueprint(this.stageNum);
      this.player.x = 80;
      this.player.y = 180;
      
      if (this.stageNum === 2) {
        this.player.hasMinigun = true;
        addTextParticle(this.player.x, this.player.y - 20, 'MINIGUN CRATE EQUIPPED!', '#ffd700');
        this.triggerDialogue(
          'ENCORE',
          'Heavy ordnance air-drop confirmed. Chopper in inbound—light em up!',
          'assets/portrait_encore.jpg'
        );
      } else if (this.stageNum === 3) {
        this.triggerDialogue(
          'CALM',
          'Concert stage secured. Noobda is cornered with the mutagen—take him down together!',
          'assets/portrait_calm.jpg'
        );
      }
    }, 1800);
  }

  gameOver(victory) {
    this.state = 'gameover';
    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('end-title');
    const stats = document.getElementById('end-stats');
    overlay.classList.remove('hidden');

    const totalSeconds = Math.round((Date.now() - this.startTime) / 1000);
    const rank = this.score >= 50000 ? 'S' : (this.score >= 30000 ? 'A' : (this.score >= 15000 ? 'B' : 'C'));

    title.innerText = victory ? '★ VICTORY ★' : '☠ DEFEAT ☠';
    title.className = `title retro-text ${victory ? 'gold' : 'red-glow'}`;

    stats.innerHTML = `
      <p style="margin-bottom: 8px;">FINAL SCORE: <span class="cyan">${this.score}</span></p>
      <p style="margin-bottom: 8px;">MAX COMBO: <span class="gold">${this.maxCombo}x</span></p>
      <p style="margin-bottom: 8px;">ENEMIES DEFEATED: <span class="white">${this.kills}</span></p>
      <p style="margin-bottom: 8px;">TIME: <span class="yellow">${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s</span></p>
      <p style="margin-top: 14px;">OVERALL RANK: <span class="red-glow" style="font-size: 22px;">★ ${rank} ★</span></p>
    `;
  }
}

const gameState = new GameState();

// UI Listeners
document.querySelectorAll('.char-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

document.getElementById('btn-start').addEventListener('click', () => {
  const activeChar = document.querySelector('.char-card.active').dataset.char;
  gameState.startRun(activeChar);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  document.getElementById('game-over-overlay').classList.add('hidden');
  document.getElementById('menu-overlay').classList.remove('hidden');
  gameState.state = 'menu';
});

// --- 9. MAIN GAME LOOP ---
function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (hitStopFrames > 0) {
    hitStopFrames--;
    return;
  }

  ctx.save();
  ctx.scale(SCALE, SCALE);

  if (screenShakeTrauma > 0) {
    const shakeX = (Math.random() - 0.5) * screenShakeTrauma * 12;
    const shakeY = (Math.random() - 0.5) * screenShakeTrauma * 12;
    ctx.translate(shakeX, shakeY);
    screenShakeTrauma = Math.max(0, screenShakeTrauma - 0.05);
  }

  if (gameState.state === 'playing' || gameState.state === 'dialogue' || gameState.state === 'qte') {
    const p = gameState.player;
    const stage = gameState.stage;

    if (gameState.state === 'playing') {
      p.update(stage);

      camera.x += (p.x - VIEW_W / 2 - camera.x) * 0.1;
      camera.x = Math.max(0, Math.min(stage.length - VIEW_W, camera.x));

      if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer === 0) gameState.combo = 0;
      }

      stage.enemies = stage.enemies.filter(e => e.active);
      stage.enemies.forEach(e => e.update(p, stage));

      if (stage.boss && stage.boss.active) {
        stage.boss.update(p, stage);
      }

      stage.projectiles = stage.projectiles.filter(proj => proj.active);
      stage.projectiles.forEach(proj => {
        proj.update();
        if (proj.isPlayer) {
          stage.enemies.forEach(e => {
            if (Math.hypot(e.x - proj.x, e.y - proj.y) < 20) {
              e.takeDamage(proj.damage, Math.sign(proj.vx));
              proj.active = false;
              gameState.addHit();
            }
          });
          if (stage.boss && Math.hypot(stage.boss.x - proj.x, stage.boss.y - proj.y) < 35) {
            stage.boss.takeDamage(proj.damage);
            proj.active = false;
            gameState.addHit();
          }
        } else {
          if (Math.hypot(p.x - proj.x, p.y - proj.y) < 18) {
            p.takeDamage(proj.damage);
            proj.active = false;
          }
        }
      });

      if (stage.enemies.length === 0 && (!stage.boss || !stage.boss.active)) {
        if (p.x >= stage.length - 80) {
          gameState.nextStage();
        }
      }
    }

    stage.drawParallax(ctx);
    stage.enemies.forEach(e => e.draw(ctx));
    if (stage.boss && stage.boss.active) stage.boss.draw(ctx);
    p.draw(ctx);
    stage.projectiles.forEach(proj => proj.draw(ctx));

    // Render Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;

      if (pt.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      if (pt.isText) {
        ctx.font = '6px "Press Start 2P"';
        ctx.fillStyle = pt.color;
        ctx.fillText(pt.text, pt.x - camera.x, pt.y - camera.y);
      } else {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - camera.x, pt.y - camera.y, pt.size, pt.size);
      }
      ctx.restore();
    }

    // --- HUD RENDER ---
    ctx.fillStyle = '#1c132d';
    ctx.fillRect(10, 10, 90, 8);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(10, 10, (p.hp / p.maxHp) * 90, 8);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 90, 8);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 20, 65, 4);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(10, 20, (p.special / p.maxSpecial) * 65, 4);

    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = p.charType === 'calm' ? '#00e5ff' : '#ffd700';
    ctx.fillText(`${p.charType.toUpperCase()} [${p.hasMinigun ? 'MINIGUN' : (p.charType === 'calm' ? 'KATANA' : 'SMG')}]`, 10, 32);

    if (gameState.combo > 1) {
      ctx.font = '9px "Press Start 2P"';
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(`${gameState.combo}x HIT!`, VIEW_W / 2 - 25, 20);
    }

    if (stage.boss && stage.boss.active) {
      ctx.fillStyle = '#1c132d';
      ctx.fillRect(VIEW_W / 2 - 65, 30, 130, 7);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(VIEW_W / 2 - 65, 30, (stage.boss.hp / stage.boss.maxHp) * 130, 7);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(VIEW_W / 2 - 65, 30, 130, 7);
      ctx.font = '6px "Press Start 2P"';
      ctx.fillStyle = '#fff';
      ctx.fillText(stage.stageNum === 2 ? 'ATTACK CHOPPER' : 'MUTANT NOOBDA', VIEW_W / 2 - 42, 45);
    }
  }

  ctx.restore();
}

requestAnimationFrame(gameLoop);
