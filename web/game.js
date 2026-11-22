/**
 * SEEDHE MAUT - NAAMCHEEN // 16-BIT WEB BRAWLER
 * Full HTML5 Canvas + WebAudio implementation of the GDD.
 */

// --- 1. AUDIO SYNTHESIZER (8-bit Web Audio API) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.bgmOsc = null;
    this.bassOsc = null;
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
    if (!this.ctx) return;
    this.playTone(320, 'sawtooth', 0.08, 0.2);
    setTimeout(() => this.playTone(180, 'triangle', 0.1, 0.15), 30);
  }

  playFinisherSlash() {
    if (!this.ctx) return;
    this.playTone(450, 'sawtooth', 0.12, 0.3);
    setTimeout(() => this.playTone(90, 'triangle', 0.25, 0.4), 40);
  }

  playSMG() {
    if (!this.ctx) return;
    this.playTone(600 + Math.random() * 200, 'square', 0.04, 0.1);
  }

  playMinigun() {
    if (!this.ctx) return;
    this.playTone(200 + Math.random() * 150, 'sawtooth', 0.05, 0.18);
  }

  playExplosion() {
    if (!this.ctx) return;
    this.playTone(80, 'square', 0.3, 0.4);
    setTimeout(() => this.playTone(40, 'triangle', 0.4, 0.5), 50);
  }

  playDeflect() {
    if (!this.ctx) return;
    this.playTone(900, 'sine', 0.1, 0.3);
    setTimeout(() => this.playTone(1400, 'sine', 0.15, 0.3), 30);
  }

  playHit() {
    if (!this.ctx) return;
    this.playTone(120, 'triangle', 0.06, 0.2);
  }

  startMusicLoop() {
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    
    // Indian Drill / Hip Hop style 16-bit arpeggio pattern for Naamcheen
    const bassNotes = [55, 55, 55, 65, 55, 55, 73, 69]; // D minor flavor
    const melodyNotes = [220, 261, 293, 329, 293, 261, 220, 196];
    
    setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const bFreq = bassNotes[this.step % bassNotes.length];
      const mFreq = melodyNotes[(this.step * 2) % melodyNotes.length];
      
      // Kick / 808 bass pulse
      this.playTone(bFreq, 'sawtooth', 0.15, 0.12);
      
      // Melody lead pulse
      if (this.step % 2 === 0) {
        this.playTone(mFreq, 'square', 0.1, 0.05);
      }
      
      // Snare / Hi-hat click
      if (this.step % 2 === 1) {
        this.playTone(800 + Math.random() * 400, 'triangle', 0.03, 0.04);
      }
      
      this.step++;
    }, 200); // 150 BPM drill groove
  }
}

const audio = new SoundController();

// --- 2. GAME ENGINE & STATE ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const VIEW_W = 480;
const VIEW_H = 270;
const SCALE = 2; // Renders internally at 480x270 for crisp 16-bit retro look

// Input state
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

// Screen Shake & Hit Stop
let screenShakeTrauma = 0;
let hitStopFrames = 0;
let timeScale = 1.0;

// Camera
const camera = { x: 0, y: 0 };

// Particle System
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
      decay: 0.05 + Math.random() * 0.05,
      color,
      size: Math.random() * 2 + 1
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

