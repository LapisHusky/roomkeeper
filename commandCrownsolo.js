module.exports = function(msg) {
    if (!msg.client.isOwner()) {
        msg.client.say('I don\'t currently have the crown.');
        return;
    }
    if (msg.client.channel.settings.crownsolo) {
        msg.client.chset({crownsolo:false});
        msg.client.say('Everyone can play the piano now.');
    } else {
        msg.client.chset({crownsolo:true});
        msg.client.say('No one can play the piano now.');
    }
}