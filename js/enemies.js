/**
 * Enemy Definitions & Movement Logic
 */

const ENEMY_TYPES = {
  ROHLIK: {
    id: 'rohlik',
    name: 'Prvák s rohlíkem',
    icon: '🥪',
    snackName: 'Rohlík s Májkou',
    maxHp: 90,
    speed: 68, // px per sec
    reward: 15,
    damage: 1,
    size: 20,
    color: '#60a5fa',
    quotes: ['Já to jenom dožvejkám!', 'Mně v tom nekape!', 'Mám hlad!', 'Už to skoro mám!']
  },
  MONSTER: {
    id: 'monster',
    name: 'Sprinter na Monsteru',
    icon: '⚡',
    snackName: 'Ledový Monster',
    maxHp: 60,
    speed: 135,
    reward: 20,
    damage: 1,
    size: 18,
    color: '#4ade80',
    quotes: ['Už zvoní!', 'V tom je vitamín B!', 'Nestíhám!', 'Speedrun!']
  },
  CHIPSY: {
    id: 'chipsy',
    name: 'Gamer s chipsy',
    icon: '🥔',
    snackName: 'Solené Chipsy',
    maxHp: 130,
    speed: 62,
    reward: 25,
    damage: 1,
    size: 22,
    color: '#fbbf24',
    splitsOnDeath: true,
    splitCount: 3,
    quotes: ['Lays s cibulí!', 'Mám čistý prsty!', 'To nekřupe!', 'Dám ti čuchnout']
  },
  DROBEK: {
    id: 'drobek',
    name: 'Uteklý drobek',
    icon: '✨',
    snackName: 'Drobeček chipsů',
    maxHp: 32,
    speed: 110,
    reward: 5,
    damage: 1,
    size: 12,
    color: '#f59e0b',
    quotes: ['Křup!', 'Chroust!', 'Nezameteš mě!']
  },
  PIZZA_TEAM: {
    id: 'pizza_team',
    name: 'Trio s krabicí pizzy',
    icon: '🍕',
    snackName: 'Rodinná Pizza Quattro Formaggi',
    maxHp: 330,
    speed: 52,
    reward: 50,
    damage: 2,
    size: 26,
    color: '#f87171',
    quotes: ['Projektová výuka!', 'To je na svačinu!', 'Nerozplácněte to!', 'Dáme učiteli dílek?']
  },
  KEBAB_BOSS: {
    id: 'kebab_boss',
    name: 'Kebab Těžkooděnec',
    icon: '🌯',
    snackName: 'Dürüm v alobalu s česnekem',
    maxHp: 650,
    speed: 46,
    reward: 90,
    damage: 3,
    size: 30,
    color: '#a855f7',
    foilShield: 4, // Absorbs first 4 hits
    quotes: ['Alobal drží teplo!', 'Hodně česneku!', 'S sebou do labu!', 'Dürüm do klávesnice!']
  },
  MATURANT_BOSS: {
    id: 'maturant_boss',
    name: 'Maturant s 2L Colou a řízkem',
    icon: '🍗',
    snackName: 'Mega řízek a 2L Cola',
    maxHp: 1600,
    speed: 45,
    reward: 220,
    damage: 5,
    size: 34,
    color: '#ec4899',
    isBoss: true,
    quotes: ['Maturita za rohem!', 'Dva litry Coly!', 'Učebna je naše!', 'Řízek k monitoru!']
  }
};

class Enemy {
  constructor(typeConfig, waypointIndex = 0, currentPos = null) {
    this.type = typeConfig;
    this.maxHp = typeConfig.maxHp;
    this.hp = this.maxHp;
    this.baseSpeed = typeConfig.speed;
    this.speed = this.baseSpeed;
    this.reward = typeConfig.reward;
    this.damage = typeConfig.damage;
    this.size = typeConfig.size;
    this.color = typeConfig.color;
    this.icon = typeConfig.icon;
    this.name = typeConfig.name;

    // Boss & Mechanics
    this.isBoss = !!typeConfig.isBoss;
    this.foilShield = typeConfig.foilShield || 0;
    this.rageTriggered = false;

    // Waypoints & Position
    this.waypointIndex = waypointIndex;
    const waypoints = window.GameMap.waypoints;
    if (currentPos) {
      this.x = currentPos.x;
      this.y = currentPos.y;
    } else {
      this.x = waypoints[0].x;
      this.y = waypoints[0].y;
    }

    // Status effects
    this.slowFactor = 1.0;
    this.slowTimer = 0;
    this.stunTimer = 0;
    this.dotDps = 0;
    this.dotTimer = 0;

    // Animation & Quotes
    this.dead = false;
    this.escaped = false;
    this.walkCycle = Math.random() * Math.PI * 2;
    this.quoteCooldown = 4.0 + Math.random() * 6.0;

    // Track total distance traveled for targeting priority (First)
    this.distanceTraveled = 0;
  }

