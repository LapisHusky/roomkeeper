module.exports = function(msg) {
    msg.client.chown(msg.p.id);
    msg.client.say('Giving you the crown.');
}