// --- 3. CHARACTERS & COMBAT SYSTEM ---
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
    
    // Trail
    if (this.isMissile && Math.random() > 0.4) {
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

class Player {
  constructor() {
    this.charType = 'calm'; // 'calm' or 'encore'
    this.x = 80;
    this.y = 180;
    this.vx = 0;
    this.vy = 0;
    this.w = 16;
    this.h = 28;
    this.facing = 1;
    this.hp = 100;
    this.maxHp = 100;
    this.special = 40;
    this.maxSpecial = 100;
    this.isGrounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2; // Calm has double jump
    this.invulnerableTimer = 0;
    
    // Combat state
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.attackTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollCooldown = 0;

    // Encore specific
    this.hasMinigun = false;
    this.shootCooldown = 0;
  }

  swapChar() {
    this.charType = this.charType === 'calm' ? 'encore' : 'calm';
    this.maxJumps = this.charType === 'calm' ? 2 : 1;
    addTextParticle(this.x, this.y - 15, `SWAP: ${this.charType.toUpperCase()}`, '#00e5ff');
    addSpark(this.x, this.y, '#00e5ff', 12, 4);
    audio.playTone(500, 'sine', 0.1, 0.2);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.isDashing || this.isRolling) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 45; // 0.75s i-frame
    screenShakeTrauma = Math.min(1.0, screenShakeTrauma + 0.4);
    addSpark(this.x, this.y, '#ff1744', 8, 3);
    addTextParticle(this.x, this.y - 10, `-${amount}`, '#ff1744');
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
    
    // Combo buffer decay
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) this.comboStep = 0;
    }

    // Special recharge passive
    if (this.special < this.maxSpecial && Math.random() < 0.05) {
      this.special += 1;
    }

    // Dash / Roll states
    if (this.isDashing) {
      this.dashTimer--;
      this.vx = this.facing * 8;
      this.vy = 0;
      addSpark(this.x, this.y + 10, '#ff0055', 2, 2);
      if (this.dashTimer <= 0) this.isDashing = false;
    } else if (this.isRolling) {
      this.rollTimer--;
      this.vx = this.facing * 5.5;
      if (this.rollTimer <= 0) this.isRolling = false;
    } else {
      // Normal Controls
      const moveSpd = this.charType === 'calm' ? 3.4 : 3.0;
      if (keys['a'] || keys['arrowleft']) {
        this.vx = -moveSpd;
        this.facing = -1;
      } else if (keys['d'] || keys['arrowright']) {
        this.vx = moveSpd;
        this.facing = 1;
      } else {
        this.vx *= 0.7;
      }

      // Jump
      if (keys['w'] || keys['arrowup']) {
        if (!this.jumpKeyHeld) {
          this.jumpKeyHeld = true;
          if (this.isGrounded || this.jumpCount < this.maxJumps) {
            this.vy = -7.2;
            this.jumpCount++;
            this.isGrounded = false;
            audio.playTone(300, 'triangle', 0.1, 0.1);
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
        this.rollCooldown = 60;
        this.invulnerableTimer = 20;
        audio.playTone(150, 'triangle', 0.1, 0.2);
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
          // Encore continuous / burst
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

    // Gravity & Physics
    if (!this.isDashing) {
      this.vy += 0.38; // Gravity
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

    // Bounds
    if (this.x < 30) this.x = 30;
    if (this.x > stage.length - 40) this.x = stage.length - 40;
  }

  executeKatanaCombo(stage) {
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 35;
    
    const hitBox = {
      x: this.x + this.facing * 18,
      y: this.y,
      radius: 26,
      damage: this.comboStep === 3 ? 24 : 12
    };

    // Slash FX
    addSpark(hitBox.x, hitBox.y, '#ff0055', 8, 3);
    
    // Deflect check for enemy projectiles
    for (let p of stage.projectiles) {
      if (!p.isPlayer && Math.hypot(p.x - hitBox.x, p.y - hitBox.y) < hitBox.radius + 15) {
        p.isPlayer = true;
        p.vx = this.facing * 9;
        p.vy = (Math.random() - 0.5) * 2;
        p.color = '#00e5ff';
        p.damage = 35;
        audio.playDeflect();
        addSpark(p.x, p.y, '#ffd700', 10, 4);
        addTextParticle(p.x, p.y - 10, 'PARRY!', '#ffd700');
        hitStopFrames = 3;
      }
    }

    // Check hit against enemies & boss
    let hitAny = false;
    stage.enemies.forEach(e => {
      if (Math.hypot(e.x - hitBox.x, e.y - hitBox.y) < hitBox.radius + e.w / 2) {
        e.takeDamage(hitBox.damage, this.facing);
        hitAny = true;
      }
    });

    if (stage.boss && Math.hypot(stage.boss.x - hitBox.x, stage.boss.y - hitBox.y) < hitBox.radius + 30) {
      stage.boss.takeDamage(hitBox.damage);
      hitAny = true;
    }

    if (hitAny) {
      gameState.addHit();
      this.special = Math.min(this.maxSpecial, this.special + 6);
      if (this.comboStep === 3) {
        audio.playFinisherSlash();
        hitStopFrames = 5;
        screenShakeTrauma = 0.35;
        // Crescent wave projectile
        stage.projectiles.push(new Projectile(this.x, this.y, this.facing * 7, 0, 18, true, false, '#ff0055'));
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
    
    if (this.hasMinigun) {
      this.shootCooldown = 4;
      stage.projectiles.push(new Projectile(this.x + this.facing * 14, this.y - 2, this.facing * 10, (Math.random() - 0.5) * 1.5, 14, true, false, '#ffd700'));
      audio.playMinigun();
      screenShakeTrauma = Math.min(0.4, screenShakeTrauma + 0.08);
      this.special = Math.min(this.maxSpecial, this.special + 1);
    } else {
      this.shootCooldown = 12;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          stage.projectiles.push(new Projectile(this.x + this.facing * 12, this.y - 2, this.facing * 8, (Math.random() - 0.5) * 1, 8, true, false, '#00e5ff'));
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
      // Crimson Dash-Slash
      this.isDashing = true;
      this.dashTimer = 15;
      this.invulnerableTimer = 20;
      screenShakeTrauma = 0.5;
      hitStopFrames = 4;
      audio.playFinisherSlash();
      addTextParticle(this.x, this.y - 15, 'CRIMSON DASH!', '#ff0055');

      stage.enemies.forEach(e => {
        if (Math.abs(e.y - this.y) < 30 && (e.x - this.x) * this.facing > 0 && Math.abs(e.x - this.x) < 140) {
          e.takeDamage(40, this.facing);
          gameState.addHit();
        }
      });
      if (stage.boss && Math.abs(stage.boss.x - this.x) < 140) {
        stage.boss.takeDamage(40);
        gameState.addHit();
      }
    } else {
      // Incendiary Grenade
      addTextParticle(this.x, this.y - 15, 'INCENDIARY GRENADE!', '#ff9800');
      audio.playTone(350, 'sawtooth', 0.2, 0.2);
      const gx = this.x + this.facing * 80;
      const gy = this.y;
      
      setTimeout(() => {
        audio.playExplosion();
        screenShakeTrauma = 0.7;
        hitStopFrames = 6;
        addSpark(gx, gy, '#ff5722', 25, 6);
        addSpark(gx, gy, '#ffeb3b', 15, 4);

        stage.enemies.forEach(e => {
          if (Math.hypot(e.x - gx, e.y - gy) < 70) {
            e.takeDamage(55, Math.sign(e.x - gx));
            gameState.addHit();
          }
        });
        if (stage.boss && Math.hypot(stage.boss.x - gx, stage.boss.y - gy) < 80) {
          stage.boss.takeDamage(55);
          gameState.addHit();
        }
      }, 400);
    }
  }

  draw(g) {
    if (this.invulnerableTimer % 4 > 2) return; // Blink
    
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Shadow
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 2, 10, 4, 0, 0, Math.PI * 2);
    g.fill();

    // Pixel character silhouette / detail
    if (this.charType === 'calm') {
      // CALM: Cyan band, dark tactical assassin jacket, katana
      g.fillStyle = '#1c172d'; // Body
      g.fillRect(rx - 6, ry - 14, 12, 24);
      g.fillStyle = '#00e5ff'; // Cyan bandana/headband
      g.fillRect(rx - 5, ry - 12, 10, 4);
      g.fillStyle = '#ff0055'; // Crimson scarf/belt
      g.fillRect(rx - 6, ry + 1, 12, 3);
      
      // Katana
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      if (this.comboStep > 0) {
        // Swing slash pose
        g.moveTo(rx + this.facing * 4, ry - 4);
        g.lineTo(rx + this.facing * 18, ry + 4);
      } else {
        // Sheathed back sword
        g.moveTo(rx - this.facing * 4, ry + 8);
        g.lineTo(rx - this.facing * 10, ry - 10);
      }
      g.stroke();
    } else {
      // ENCORE: Gold highlights, streetwear hoodie, dual guns
      g.fillStyle = '#2a223e'; // Hoodie
      g.fillRect(rx - 7, ry - 14, 14, 24);
      g.fillStyle = '#ffd700'; // Gold cap / chain
      g.fillRect(rx - 5, ry - 14, 10, 4);
      g.fillStyle = '#ff9800'; // Straps
      g.fillRect(rx - 7, ry + 2, 14, 2);

      // Guns
      g.fillStyle = this.hasMinigun ? '#e91e63' : '#9e9e9e';
      if (this.hasMinigun) {
        g.fillRect(rx + this.facing * 2, ry - 2, this.facing * 14, 6);
      } else {
        g.fillRect(rx + this.facing * 4, ry - 4, this.facing * 7, 4);
        g.fillRect(rx + this.facing * 2, ry + 2, this.facing * 6, 4);
      }
    }
  }
}

// --- 4. ENEMY TYPES & BOSSES ---
class Enemy {
  constructor(x, y, type = 'grunt') {
    this.x = x;
    this.y = y;
    this.type = type; // 'grunt', 'pistol', 'shield'
    this.facing = -1;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.attackTimer = 0;
    this.aimLaserTimer = 0;

    if (type === 'grunt') {
      this.hp = 25;
      this.w = 16;
      this.h = 26;
      this.speed = 1.4;
      this.damage = 10;
      this.color = '#7e57c2';
    } else if (type === 'pistol') {
      this.hp = 30;
      this.w = 16;
      this.h = 26;
      this.speed = 1.0;
      this.damage = 12;
      this.color = '#26a69a';
    } else if (type === 'shield') {
      this.hp = 70;
      this.w = 20;
      this.h = 28;
      this.speed = 0.7;
      this.damage = 16;
      this.color = '#ef5350';
      this.shieldUp = true;
    }
  }

  takeDamage(amount, hitDir) {
    // Shield blocks frontal attacks
    if (this.type === 'shield' && this.shieldUp && hitDir !== this.facing) {
      addTextParticle(this.x, this.y - 12, 'BLOCKED!', '#ffd700');
      addSpark(this.x, this.y, '#ffd700', 8, 3);
      audio.playTone(800, 'square', 0.05, 0.15);
      this.shieldUp = false; // Drop shield on heavy flank
      setTimeout(() => this.shieldUp = true, 800);
      return;
    }

    this.hp -= amount;
    this.vx = hitDir * 3;
    addSpark(this.x, this.y, this.color, 6, 2.5);
    addTextParticle(this.x, this.y - 10, `-${amount}`, '#fff');
    audio.playHit();

    if (this.hp <= 0) {
      this.active = false;
      gameState.kills++;
      addSpark(this.x, this.y, '#ff0055', 14, 4);
    }
  }

  update(player, stage) {
    const dist = Math.abs(player.x - this.x);
    this.facing = Math.sign(player.x - this.x) || -1;

    if (this.type === 'grunt') {
      if (dist > 20) {
        this.x += this.facing * this.speed * timeScale;
      } else {
        this.attackTimer++;
        if (this.attackTimer >= 45) {
          this.attackTimer = 0;
          player.takeDamage(this.damage);
        }
      }
    } else if (this.type === 'pistol') {
      // Reposition / Aim
      if (dist < 120) {
        this.x -= this.facing * this.speed * timeScale; // Retreat to range
      } else if (dist > 220) {
        this.x += this.facing * this.speed * timeScale;
      } else {
        this.aimLaserTimer++;
        if (this.aimLaserTimer >= 50) {
          this.aimLaserTimer = 0;
          stage.projectiles.push(new Projectile(this.x, this.y - 2, this.facing * 5.5, 0, this.damage, false, false, '#ff1744'));
          audio.playTone(700, 'sawtooth', 0.05, 0.1);
        }
      }
    } else if (this.type === 'shield') {
      if (dist > 24) {
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

    // Laser telegraph
    if (this.type === 'pistol' && this.aimLaserTimer > 20) {
      g.strokeStyle = 'rgba(255, 23, 68, 0.7)';
      g.lineWidth = 1;
      g.setLineDash([4, 2]);
      g.beginPath();
      g.moveTo(rx, ry - 2);
      g.lineTo(rx + this.facing * 180, ry - 2);
      g.stroke();
      g.setLineDash([]);
    }

    // Shadow
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 2, 8, 3, 0, 0, Math.PI * 2);
    g.fill();

    // Body
    g.fillStyle = this.color;
    g.fillRect(rx - this.w / 2, ry - this.h / 2, this.w, this.h);

    // Eyes
    g.fillStyle = '#ff1744';
    g.fillRect(rx + this.facing * 2, ry - 8, 3, 2);

    // Shield prop
    if (this.type === 'shield' && this.shieldUp) {
      g.fillStyle = '#b0bec5';
      g.fillRect(rx + this.facing * 8, ry - 14, 4, 28);
    }
  }
}

// Stage 2 Attack Chopper Mini-Boss
class ChopperBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 300;
    this.maxHp = 300;
    this.active = true;
    this.timer = 0;
    this.phase = 'hover'; // 'hover', 'missile', 'sweep'
  }

  takeDamage(amount) {
    this.hp -= amount;
    addSpark(this.x, this.y, '#ff1744', 8, 3);
    addTextParticle(this.x, this.y - 15, `-${amount}`, '#ff9800');
    audio.playHit();
    if (this.hp <= 0) {
      this.active = false;
      audio.playExplosion();
      screenShakeTrauma = 1.0;
      addSpark(this.x, this.y, '#ff5722', 40, 8);
    }
  }

  update(player, stage) {
    this.timer++;
    this.x = camera.x + 360 + Math.sin(this.timer * 0.05) * 40;
    this.y = 80 + Math.cos(this.timer * 0.04) * 20;

    if (this.timer % 90 === 0) {
      // Fire homing missile
      audio.playTone(250, 'square', 0.2, 0.2);
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      stage.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 20, false, true, '#ff5722'));
    }

    if (this.timer % 140 === 0) {
      // Machine gun sweep
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          stage.projectiles.push(new Projectile(this.x - 20, this.y + 10, -5, 2 + i * 0.4, 12, false, false, '#ffeb3b'));
          audio.playTone(550, 'sawtooth', 0.04, 0.1);
        }, i * 60);
      }
    }
  }

  draw(g) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Helicopter body
    g.fillStyle = '#b71c1c';
    g.fillRect(rx - 30, ry - 14, 60, 24);
    // Rotor blade spinning
    g.fillStyle = '#e0e0e0';
    g.fillRect(rx - 45 + (Math.sin(this.timer * 0.8) * 10), ry - 22, 90, 4);
    // Cockpit
    g.fillStyle = '#00e5ff';
    g.fillRect(rx - 24, ry - 10, 16, 12);
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
    this.w = 34;
    this.h = 48;
    this.facing = -1;
    this.timer = 0;
    this.state = 'idle'; // 'idle', 'leap', 'charge', 'beam'
    this.beamTimer = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    addSpark(this.x, this.y, '#e91e63', 6, 3);
    addTextParticle(this.x, this.y - 20, `-${amount}`, '#ff0055');
    audio.playHit();
    if (this.hp <= 90 && !gameState.qteTriggered) {
      gameState.triggerQTE();
    }
  }

  update(player, stage) {
    this.timer++;
    this.facing = Math.sign(player.x - this.x) || -1;

    // Boss Phase Cycle
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
      this.x += this.facing * 4.5 * timeScale;
      if (Math.abs(player.x - this.x) < 28 && Math.abs(player.y - this.y) < 30) {
        player.takeDamage(24);
      }
      if (this.chargeTimer <= 0) this.state = 'idle';
    } else if (this.state === 'leap') {
      this.leapTimer--;
      if (this.leapTimer === 25) {
        // Crash down
        this.x = player.x;
        audio.playExplosion();
        screenShakeTrauma = 0.8;
        addSpark(this.x, this.y + this.h / 2, '#9c27b0', 25, 6);
        // Low shockwave
        stage.projectiles.push(new Projectile(this.x, this.y + 15, -4.5, 0, 18, false, false, '#9c27b0'));
        stage.projectiles.push(new Projectile(this.x, this.y + 15, 4.5, 0, 18, false, false, '#9c27b0'));
      }
      if (this.leapTimer <= 0) this.state = 'idle';
    } else if (this.state === 'beam') {
      this.beamTimer--;
      // Chest Laser
      if (this.beamTimer > 15 && this.beamTimer < 45) {
        const beamX = this.x + this.facing * 120;
        if (Math.abs(player.y - this.y) < 25 && (player.x - this.x) * this.facing > 0 && Math.abs(player.x - this.x) < 240) {
          player.takeDamage(4);
        }
      }
      if (this.beamTimer <= 0) this.state = 'idle';
    }
  }

  draw(g) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Beam graphic
    if (this.state === 'beam' && this.beamTimer > 15 && this.beamTimer < 45) {
      g.fillStyle = 'rgba(233, 30, 99, 0.8)';
      g.fillRect(rx + (this.facing > 0 ? 10 : -240), ry - 6, 240, 12);
      g.fillStyle = '#fff';
      g.fillRect(rx + (this.facing > 0 ? 10 : -240), ry - 2, 240, 4);
    }

    // Shadow
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(rx, ry + this.h / 2 + 2, 16, 6, 0, 0, Math.PI * 2);
    g.fill();

    // Hulking Mutant Pixel Sprite
    g.fillStyle = '#4a148c'; // Dark mutagen muscle
    g.fillRect(rx - 16, ry - 24, 32, 48);
    g.fillStyle = '#76ff03'; // Mutagen green veins
    g.fillRect(rx - 12, ry - 14, 24, 4);
    g.fillRect(rx - 10, ry + 2, 20, 3);
    
    // Glowing red eyes
    g.fillStyle = '#ff1744';
    g.fillRect(rx + this.facing * 4, ry - 18, 5, 3);
  }
}

