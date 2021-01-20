const { fstat } = require('fs');
const fs = require('fs');

const permissions = require('./permissions.json');

module.exports = function(msg) {
    if (msg.args === undefined || !msg.args.includes(' ')) {
        msg.client.say('Usage: --setrank [number 0, 1, or 2] [name or _id]');
        return;
    }
    var ppl = msg.args.substring(msg.args.indexOf(' ') + 1);
    ppl = msg.client.find_ids(ppl);
    if (ppl.length === 0) {
        msg.client.say('Unknown user.');
        return;
    }
    if (ppl.length > 1) {
        msg.client.say('Multiple users found.');
        return;
    }
    var num = msg.args.substring(0, msg.args.indexOf(' '));
    num = parseInt(num);
    if (![0,1,2].includes(num)) {
        msg.client.say('Usage: --setrank [number 0, 1, or 2] [name or _id]');
        return;
    }
    permissions[ppl[0]] = num;
    msg.client.say('Set their rank to ' + num + '.');
    fs.writeFileSync('./permissions.json', JSON.stringify(permissions));
}