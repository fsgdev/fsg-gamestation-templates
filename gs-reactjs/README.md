# Game Station - React Template

If you don't know React, start with the [vanilla js](../gs-vanillajs) template instead.

## Installing modules

1. Install [Node.js](https://nodejs.org/en/download).
2. `cd` to the `ui` folder and run `npm i`.

## Developing the game

1. In `ui`, run `npm run dev`.
2. Open http://localhost:3000 to play it in your browser. Outside Game Station the page is the
   player, the keyboard is the controller (arrows or W A S D, Enter) and `fetchNui` returns its mock.
3. To work on it in game, set `Config.DevServer = 'http://localhost:3000'` in `config.lua` and
   `ensure` the resource. A saved change then shows in game at once. Only you see it: `localhost` is
   each player's own PC.

## Building the game

1. In `ui`, run `npm run build`. The page goes to `ui/dist`.
2. Set `Config.DevServer = false` in `config.lua`.
3. `ensure` the resource.

## Making it yours

- `config.lua`: the game's id (unique and permanent: purchases are saved under it), name, price, art,
  input and control rows.
- `ui/src/App.jsx`: the player's copy runs the game and shares it; every copy draws the shared game.
- `ui/src/snake.js`: the rules and the board, no framework in them.
- `server.lua` / `client.lua`: best scores through `fetchNui`, checked against Game Station on the
  server, and a message to every screen at the console on a new best.
- `ui/src/lib/gamestation.js`: the Game Station SDK (`gamestation.d.ts` has its types). Keep it as is.

The full documentation is the [Add-on Games docs](https://fsg-scripts.gitbook.io/resources/fsg-scripts/fsg_gamestation/add-on-games).