// --- 5. STAGE BLUEPRINT & PARALLAX ---
class StageBlueprint {
  constructor(stageNum) {
    this.stageNum = stageNum;
    this.length = stageNum === 1 ? 1600 : (stageNum === 2 ? 1400 : 960);
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.spawnIndex = 0;
    this.initEnemies();
  }

  getFloorY(x) {
    if (this.stageNum === 1) {
      // Stage 1 Rooftop & gaps
      if (x > 500 && x < 620) return 320; // Falling gap
      if (x > 1050 && x < 1180) return 320;
      return 210;
    } else if (this.stageNum === 2) {
      // Moving Metro Train roof
      return 200;
    } else {
      // Arena Stage
      return 210;
    }
  }

  initEnemies() {
    if (this.stageNum === 1) {
      // Section 1A: Entry
      this.enemies.push(new Enemy(260, 200, 'grunt'));
      this.enemies.push(new Enemy(340, 200, 'grunt'));
      this.enemies.push(new Enemy(440, 200, 'pistol'));
      // Section 1B: Cranes
      this.enemies.push(new Enemy(720, 200, 'grunt'));
      this.enemies.push(new Enemy(820, 200, 'shield'));
      this.enemies.push(new Enemy(960, 200, 'pistol'));
      // Section 1C: Mob before Taunt
      this.enemies.push(new Enemy(1250, 200, 'grunt'));
      this.enemies.push(new Enemy(1320, 200, 'grunt'));
      this.enemies.push(new Enemy(1400, 200, 'shield'));
    } else if (this.stageNum === 2) {
      this.enemies.push(new Enemy(280, 190, 'grunt'));
      this.enemies.push(new Enemy(420, 190, 'shield'));
      this.enemies.push(new Enemy(600, 190, 'pistol'));
      this.boss = new ChopperBoss(600, 80);
    } else if (this.stageNum === 3) {
      this.boss = new MutantNoobda(400, 190);
    }
  }