  applyDamage(amount, isCrit = false) {
    // Shield check (Kebab Boss alobal)
    if (this.foilShield > 0) {
      this.foilShield--;
      window.SoundEngine.playHit();
      window.ParticleSystem.addFloatingText(this.x, this.y, 'ODRAŽENO!', '#38bdf8', 12);
      window.ParticleSystem.addBurst(this.x, this.y, 4, '#e2e8f0', 2, 3);
      if (this.foilShield === 0) {
        window.ParticleSystem.addFloatingText(this.x, this.y, 'ALOBAL PRORAŽEN!', '#f43f5e', 14, true);
      }
      return false;
    }

    this.hp -= amount;
    window.SoundEngine.playHit();
    window.ParticleSystem.addFloatingText(this.x, this.y, `-${Math.round(amount)}`, isCrit ? '#f43f5e' : '#f87171', 13, isCrit);
    window.ParticleSystem.addBurst(this.x, this.y, 4, this.color, 2, 2.5);

    // Boss Phase 2 Rage
    if (this.isBoss && !this.rageTriggered && this.hp <= this.maxHp * 0.5) {
      this.rageTriggered = true;
      this.baseSpeed *= 1.45;
      window.ParticleSystem.addSpeechBubble(this, 'GLUK GLUK! JEDU NA 150%!', 3.0);
      window.ParticleSystem.addFloatingText(this.x, this.y, 'RAGE MODE!', '#ec4899', 16, true);
    }

    if (this.hp <= 0) {
      this.dead = true;
      return true; // killed
    }
    return false;
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor) {
      this.slowFactor = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
    window.ParticleSystem.addFloatingText(this.x, this.y, 'STUN!', '#38bdf8', 12);
  }

  applyDot(dps, duration) {
    this.dotDps = Math.max(this.dotDps, dps);
    this.dotTimer = Math.max(this.dotTimer, duration);
  }

  update(dt) {
    if (this.dead || this.escaped) return;

    // 1. Process DoT (Toner / Hot sauce)
    if (this.dotTimer > 0) {
      this.dotTimer -= dt;
      const damageTick = this.dotDps * dt;
      this.hp -= damageTick;
      if (Math.random() < 0.2) {
        window.ParticleSystem.addBurst(this.x, this.y, 1, '#334155', 1, 3, 'toner');
      }
      if (this.hp <= 0) {
        this.dead = true;
        return;
      }
    }

    // 2. Status timers
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return; // Can't move while stunned
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowFactor = 1.0;
      }
    }

    // 3. Movement along waypoints
    const waypoints = window.GameMap.waypoints;
    if (this.waypointIndex >= waypoints.length - 1) {
      this.escaped = true;
      return;
    }

    const target = waypoints[this.waypointIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    const currentSpeed = this.baseSpeed * this.slowFactor;
    const moveDist = currentSpeed * dt;

    if (dist <= moveDist) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      this.distanceTraveled += dist;
      if (this.waypointIndex >= waypoints.length - 1) {
        this.escaped = true;
      }
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
      this.distanceTraveled += moveDist;
    }

    // Walk animation bobbing
    this.walkCycle += dt * 8 * (currentSpeed / 60);

    // Speech bubble banter
    this.quoteCooldown -= dt;
    if (this.quoteCooldown <= 0 && this.type.quotes && this.type.quotes.length > 0) {
      const q = this.type.quotes[Math.floor(Math.random() * this.type.quotes.length)];
      window.ParticleSystem.addSpeechBubble(this, q, 2.2);
      this.quoteCooldown = 8.0 + Math.random() * 10.0;
    }
  }

  draw(ctx) {
    if (this.dead || this.escaped) return;

    ctx.save();
    // Bobbing offset
    const bobY = Math.sin(this.walkCycle) * 3;
    const drawX = this.x;
    const drawY = this.y + bobY;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(drawX, this.y + this.size * 0.7, this.size * 0.75, this.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Circle (Student Backpack / Jacket)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon / Snack carried
    ctx.font = `${Math.round(this.size * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, drawX, drawY);

    // Stun Stars / Freeze effect
    if (this.stunTimer > 0) {
      ctx.font = '14px sans-serif';
      ctx.fillText('💫', drawX, drawY - this.size - 6);
    } else if (this.slowTimer > 0) {
      // Ice / Soap sparkle
      ctx.font = '12px sans-serif';
      ctx.fillText('🧼', drawX + this.size * 0.6, drawY - this.size * 0.4);
    }

    // Alobal Shield indicator for Kebab
    if (this.foilShield > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.size + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Shield number badge
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(drawX + this.size, drawY - this.size * 0.5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`${this.foilShield}`, drawX + this.size, drawY - this.size * 0.5);
    }

    // Health Bar
    const barWidth = Math.max(30, this.size * 1.6);
    const barHeight = 4;
    const barX = drawX - barWidth / 2;
    const barY = drawY - this.size - 9;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.restore();
  }
}

window.ENEMY_TYPES = ENEMY_TYPES;
window.Enemy = Enemy;
