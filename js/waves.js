/**
 * Wave Manager: Wave Spawning, Composition & Difficulty Balancing
 */

class WaveManager {
  constructor() {
    this.currentWave = 0;
    this.totalWaves = 10;
    this.isWaveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.breakTimer = 15; // 15s initial prep time
    this.breakDuration = 10; // 10s between waves
    this.waitingForBreak = true;

    this.wavesConfig = [
      // Wave 1
      {
        title: 'První zvonění',
        desc: 'Prváci s rohlíkem a Májkou zkouší štěstí.',
        spawns: [
          { type: 'ROHLIK', count: 7, delay: 1.4 }
        ]
      },
      // Wave 2
      {
        title: 'Ranní spěch',
        desc: 'Pozor na rychlíky s ledovým Monsterem!',
        spawns: [
          { type: 'ROHLIK', count: 5, delay: 1.2 },
          { type: 'MONSTER', count: 4, delay: 0.9 }
        ]
      },
      // Wave 3
      {
        title: 'Svačinová pauza',
        desc: 'Gamer s chipsy! Když ho trefíš, rozsype drobky!',
        spawns: [
          { type: 'ROHLIK', count: 4, delay: 1.2 },
          { type: 'CHIPSY', count: 4, delay: 1.5 },
          { type: 'MONSTER', count: 3, delay: 0.8 }
        ]
      },
      // Wave 4
      {
        title: 'Energetický zátah',
        desc: 'Celá třída vypila energetické nápoje naráz!',
        spawns: [
          { type: 'MONSTER', count: 10, delay: 0.65 },
          { type: 'CHIPSY', count: 3, delay: 1.2 }
        ]
      },
      // Wave 5
      {
        title: 'Skupinový projekt',
        desc: 'Studenti nesou velkou krabici pizzy jako římskou želvu.',
        spawns: [
          { type: 'PIZZA_TEAM', count: 2, delay: 2.5 },
          { type: 'ROHLIK', count: 6, delay: 1.0 },
          { type: 'MONSTER', count: 5, delay: 0.8 }
        ]
      },
      // Wave 6
      {
        title: 'Velká přestávka – Kebab Boss!',
        banner: '⚠️ POZOR: KEBAB BOSS S ALOBALEM!',
        desc: 'Alobalový štít odrazí první 4 zásahy!',
        spawns: [
          { type: 'KEBAB_BOSS', count: 1, delay: 3.0 },
          { type: 'CHIPSY', count: 6, delay: 1.1 },
          { type: 'MONSTER', count: 5, delay: 0.7 }
        ]
      },
      // Wave 7
      {
        title: 'Dvojitý kebabový konvoj',
        desc: 'Dva kebaby a pizzeristé v sevřeném šiku.',
        spawns: [
          { type: 'KEBAB_BOSS', count: 2, delay: 4.0 },
          { type: 'PIZZA_TEAM', count: 3, delay: 2.0 },
          { type: 'ROHLIK', count: 8, delay: 0.9 }
        ]
      },
      // Wave 8
      {
        title: 'Křupavá lavina',
        desc: 'Záplava brambůrků! Připravte školníka na úklid drobků.',
        spawns: [
          { type: 'CHIPSY', count: 10, delay: 1.0 },
          { type: 'MONSTER', count: 8, delay: 0.7 }
        ]
      },
      // Wave 9
      {
        title: 'Předzvěst katastrofy',
        desc: 'Masivní nápor hladových studentů ze všech ročníků.',
        spawns: [
          { type: 'KEBAB_BOSS', count: 3, delay: 3.0 },
          { type: 'PIZZA_TEAM', count: 4, delay: 1.8 },
          { type: 'MONSTER', count: 12, delay: 0.6 }
        ]
      },
      // Wave 10
      {
        title: 'Konec vyučování – MATURANT BOSS!',
        banner: '🚨 FINÁLNÍ BOSS: MATURANT S 2L COLOU!',
        desc: 'Pokud pronikne do učebny, zničí 5 životů! Při 50% HP zuří!',
        spawns: [
          { type: 'MATURANT_BOSS', count: 1, delay: 4.0 },
          { type: 'KEBAB_BOSS', count: 2, delay: 2.5 },
          { type: 'PIZZA_TEAM', count: 3, delay: 2.0 },
          { type: 'MONSTER', count: 10, delay: 0.6 }
        ]
      }
    ];
  }

  startNextWave() {
    if (this.currentWave >= this.totalWaves) return false;
    this.currentWave++;
    this.isWaveActive = true;
    this.waitingForBreak = false;
    this.breakTimer = 0;

    const waveConfig = this.wavesConfig[this.currentWave - 1];

    // Build spawn queue
    this.spawnQueue = [];
    for (const group of waveConfig.spawns) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: group.delay
        });
      }
    }

    // Display banner if any
    if (waveConfig.banner) {
      const bannerEl = document.getElementById('waveBanner');
      if (bannerEl) {
        bannerEl.innerText = waveConfig.banner;
        bannerEl.style.display = 'block';
        setTimeout(() => {
          bannerEl.style.display = 'none';
        }, 3500);
      }
    }

    return true;
  }

  triggerEarlyWaveBonus() {
    if (!this.waitingForBreak) return 0;
    const bonus = Math.max(10, Math.floor(this.breakTimer * 2));
    this.startNextWave();
    return bonus;
  }

  update(dt, enemiesList, onSpawnEnemy) {
    // Break timer between waves
    if (this.waitingForBreak) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // Spawning enemies from current queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const item = this.spawnQueue.shift();
        const config = window.ENEMY_TYPES[item.type];
        if (config) {
          const enemy = new window.Enemy(config);
          onSpawnEnemy(enemy);
        }
        this.spawnTimer = item.delay;
      }
    } else {
      // All spawned, check if all defeated or escaped
      const activeEnemies = enemiesList.filter(e => !e.dead && !e.escaped);
      if (activeEnemies.length === 0) {
        // Wave cleared!
        this.isWaveActive = false;
        if (this.currentWave < this.totalWaves) {
          this.waitingForBreak = true;
          this.breakTimer = this.breakDuration;
        }
      }
    }
  }
}

window.WaveManager = WaveManager;
