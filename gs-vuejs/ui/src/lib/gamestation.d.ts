// Types for gamestation.js (Game Station add-on SDK, protocol 1). Keep both files side by side.

export type GameStationButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'x' | 'y'

export interface GameStationContext {
  /** Your game's id (RegisterGame's id). */
  gameId: string
  /** The console the game is on; null in a browser. */
  consoleId: string | null
  /** Your resource's name (where fetchNui goes); null in a browser. */
  resource: string | null
  /** 'player': runs the game. 'screen': the TV or a watcher, draws GameStation.shared. */
  role: 'player' | 'screen'
  /** This copy is on screen. The player's copy is hidden while they look at the TV. */
  visible: boolean
  /** How the game is played, from RegisterGame. */
  input: 'controller' | 'keyboard'
  /** The player is in fullscreen (their own screen), rather than looking at the TV. */
  fullscreen: boolean
  /** The player holds the controller (not put down, not walking around in free move). */
  controller: boolean
  /** Game Station's menu is open over the game. */
  paused: boolean
  /** Who plays: on the player's screen their server id and name, on a watcher's the host's name. */
  player: { id?: number; name?: string } | null
  /** The player's Game Station accent colour, '#RRGGBB'. */
  accent: string
  /** 0..1, how loud this copy should play. */
  volume: number
  /** Not in FiveM (a browser, or Game Station's dev preview). */
  dev: boolean
}

export interface GameStationEvents {
  context: GameStationContext
  input: { button: GameStationButton; pressed: boolean }
  stick: { x: number; y: number }
  share: unknown
  message: unknown
  pause: void
  resume: void
  volume: number
}

export interface GameStationApi {
  readonly context: GameStationContext | null
  readonly ready: Promise<GameStationContext>
  readonly isPlayer: boolean
  readonly shared: unknown
  readonly volume: number
  readonly paused: boolean
  readonly stick: { x: number; y: number }
  isDown(button: GameStationButton): boolean
  on<K extends keyof GameStationEvents>(type: K, fn: (value: GameStationEvents[K]) => void): () => void
  off<K extends keyof GameStationEvents>(type: K, fn: (value: GameStationEvents[K]) => void): void
  share(state: unknown): void
  fetchNui<T = unknown>(name: string, data?: unknown, mock?: T): Promise<T>
  exit(): void
}

declare const GameStation: GameStationApi
export default GameStation
