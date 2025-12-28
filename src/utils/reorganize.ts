const { parseTime, formatTime } = require('./time');
const assert = require('assert');

module.exports.reorganize = function(runners, course) {
    return runners.filter(r => parseTime(r.time) !== null).map(r => {
        let runner = { ...r };
        let runnerCourse = 'St,' + runner.splits.map(s => s.code).join(',');
        console.log(runner.fullName, runnerCourse);
        if (runnerCourse === course.join(',')) {
            return runner;
        }

        let time = 0;
        let splits = [];
        let lastValidTime = 0;
        let lastValidIdx = -1;

        for (let idx = 0; idx < course.length - 1; idx++) {
            let from = course[idx];
            let to = course[idx + 1];
            let split = getSplit(runner, from, to);
            if (!split) {
                console.log('missing split for runner ' + runner.fullName + " at index " + idx, from, to);
            }
            console.log('split', from + '-' + to, formatTime(lastValidTime), split.diff);

            if (!split) {
                console.log('split not found for runner', from, to, runner.fullName);
                return;
            }

            if (split.split !== 's') {
                time += split.diff;
                lastValidTime = time;
                lastValidIdx = idx;
                splits.push({
                    ...split,
                    time: formatTime(time)
                });
                console.log('result', idx, split.code, 'time', formatTime(time));
            } else {
                splits.push({
                    ...split,
                    time: '-'
                });
            }
        }
        runner.splits = splits;
        return runner;
    });
}

function getSplit(runner, from, to) {
    for (let idx = 0; idx < runner.splits.length; idx++) {
        if (from === 'St') {
            // assumption: all runners have same start
            const split = runner.splits[0];
            return {
                ...split,
                diff: parseTime(split.time)
            };
        } else if (to === 'Zi') {
            throw "to Zi not supported";
        }

        for (let j = 1; j < runner.splits.length; j++) {
            if (from === runner.splits[j - 1].code && to === runner.splits[j].code) {
                const prevSplit = runner.splits[j - 1];
                const split = runner.splits[j];
                return {
                    ...split,
                    diff: parseTime(split.time) - parseTime(prevSplit.time)
                };
            }
        }
    }

    console.log('busted!', from, to, runner);
    return null;
}

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
};


module.exports.defineSubRanking = function(input, from, to) {
    let runners;
    if (typeof input.categories !== 'undefined') {
        runners = input.categories.flatMap(function(category) { return category.runners; })
    } else {
        runners = input.runners;
    }

    return runners.map(function(runner) {
        var fromTime, toTime;
        const course = [];

        if (from === 'St') {
            fromTime = 0;
            course.push(from);
        }

        if (to === 'Zi') {
            toTime = parseTime(runner.time);
        }

        for (var i = 0; i < runner.splits.length; i++) {
            var split = runner.splits[i];
            if (parseTime(split.time) === null) {
                continue;
            }

            if (split.code === from && typeof fromTime === 'undefined') {
                fromTime = parseTime(split.time);
                course.push(split.code);

            } else if (split.code === to) {
                toTime = parseTime(split.time);
                course.push(split.code);
                break;

            } else if (typeof fromTime !== 'undefined') {
                course.push(split.code);
            }
        }

        if (typeof fromTime !== 'undefined' && typeof toTime !== 'undefined' && toTime !== null) {
            const time = formatTime(toTime - fromTime);
            return {
                fullName: runner.fullName,
                time: time,
                course: course.join('-')
            };
        }

        return {
            fullName: runner.fullName
        };
    }).filter(runner => typeof runner.time !== 'undefined')
    .sort((e1, e2) => parseTime(e1.time) - parseTime(e2.time));
}
