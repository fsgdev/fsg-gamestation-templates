import { useEffect, useRef, useState } from 'react'
import GameStation from './lib/gamestation.js'
import { useGameStation } from './useGameStation'
import { drawBoard, isDir, newGame, start, step, turn, TICK_MS, type Snake } from './snake'

type BestMessage = { type: 'record'; name: string; score: number }
const isRecord = (msg: unknown): msg is BestMessage => (msg as BestMessage | null)?.type === 'record'

export default function App() {
  const { context, shared: game } = useGameStation<Snake>()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const isPlayer = context?.role === 'player'

  // The player's copy runs the game: buttons in, a tick, and a share after every change. Every other
  // copy (the TV, people watching) only draws what was shared.
  useEffect(() => {
    if (!isPlayer) return
    let current = newGame()
    let alive = true // replies that land after this copy stopped playing are dropped
    const update = (next: Snake) => {
      if (!alive) return
      current = next
      GameStation.share(current)
    }
    update(current)

    GameStation.fetchNui<{ best?: number }>('getBest', {}, { best: 0 })
      .then((res) => update({ ...current, best: Math.max(current.best, res?.best ?? 0) }))
      .catch(() => undefined)

    const offInput = GameStation.on('input', ({ button, pressed }) => {
      if (!pressed) return
      if (button === 'a' || button === 'x') {
        if (current.phase !== 'playing') update(start(current))
      } else if (isDir(button)) {
        update(turn(current, button))
      }
    })

    const timer = window.setInterval(() => {
      if (GameStation.paused || current.phase !== 'playing') return
      const { game: next, died } = step(current)
      update(next)
      if (!died) return
      GameStation.fetchNui<{ best?: number }>('gameOver', { score: next.score }, { best: next.best })
        .then((res) => {
          if (typeof res?.best === 'number') update({ ...current, best: res.best })
        })
        .catch(() => undefined)
    }, TICK_MS)

    return () => {
      alive = false
      offInput()
      window.clearInterval(timer)
    }
  }, [isPlayer])

  // Every copy: the server's word that someone at this console set a new best.
  useEffect(() => {
    let hide = 0
    const off = GameStation.on('message', (msg) => {
      if (!isRecord(msg)) return
      setNotice(`${msg.name} set a new best: ${msg.score}`)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setNotice(null), 4000)
    })
    return () => {
      off()
      window.clearTimeout(hide)
    }
  }, [])

  // Draw the board from the shared game. The player's copy is hidden while they watch the TV: skip it.
  const visible = context?.visible !== false
  const accent = context?.accent ?? '#4F7DF3'
  useEffect(() => {
    const el = canvas.current
    if (!el || !visible) return
    const draw = () => drawBoard(el, game, accent)
    draw()
    const resize = new ResizeObserver(draw)
    resize.observe(el)
    return () => resize.disconnect()
  }, [game, visible, accent])

  let banner: { title: string; line: string } | null = null
  if (!game) banner = { title: 'Snake', line: 'Waiting for the player' }
  else if (game.phase === 'ready') banner = { title: 'Snake', line: 'Press Enter to start' }
  else if (game.phase === 'over') banner = { title: 'Game over', line: `Score ${game.score}. Press Enter to play again` }

  return (
    <main className="screen">
      <canvas ref={canvas} className="board" />
      <header className="hud">
        <span>Score {game?.score ?? 0}</span>
        <span className="dim">Best {game?.best ?? 0}</span>
      </header>
      {banner && (
        <div className="banner">
          <h1>{banner.title}</h1>
          {banner.line && <p>{banner.line}</p>}
        </div>
      )}
      {notice && <div className="notice">{notice}</div>}
    </main>
  )
}
