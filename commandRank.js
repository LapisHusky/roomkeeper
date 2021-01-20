const permissions = require('./permissions.json');

module.exports = function(msg) {
    if (msg.args === undefined) {
        msg.client.say('Your rank is ' + (permissions[msg.p._id] ? permissions[msg.p._id] : 0));
        return;
    }
    var ppl = msg.args;
    ppl = msg.client.find_ids(ppl);
    if (ppl.length === 0) {
        msg.client.say('Unknown user.');
        return;
    }
    if (ppl.length > 1) {
        msg.client.say('Multiple users found.');
        return;
    }
    msg.client.say('Their rank is ' + (permissions[ppl[0]] ? permissions[ppl[0]] : 0));
}