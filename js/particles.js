/**
 * Visual effects, floating numbers, speech bubbles, and particles.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.speechBubbles = [];
    this.puddles = []; // Soap puddles left by Janitor
    this.electricArcs = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.speechBubbles = [];
    this.puddles = [];
    this.electricArcs = [];
  }

  // Floating text (damage, money, status)
  addFloatingText(x, y, text, color = '#f87171', size = 14, isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      text: text,
      color: color,
      size: isCrit ? size * 1.4 : size,
      isCrit: isCrit,
      life: 1.0,
      vy: isCrit ? -1.8 : -1.2,
      vx: (Math.random() - 0.5) * 0.8
    });
  }

  // Comic speech bubble
  addSpeechBubble(entity, text, duration = 2.2) {
    // Only 1 bubble per entity at a time
    this.speechBubbles = this.speechBubbles.filter(b => b.entity !== entity);
    this.speechBubbles.push({
      entity: entity,
      text: text,
      life: duration,
      maxLife: duration
    });
  }

  // Spark / Crumbs / Toner smoke / Chalk dust particles
  addBurst(x, y, count = 8, color = '#fbbf24', speed = 2, size = 3, type = 'crumb') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random() * 0.8) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: size * (0.6 + Math.random() * 0.8),
        color: color,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        type: type,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Soap puddle on track (slows enemies)
  addPuddle(x, y, radius = 28, duration = 6.0) {
    this.puddles.push({
      x: x,
      y: y,
      radius: radius,
      life: duration,
      maxLife: duration
    });
  }

  // Chain lightning / Wi-Fi shock between points
  addLightning(x1, y1, x2, y2, color = '#38bdf8', duration = 0.25) {
    this.electricArcs.push({
      x1: x1, y1: y1,
      x2: x2, y2: y2,
      color: color,
      life: duration,
      maxLife: duration
    });
  }

  update(dt) {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.life -= p.decay;

      // Slight gravity for crumbs
      if (p.type === 'crumb') {
        p.vy += 0.05;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.life -= dt * 1.2;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Speech bubbles
    for (let i = this.speechBubbles.length - 1; i >= 0; i--) {
      const b = this.speechBubbles[i];
      b.life -= dt;
      if (b.life <= 0 || (b.entity.dead && b.entity.dead === true)) {
        this.speechBubbles.splice(i, 1);
      }
    }

    // Soap puddles
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const pud = this.puddles[i];
      pud.life -= dt;
      if (pud.life <= 0) {
        this.puddles.splice(i, 1);
      }
    }

    // Electric arcs
    for (let i = this.electricArcs.length - 1; i >= 0; i--) {
      const arc = this.electricArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.electricArcs.splice(i, 1);
      }
    }
  }

  drawPuddles(ctx) {
    ctx.save();
    for (const p of this.puddles) {
      const alpha = Math.min(1, p.life / 0.8) * 0.6;
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Suds / Foam bubbles inside puddle
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x - 6, p.y - 4, p.radius * 0.3, 0, Math.PI * 2);
      ctx.arc(p.x + 8, p.y + 5, p.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLightning(ctx) {
    ctx.save();
    for (const arc of this.electricArcs) {
      const alpha = arc.life / arc.maxLife;
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);

      // Jagged line
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const ratio = s / steps;
        const mx = arc.x1 + (arc.x2 - arc.x1) * ratio + (Math.random() * 14 - 7);
        const my = arc.y1 + (arc.y2 - arc.y1) * ratio + (Math.random() * 14 - 7);
        ctx.lineTo(mx, my);
      }
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'crumb') {
        // Little crumb squares/rectangles
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'toner') {
        // Smoke puff
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal circular spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawFloatingText(ctx) {
    ctx.save();
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = `${ft.isCrit ? 'bold ' : '600 '}${ft.size}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  drawSpeechBubbles(ctx) {
    ctx.save();
    for (const b of this.speechBubbles) {
      const e = b.entity;
      const x = e.x;
      const y = e.y - 28;

      ctx.font = "bold 11px 'Segoe UI', sans-serif";
      const metrics = ctx.measureText(b.text);
      const padding = 6;
      const w = metrics.width + padding * 2;
      const h = 20;
      const bx = x - w / 2;
      const by = y - h;

      // Bubble background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(bx, by, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(x - 4, by + h);
      ctx.lineTo(x, by + h + 5);
      ctx.lineTo(x + 4, by + h);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, x, by + h / 2);
    }
    ctx.restore();
  }

  draw(ctx) {
    this.drawPuddles(ctx);
    this.drawLightning(ctx);
    this.drawParticles(ctx);
    this.drawFloatingText(ctx);
    this.drawSpeechBubbles(ctx);
  }
}

window.ParticleSystem = new ParticleSystem();
