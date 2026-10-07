/**
 * Tower & Projectile System with Branching Upgrades
 */

const TOWER_TYPES = {
  TEACHER: {
    id: 'teacher',
    name: 'Učitel informatiky',
    icon: '👨‍🏫',
    cost: 100,
    range: 145,
    fireRate: 0.75, // sec per shot
    damage: 24,
    description: 'Píše poznámky do Bakalářů. Rychlý spolehlivý útočník.',
    projectileType: 'note',
    projectileSpeed: 380,
    upgrades: {
      lvl2: { cost: 80, range: 165, fireRate: 0.6, damage: 38, name: 'Třídní učitel' },
      branchA: {
        id: 'bakalari',
        name: 'Pětka v Bakalářích',
        icon: '📝',
        cost: 160,
        range: 195,
        fireRate: 0.65,
        damage: 85,
        critChance: 0.35,
        critMult: 2.5,
        description: 'Smrtící známkování: 35% šance na obří kritický zásah.'
      },
      branchB: {
        id: 'ukoly',
        name: 'Hromada referátů',
        icon: '📚',
        cost: 150,
        range: 160,
        fireRate: 0.45,
        damage: 42,
        multiShot: 3,
        description: 'Rozdává referáty na víkend: zasáhne 3 studenty najednou.'
      }
    }
  },
  JANITOR: {
    id: 'janitor',
    name: 'Školník s mopem',
    icon: '🧹',
    cost: 140,
    range: 115,
    fireRate: 2.0,
    damage: 10,
    slowFactor: 0.5,
    slowDuration: 2.5,
    description: 'Vytírá podlahu – mokrá louže studenty zpomalí o 50 %.',
    projectileType: 'splash',
    upgrades: {
      lvl2: { cost: 95, range: 130, fireRate: 1.7, damage: 18, slowFactor: 0.4, slowDuration: 3.2, name: 'Vyleštěné lino' },
      branchA: {
        id: 'kalamita',
        name: 'Mýdlová kalamita',
        icon: '🧼',
        cost: 175,
        range: 140,
        fireRate: 1.5,
        damage: 25,
        slowFactor: 0.3,
        slowDuration: 4.0,
        slipBack: true, // Slips enemies slightly backwards on track!
        description: 'Extrémní pěna: zpomalení na 30 % a studenti občas sklouznou zpět!'
      },
      branchB: {
        id: 'smetak',
        name: 'Průmyslový smeták',
        icon: '🪣',
        cost: 165,
        range: 125,
        fireRate: 1.3,
        damage: 60,
        aoe: true,
        aoeRadius: 80,
        description: 'Těžký úder kýblem a smetákem do země: vysoké plošné poškození.'
      }
    }
  },
  ROUTER: {
    id: 'router',
    name: 'Wi-Fi Router',
    icon: '📡',
    cost: 200,
    range: 135,
    fireRate: 2.8,
    damage: 20,
    stunDuration: 1.2,
    description: 'Vypíná Wi-Fi! Způsobí studentům paniku a zastaví je na 1.2s.',
    projectileType: 'wifi_pulse',
    upgrades: {
      lvl2: { cost: 130, range: 155, fireRate: 2.4, damage: 35, stunDuration: 1.6, name: 'Gigabitový router' },
      branchA: {
        id: 'firewall',
        name: 'Zákaz TikToku (Firewall)',
        icon: '🚫',
        cost: 210,
        range: 170,
        fireRate: 2.2,
        damage: 45,
        stunDuration: 2.6,
        description: 'Kompletní výpadek sociálních sítí: Masivní stun na 2.6 sekundy!'
      },
      branchB: {
        id: 'chain',
        name: 'Elektrický výboj',
        icon: '⚡',
        cost: 220,
        range: 160,
        fireRate: 1.6,
        damage: 75,
        chainCount: 4,
        description: 'Přetížený signál vyšle řetězový elektrický ráz mezi 4 studenty.'
      }
    }
  },
  PRINTER: {
    id: 'printer',
    name: 'Zaseknutá Tiskárna',
    icon: '🖨️',
    cost: 260,
    range: 130,
    fireRate: 1.9,
    damage: 48,
    description: 'Chrlí štosy papíru a horký toner s plošným dopadem.',
    projectileType: 'paper_ream',
    projectileSpeed: 300,
    upgrades: {
      lvl2: { cost: 160, range: 150, fireRate: 1.6, damage: 75, name: 'LaserJet Dual' },
      branchA: {
        id: 'toner_cloud',
        name: 'Toxický tonerový mrak',
        icon: '☁️',
        cost: 240,
        range: 160,
        fireRate: 1.5,
        damage: 60,
        dotDps: 35,
        dotDuration: 3.5,
        description: 'Černý oblak práškového toneru, který studenty dusí trvalým poškozením.'
      },
      branchB: {
        id: 'paper_jam',
        name: 'Papírová lavina',
        icon: '📦',
        cost: 250,
        range: 155,
        fireRate: 1.4,
        damage: 125,
        aoeRadius: 90,
        description: 'Těžké bedny xeroxového papíru rozdrtí celé skupiny svačinářů.'
      }
    }
  }
};

