# Game Station - Vanilla JS Template

Plain HTML and JavaScript: no build step, nothing to install. Ensure the resource and Snake is in the
Game Station store.

## Developing the game

You can open the page in your browser while you work on it: serve the `ui` folder with any static
server, for example `python -m http.server 3000 --directory ui`, or the
[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for
VS Code. Outside Game Station the page is the player, the keyboard is the controller (arrows or
W A S D, Enter) and `fetchNui` returns its mock.

To work on it in game, serve `ui` on port 3000, set `Config.DevServer = 'http://localhost:3000'` in
`config.lua` and `ensure` the resource. A saved change then shows in game when the game reopens. Only
you see it: `localhost` is each player's own PC. Set it back to `false` when you are done.

## Making it yours

- `config.lua`: the game's id (unique and permanent: purchases are saved under it), name, price, art,
  input and control rows.
- `ui/main.js`: the player's copy runs the game and shares it; every copy draws the shared game.
- `ui/snake.js`: the rules and the board.
- `server.lua` / `client.lua`: best scores through `fetchNui`, checked against Game Station on the
  server, and a message to every screen at the console on a new best.
- `ui/gamestation.js`: the Game Station SDK (`gamestation.d.ts` has its types). Keep it as is.

The full documentation is the [Add-on Games docs](https://fsg-scripts.gitbook.io/resources/fsg-scripts/fsg_gamestation/add-on-games).
