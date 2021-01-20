const commands = [];
module.exports = commands;

commands.push({name:'help', aliases:[], eval:require('./commandHelp.js')});
commands.push({name:'kickban', permission:1, aliases:['ban'], eval:require('./commandKickban.js')});
commands.push({name:'unban', permission:1, aliases:[], eval:require('./commandUnban.js')});
commands.push({name:'roomcolor', permission:1, aliases:['color', 'colour', 'roomcolour', 'colorbg', 'colourbg', 'bgcolor', 'bgcolour'], eval:require('./commandRoomcolor.js')});
commands.push({name:'nocussing', permission:1, aliases:[], eval:require('./commandNocussing.js')});
commands.push({name:'visibility', permission:1, aliases:['visible'], eval:require('./commandVisibility.js')});
commands.push({name:'crownsolo', permission:1, aliases:[], eval:require('./commandCrownsolo.js')});
commands.push({name:'getcrown', permission:2, aliases:['crown'], eval:require('./commandGetcrown.js')});
commands.push({name:'rank', aliases:[], eval:require('./commandRank.js')});
commands.push({name:'setrank', permission:2, aliases:[], eval:require('./commandSetrank.js')});