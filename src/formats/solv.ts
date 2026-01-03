import { Format } from "../format";
import { Category } from "../model/category";
import { Competition } from "../model/competition";
import { Runner } from "../model/runner";
import { formatTime, parseTime } from "../time";

function reformatTime(str: string): string | undefined {
  // "special" total times (like wrong or missing control)
  if (str.indexOf(":") === -1) {
    return str;
  }

  const parsed = parseTime(str);
  return parsed ? formatTime(parsed) : undefined;
}

function reformatSplitTime(str: string): string | undefined {
  // normalize missing punch time
  if (str === "-" || str === "-----") {
    return "-";
  }

  // normalize not working control
  if (str === "0.00") {
    return "s";
  }

  const parsed = parseTime(str);
  return parsed ? formatTime(parsed) : undefined;
}

// flat csv file format - every row contains full info including category
// Kategorie;Laenge;Steigung;PoAnz;Rang;Name;Jahrgang;Ort;Club;Zeit;Startzeit;Zielzeit;Zwischenzeiten
export class SolvFormat implements Format {
  parse(text: string, options: any = {}) {
    const categories: { [key: string]: Category } = {};

    const lines = text.split("\n");

    // drop header column
    lines.splice(0, 1)[0].split(";");

    lines.forEach(function (line, idx) {
      const tokens = line.split(";");
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
          ascent: parseInt(tokens[2]),
          controls: parseInt(tokens[3]),
          runners: [],
        };
        categories[categoryName] = category;
      }

      const runner:Runner = {
        id: "" + idx,
        category: categoryName,
        rank: tokens[4] ? parseInt(tokens[4]) : undefined,
        fullName: tokens[5],
        yearOfBirth: tokens[6],
        city: tokens[7],
        club: tokens[8],
        time: reformatTime(tokens[9]),
        startTime: tokens[10],
        splits: [],
      };

      if (tokens.length - 12 < category.controls * 2) {
        // some crappy SOLV data...
        console.debug(
          "fix crappy data from SOLV - not enough tokens on line for runner " +
            runner.fullName
        );
        for (var i = tokens.length; i < category.controls * 2 + 12; i++) {
          if (i % 2 === 0) {
            tokens[i] =
              category.runners.length === 0
                ? "???"
                : category.runners[0].splits[(i - 12) / 2].code;
          } else {
            tokens[i] = "-";
          }
        }
      }

      for (let i = 12; i < tokens.length - 1; i += 2) {
        let time = reformatSplitTime(tokens[i + 1]);
        if (runner.splits.length > 0 && time) {
          let prev = runner.splits[runner.splits.length - 1].time;
          let parsedTime = parseTime(tokens[i + 1]);
          if (
            time === prev ||
            tokens[i + 1] === "0.00" || (parsedTime && parsedTime > 180 * 60)) {
            // normalize valid manual punches
            time = "s";
          }
        }
        runner.splits.push({ code: tokens[i], time: time });
      }

      runner.splits.push({ code: "Zi", time: runner.time });

      category.runners.push(runner);
    });

    return {
      name: options.event || "Anonymous Event",
      map: options.map || "Unknown Map",
      date: options.date || "",
      startTime: options.startTime || "",
      categories: Object.keys(categories).map(function (category) {
        return categories[category];
      }),
    };
  }

  serialize(competition: Competition) {
    var result =
      "Kategorie;Laenge;Steigung;PoAnz;Rang;Name;Jahrgang;Ort;Club;Zeit;Startzeit;Zielzeit;Zwischenzeiten\n";

    competition.categories.forEach(function (category) {
      category.runners.forEach(function (runner) {
        const distance = category.distance
          ? category.distance
          : null;
        const runTime = parseTime(runner.time);
        const startTime = parseTime(runner.startTime);
        const finishTime = runTime && startTime ? formatTime(runTime + startTime) : '';
        result += [
          category.name,
          distance,
          category.ascent,
          category.controls,
          runner.rank,
          runner.fullName,
          runner.yearOfBirth,
          runner.city,
          runner.club,
          runner.time,
          runner.startTime,
          finishTime,
        ].join(";");
        result +=
          ";" +
          runner.splits
            .map(function (split) {
              return split.code + ";" + split.time;
            })
            .join(";") +
          "\n";
      });
    });

    return result;
  }

  check(text: string) {
    return text.indexOf("Kategorie;Laenge;Steigung;PoAnz;Rang;") === 0;
  }
}
