class GameOfLife extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.lastTick = 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  connectedCallback() {
    this.cellSize = parseInt(this.getAttribute('cell-size')) || 8;
    this.cellGap = parseInt(this.getAttribute('gap')) || 2;
    this.tickRate = parseInt(this.getAttribute('tick-rate')) || 50;

    this.resizeTimeout = null;
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.handleResize(), 150);
    });

    this.grid = [];
    this.nextGrid = [];

    this.handleResize();
    this.resizeObserver.observe(this);

    this.mouseHandler = (e) => this.handleMouseMove(e);
    window.addEventListener('mousemove', this.mouseHandler);

    requestAnimationFrame((t) => this.loop(t));
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('mousemove', this.mouseHandler);
  }

  handleResize() {
    const newWidth = this.offsetWidth;
    const newHeight = this.offsetHeight;
    if (!newWidth || !newHeight) return;

    const newCols = Math.floor(newWidth / (this.cellSize + this.cellGap));
    const newRows = Math.floor(newHeight / (this.cellSize + this.cellGap));

    if (this.cols === newCols && this.rows === newRows) return;

    const oldGrid = this.grid;
    const oldCols = this.cols;
    const oldRows = this.rows;

    this.width = this.canvas.width = newWidth;
    this.height = this.canvas.height = newHeight;
    this.cols = newCols;
    this.rows = newRows;

    this.grid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));
    this.nextGrid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));

    for (let x = 0; x < this.cols; x++) {
      const prob = (x / this.cols) * 0.15;
      for (let y = 0; y < this.rows; y++) {
        if (oldGrid && x < oldCols && y < oldRows) {
          this.grid[x][y] = oldGrid[x][y];
        } else {
          this.grid[x][y] = Math.random() < prob ? 1 : 0;
        }
      }
    }
    this.draw();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (this.cellSize + this.cellGap));
    const y = Math.floor((e.clientY - rect.top) / (this.cellSize + this.cellGap));

    if (x >= 0 && x < this.cols - 1 && y >= 0 && y < this.rows - 1) {
      this.grid[x][y] = 1;
      this.grid[x+1][y] = 1;
      this.grid[x][y+1] = 1;
      this.grid[x+1][y+1] = 1;
    }
  }

  spawnGlider(startX, startY) {
    const coords = [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
    coords.forEach(([dx, dy]) => {
      // Invert X so it flies Left into the fade!
      const x = (startX - dx + this.cols) % this.cols;
      const y = (startY + dy + this.rows) % this.rows;
      this.grid[x][y] = 1;
    });
  }

  computeNextGen() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let neighbors = 0;

        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const col = (x + i + this.cols) % this.cols;
            const row = (y + j + this.rows) % this.rows;
            if (this.grid[col][row] === 1) neighbors++;
          }
        }

        const state = this.grid[x][y];
        if (state === 0 && neighbors === 3) {
          this.nextGrid[x][y] = 1;
        } else if (state === 1 && (neighbors === 2 || neighbors === 3)) {
          this.nextGrid[x][y] = 1;
        } else {
          this.nextGrid[x][y] = 0;
        }
      }
    }

    [this.grid, this.nextGrid] = [this.nextGrid, this.grid];

    // Glider Injection (Organically prevents stagnation)
    // 2% chance per frame. At 50ms (20fps), that's roughly 1 glider every 2.5 seconds.
    if (Math.random() < 0.02) {
      // Spawn in the rightmost 30% of the screen so it can fly leftward
      const startX = Math.floor(this.cols * 0.7) + Math.floor(Math.random() * (this.cols * 0.3));
      const startY = Math.floor(Math.random() * this.rows);
      this.spawnGlider(startX, startY);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = getComputedStyle(this).getPropertyValue('--game-of-life-color').trim() || 'rgba(255, 255, 255, 0.45)';

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (this.grid[x][y] === 1) {
          this.ctx.fillRect(
            x * (this.cellSize + this.cellGap),
            y * (this.cellSize + this.cellGap),
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }

  loop(timestamp) {
    if (timestamp - this.lastTick > this.tickRate) {
      this.computeNextGen();
      this.draw();
      this.lastTick = timestamp;
    }
    requestAnimationFrame((t) => this.loop(t));
  }
}

customElements.define('game-of-life', GameOfLife);
