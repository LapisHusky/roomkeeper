const banmanager = require('./banmanager.js');

module.exports = function(msg) {
    if (msg.args === undefined) {
        msg.client.say('Usage: --unban [name or _id(s)]');
        return;
    }
    var ppl = msg.args;
    ppl = msg.client.find_ids(ppl);
    if (ppl.length === 0) {
        msg.client.say('Unknown user.');
        return;
    }
    ppl.forEach(_id => {
        banmanager.unban(_id);
        if (msg.client.isOwner) {
            msg.client.unban(_id);
            msg.client.say('Unbanned ' + _id);
        } else {
            msg.client.say(_id + ' will no longer be autobanned but you may need to rerun this command when I have the crown to remove their current ban.');
        }
    });
}