module.exports = function(msg) {
    if (!msg.client.isOwner()) {
        msg.client.say('I don\'t currently have the crown.');
        return;
    }
    if (msg.client.channel.settings['no cussing']) {
        msg.client.chset({'no cussing':false});
        msg.client.say('Disabled no cussing.');
    } else {
        msg.client.chset({'no cussing':true});
        msg.client.say('Enabled no cussing.');
    }
}