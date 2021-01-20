const MPPClient = require('./client.js');
const commands = require('./allcommands.js');
const banmanager = require('./banmanager.js');

const permissions = require('./permissions.json');

const client = new MPPClient(undefined, 'insert your proxy here');

exports.client = client;

client.on('hi', () => {
    client.setChannel('✧𝓡𝓟 𝓡𝓸𝓸𝓶✧');
    client.setName('bouncer but dumber [--help]');
});

client.on('a', msg => {
    if (client.channel._id !== client.desiredChannelId) return;
    if (msg.a.startsWith('--')) {
        msg.client = client;
        if (msg.a.includes(' ')) {
            msg.cmdbase = msg.a.substring(2, msg.a.indexOf(' '));
            msg.args = msg.a.substring(msg.a.indexOf(' ') + 1);
        } else {
            msg.cmdbase = msg.a.substring(2);
        }
        msg.cmdbase = msg.cmdbase.toLowerCase();
        var command;
        commands.forEach(c => {
            if (c.name === msg.cmdbase) command = c;
            if (c.aliases.includes(msg.cmdbase)) command = c;
        });
        if (command) {
            if (command.permission) {
                if (!(permissions[msg.p._id] >= command.permission)) {
                    client.say('You don\'t have permission for that.');
                    return;
                }
            }
            try {
                command.eval(msg);
            } catch (err) {
                console.log(err);
                client.say('Error.');
            }
        }
    }
});

client.on('ch', msg => {
    if (client.isOwner) {
        msg.ppl.forEach(user => {
            const time = banmanager.checkban(user._id);
            if (time > 0) {
                client.kickBan(user._id, time);
            }
        });
    }
});

client.start();