class Projectile {
  constructor(x, y, target, options) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = options.speed || 350;
    this.damage = options.damage || 20;
    this.type = options.type || 'note';
    this.isCrit = !!options.isCrit;
    this.aoeRadius = options.aoeRadius || 0;
    this.dotDps = options.dotDps || 0;
    this.dotDuration = options.dotDuration || 0;
    this.dead = false;

    // Visual angle
    this.angle = 0;
  }

  update(dt, enemies) {
    if (this.dead) return;

    // If target died, projectile still flies to last known position
    const tx = this.target ? this.target.x : this.x;
    const ty = this.target ? this.target.y : this.y;

    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    const step = this.speed * dt;
    if (dist <= step) {
      this.x = tx;
      this.y = ty;
      this.hit(enemies);
      this.dead = true;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  hit(enemies) {
    if (this.aoeRadius > 0) {
      // Area of effect hit
      for (const e of enemies) {
        if (!e.dead && !e.escaped) {
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d <= this.aoeRadius) {
            e.applyDamage(this.damage, this.isCrit);
            if (this.dotDuration > 0) {
              e.applyDot(this.dotDps, this.dotDuration);
            }
          }
        }
      }
      window.ParticleSystem.addBurst(this.x, this.y, 14, '#64748b', 3, 4, 'toner');
    } else if (this.target && !this.target.dead && !this.target.escaped) {
      // Single target hit
      this.target.applyDamage(this.damage, this.isCrit);
      if (this.dotDuration > 0) {
        this.target.applyDot(this.dotDps, this.dotDuration);
      }
    }
  }

  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'note') {
      // White paper note / bad grade
      ctx.fillStyle = this.isCrit ? '#f43f5e' : '#ffffff';
      ctx.fillRect(-8, -5, 16, 10);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -5, 16, 10);

      // Red '5' mark
      ctx.fillStyle = this.isCrit ? '#ffffff' : '#ef4444';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.isCrit ? '5!' : '5', 0, 3);
    } else if (this.type === 'paper_ream') {
      // Box / pack of paper
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-10, -7, 20, 14);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -7, 20, 14);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-4, -5, 8, 10); // Red packaging tape
    }

    ctx.restore();
  }
}

class Tower {
  constructor(col, row, typeConfig) {
    this.col = col;
    this.row = row;
    this.type = typeConfig;
    this.level = 1;
    this.branch = null; // 'branchA' or 'branchB'
    this.totalInvested = typeConfig.cost;

    const center = window.GameMap.getTileCenter(col, row);
    this.x = center.x;
    this.y = center.y;

    // Stats
    this.range = typeConfig.range;
    this.fireRate = typeConfig.fireRate;
    this.damage = typeConfig.damage;
    this.cooldown = 0;

    // Animation & Aim
    this.aimAngle = 0;
    this.pulseAnim = 0;
    this.target = null;
    this.targetingMode = 'first'; // 'first', 'strongest', 'weakest', 'closest'
  }

