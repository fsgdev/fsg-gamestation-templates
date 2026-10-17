// Snake: the rules and the board, with no framework in them. Every function returns a new game
// rather than changing the one it was given, so each share is a fresh value.

export const COLS = 32
export const ROWS = 18
export const TICK_MS = 110

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Cell = [number, number]
export type Snake = {
  phase: 'ready' | 'playing' | 'over'
  snake: Cell[]
  dir: Dir
  next: Dir
  food: Cell
  score: number
  best: number
}

const STEP: Record<Dir, Cell> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

export const isDir = (button: string): button is Dir => button in STEP

export function newGame(best = 0): Snake {
  return { phase: 'ready', snake: [[9, 9], [8, 9], [7, 9]], dir: 'right', next: 'right', food: [22, 9], score: 0, best }
}

export function start(game: Snake): Snake {
  return { ...newGame(game.best), phase: 'playing' }
}

export function turn(game: Snake, dir: Dir): Snake {
  if (game.phase !== 'playing' || dir === OPPOSITE[game.dir]) return game
  return { ...game, next: dir }
}

function freeCell(snake: Cell[]): Cell {
  const taken = new Set(snake.map(([x, y]) => `${x},${y}`))
  for (;;) {
    const cell: Cell = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)]
    if (!taken.has(`${cell[0]},${cell[1]}`)) return cell
  }
}

export function step(game: Snake): { game: Snake; died: boolean } {
  if (game.phase !== 'playing') return { game, died: false }
  const dir = game.next
  const [hx, hy] = game.snake[0]
  const head: Cell = [hx + STEP[dir][0], hy + STEP[dir][1]]
  const ate = head[0] === game.food[0] && head[1] === game.food[1]
  const body = ate ? game.snake : game.snake.slice(0, -1)
  const crashed = head[0] < 0 || head[1] < 0 || head[0] >= COLS || head[1] >= ROWS
    || body.some(([x, y]) => x === head[0] && y === head[1])
  if (crashed) return { game: { ...game, dir, phase: 'over', best: Math.max(game.best, game.score) }, died: true }
  const snake = [head, ...body]
  return {
    game: { ...game, dir, snake, food: ate ? freeCell(snake) : game.food, score: game.score + (ate ? 1 : 0) },
    died: false,
  }
}

// The board fills the canvas below a 12% band for the score (index.css lays the HUD over that band).
export function drawBoard(canvas: HTMLCanvasElement, game: Snake | null, accent: string) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  const top = h * 0.12
  const cell = Math.max(1, Math.floor(Math.min((w * 0.92) / COLS, (h * 0.83) / ROWS)))
  const ox = Math.floor((w - cell * COLS) / 2)
  const oy = Math.floor(top + (h * 0.83 - cell * ROWS) / 2)
  ctx.fillStyle = '#0c0c0c'
  ctx.fillRect(ox, oy, cell * COLS, cell * ROWS)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(ox - 0.5, oy - 0.5, cell * COLS + 1, cell * ROWS + 1)
  if (!game) return

  ctx.fillStyle = accent
  ctx.fillRect(ox + game.food[0] * cell + 2, oy + game.food[1] * cell + 2, cell - 4, cell - 4)
  game.snake.forEach(([x, y], i) => {
    ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
    ctx.fillRect(ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2)
  })
}
