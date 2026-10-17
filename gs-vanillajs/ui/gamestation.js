/**
 * Game Station add-on SDK (page side), protocol 1.
 * Copy this file and gamestation.d.ts into your game's page, then:
 *
 *   import GameStation from './gamestation.js'
 *
 * Your page is shown inside Game Station on two kinds of surface, and `GameStation.context.role`
 * says which one this copy is:
 *   'player'  the player's own screen. It gets the controller, runs the game, can call your
 *             resource's NUI callbacks (fetchNui) and shares its state (share).
 *   'screen'  the TV, and anyone watching a shared screen. It only draws: the player's latest
 *             shared state is GameStation.shared (and the 'share' event).
 * share() also fires the player's own 'share' listeners, so every copy can draw from one place.
 * Opened straight in a browser (your dev server), the page is a player with the keyboard as the
 * controller, and fetchNui returns its `mock` argument.
 *
 * Full guide: sdk/README.md in fsg_gamestation.
 */

const PROTOCOL = 1
const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y']
// The keyboard as the controller, for keyboard add-ons and the browser.
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Enter: 'a', NumpadEnter: 'a', Backspace: 'b', Space: 'x', Tab: 'y',
}
const SHARE_MS = 33 // shares leave at most ~30 times a second; the newest state wins
const MAX_SHARE = 16384 // Game Station's default Config.AddonGames.maxShareBytes
const EARLY_MAX = 32 // messages kept for a page that has not started listening yet

const embedded = window.parent !== window
const listeners = new Map()
const down = new Set()
const early = [] // 'message' values that arrived before any listener

let context = embedded ? null : {
  gameId: 'dev', consoleId: null, resource: null, role: 'player', visible: true, input: 'keyboard',
  fullscreen: true, controller: true, paused: false, player: { id: 1, name: 'Developer' },
  accent: '#4F7DF3', volume: 1, dev: true,
}
let shared = null
let stick = { x: 0, y: 0 }
let volume = context ? context.volume : 1
let paused = false
let pendingShare
let hasPending = false
let shareTimer = 0
let shareAt = 0
let warned = false

let resolveReady
const ready = new Promise((resolve) => { resolveReady = resolve })
if (context) resolveReady(context)

function emit(type, value) {
  const set = listeners.get(type)
  if (!set || set.size === 0) {
    if (type === 'message' && early.length < EARLY_MAX) early.push(value)
    return
  }
  for (const fn of [...set]) {
    try { fn(value) } catch (err) { console.error('[GameStation]', err) }
  }
}

function post(msg) {
  if (embedded) window.parent.postMessage({ gamestation: PROTOCOL, ...msg }, '*')
}

function setButton(button, pressed) {
  if (!BUTTONS.includes(button) || pressed === down.has(button)) return
  if (pressed) down.add(button)
  else down.delete(button)
  emit('input', { button, pressed })
}

function setStick(x, y) {
  if (x === stick.x && y === stick.y) return
  stick = { x, y }
  emit('stick', stick)
}

function releaseAll() {
  for (const button of [...down]) setButton(button, false)
  setStick(0, 0)
}

// ─── From Game Station ───────────────────────────────────────────────────────
window.addEventListener('message', (e) => {
  if (!embedded || e.source !== window.parent) return
  const m = e.data
  if (!m || m.gamestation !== PROTOCOL) return
  switch (m.type) {
    case 'hello':
      post({ type: 'ready' })
      break
    case 'context': {
      const first = !context
      context = m.context
      if (context.role !== 'player') releaseAll()
      if (context.volume !== volume) {
        volume = context.volume
        emit('volume', volume)
      }
      if (first) resolveReady(context)
      emit('context', context)
      break
    }
    case 'input':
      setButton(m.button, !!m.pressed)
      break
    case 'stick':
      setStick(Number(m.x) || 0, Number(m.y) || 0)
      break
    case 'share': {
      let state
      try { state = JSON.parse(m.json) } catch { return }
      shared = state
      emit('share', state)
      break
    }
    case 'message':
      emit('message', m.data)
      break
    case 'pause':
      releaseAll()
      paused = true
      emit('pause')
      break
    case 'resume':
      paused = false
      emit('resume')
      break
    case 'volume':
      volume = Number(m.volume) || 0
      emit('volume', volume)
      break
  }
})

// ─── The keyboard as the controller ──────────────────────────────────────────
function keyboardDrives() {
  if (!embedded) return true
  return !!context && context.role === 'player' && (context.input === 'keyboard' || context.dev)
}