  upgradeLevel2() {
    const up = this.type.upgrades.lvl2;
    this.level = 2;
    this.range = up.range;
    this.fireRate = up.fireRate;
    this.damage = up.damage;
    this.totalInvested += up.cost;
    window.SoundEngine.playUpgrade();
    window.ParticleSystem.addFloatingText(this.x, this.y, 'LEVEL 2!', '#4ade80', 14, true);
    window.ParticleSystem.addBurst(this.x, this.y, 10, '#4ade80', 3, 3);
  }

  upgradeBranch(branchKey) {
    const branchConfig = this.type.upgrades[branchKey];
    this.level = 3;
    this.branch = branchKey;
    this.branchConfig = branchConfig;
    this.range = branchConfig.range;
    this.fireRate = branchConfig.fireRate;
    this.damage = branchConfig.damage;
    this.totalInvested += branchConfig.cost;
    window.SoundEngine.playUpgrade();
    window.ParticleSystem.addFloatingText(this.x, this.y, branchConfig.name.toUpperCase(), '#38bdf8', 14, true);
    window.ParticleSystem.addBurst(this.x, this.y, 16, '#38bdf8', 4, 3);
  }

  getSellValue() {
    return Math.floor(this.totalInvested * 0.7);
  }

  findTarget(enemies) {
    const inRange = enemies.filter(e => {
      if (e.dead || e.escaped) return false;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      return d <= this.range;
    });

    if (inRange.length === 0) return null;

    if (this.targetingMode === 'first') {
      // Highest distance traveled
      return inRange.reduce((prev, curr) => curr.distanceTraveled > prev.distanceTraveled ? curr : prev);
    } else if (this.targetingMode === 'strongest') {
      return inRange.reduce((prev, curr) => curr.hp > prev.hp ? curr : prev);
    } else if (this.targetingMode === 'weakest') {
      return inRange.reduce((prev, curr) => curr.hp < prev.hp ? curr : prev);
    } else {
      // Closest
      return inRange.reduce((prev, curr) => {
        const d1 = Math.hypot(prev.x - this.x, prev.y - this.y);
        const d2 = Math.hypot(curr.x - this.x, curr.y - this.y);
        return d2 < d1 ? curr : prev;
      });
    }
  }

  update(dt, enemies, projectiles, coffeeActive = false) {
    // Pulse animation
    this.pulseAnim += dt * 3;

    // Rate multiplier if Coffee ability is active
    const effectiveFireRate = coffeeActive ? this.fireRate * 0.5 : this.fireRate;

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    this.target = this.findTarget(enemies);
    if (!this.target) return;

    // Aim angle towards target
    this.aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

    // Fire check
    if (this.cooldown <= 0) {
      this.fire(enemies, projectiles);
      this.cooldown = effectiveFireRate;
    }
  }

