const { formatTime, parseTime } = require('./time');

function reformatTime(str) {
    // "special" total times (like wrong or missing control)
    if (str.indexOf(':') === -1) {
        return str;
    }

    return formatTime(parseTime(str));
}

function reformatSplitTime(str) {
    // normalize missing punch time
    if (str === '-' ||  str === '-----') {
        return '-';
    }

    // normalize not working control
    if (str === '0.00') {
        return 's';
    }

    return formatTime(parseTime(str));
}

// flat csv file format - every row contains full info including category
// Kategorie;Laenge;Steigung;PoAnz;Rang;Name;Jahrgang;Ort;Club;Zeit;Startzeit;Zielzeit;Zwischenzeiten    
module.exports.parse = function(text, options = {}) {
    const categories = {};

    const lines = text.split('\n');

    // drop header column
    lines.splice(0, 1)[0].split(';');

    lines.forEach(function(line, idx) {
        const tokens = line.split(';');
        if (tokens.length < 11) {
            // invalid input? not enough data for runner
            return;
        }

        const categoryName = tokens[0];
        let category = categories[categoryName];
        if (!category) {
            category = {
                name: categoryName,
                distance: Math.round(parseFloat(tokens[1]) * 1000),
                ascent: tokens[2],
                controls: parseInt(tokens[3]),
                runners: []
            };
            categories[categoryName] = category;
        }

        const runner = {
            id: idx,
            rank: tokens[4] ? parseInt(tokens[4]) : null,
            fullName: tokens[5],
            yearOfBirth: tokens[6],
            city: tokens[7],
            club: tokens[8],
            time: reformatTime(tokens[9]),
            startTime: tokens[10],
            splits: []
        };

        if ((tokens.length - 12) < category.controls * 2) {
            // some crappy SOLV data...
            console.log('fix crappy data from SOLV - not enough tokens on line for runner ' + runner.fullName);
            for (var i = tokens.length; i < category.controls * 2 + 12; i++) {
                if (i % 2 === 0) {
                    tokens[i] = category.runners.length === 0 ? '???' : category.runners[0].splits[(i - 12) / 2].code;
                } else {
                    tokens[i] = '-';
                }
            }
        }

        for (let i = 12; i < tokens.length - 1; i += 2) {
            let time = reformatSplitTime(tokens[i + 1]);
            if (runner.splits.length > 0 && parseTime(time)) {
                let prev = parseTime(runner.splits[runner.splits.length - 1]);
                if (time === prev || tokens[i + 1] === '0.00' || parseTime(tokens[i + 1]) > 180 * 60) {
                    // normalize valid manual punches
                    time = 's';
                }
            }
            runner.splits.push({ code: tokens[i], time: time });
        }

        category.runners.push(runner);
    });

	return {
		name: options.event || 'Anonymous Event',
		map: options.map || 'Unknown Map',
		date: options.date || '',
		startTime: options.startTime || '',
		categories: Object.keys(categories).map(function(category) {
			return categories[category];
		})
    }; 
};

module.exports.serialize = function(event) {
    var result = 'Kategorie;Laenge;Steigung;PoAnz;Rang;Name;Jahrgang;Ort;Club;Zeit;Startzeit;Zielzeit;Zwischenzeiten\n';

    event.categories.forEach(function(category) {
        category.runners.forEach(function(runner) {
            const distance = category.distance ? parseFloat(category.distance / 1000).toFixed(1) : null;
            result += [category.name, distance, category.ascent, category.controls, runner.rank, runner.fullName, runner.yearOfBirth, runner.city, runner.club, runner.time, runner.startTime, formatTime(parseTime(runner.time) + parseTime(runner.startTime))].join(';');
            result += ';' + runner.splits.map(function(split) {
                return split.code + ';' + split.time;
            }).join(';') + '\n';
        });
    });

    return result;
};

module.exports.formatCheck = function(text) {
    return text.startsWith('Kategorie;Laenge;Steigung;PoAnz;Rang;');
};
