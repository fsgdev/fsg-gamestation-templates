fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'gs-vuejs'
description 'Game Station game template (Vue)'
author 'FSG'
version '1.0.0'

dependencies {
    'ox_lib',
    'fsg_gamestation',
}

shared_script '@ox_lib/init.lua'
client_script 'client.lua'
server_scripts {
    'config.lua',
    'server.lua',
}

-- The store art and the game's page. Build the page first: cd ui && npm install && npm run build
files {
    'images/*',
    'ui/dist/*',
    'ui/dist/**/*',
}
