const timeHelper = require('./time.js');
const banmanager = require('./banmanager.js');

const permissions = require('./permissions.json');

module.exports = function(msg) {
    if (msg.args === undefined || !msg.args.includes(' ')) {
        msg.client.say('Usage: --kickban [time: f(orever) || time + unit (example 12h) || number of minutes] [name or _id(s)]');
        return;
    }
    var time = msg.args.substring(0, msg.args.indexOf(' '));
    time = timeHelper.timeToMs(time);
    if (time === undefined) {
        msg.client.say('Usage: --kickban [time: f(orever) || time + unit (example 12h) || number of minutes] [name or _id(s)]');
        return;
    }
    var ppl = msg.args.substring(msg.args.indexOf(' ') + 1);
    ppl = msg.client.find_ids(ppl);
    if (ppl.length === 0) {
        msg.client.say('Unknown user.');
        return;
    }
    ppl.forEach(_id => {
        if (permissions[_id] >= 1) {
            msg.client.say(_id + 'can\'t be banned.');
            return;
        }
        banmanager.setban(_id, time);
        if (msg.client.isOwner()) {
            msg.client.kickBan(_id, Math.min(36e5, time));
        } else {
            msg.client.say(_id + ' will be banned when I have the crown.');
        }
    });
}