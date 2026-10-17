-- Your game, as Game Station shows it in its store. server.lua registers it.
Config = {}

Config.Game = {
    id = 'snake_reactts',           -- unique and permanent: purchases are saved under it
    name = 'Snake',
    price = 100,                    -- 0 makes it free (players still "get" it once from the store)
    publisher = 'Your Studio',
    genre = 'Arcade',
    cover = 'images/cover.png',     -- square art (a file in this resource, or an https link)
    background = 'images/background.png', -- 16:9 art
    ui = 'ui/dist/index.html',      -- the game's page
    -- 'controller': played on the TV with the controller (Game Station sends the buttons).
    -- 'keyboard': played fullscreen with keyboard and mouse, like the store's web games.
    input = 'controller',
    controls = { -- the keybind HUD while playing (Game Station adds Menu, Fullscreen and Drop)
        { keys = { 'up', 'down', 'left', 'right' }, label = 'Steer' },
        { keys = { 'Enter' }, label = 'Start' },
    },
}

-- While you work on the page: run `npm run dev` in ui/ and set this to 'http://localhost:3000'.
-- Game Station then loads the page from there, so a saved change shows in game at once. Only you see
-- it (localhost is each player's own PC): set it back to false and build (npm run build) before anyone else plays.
Config.DevServer = false