  drawParallax(g) {
    const bgOffset = camera.x * 0.15;
    const midOffset = camera.x * 0.45;

    if (this.stageNum === 1) {
      // Dusk Rooftops (GDD Palette: #2D1B69 -> #FF6B35)
      const grad = g.createLinearGradient(0, 0, 0, VIEW_H);
      grad.addColorStop(0, '#1a0e36');
      grad.addColorStop(0.5, '#4a154b');
      grad.addColorStop(1, '#ff6b35');
      g.fillStyle = grad;
      g.fillRect(0, 0, VIEW_W, VIEW_H);

      // Distant City Skyline
      g.fillStyle = '#170c29';
      for (let i = 0; i < 20; i++) {
        const bx = i * 60 - (bgOffset % 60);
        const bh = 70 + (i % 4) * 25;
        g.fillRect(bx, VIEW_H - bh - 60, 48, bh);
      }

      // Neon Billboards & Water Towers
      g.fillStyle = '#ff0055';
      g.fillRect(180 - midOffset, 70, 40, 14);
      g.fillStyle = '#00e5ff';
      g.fillRect(400 - midOffset, 60, 50, 12);

      // Rooftops Surface
      g.fillStyle = '#22193b';
      g.fillRect(0 - camera.x, 210 - camera.y, this.length, 70);
      g.fillStyle = '#392a5c';
      g.fillRect(0 - camera.x, 210 - camera.y, this.length, 4);
    } else if (this.stageNum === 2) {
      // Sunset Metro Train (Fast auto-scroll)
      const grad = g.createLinearGradient(0, 0, 0, VIEW_H);
      grad.addColorStop(0, '#bf360c');
      grad.addColorStop(0.6, '#ff8f00');
      grad.addColorStop(1, '#ffeb3b');
      g.fillStyle = grad;
      g.fillRect(0, 0, VIEW_W, VIEW_H);

      // Train car roof
      g.fillStyle = '#37474f';
      g.fillRect(0 - camera.x, 200 - camera.y, this.length, 80);
      g.fillStyle = '#b0bec5';
      g.fillRect(0 - camera.x, 200 - camera.y, this.length, 4);
    } else {
      // Stage 3 Live Concert Arena
      g.fillStyle = '#0d081a';
      g.fillRect(0, 0, VIEW_W, VIEW_H);

      // Sweeping Stage Spotlights
      g.fillStyle = 'rgba(0, 229, 255, 0.15)';
      g.beginPath();
      g.moveTo(VIEW_W / 2, 0);
      g.lineTo(VIEW_W / 2 - 120 + Math.sin(Date.now() * 0.003) * 100, VIEW_H);
      g.lineTo(VIEW_W / 2 + 120 + Math.sin(Date.now() * 0.003) * 100, VIEW_H);
      g.fill();

      // Speaker Stacks
      g.fillStyle = '#1b132c';
      g.fillRect(20 - camera.x, 100 - camera.y, 40, 110);
      g.fillRect(420 - camera.x, 100 - camera.y, 40, 110);

      // Stage floor
      g.fillStyle = '#2a1a44';
      g.fillRect(0 - camera.x, 210 - camera.y, this.length, 70);
    }
  }
}

