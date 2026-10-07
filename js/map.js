/**
 * Game Map, Waypoints, Grid, and Corridor Rendering
 */
class GameMap {
  constructor() {
    this.tileSize = 60;
    this.cols = 15;
    this.rows = 9;
    this.width = this.cols * this.tileSize;   // 900
    this.height = this.rows * this.tileSize; // 540

    // Grid layout:
    // 0 = Linoleum floor (buildable)
    // 1 = Hallway path (walkable by students, non-buildable)
    // 2 = Lockers (obstacle, non-buildable)
    // 3 = Wall / Chalkboard / Plants
    // 4 = IT Lab Door (Goal)
    // 5 = Entrance (Start)
    this.grid = [
      [2, 2, 2, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 3, 3],
      [2, 2, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 2, 2, 2],
      [5, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 2],
      [0, 0, 0, 1, 0, 3, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0, 0],
      [0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 1, 1, 4],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 2, 2, 2],
      [2, 2, 2, 3, 0, 0, 2, 2, 0, 0, 0, 2, 2, 2, 2]
    ];

    // Exact pixel waypoints through tile centers
    this.waypoints = [
      { x: -30, y: 2.5 * this.tileSize },                // Start offscreen left
      { x: 3.5 * this.tileSize, y: 2.5 * this.tileSize }, // Col 3.5, Row 2.5
      { x: 3.5 * this.tileSize, y: 6.5 * this.tileSize }, // Col 3.5, Row 6.5
      { x: 7.5 * this.tileSize, y: 6.5 * this.tileSize }, // Col 7.5, Row 6.5
      { x: 7.5 * this.tileSize, y: 2.5 * this.tileSize }, // Col 7.5, Row 2.5
      { x: 11.5 * this.tileSize, y: 2.5 * this.tileSize },// Col 11.5, Row 2.5
      { x: 11.5 * this.tileSize, y: 5.5 * this.tileSize },// Col 11.5, Row 5.5
      { x: 14.5 * this.tileSize + 30, y: 5.5 * this.tileSize } // Offscreen right into lab
    ];
  }

  isBuildable(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.grid[row][col] === 0;
  }

  getTileCoords(x, y) {
    return {
      col: Math.floor(x / this.tileSize),
      row: Math.floor(y / this.tileSize)
    };
  }

  getTileCenter(col, row) {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2
    };
  }

  draw(ctx, hoverTile = null, selectedTowerType = null, canAfford = true, isOccupied = false) {
    // 1. Draw base floor tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.tileSize;
        const y = r * this.tileSize;
        const type = this.grid[r][c];

        if (type === 1 || type === 5 || type === 4) {
          // Corridor / Path
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);

          // Floor joint lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, this.tileSize, this.tileSize);

          // Path direction chevrons / subtle arrows
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 0) {
          // Linoleum classroom hallway (Checkered tiles)
          const isAlt = (r + c) % 2 === 0;
          ctx.fillStyle = isAlt ? '#1e2538' : '#222b40';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);

          ctx.strokeStyle = '#171d2c';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        } else if (type === 2) {
          // Metal lockers
          ctx.fillStyle = '#1e2538';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);

          // Draw school locker
          this.drawLocker(ctx, x, y, (r * this.cols + c));
        } else if (type === 3) {
          // Decor: Chalkboard or potted school plant
          ctx.fillStyle = '#1e2538';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          this.drawDecoration(ctx, x, y, (r + c) % 2);
        }
      }
    }

    // 2. Yellow warning caution stripe along hallway borders
    this.drawPathBorders(ctx);

    // 3. Entrance & Exit Door
    this.drawEntranceAndExit(ctx);

    // 4. Highlight hovered tile if placing tower
    if (hoverTile && selectedTowerType) {
      const hx = hoverTile.col * this.tileSize;
      const hy = hoverTile.row * this.tileSize;
      const valid = this.isBuildable(hoverTile.col, hoverTile.row) && canAfford && !isOccupied;

      ctx.save();
      ctx.fillStyle = valid ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = valid ? '#4ade80' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.fillRect(hx, hy, this.tileSize, this.tileSize);
      ctx.strokeRect(hx, hy, this.tileSize, this.tileSize);

      // Range indicator circle preview
      if (valid && selectedTowerType.range) {
        ctx.beginPath();
        ctx.arc(hx + this.tileSize / 2, hy + this.tileSize / 2, selectedTowerType.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawLocker(ctx, x, y, seed) {
    ctx.save();
    // Locker locker body
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

    // Locker vents
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 12, y + 12, 18, 3);
    ctx.fillRect(x + 12, y + 18, 18, 3);

    // Handle and locker number
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 38, y + 26, 4, 10);

    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`${100 + (seed % 50)}`, x + 24, y + 36);
    ctx.restore();
  }

  drawDecoration(ctx, x, y, variant) {
    ctx.save();
    if (variant === 0) {
      // School chalkboard with funny note
      ctx.fillStyle = '#14532d'; // Dark green blackboard
      ctx.fillRect(x + 5, y + 8, this.tileSize - 10, this.tileSize - 16);
      ctx.strokeStyle = '#78350f'; // Wood border
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 8, this.tileSize - 10, this.tileSize - 16);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ZÁKAZ JÍDLA!', x + this.tileSize / 2, y + 24);
      ctx.fillText('V IT LABU', x + this.tileSize / 2, y + 35);
    } else {
      // Potted School Plant (Fikus)
      ctx.fillStyle = '#78350f'; // Pot
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 48);
      ctx.lineTo(x + 40, y + 48);
      ctx.lineTo(x + 36, y + 30);
      ctx.lineTo(x + 24, y + 30);
      ctx.closePath();
      ctx.fill();

      // Leaves
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + 30, y + 24, 12, 0, Math.PI * 2);
      ctx.arc(x + 22, y + 20, 9, 0, Math.PI * 2);
      ctx.arc(x + 38, y + 20, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPathBorders(ctx) {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);

    // Border lines along track
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[i + 1];

      // Draw faint centerline
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEntranceAndExit(ctx) {
    ctx.save();
    // Entrance (Left edge, row 2)
    const entY = 2 * this.tileSize;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, entY, 14, this.tileSize);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(7, entY + this.tileSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ŠATNY', 0, 3);
    ctx.restore();

    // Exit: Door to Computer Science Lab (Right edge, row 5)
    const exitX = 14 * this.tileSize;
    const exitY = 5 * this.tileSize;

    // Glowing lab door frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(exitX + 20, exitY + 4, 38, this.tileSize - 8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(exitX + 20, exitY + 4, 38, this.tileSize - 8);

    // Glowing window showing computer inside
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(exitX + 26, exitY + 12, 26, 22);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🖥️', exitX + 39, exitY + 28);

    // "LAB 101" Sign
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('IT LAB 101', exitX + 39, exitY + 46);
    ctx.restore();
  }
}

window.GameMap = new GameMap();
