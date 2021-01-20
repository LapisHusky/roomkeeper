module.exports = function(msg) {
    if (!msg.client.isOwner) {
        msg.client.say('I don\'t currently have the crown.');
        return;
    }
    if (msg.client.channel.settings.visible) {
        msg.client.chset({visible:false});
        msg.client.say('Room is no longer shown in the room list.');
    } else {
        msg.client.chset({visible:true});
        msg.client.say('Room is now shown in the room list.');
    }
}