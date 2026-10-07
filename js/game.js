/**
 * Main Game Controller, Loop, Input, Abilities & HUD Logic
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.greaseCanvas = document.getElementById('greaseCanvas');
    this.greaseCtx = this.greaseCanvas.getContext('2d');

    // High DPI / Canvas scaling
    this.width = 900;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.greaseCanvas.width = this.width;
    this.greaseCanvas.height = this.height;

    // State
    this.health = 20;
    this.maxHealth = 20;
    this.discipline = 350; // Starting currency
    this.gameSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    // Entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.greaseSpots = []; // Cleanable screen stains

    // Selection
    this.selectedShopType = null;
    this.selectedPlacedTower = null;
    this.hoverTile = null;

    // Active Abilities
    this.abilities = {
      broadcast: {
        id: 'broadcast',
        cooldown: 35,
        timer: 0,
        active: false,
        duration: 4.0
      },
      coffee: {
        id: 'coffee',
        cooldown: 30,
        timer: 0,
        active: false,
        duration: 8.0,
        activeTimer: 0
      }
    };

    // Statistics
    this.stats = {
      snacksConfiscated: 0,
      disciplineEarned: 0,
      greaseCleaned: 0,
      towersBuilt: 0
    };

    // Subsystems
    this.waveManager = new window.WaveManager();
    this.lastTime = performance.now();

    // Event listeners
    this.initEvents();
    this.updateHUD();
  }

  initEvents() {
    // Mouse move on canvas
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      this.hoverTile = window.GameMap.getTileCoords(mouseX, mouseY);

      // Check if hovering near a grease spot to show sponge cursor
      const nearGrease = this.greaseSpots.some(spot => Math.hypot(spot.x - mouseX, spot.y - mouseY) <= spot.radius + 15);
      this.canvas.style.cursor = nearGrease ? 'pointer' : (this.selectedShopType ? 'crosshair' : 'default');
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTile = null;
    });

    // Click on canvas
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      this.handleCanvasClick(mouseX, mouseY);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') this.selectShopTower('teacher');
      if (e.key === '2') this.selectShopTower('janitor');
      if (e.key === '3') this.selectShopTower('router');
      if (e.key === '4') this.selectShopTower('printer');
      if (e.key === 'q' || e.key === 'Q') this.triggerBroadcastAbility();
      if (e.key === 'w' || e.key === 'W') this.triggerCoffeeAbility();
      if (e.key === ' ') {
        e.preventDefault();
        this.togglePause();
      }
      if (e.key === 'Escape') {
        this.deselectAll();
      }
    });

    // Shop buttons
    document.querySelectorAll('.tower-card').forEach(card => {
      card.addEventListener('click', () => {
        const typeId = card.getAttribute('data-type');
        this.selectShopTower(typeId);
      });
    });

    // Speed buttons
    document.querySelectorAll('.btn-speed').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.getAttribute('data-speed'));
        this.setSpeed(speed);
        document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Pause button
    const pauseBtn = document.getElementById('btnPause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    // Audio toggle button
    const audioBtn = document.getElementById('btnAudio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = window.SoundEngine.toggleMute();
        audioBtn.innerText = muted ? '🔇 Zvuk' : '🔊 Zvuk';
      });
    }

    // Early wave button
    const earlyBtn = document.getElementById('btnEarlyWave');
    if (earlyBtn) {
      earlyBtn.addEventListener('click', () => {
        const bonus = this.waveManager.triggerEarlyWaveBonus();
        if (bonus > 0) {
          this.addDiscipline(bonus);
          window.SoundEngine.playCoin();
          window.ParticleSystem.addFloatingText(450, 270, `+${bonus} ODVAHA!`, '#fde047', 16, true);
        }
      });
    }

    // Abilities buttons
    const btnBroadcast = document.getElementById('btnAbilityBroadcast');
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => this.triggerBroadcastAbility());
    }
    const btnCoffee = document.getElementById('btnAbilityCoffee');
    if (btnCoffee) {
      btnCoffee.addEventListener('click', () => this.triggerCoffeeAbility());
    }

    // Restart button in modals
    document.querySelectorAll('.btn-restart').forEach(btn => {
      btn.addEventListener('click', () => this.restartGame());
    });
  }

  handleCanvasClick(x, y) {
    // 0. Check if clicked near a grease spot to clean it with sponge!
    for (let i = this.greaseSpots.length - 1; i >= 0; i--) {
      const spot = this.greaseSpots[i];
      const dist = Math.hypot(spot.x - x, spot.y - y);
      if (dist <= spot.radius + 15) {
        this.greaseSpots.splice(i, 1);
        this.stats.greaseCleaned++;
        this.addDiscipline(10);
        window.SoundEngine.playSpongeClean();
        window.ParticleSystem.addFloatingText(x, y, '+10 KÁZEŇ (VYČIŠTĚNO!)', '#4ade80', 13, true);
        window.ParticleSystem.addBurst(x, y, 8, '#38bdf8', 2, 3);
        this.drawGreaseOverlay();
        return;
      }
    }

    const coords = window.GameMap.getTileCoords(x, y);

    // 1. Check if clicked an existing tower
    const clickedTower = this.towers.find(t => t.col === coords.col && t.row === coords.row);
    if (clickedTower) {
      this.selectedPlacedTower = clickedTower;
      this.selectedShopType = null;
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
      this.updateSelectionPanel();
      return;
    }

    // 2. If we had a shop tower selected, try to place it
    if (this.selectedShopType) {
      if (window.GameMap.isBuildable(coords.col, coords.row)) {
        // Check if tile already has a tower
        const occupied = this.towers.some(t => t.col === coords.col && t.row === coords.row);
        if (!occupied && this.discipline >= this.selectedShopType.cost) {
          this.placeTower(coords.col, coords.row, this.selectedShopType);
          return;
        }
      }
    }

    // 3. Otherwise deselect
    this.deselectAll();
  }

  placeTower(col, row, typeConfig) {
    this.discipline -= typeConfig.cost;
    const tower = new window.Tower(col, row, typeConfig);
    this.towers.push(tower);
    this.stats.towersBuilt++;

    window.SoundEngine.playPaperFlick();
    window.ParticleSystem.addBurst(tower.x, tower.y, 8, '#38bdf8', 2, 3);
    window.ParticleSystem.addFloatingText(tower.x, tower.y, `-${typeConfig.cost}`, '#fde047', 13);

    // Keep shop selection active or select placed tower
    this.selectedPlacedTower = tower;
    this.selectedShopType = null;
    document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));

    this.updateHUD();
    this.updateSelectionPanel();
  }

  selectShopTower(typeId) {
    const key = typeId.toUpperCase();
    const typeConfig = window.TOWER_TYPES[key];
    if (!typeConfig) return;

    if (this.selectedShopType === typeConfig) {
      this.selectedShopType = null;
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
    } else {
      this.selectedShopType = typeConfig;
      this.selectedPlacedTower = null;
      this.updateSelectionPanel();

      document.querySelectorAll('.tower-card').forEach(c => {
        if (c.getAttribute('data-type') === typeId) {
          c.classList.add('selected');
        } else {
          c.classList.remove('selected');
        }
      });
    }
  }

  deselectAll() {
    this.selectedShopType = null;
    this.selectedPlacedTower = null;
    document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
    this.updateSelectionPanel();
  }

  // Active abilities
  triggerBroadcastAbility() {
    const ab = this.abilities.broadcast;
    if (ab.timer > 0) return;

    ab.timer = ab.cooldown;
    window.SoundEngine.playSchoolChime();

    // Stun all active enemies on screen
    for (const e of this.enemies) {
      if (!e.dead && !e.escaped) {
        e.applyStun(ab.duration);
      }
    }

    window.ParticleSystem.addFloatingText(450, 160, '📢 ŠKOLNÍ ROZHLAS: ZASTAVIT SE!', '#38bdf8', 18, true);
    this.updateAbilitiesHUD();
  }

  triggerCoffeeAbility() {
    const ab = this.abilities.coffee;
    if (ab.timer > 0) return;

    ab.timer = ab.cooldown;
    ab.active = true;
    ab.activeTimer = ab.duration;

    window.SoundEngine.playCoffeeSip();
    window.ParticleSystem.addFloatingText(450, 220, '☕ KÁVA ZE SBOROVNY: 2X RYCHLOST!', '#fbbf24', 18, true);

    for (const t of this.towers) {
      window.ParticleSystem.addBurst(t.x, t.y, 6, '#fbbf24', 2, 3);
    }
    this.updateAbilitiesHUD();
  }

  addDiscipline(amount) {
    this.discipline += amount;
    this.stats.disciplineEarned += amount;
    this.updateHUD();
  }

  takeDamage(amount, enemy) {
    this.health = Math.max(0, this.health - amount);
    window.SoundEngine.playLeakAlarm();
    window.ParticleSystem.addFloatingText(450, 40, `-${amount} ČISTOTA!`, '#ef4444', 18, true);

    // Add grease smudge on screen
    this.addGreaseSplatter(
      window.GameMap.waypoints[window.GameMap.waypoints.length - 1].x - 60 + (Math.random() * 40 - 20),
      window.GameMap.waypoints[window.GameMap.waypoints.length - 1].y + (Math.random() * 60 - 30)
    );

    this.updateHUD();

    if (this.health <= 0 && !this.isGameOver) {
      this.gameOver();
    }
  }

  addGreaseSplatter(x, y) {
    const radius = 24 + Math.random() * 16;
    this.greaseSpots.push({
      x: Math.min(this.width - 40, Math.max(40, x)),
      y: Math.min(this.height - 40, Math.max(40, y)),
      radius: radius,
      color: Math.random() < 0.5 ? 'rgba(234, 88, 12, 0.7)' : 'rgba(202, 138, 4, 0.7)' // ketchup / grease
    });

    // Show grease hint if spots exist
    const hint = document.getElementById('greaseHint');
    if (hint) hint.style.display = 'block';

    this.drawGreaseOverlay();
  }

  drawGreaseOverlay() {
    this.greaseCtx.clearRect(0, 0, this.width, this.height);

    for (const spot of this.greaseSpots) {
      this.greaseCtx.save();
      this.greaseCtx.fillStyle = spot.color;
      this.greaseCtx.beginPath();
      this.greaseCtx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      this.greaseCtx.fill();

      // Splat drops around
      for (let i = 0; i < 5; i++) {
        const angle = i * (Math.PI * 2 / 5);
        const dist = spot.radius * 1.3;
        this.greaseCtx.beginPath();
        this.greaseCtx.arc(spot.x + Math.cos(angle) * dist, spot.y + Math.sin(angle) * dist, spot.radius * 0.25, 0, Math.PI * 2);
        this.greaseCtx.fill();
      }

      // Handprint / greasy mark texture
      this.greaseCtx.font = '18px sans-serif';
      this.greaseCtx.textAlign = 'center';
      this.greaseCtx.textBaseline = 'middle';
      this.greaseCtx.fillText('🖐️', spot.x, spot.y);

      this.greaseCtx.restore();
    }

    const hint = document.getElementById('greaseHint');
    if (hint) {
      hint.style.display = this.greaseSpots.length > 0 ? 'block' : 'none';
    }
  }

  setSpeed(speed) {
    this.gameSpeed = speed;
    this.isPaused = false;
    const pauseBtn = document.getElementById('btnPause');
    if (pauseBtn) pauseBtn.innerText = '⏸️ Pauza';
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('btnPause');
    if (pauseBtn) {
      pauseBtn.innerText = this.isPaused ? '▶️ Spustit' : '⏸️ Pauza';
    }
  }

  updateHUD() {
    document.getElementById('statHealth').innerText = `${this.health} / ${this.maxHealth}`;
    document.getElementById('statDiscipline').innerText = this.discipline;
    document.getElementById('statWave').innerText = `${this.waveManager.currentWave} / ${this.waveManager.totalWaves}`;

    // Update shop button states (disabled if can't afford)
    document.querySelectorAll('.tower-card').forEach(card => {
      const typeId = card.getAttribute('data-type');
      const cfg = window.TOWER_TYPES[typeId.toUpperCase()];
      if (cfg) {
        if (this.discipline < cfg.cost) {
          card.classList.add('disabled');
        } else {
          card.classList.remove('disabled');
        }
      }
    });

    // Early wave button display
    const earlyBtn = document.getElementById('btnEarlyWave');
    if (earlyBtn) {
      if (this.waveManager.waitingForBreak && this.waveManager.currentWave < this.waveManager.totalWaves) {
        const sec = Math.ceil(this.waveManager.breakTimer);
        earlyBtn.style.display = 'inline-flex';
        earlyBtn.innerText = this.waveManager.currentWave === 0 
          ? `▶️ Spustit 1. přestávku (${sec}s)` 
          : `⏩ Další přestávka (${sec}s)`;
      } else {
        earlyBtn.style.display = 'none';
      }
    }
  }

  updateAbilitiesHUD() {
    // Broadcast ability
    const btnB = document.getElementById('btnAbilityBroadcast');
    const cdB = document.getElementById('cdAbilityBroadcast');
    if (btnB && cdB) {
      const b = this.abilities.broadcast;
      if (b.timer > 0) {
        btnB.classList.add('disabled');
        cdB.innerText = `${Math.ceil(b.timer)}s`;
      } else {
        btnB.classList.remove('disabled');
        cdB.innerText = 'PŘIPRAVENO (Q)';
      }
    }

    // Coffee ability
    const btnC = document.getElementById('btnAbilityCoffee');
    const cdC = document.getElementById('cdAbilityCoffee');
    if (btnC && cdC) {
      const c = this.abilities.coffee;
      if (c.active) {
        btnC.classList.add('active');
        cdC.innerText = `AKTIVNÍ (${Math.ceil(c.activeTimer)}s)`;
      } else if (c.timer > 0) {
        btnC.classList.remove('active');
        btnC.classList.add('disabled');
        cdC.innerText = `${Math.ceil(c.timer)}s`;
      } else {
        btnC.classList.remove('active');
        btnC.classList.remove('disabled');
        cdC.innerText = 'PŘIPRAVENO (W)';
      }
    }
  }

  updateSelectionPanel() {
    const panel = document.getElementById('selectionPanel');
    if (!panel) return;

    if (!this.selectedPlacedTower) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'flex';
    const t = this.selectedPlacedTower;

    document.getElementById('selTowerIcon').innerText = t.branchConfig ? t.branchConfig.icon : t.type.icon;
    document.getElementById('selTowerName').innerText = `${t.branchConfig ? t.branchConfig.name : t.type.name} (Úroveň ${t.level})`;
    document.getElementById('selTowerStats').innerHTML = `
      Poškození: <strong>${Math.round(t.damage)}</strong> | 
      Rychlost útoku: <strong>${t.fireRate.toFixed(2)}s</strong> | 
      Dosah: <strong>${t.range}px</strong>
    `;

    // Action buttons container
    const actionsBox = document.getElementById('selTowerActions');
    actionsBox.innerHTML = '';

    // Level 1 -> 2
    if (t.level === 1) {
      const up = t.type.upgrades.lvl2;
      const canAfford = this.discipline >= up.cost;
      const btn = document.createElement('button');
      btn.className = `btn btn-primary ${canAfford ? '' : 'disabled'}`;
      btn.innerHTML = `Vylepšit na Lvl 2 (${up.cost} Kázeň)`;
      btn.onclick = () => {
        if (this.discipline >= up.cost) {
          this.discipline -= up.cost;
          t.upgradeLevel2();
          this.updateHUD();
          this.updateSelectionPanel();
        }
      };
      actionsBox.appendChild(btn);
    } 
    // Level 2 -> 3 (Branching Upgrades!)
    else if (t.level === 2) {
      const brA = t.type.upgrades.branchA;
      const brB = t.type.upgrades.branchB;

      const btnA = document.createElement('button');
      btnA.className = 'upgrade-branch-btn';
      btnA.innerHTML = `<strong>${brA.icon} ${brA.name}</strong><span>${brA.cost} Kázeň</span>`;
      btnA.title = brA.description;
      btnA.onclick = () => {
        if (this.discipline >= brA.cost) {
          this.discipline -= brA.cost;
          t.upgradeBranch('branchA');
          this.updateHUD();
          this.updateSelectionPanel();
        }
      };

      const btnB = document.createElement('button');
      btnB.className = 'upgrade-branch-btn';
      btnB.innerHTML = `<strong>${brB.icon} ${brB.name}</strong><span>${brB.cost} Kázeň</span>`;
      btnB.title = brB.description;
      btnB.onclick = () => {
        if (this.discipline >= brB.cost) {
          this.discipline -= brB.cost;
          t.upgradeBranch('branchB');
          this.updateHUD();
          this.updateSelectionPanel();
        }
      };

      actionsBox.appendChild(btnA);
      actionsBox.appendChild(btnB);
    } else {
      const maxBadge = document.createElement('span');
      maxBadge.style.color = '#4ade80';
      maxBadge.style.fontWeight = 'bold';
      maxBadge.innerText = 'MAX ÚROVEŇ (Specializace)';
      actionsBox.appendChild(maxBadge);
    }

    // Sell button
    const sellBtn = document.createElement('button');
    sellBtn.className = 'btn btn-warning';
    sellBtn.innerText = `Prodat (+${t.getSellValue()})`;
    sellBtn.onclick = () => {
      this.discipline += t.getSellValue();
      const idx = this.towers.indexOf(t);
      if (idx !== -1) this.towers.splice(idx, 1);
      window.SoundEngine.playCoin();
      window.ParticleSystem.addBurst(t.x, t.y, 10, '#fbbf24', 2, 3);
      this.deselectAll();
      this.updateHUD();
    };
    actionsBox.appendChild(sellBtn);
  }

  gameOver() {
    this.isGameOver = true;
    window.SoundEngine.playGameOver();
    const modal = document.getElementById('gameOverModal');
    if (modal) {
      document.getElementById('goSnacks').innerText = this.stats.snacksConfiscated;
      document.getElementById('goDiscipline').innerText = this.stats.disciplineEarned;
      document.getElementById('goGrease').innerText = this.stats.greaseCleaned;
      modal.style.display = 'flex';
    }
  }

  victory() {
    this.isVictory = true;
    window.SoundEngine.playVictory();
    const modal = document.getElementById('victoryModal');
    if (modal) {
      document.getElementById('vicSnacks').innerText = this.stats.snacksConfiscated;
      document.getElementById('vicDiscipline').innerText = this.stats.disciplineEarned;
      document.getElementById('vicGrease').innerText = this.stats.greaseCleaned;
      modal.style.display = 'flex';
    }
  }

  restartGame() {
    this.health = this.maxHealth;
    this.discipline = 350;
    this.gameSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.greaseSpots = [];

    this.stats = {
      snacksConfiscated: 0,
      disciplineEarned: 0,
      greaseCleaned: 0,
      towersBuilt: 0
    };

    this.abilities.broadcast.timer = 0;
    this.abilities.coffee.timer = 0;
    this.abilities.coffee.active = false;

    this.waveManager = new window.WaveManager();
    window.ParticleSystem.reset();

    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('victoryModal').style.display = 'none';

    this.drawGreaseOverlay();
    this.deselectAll();
    this.updateHUD();
    this.updateAbilitiesHUD();
  }

  update(dt) {
    if (this.isGameOver || this.isVictory || this.isPaused) return;

    // Apply speed multiplier
    const effectiveDt = dt * this.gameSpeed;

    // 1. Update abilities timers
    if (this.abilities.broadcast.timer > 0) {
      this.abilities.broadcast.timer = Math.max(0, this.abilities.broadcast.timer - effectiveDt);
    }
    if (this.abilities.coffee.timer > 0) {
      this.abilities.coffee.timer = Math.max(0, this.abilities.coffee.timer - effectiveDt);
    }
    if (this.abilities.coffee.active) {
      this.abilities.coffee.activeTimer -= effectiveDt;
      if (this.abilities.coffee.activeTimer <= 0) {
        this.abilities.coffee.active = false;
      }
    }
    this.updateAbilitiesHUD();

    // 2. Wave Manager update
    this.waveManager.update(effectiveDt, this.enemies, (newEnemy) => {
      this.enemies.push(newEnemy);
    });

    // Check victory condition
    if (this.waveManager.currentWave >= this.waveManager.totalWaves && 
        !this.waveManager.isWaveActive && 
        this.enemies.filter(e => !e.dead && !e.escaped).length === 0 &&
        this.health > 0 && !this.isVictory) {
      this.victory();
      return;
    }

    // 3. Update Towers
    for (const tower of this.towers) {
      tower.update(effectiveDt, this.enemies, this.projectiles, this.abilities.coffee.active);
    }

    // 4. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(effectiveDt, this.enemies);
      if (p.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // 5. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(effectiveDt);

      // Check if stepped into Janitor soap puddles
      for (const pud of window.ParticleSystem.puddles) {
        if (Math.hypot(e.x - pud.x, e.y - pud.y) <= pud.radius) {
          e.applySlow(0.45, 1.2);
        }
      }

      // Check death
      if (e.dead) {
        this.stats.snacksConfiscated++;
        this.addDiscipline(e.reward);
        window.SoundEngine.playCoin();
        window.ParticleSystem.addFloatingText(e.x, e.y, `+${e.reward}`, '#fde047', 12);
        window.ParticleSystem.addBurst(e.x, e.y, 8, '#fbbf24', 2, 2.5);

        // Chips split into crumbs mechanic!
        if (e.type.splitsOnDeath) {
          window.SoundEngine.playChipsCrunch();
          window.ParticleSystem.addFloatingText(e.x, e.y, 'DROBKY!', '#f59e0b', 14, true);
          for (let s = 0; s < e.type.splitCount; s++) {
            const crumbConfig = window.ENEMY_TYPES.DROBEK;
            const crumb = new window.Enemy(crumbConfig, e.waypointIndex, {
              x: e.x + (Math.random() * 20 - 10),
              y: e.y + (Math.random() * 20 - 10)
            });
            this.enemies.push(crumb);
          }
        }

        this.enemies.splice(i, 1);
        continue;
      }

      // Check escape into IT Lab
      if (e.escaped) {
        this.takeDamage(e.damage, e);
        this.enemies.splice(i, 1);
        continue;
      }
    }

    // 6. Update Visual Particles & Popups
    window.ParticleSystem.update(effectiveDt);

    // Update HUD
    this.updateHUD();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Map & Hallway
    const isOccupied = this.hoverTile ? this.towers.some(t => t.col === this.hoverTile.col && t.row === this.hoverTile.row) : false;
    window.GameMap.draw(
      this.ctx,
      this.hoverTile,
      this.selectedShopType,
      this.selectedShopType ? this.discipline >= this.selectedShopType.cost : false,
      isOccupied
    );

    // 2. Draw Soap Puddles (under enemies and towers)
    window.ParticleSystem.drawPuddles(this.ctx);

    // 3. Draw Towers
    for (const tower of this.towers) {
      const isSel = this.selectedPlacedTower === tower;
      tower.draw(this.ctx, isSel);
    }

    // 4. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    // 5. Draw Projectiles
    for (const proj of this.projectiles) {
      proj.draw(this.ctx);
    }

    // 6. Draw Lightning, Particles, Speech bubbles & Numbers
    window.ParticleSystem.drawLightning(this.ctx);
    window.ParticleSystem.drawParticles(this.ctx);
    window.ParticleSystem.drawFloatingText(this.ctx);
    window.ParticleSystem.drawSpeechBubbles(this.ctx);
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => {
      this.lastTime = t;
      this.loop(t);
    });
  }
}

// Instantiate and start once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.GameInstance = new Game();
  window.GameInstance.start();
});