  fire(enemies, projectiles) {
    if (this.type.id === 'teacher') {
      window.SoundEngine.playPaperFlick();

      if (this.branch === 'branchB') {
        // Multi-shot (referáty)
        const inRange = enemies.filter(e => !e.dead && !e.escaped && Math.hypot(e.x - this.x, e.y - this.y) <= this.range);
        const targets = inRange.slice(0, 3);
        for (const t of targets) {
          projectiles.push(new Projectile(this.x, this.y, t, {
            speed: this.type.projectileSpeed,
            damage: this.damage,
            type: 'note',
            isCrit: false
          }));
        }
      } else {
        // Normal or Branch A (Pětka v Bakalářích)
        let isCrit = false;
        let dmg = this.damage;
        if (this.branch === 'branchA') {
          if (Math.random() < this.branchConfig.critChance) {
            isCrit = true;
            dmg *= this.branchConfig.critMult;
          }
        }
        projectiles.push(new Projectile(this.x, this.y, this.target, {
          speed: this.type.projectileSpeed,
          damage: dmg,
          type: 'note',
          isCrit: isCrit
        }));
      }
    } else if (this.type.id === 'janitor') {
      window.SoundEngine.playSplash();

      if (this.branch === 'branchB') {
        // Smeták na drobky (Heavy AoE slam)
        window.ParticleSystem.addBurst(this.target.x, this.target.y, 16, '#38bdf8', 3, 4);
        const inRange = enemies.filter(e => !e.dead && !e.escaped && Math.hypot(e.x - this.target.x, e.y - this.target.y) <= 80);
        for (const e of inRange) {
          e.applyDamage(this.damage);
          e.applySlow(0.4, 2.5);
        }
      } else {
        // Creates soap puddle at target's feet
        window.ParticleSystem.addPuddle(this.target.x, this.target.y, 30, 5.0);
        this.target.applyDamage(this.damage);
        const slow = (this.branch === 'branchA') ? 0.3 : (this.level === 2 ? 0.4 : 0.5);
        const duration = (this.branch === 'branchA') ? 4.0 : 2.5;
        this.target.applySlow(slow, duration);

        // Branch A: Slip back
        if (this.branch === 'branchA' && Math.random() < 0.45 && this.target.waypointIndex > 0) {
          this.target.waypointIndex--;
          const prevWp = window.GameMap.waypoints[this.target.waypointIndex];
          this.target.x = prevWp.x;
          this.target.y = prevWp.y;
          window.ParticleSystem.addFloatingText(this.target.x, this.target.y, 'UKLOUZL ZPĚT!', '#38bdf8', 12, true);
        }
      }
    } else if (this.type.id === 'router') {
      window.SoundEngine.playWifiZap();

      if (this.branch === 'branchB') {
        // Chain lightning across 4 enemies
        const inRange = enemies.filter(e => !e.dead && !e.escaped && Math.hypot(e.x - this.x, e.y - this.y) <= this.range);
        const chainTargets = inRange.slice(0, 4);
        let prevPoint = { x: this.x, y: this.y };
        for (const ct of chainTargets) {
          window.ParticleSystem.addLightning(prevPoint.x, prevPoint.y, ct.x, ct.y);
          ct.applyDamage(this.damage);
          ct.applyStun(0.6);
          prevPoint = { x: ct.x, y: ct.y };
        }
      } else {
        // Single target pulse / Stun
        const stunDur = (this.branch === 'branchA') ? 2.6 : (this.level === 2 ? 1.6 : 1.2);
        window.ParticleSystem.addLightning(this.x, this.y, this.target.x, this.target.y);
        this.target.applyDamage(this.damage);
        this.target.applyStun(stunDur);
      }
    } else if (this.type.id === 'printer') {
      window.SoundEngine.playPrinterChug();

      const aoe = (this.branch === 'branchB') ? 90 : 50;
      const dotDps = (this.branch === 'branchA') ? 35 : 0;
      const dotDuration = (this.branch === 'branchA') ? 3.5 : 0;

      projectiles.push(new Projectile(this.x, this.y, this.target, {
        speed: this.type.projectileSpeed,
        damage: this.damage,
        type: 'paper_ream',
        aoeRadius: aoe,
        dotDps: dotDps,
        dotDuration: dotDuration
      }));
    }
  }

  draw(ctx, isSelected = false) {
    ctx.save();
    // Range circle if selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Pedestal base
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.branch ? '#38bdf8' : (this.level === 2 ? '#4ade80' : '#475569');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Tower Icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.branchConfig ? this.branchConfig.icon : this.type.icon, this.x, this.y);

    // Level stars badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    const stars = this.level === 3 ? '★★★' : (this.level === 2 ? '★★' : '★');
    ctx.fillText(stars, this.x, this.y + 20);

    ctx.restore();
  }
}

window.TOWER_TYPES = TOWER_TYPES;
window.Tower = Tower;
window.Projectile = Projectile;
