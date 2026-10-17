-- The page's GameStation.fetchNui calls land here (only the player's own screen can make them) and
-- go on to the server, which checks them against Game Station.

local resource = GetCurrentResourceName()

RegisterNUICallback('getBest', function(_, cb)
    cb({ best = lib.callback.await(resource .. ':getBest', false) or 0 })
end)

RegisterNUICallback('gameOver', function(data, cb)
    local score = type(data) == 'table' and data.score or 0
    cb({ best = lib.callback.await(resource .. ':gameOver', false, score) })
end)

-- Pushing to your page from Lua (it arrives as GameStation.on('message')):
--   exports.fsg_gamestation:SendGameMessage('snake_vanillajs', { type = 'hello' })
-- and the server can reach a player (SendGameMessage) or a whole console (SendConsoleMessage).