function keyStick() {
  const x = (down.has('right') ? 1 : 0) - (down.has('left') ? 1 : 0)
  const y = (down.has('down') ? 1 : 0) - (down.has('up') ? 1 : 0)
  setStick(x, y)
}

function onKey(e) {
  const el = e.target
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  const pressed = e.type === 'keydown'
  // A keyboard add-on has no Game Station menu over it: Esc quits, like the store's web games.
  if (e.code === 'Escape' && pressed && embedded && context && context.role === 'player' && context.input === 'keyboard') {
    e.preventDefault()
    post({ type: 'exit' })
    return
  }
  if (!keyboardDrives()) return
  const button = KEYS[e.code]
  if (!button) return
  e.preventDefault()
  setButton(button, pressed)
  if (button === 'up' || button === 'down' || button === 'left' || button === 'right') keyStick()
}

window.addEventListener('keydown', onKey)
window.addEventListener('keyup', onKey)
window.addEventListener('blur', () => { if (keyboardDrives()) releaseAll() })

// ─── To Game Station ─────────────────────────────────────────────────────────
function flushShare() {
  shareTimer = 0
  if (!hasPending) return
  const state = pendingShare
  hasPending = false
  pendingShare = undefined
  shareAt = performance.now()
  const json = JSON.stringify(state)
  if (json.length > MAX_SHARE) {
    if (!warned) {
      warned = true
      console.warn(`[GameStation] share() state is ${json.length} bytes, over ${MAX_SHARE}: not sent. Share less.`)
    }
    return
  }
  post({ type: 'share', json })
}

// Say hello once the modules that import this have run, so their listeners are in place.
if (embedded) setTimeout(() => post({ type: 'ready' }), 0)

const GameStation = {
  /** Who this copy of the page is and where it runs; null until Game Station says (see ready). */
  get context() { return context },
  /** Resolves with the first context. */
  ready,
  /** True on the player's own screen: run the game here. */
  get isPlayer() { return !!context && context.role === 'player' },
  /** The player's latest shared state (on the player's screen: its own latest). */
  get shared() { return shared },
  /** 0..1, how loud this copy should play. The player's own TV is 0 (their screen plays the sound). */
  get volume() { return volume },
  /** Game Station's menu is open over the game (Esc / P / Start). */
  get paused() { return paused },
  /** Left stick, W A S D, arrows or d-pad as { x, y } in -1..1 (y down). */
  get stick() { return stick },

  /** Is a button held? 'up' 'down' 'left' 'right' 'a' 'b' 'x' 'y' */
  isDown(button) { return down.has(button) },

  /**
   * Listen to 'context' | 'input' | 'stick' | 'share' | 'message' | 'pause' | 'resume' | 'volume'.
   * Returns a function that stops listening.
   */
  on(type, fn) {
    let set = listeners.get(type)
    if (!set) listeners.set(type, (set = new Set()))
    set.add(fn)
    // Messages that came before anyone listened go to the first listener.
    if (type === 'message' && early.length) {
      const kept = early.splice(0)
      setTimeout(() => { for (const value of kept) emit('message', value) }, 0)
    }
    return () => set.delete(fn)
  },
  off(type, fn) {
    const set = listeners.get(type)
    if (set) set.delete(fn)
  },

  /**
   * Player only: the state the TV and watchers draw. Call it whenever the game changes (every tick
   * is fine); it is sent at most ~30 times a second and must stay under 16 KB as JSON. Your own
   * 'share' listeners fire at once with the same value.
   */
  share(state) {
    if (!context || context.role !== 'player') return
    shared = state
    emit('share', state)
    pendingShare = state
    hasPending = true
    if (!embedded || shareTimer) return
    const wait = SHARE_MS - (performance.now() - shareAt)
    if (wait <= 0) flushShare()
    else shareTimer = setTimeout(flushShare, wait)
  },

  /**
   * Player only: POST to your resource's RegisterNUICallback(name) and resolve with its cb() value.
   * In a browser (or Game Station's dev preview) it resolves with `mock` instead.
   */
  async fetchNui(name, data, mock) {
    if (!embedded || (context && context.dev)) return mock
    if (!context || context.role !== 'player') {
      throw new Error('GameStation.fetchNui only works on the player screen (check GameStation.isPlayer)')
    }
    const resource = context.resource || (typeof window.GetParentResourceName === 'function' ? window.GetParentResourceName() : '')
    const res = await fetch(`https://${resource}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data === undefined ? {} : data),
    })
    const text = await res.text()
    return text ? JSON.parse(text) : null
  },

  /** Player only: close the game and go back to Game Station's Home. */
  exit() {
    if (context && context.role === 'player') post({ type: 'exit' })
  },
}

export default GameStation
