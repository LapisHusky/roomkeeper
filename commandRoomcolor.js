const htmlcolors = require('./colors.json');

module.exports = function(msg) {
    if (!msg.client.isOwner) {
        msg.client.say('I don\'t currently have the crown.');
        return;
    }
    if (msg.args === undefined) {
        msg.client.say('Usage: --roomcolor [hex color (for example #004488)] [optional second hex color]');
        return;
    }
    var color1;
    var color2 = null;
    if (msg.args.includes(' ')) {
        color1 = msg.args.substring(0, msg.args.indexOf(' '));
        color2 = msg.args.substring(msg.args.indexOf(' ') + 1);
        if (htmlcolors[color1]) {
            color1 = htmlcolors[color1];
        }
        if (htmlcolors[color2]) {
            color2 = htmlcolors[color2];
        }
        if (!color2.startsWith('#')) {
            color2 = '#' + color2;
        }
        if (!/^#[0-9A-F]{6}$/i.test(color2)) {
            if (!/^#[0-9A-F]{3}$/i.test(color2)) {
                msg.client.say(color2 + ' is not a valid hexadecimal color.');
                return;
            }
            color2 = '#' + color2.charAt(1).repeat(2) + color2.charAt(2).repeat(2) + color2.charAt(3).repeat(2);
        }
        color2 = color2.toLowerCase();
    } else {
        color1 = msg.args;
        if (htmlcolors[color1]) {
            color1 = htmlcolors[color1];
        }
    }
    if (!color1.startsWith('#')) {
          color1 = '#' + color1;
    }
    if (!/^#[0-9A-F]{6}$/i.test(color1)) {
        if (!/^#[0-9A-F]{3}$/i.test(color1)) {
            msg.client.say(color1 + ' is not a valid hexadecimal color.');
            return;
        }
        color1 = '#' + color1.charAt(1).repeat(2) + color1.charAt(2).repeat(2) + color1.charAt(3).repeat(2);
    }
    color1 = color1.toLowerCase();
    if (color2 === null) {
        msg.client.chset({color:color1});
        msg.client.say('Set the room color to ' + color1 + '.');
    } else {
        msg.client.chset({color:color1, color2:color2});
        msg.client.say('Set the room color to ' + color1 + ' with fade color ' + color2 + '.');
    }
}