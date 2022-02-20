function parseCategory(row) {
	return {
		name: row[0],
		distance: parseInt(row[1], 10),
		ascent: parseInt(row[2], 10),
		controls: parseInt(row[3], 10),
		runners: []
	};
}

function parseRunner(row, category, id) {
	var headerLength = 15;
	var i;

	var splits = [];
	for (i = headerLength; i < row.length; i += 2) {
		splits.push({ 'code': row[i], 'time': row[i + 1] });
	}

	// split cleanup - detect two following splits with identical time
	// --> control not working properly; set 's' as split time (substitute)
	// going from back to front to catch several not working controls
	for (i = splits.length - 1;	i > 0; i--) {
		if (splits[i].time === splits[i - 1].time && splits[i].time !== '-') {
			splits[i].time = 's';
		}
	}

	return {
		id: id,
		category: category,
		rank: row[0] ? parseInt(row[0]) : null,
		name: row[1],
        firstName: row[2],
        fullName: [row[2], row[1]].join(' '),
		yearOfBirth: row[3],
		sex: row[4],
		club: row[8],
		city: row[7],
		nation: row[9],
		time: row[12],
		startTime: row[13],
		ecard: row[11],
		splits: splits
	};
}

module.exports.parse = function(text) {
    // split text into lines
	var lines = text.trim().split(/[\r\n]+/);

	// throw away first row containing headers
	lines = lines.splice(1);

    // second row contains information about the event
	var header = lines[0].split(';');

	var event = {
        // row starts with a double slash
		name: header[0].substring(2, header[0].length),
		map: header[1],
		date: header[2],
		startTime: header[3],
		categories: [ ]
	};

	// throw a way the now parsed header
	lines = lines.splice(1);

	var category = null;

	let idx = 0;
	lines.filter(line => line.trim().length > 0).forEach(function(line) {
		var cols = line.split(';');
		if (cols.length === 4) {
			category = parseCategory(cols);
			event.categories.push(category);
		} else {
			category.runners.push(parseRunner(cols, category.name, ++idx));
		}
	});

	return event;
};

module.exports.serialize = function(event) {
    var result = '//Format: Rank;Name;Firstname;YearOfBirth;SexMF;FedNr;Zip;Town;Club;NationIOF;StartNr;eCardNr;RunTime;StartTime;FinishTime;CtrlCode;SplitTime; ...\n';
    result += '//' + [event.name, event.map, event.date, event.startTime, ''].join(';') + '\n';

    event.categories.forEach(function(category) {
        result += [category.name, category.distance, category.ascent, category.controls].join(';') + '\n';
        category.runners.forEach(function(runner) {
            result += [runner.rank, runner.name, runner.firstName, runner.yearOfBirth, runner.sex, '', runner.zip, runner.city, runner.club, runner.nation, '', runner.ecard, runner.time, runner.startTime, ''].join(';');
            result += ';' + runner.splits.map(function(split) {
                return split.code + ';' + split.time;
            }).join(';') + '\n';
        });
    });

    return result;
};

module.exports.formatCheck = function(text) {
    return text.substring(0, 8) === '//Format';
};
