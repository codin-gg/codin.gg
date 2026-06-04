class GameOfLife extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.lastTick = 0;

    // Minimal internal styles. Just enough to make the canvas fill the component.
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block; /* Required for the component to accept external dimensions */
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
    this.cellSize = parseInt(this.getAttribute('cell-size')) || 10;
    this.cellGap = parseInt(this.getAttribute('gap')) || 2;
    this.tickRate = parseInt(this.getAttribute('tick-rate')) || 150;

    // Use ResizeObserver instead of window resize for better component encapsulation
    this.resizeObserver = new ResizeObserver(() => this.init());
    this.resizeObserver.observe(this);

    requestAnimationFrame((t) => this.loop(t));
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
  }

  init() {
    // Get actual pixel dimensions of the component
    this.width = this.canvas.width = this.offsetWidth;
    this.height = this.canvas.height = this.offsetHeight;

    this.cols = Math.floor(this.width / (this.cellSize + this.cellGap));
    this.rows = Math.floor(this.height / (this.cellSize + this.cellGap));

    // Using Uint8Array is much faster/memory-efficient for 0/1 states
    this.grid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));
    this.nextGrid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));

    this.seed();
    this.draw();
  }

  seed() {
    for (let x = 0; x < this.cols; x++) {
      const spawnProbability = (x / this.cols) * 0.18;
      for (let y = 0; y < this.rows; y++) {
        this.grid[x][y] = Math.random() < spawnProbability ? 1 : 0;
      }
    }
  }

  sparkOrganicLife() {
    for (let x = 0; x < this.cols; x++) {
      const spawnProbability = (x / this.cols) * 0.005;
      for (let y = 0; y < this.rows; y++) {
        if (Math.random() < spawnProbability) this.grid[x][y] = 1;
      }
    }
  }

  getNeighbors(x, y) {
    let sum = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const col = (x + i + this.cols) % this.cols;
        const row = (y + j + this.rows) % this.rows;
        sum += this.grid[col][row];
      }
    }
    return sum - this.grid[x][y];
  }

  computeNextGen() {
    let activeCells = 0;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const state = this.grid[x][y];
        const neighbors = this.getNeighbors(x, y);

        if (state === 0 && neighbors === 3) {
          this.nextGrid[x][y] = 1;
          activeCells++;
        } else if (state === 1 && (neighbors === 2 || neighbors === 3)) {
          this.nextGrid[x][y] = 1;
          activeCells++;
        } else {
          this.nextGrid[x][y] = 0;
        }
      }
    }

    [this.grid, this.nextGrid] = [this.nextGrid, this.grid];

    if (activeCells < (this.cols * this.rows) * 0.015) {
      this.sparkOrganicLife();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Read color from CSS variables (defaults to white with opacity)
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
