const fs = require('fs');

const manualbans = require('./bans.json');
const permbans = require('./permbans.json');

exports.checkban = function(_id) {
    if (permbans.includes(_id)) return 36e5;
    if (manualbans[_id] > Date.now()) return Math.min(36e5, manualbans[_id] - Date.now());
    return 0;
}

exports.setban = function(_id, ms) {
    manualbans[_id] = Date.now() + ms;
    fs.writeFileSync('./bans.json', JSON.stringify(manualbans));
}

exports.unban = function(_id) {
    if (permbans.includes(_id)) {
        permbans.splice(permbans.indexOf(_id), 1);
        fs.writeFileSync('./permbans.json', JSON.stringify(permbans));
    }
    if (!(manualbans[_id] > Date.now())) return;
    delete manualbans[_id];
    fs.writeFileSync('./bans.json', JSON.stringify(manualbans));
}