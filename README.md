# Game Station - Game Templates

Templates for [Game Station](https://portal.cfx.re/) add-on games. Each folder is a complete resource
with the same small game (Snake) that uses every part of the add-on API: registering in the store, the
controller, sharing the game to the TV and to people watching, calling your own Lua, and messages from
the server to every screen at a console.

## Templates

-   [vanilla js](./gs-vanillajs) - plain HTML and JavaScript, no build step
-   [react js](./gs-reactjs) - React template
-   [react typescript](./gs-reactts) - React template with TypeScript
-   [vue js](./gs-vuejs) - Vue 3 template

## Getting started

1. Copy a template folder into your server's `resources` and rename it.
2. In its `config.lua`, give the game its own `id` (unique and permanent: purchases are saved under
   it), name, price and art.
3. For React or Vue: in `ui`, run `npm i` and `npm run build`.
4. `ensure` it after `fsg_gamestation`. The game is in the Game Station store.

Each template's README covers working on the page in a browser and live in game.

## Documentation

The full guide (how a game runs, the controls, every export and the page SDK) is the
[Add-on Games docs](https://fsg-scripts.gitbook.io/resources/fsg-scripts/fsg_gamestation/add-on-games).

Requires Game Station 2.0.0 or newer.
