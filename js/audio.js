/**
 * Web Audio API Procedural Sound Engine
 * Zero external audio files required!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.initOnFirstInteraction = this.initOnFirstInteraction.bind(this);
    
    // Auto-init on first click/key
    window.addEventListener('click', this.initOnFirstInteraction, { once: true });
    window.addEventListener('keydown', this.initOnFirstInteraction, { once: true });
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initOnFirstInteraction() {
    this.init();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.bgmPlaying) {
      this.stopBgm();
    }
    return this.muted;
  }

  // Helper for quick synthesis
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1, decay = true) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted
    }
  }

  // Učitel střílí poznámku (papírový svištivý zvuk)
  playPaperFlick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch(e) {}
  }

  // Školník – cákanec vody / louže
  playSplash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch(e) {}
  }

  // Wi-Fi pulz / Stun blesk
  playWifiZap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.04);
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch(e) {}
  }

  // Zaseknutá tiskárna – mechanický hluk & toner
  playPrinterChug() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch(e) {}
  }

  // Zásah studenta
  playHit() {
    this.playTone(200, 'sine', 0.04, 0.04);
  }

  // Křupnutí brambůrků
  playChipsCrunch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.03);
      osc.frequency.setValueAtTime(300, this.ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch(e) {}
  }

  // Zabití / Zabavení svačiny (Cinknutí Kázně)
  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.28);
  }

  // Školní rozhlas: ikonický bim-bam gong!
  playSchoolChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Tón 1: F5
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(698.46, now);
    g1.gain.setValueAtTime(0.18, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(g1);
    g1.connect(this.ctx.destination);
    osc1.start();
    osc1.stop(now + 0.8);

    // Tón 2: C5
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(523.25, now + 0.4);
    g2.gain.setValueAtTime(0.2, now + 0.4);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(g2);
    g2.connect(this.ctx.destination);
    osc2.start(now + 0.4);
    osc2.stop(now + 1.4);
  }

  // Káva boost – rychlý power-up arpeggio
  playCoffeeSip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554, 659, 880];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.08, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + (i + 1) * 0.06 + 0.1);
    });
  }

  // Hadřík – vrzavé utření mastnoty
  playSpongeClean() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
  }

  // Student prošel do učebny (Znečištění klávesnic / Alarm!)
  playLeakAlarm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.28);
  }

  // Upgrade věže
  playUpgrade() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.08, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.2);
    });
  }

  // Vítězství
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const melody = [523, 659, 783, 1046, 783, 1046];
    const now = this.ctx.currentTime;
    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.12, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.25);
    });
  }

  // Game Over
  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 415, 392, 349];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.2);
      gain.gain.setValueAtTime(0.12, now + idx * 0.2);
      gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.2 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.2);
      osc.stop(now + idx * 0.2 + 0.35);
    });
  }
}

window.SoundEngine = new SoundEngine();