// --- 6. GAME CONTROLLER, HUD & RUNTIME LOOP ---
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
    this.state = 'menu'; // 'menu', 'playing', 'dialogue', 'qte', 'gameover'
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
  }

  addHit() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTimer = 90; // 1.5s window
    const multiplier = this.combo >= 30 ? 3.0 : (this.combo >= 20 ? 2.0 : (this.combo >= 10 ? 1.5 : 1.0));
    this.score += Math.round(50 * multiplier);
  }

  triggerDialogue(speaker, text, callback) {
    this.state = 'dialogue';
    const box = document.getElementById('dialogue-box');
    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');
    box.classList.remove('hidden');
    speakerEl.innerText = speaker;
    textEl.innerText = text;

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
        
        // Success: Co-Op Finisher Cinematic Explosion
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
    this.stage = new StageBlueprint(this.stageNum);
    this.player.x = 80;
    this.player.y = 180;
    if (this.stageNum === 2) {
      this.player.hasMinigun = true; // Stage 2 Minigun drop
      addTextParticle(this.player.x, this.player.y - 20, 'MINIGUN CRATE EQUIPPED!', '#ffd700');
    }
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
      <p>FINAL SCORE: <span class="cyan">${this.score}</span></p>
      <p>MAX COMBO: <span class="gold">${this.maxCombo}x</span></p>
      <p>ENEMIES DEFEATED: <span class="white">${this.kills}</span></p>
      <p>TIME: <span class="yellow">${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s</span></p>
      <p>OVERALL RANK: <span class="red-glow" style="font-size: 20px;">${rank}</span></p>
    `;
  }
}

const gameState = new GameState();

// UI Button Listeners
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

// Main Animation Loop
function gameLoop() {
  requestAnimationFrame(gameLoop);

  // Hit-stop freeze
  if (hitStopFrames > 0) {
    hitStopFrames--;
    return;
  }

  ctx.save();
  ctx.scale(SCALE, SCALE);

  // Screen Shake
  if (screenShakeTrauma > 0) {
    const shakeX = (Math.random() - 0.5) * screenShakeTrauma * 12;
    const shakeY = (Math.random() - 0.5) * screenShakeTrauma * 12;
    ctx.translate(shakeX, shakeY);
    screenShakeTrauma = Math.max(0, screenShakeTrauma - 0.05);
  }

  if (gameState.state === 'playing' || gameState.state === 'dialogue' || gameState.state === 'qte') {
    const p = gameState.player;
    const stage = gameState.stage;

    // Update
    if (gameState.state === 'playing') {
      p.update(stage);

      // Camera lerp
      camera.x += (p.x - VIEW_W / 2 - camera.x) * 0.1;
      camera.x = Math.max(0, Math.min(stage.length - VIEW_W, camera.x));

      // Combo Decay
      if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer === 0) gameState.combo = 0;
      }

      // Enemies
      stage.enemies = stage.enemies.filter(e => e.active);
      stage.enemies.forEach(e => e.update(p, stage));

      // Bosses
      if (stage.boss && stage.boss.active) {
        stage.boss.update(p, stage);
      }

      // Projectiles
      stage.projectiles = stage.projectiles.filter(proj => proj.active);
      stage.projectiles.forEach(proj => {
        proj.update();
        // Check collisions
        if (proj.isPlayer) {
          stage.enemies.forEach(e => {
            if (Math.hypot(e.x - proj.x, e.y - proj.y) < 16) {
              e.takeDamage(proj.damage, Math.sign(proj.vx));
              proj.active = false;
              gameState.addHit();
            }
          });
          if (stage.boss && Math.hypot(stage.boss.x - proj.x, stage.boss.y - proj.y) < 28) {
            stage.boss.takeDamage(proj.damage);
            proj.active = false;
            gameState.addHit();
          }
        } else {
          if (Math.hypot(p.x - proj.x, p.y - proj.y) < 14) {
            p.takeDamage(proj.damage);
            proj.active = false;
          }
        }
      });

      // Stage Progression trigger
      if (stage.enemies.length === 0 && (!stage.boss || !stage.boss.active)) {
        if (p.x >= stage.length - 80) {
          gameState.nextStage();
        }
      }
    }

    // Render Stage Parallax & Floor
    stage.drawParallax(ctx);

    // Render Entities
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

    // --- HUD RENDER (Top Bar) ---
    // P1 Health Bar
    ctx.fillStyle = '#22193b';
    ctx.fillRect(10, 10, 80, 8);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(10, 10, (p.hp / p.maxHp) * 80, 8);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 80, 8);

    // Special Meter
    ctx.fillStyle = '#102027';
    ctx.fillRect(10, 20, 60, 4);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(10, 20, (p.special / p.maxSpecial) * 60, 4);

    // Active Character Label
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = p.charType === 'calm' ? '#00e5ff' : '#ffd700';
    ctx.fillText(`${p.charType.toUpperCase()} [${p.hasMinigun ? 'MINIGUN' : (p.charType === 'calm' ? 'KATANA' : 'SMG')}]`, 10, 32);

    // Combo Counter
    if (gameState.combo > 1) {
      ctx.font = '9px "Press Start 2P"';
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(`${gameState.combo}x HIT!`, VIEW_W / 2 - 25, 20);
    }

    // Boss Bar if active
    if (stage.boss && stage.boss.active) {
      ctx.fillStyle = '#22193b';
      ctx.fillRect(VIEW_W / 2 - 60, 32, 120, 6);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(VIEW_W / 2 - 60, 32, (stage.boss.hp / stage.boss.maxHp) * 120, 6);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(VIEW_W / 2 - 60, 32, 120, 6);
      ctx.font = '6px "Press Start 2P"';
      ctx.fillStyle = '#fff';
      ctx.fillText(stage.stageNum === 2 ? 'RED ATTACK CHOPPER' : 'MUTANT NOOBDA', VIEW_W / 2 - 40, 46);
    }
  }

  ctx.restore();
}

// Draw preview avatars on cards
function drawPreviews() {
  const cCanvas = document.getElementById('calm-preview');
  const cCtx = cCanvas.getContext('2d');
  cCtx.imageSmoothingEnabled = false;
  cCtx.fillStyle = '#1c172d';
  cCtx.fillRect(20, 14, 24, 36);
  cCtx.fillStyle = '#00e5ff';
  cCtx.fillRect(20, 18, 24, 6);
  cCtx.fillStyle = '#ff0055';
  cCtx.fillRect(20, 32, 24, 4);

  const eCanvas = document.getElementById('encore-preview');
  const eCtx = eCanvas.getContext('2d');
  eCtx.imageSmoothingEnabled = false;
  eCtx.fillStyle = '#2a223e';
  eCtx.fillRect(20, 14, 24, 36);
  eCtx.fillStyle = '#ffd700';
  eCtx.fillRect(20, 16, 24, 6);
  eCtx.fillStyle = '#ff9800';
  eCtx.fillRect(20, 34, 24, 4);
}

drawPreviews();
requestAnimationFrame(gameLoop);
