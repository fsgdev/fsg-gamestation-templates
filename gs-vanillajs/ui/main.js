import GameStation from './gamestation.js'
import { drawBoard, isDir, newGame, start, step, turn, TICK_MS } from './snake.js'

const canvas = document.getElementById('board')
const score = document.getElementById('score')
const best = document.getElementById('best')
const banner = document.getElementById('banner')
const bannerTitle = document.getElementById('banner-title')
const bannerLine = document.getElementById('banner-line')
const notice = document.getElementById('notice')

// ─── Drawing: every copy draws the shared game (the player's own share() included) ───
function render() {
  const ctx = GameStation.context
  const game = GameStation.shared
  // The player's copy is hidden while they watch the TV: nothing to draw.
  if (ctx && !ctx.visible) return
  drawBoard(canvas, game, (ctx && ctx.accent) || '#4F7DF3')
  score.textContent = `Score ${game ? game.score : 0}`
  best.textContent = `Best ${game ? game.best : 0}`

  let title = null
  let line = ''
  if (!game) { title = 'Snake'; line = 'Waiting for the player' }
  else if (game.phase === 'ready') { title = 'Snake'; line = 'Press Enter to start' }
  else if (game.phase === 'over') { title = 'Game over'; line = `Score ${game.score}. Press Enter to play again` }
  banner.hidden = !title
  bannerTitle.textContent = title || ''
  bannerLine.textContent = line
  bannerLine.hidden = !line
}

GameStation.on('share', render)
GameStation.on('context', render)
new ResizeObserver(render).observe(canvas)

// ─── Playing: only the player's copy runs the game ───────────────────────────
let stopPlaying = null

function play() {
  let current = newGame()
  let alive = true // replies that land after this copy stopped playing are dropped
  const update = (next) => {
    if (!alive) return
    current = next
    GameStation.share(current)
  }
  update(current)

  GameStation.fetchNui('getBest', {}, { best: 0 })
    .then((res) => update({ ...current, best: Math.max(current.best, (res && res.best) || 0) }))
    .catch(() => undefined)

  const offInput = GameStation.on('input', ({ button, pressed }) => {
    if (!pressed) return
    if (button === 'a' || button === 'x') {
      if (current.phase !== 'playing') update(start(current))
    } else if (isDir(button)) {
      update(turn(current, button))
    }
  })

  const timer = setInterval(() => {
    if (GameStation.paused || current.phase !== 'playing') return
    const { game: next, died } = step(current)
    update(next)
    if (!died) return
    GameStation.fetchNui('gameOver', { score: next.score }, { best: next.best })
      .then((res) => { if (res && typeof res.best === 'number') update({ ...current, best: res.best }) })
      .catch(() => undefined)
  }, TICK_MS)

  return () => {
    alive = false
    offInput()
    clearInterval(timer)
  }
}

// The role can arrive late (or change), so follow the context.
function followRole() {
  if (GameStation.isPlayer && !stopPlaying) stopPlaying = play()
  else if (!GameStation.isPlayer && stopPlaying) { stopPlaying(); stopPlaying = null }
}
GameStation.on('context', followRole)
followRole()
render()

// ─── Every copy: the server's word that someone at this console set a new best ───
let hide = 0
GameStation.on('message', (msg) => {
  if (!msg || msg.type !== 'record') return
  notice.textContent = `${msg.name} set a new best: ${msg.score}`
  notice.hidden = false
  clearTimeout(hide)
  hide = setTimeout(() => { notice.hidden = true }, 4000)
})
