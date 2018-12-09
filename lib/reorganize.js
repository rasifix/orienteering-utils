const { parseTime, formatTime } = require('./time');
const assert = require('assert');

module.exports.reorganize = function(runner, course) {
    let time = 0;
    let splits = [];
    for (let idx = 0; idx < course.length; idx++) {
        let from = idx === 0 ? 'St' : course[idx];
        let to = idx
    }
};

function getLegTime(runner, from, to) {
    // from: [41,38]
    // to: [42]
    for (let idx = 0; idx < runner.splits.length; idx++) {
        if (from[0] === 'St') {
            // assumption: all runners have same start
            return parseTime(runner.splits[0].time);
        } else if (to[0] === 'Zi') {
            return parseTime(runner.totalTime) - parseTime(runner.splits[runner.splits.length - 1].time);
        }

        for (let j = 1; j < runner.splits.length; j++) {
            if (from.includes(runner.splits[j - 1].code) && to.includes(runner.splits[j].code)) {
                let currentTime = parseTime(runner.splits[j].time);
                let previousTime = parseTime(runner.splits[j - 1].time);
                if (currentTime === null) {
                    return null;
                }

                // find last valid previous time or 0
                let k = j - 2;
                while (previousTime === null) {
                    if (k === -1) {
                        previousTime = 0;
                    } else {
                        previousTime = parseTime(runner.splits[k].time);
                        k--;
                    }
                }

                let legTime =  currentTime - previousTime;
                if (legTime === 0) {
                    console.log('*', runner.splits[j], currentTime, runner.splits[j - 1], previousTime);
                } else if (legTime < 0) {
                    console.log('*', runner.splits[j], currentTime, runner.splits[j - 1], previousTime);
                }
                return legTime;
            }
        }
    }

    console.log('busted!', from, to);
    return 0;
}

/**
 * Reorganize a single runner to the given course. The course is specified as an array
 * of arrays. The elements in the inner array represent the controls that shall be 
 * combined. 
 * 
 * @param {*} runner 
 * @param {*} course 
 */
module.exports.reorganizeBbn = function(runner, course) {
    assert(runner.splits.length === course.length, 'number of splits must match', runner.splits.length, course.length);

    // course = [[41,38],[42],[43], ...]
    let time = 0;
    let splits = [];
    for (let idx = 0; idx < course.length; idx++) {
        let from = idx === 0 ? ['St'] : course[idx - 1];
        let to = course[idx];
        let legTime = getLegTime(runner, from, to);
        if (legTime !== null) {
            time += legTime;
        }
        splits.push({ code: to.join('|'), time: legTime === null ? '-' : formatTime(time) });
    }

    assert(runner.splits.length === splits.length, 'number of splits must not change', runner.splits.length, splits.length, course.length);

    runner.splits = splits;
}