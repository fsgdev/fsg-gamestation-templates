<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GameStation from './lib/gamestation.js'
import { useGameStation } from './useGameStation'
import { drawBoard, isDir, newGame, start, step, turn, TICK_MS } from './snake'

const { context, shared: game } = useGameStation()
const canvas = ref(null)
const notice = ref(null)
const isPlayer = computed(() => context.value?.role === 'player')

// The player's copy runs the game: buttons in, a tick, and a share after every change. Every other
// copy (the TV, people watching) only draws what was shared.
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
    GameStation.fetchNui('gameOver', { score: next.score }, { best: next.best })
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
}

watch(isPlayer, (player) => {
  if (stopPlaying) stopPlaying()
  stopPlaying = player ? play() : null
}, { immediate: true })

// Every copy: the server's word that someone at this console set a new best.
let hide = 0
const offMessage = GameStation.on('message', (msg) => {
  if (msg?.type !== 'record') return
  notice.value = `${msg.name} set a new best: ${msg.score}`
  window.clearTimeout(hide)
  hide = window.setTimeout(() => { notice.value = null }, 4000)
})

// Draw the board from the shared game. The player's copy is hidden while they watch the TV: skip it.
const visible = computed(() => context.value?.visible !== false)
const accent = computed(() => context.value?.accent ?? '#4F7DF3')
function draw() {
  if (canvas.value && visible.value) drawBoard(canvas.value, game.value, accent.value)
}
let resize = null
onMounted(() => {
  resize = new ResizeObserver(draw)
  resize.observe(canvas.value)
  draw()
})
watch([game, visible, accent], draw)

onUnmounted(() => {
  if (stopPlaying) stopPlaying()
  offMessage()
  window.clearTimeout(hide)
  if (resize) resize.disconnect()
})

const banner = computed(() => {
  const g = game.value
  if (!g) return { title: 'Snake', line: 'Waiting for the player' }
  if (g.phase === 'ready') return { title: 'Snake', line: 'Press Enter to start' }
  if (g.phase === 'over') return { title: 'Game over', line: `Score ${g.score}. Press Enter to play again` }
  return null
})
</script>

<template>
  <main class="screen">
    <canvas ref="canvas" class="board" />
    <header class="hud">
      <span>Score {{ game?.score ?? 0 }}</span>
      <span class="dim">Best {{ game?.best ?? 0 }}</span>
    </header>
    <div v-if="banner" class="banner">
      <h1>{{ banner.title }}</h1>
      <p v-if="banner.line">{{ banner.line }}</p>
    </div>
    <div v-if="notice" class="notice">{{ notice }}</div>
  </main>
</template>
