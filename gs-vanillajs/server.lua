-- Registers the game in config.lua with Game Station, and keeps each player's best score.

local resource = GetCurrentResourceName()
local GAME = Config.Game

if Config.DevServer then GAME.ui = Config.DevServer end

local function register()
    local ok, err = exports.fsg_gamestation:RegisterGame(GAME)
    if not ok then print(('^1[%s]^7 RegisterGame failed: %s'):format(resource, err)) end
end

-- Game Station forgets add-ons when it restarts, so register again whenever it starts.
AddEventHandler('onResourceStart', function(started)
    if started == 'fsg_gamestation' then register() end
end)
if GetResourceState('fsg_gamestation') == 'started' then register() end

-- Best scores, per license, in this resource's own KVP store.
local function bestKey(src)
    return 'best:' .. (GetPlayerIdentifierByType(src, 'license') or tostring(src))
end

-- Only someone playing this game right now gets an answer. GetPlayingGame is Game Station's word
-- (the player owns the game and has that console's screen on), not the page's.
lib.callback.register(resource .. ':getBest', function(src)
    if exports.fsg_gamestation:GetPlayingGame(src) ~= GAME.id then return 0 end
    return GetResourceKvpInt(bestKey(src))
end)

-- A finished run. The score is still the client's word: never pay out on it without checks of your own.
lib.callback.register(resource .. ':gameOver', function(src, score)
    local gameId, consoleId = exports.fsg_gamestation:GetPlayingGame(src)
    if gameId ~= GAME.id then return nil end
    score = math.floor(tonumber(score) or 0)
    if score < 0 or score > 32 * 18 then return nil end

    local key = bestKey(src)
    local best = GetResourceKvpInt(key)
    if score > best then
        best = score
        SetResourceKvpInt(key, best)
        -- Every screen at that console (the TV, people watching) shows it.
        exports.fsg_gamestation:SendConsoleMessage(consoleId, GAME.id, { type = 'record', name = GetPlayerName(src), score = best })
    end
    return best
end)

-- Game Station also tells you when someone opens or leaves your game (local events: listen with
-- AddEventHandler, never RegisterNetEvent, so no client can fake them).
AddEventHandler('fsg_gamestation:addon:opened', function(src, gameId, consoleId)
    if gameId ~= GAME.id then return end
    -- e.g. start a match for this console, or count plays
end)

AddEventHandler('fsg_gamestation:addon:closed', function(src, gameId, consoleId)
    if gameId ~= GAME.id then return end
    -- e.g. drop them from a match
end)
