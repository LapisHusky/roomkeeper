var timeLetters = ['s','m','h','d','w','M','y'];
var timeMultipliers = [1000,60000,3600000,86400000,604800000,2592000000,31536000000];

exports.msToTime = function(args) {
    if (args >= 10000000000000) {
        return 'forever';
    }
    if (args >= 31536000000) {
        return Math.round((args / 31536000000) * 10) / 10 + ' years';
    }
    if (args >= 2592000000) {
        return Math.round((args / 2592000000) * 10) / 10 + ' months';
    }
    if (args >= 604800000) {
        return Math.round((args / 604800000) * 10) / 10 + ' weeks';
    }
    if (args >= 86400000) {
        return Math.round((args / 86400000) * 10) / 10 + ' days';
    }
    if (args >= 3600000) {
        return Math.round((args / 3600000) * 10) / 10 + ' hours';
    }
    if (args >= 60000) {
        return Math.round((args / 60000) * 10) / 10 + ' minutes';
    }
    if (args >= 1000) {
        return Math.round((args / 1000) * 10) / 10 + ' seconds';
    }
    return args + ' milliseconds';
}
exports.timeToMs = function(args) {
    if (args === 'f' || args === 'forever') {
        return 1e+100;
    }
    var lastLetter = args.substring(args.length - 1);
    var number = args.substring(0, args.length - 1);
    number = parseFloat(number);
    if (timeLetters.includes(lastLetter)) {
        if (!(number >= 0 && number < Infinity)) {
            return;
        }
        return timeMultipliers[timeLetters.indexOf(lastLetter)] * number;
    } else {
        number = parseFloat(args);
        if (number >= 0 && number < Infinity) {
            return number * 60000;
        }
    }
    return;
}