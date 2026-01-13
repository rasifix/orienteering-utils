import { Format } from "../format";
import { Category } from "../model/category";
import { Competition } from "../model/competition";
import { Runner } from "../model/runner";
import { formatTime } from "../time";


function clean(value: string | undefined): string | undefined {
  if (value) {
    return value.startsWith('"') && value.endsWith('"')
      ? value.substring(1, value.length - 1)
      : value;
  }
  return value;
}

export class PicoeventsFormat implements Format {
  parse(text: string):Competition {
    // convert CSV to JSON
    const categories: { [key: string]: Category } = {};

    const lines = text.split(/\r?\n/);
    const firstLine = lines.splice(0, 1)[0];
    const eventHeader = firstLine.split(",");

    const result: Competition = {
      id: eventHeader[1],
      name: clean(eventHeader[2]),
      map: clean(eventHeader[7]),
      date: clean(eventHeader[3]),
      startTime: clean(eventHeader[4]),
      categories: [],
    };

    const header = lines.splice(0, 1)[0].split(",");

    const sortKeyIdx = header.indexOf("[SORTKEY]");
    const statusIdx = header.indexOf("[RESPERSIDX]");
    const startTimeIdx = header.indexOf("[STARTFULLPREC]");
    const noOfSplitsIdx = header.indexOf("[NOFSPLITS]");
    const termIdx = header.indexOf("[TERM]");
    const firstNameIdx = header.indexOf("[FIRSTNAME]");
    const familyNameIdx = header.indexOf("[FAMILYNAME]");
    const yobIdx = header.indexOf("[YOB]");
    const townIdx = header.indexOf("[TOWN]");
    const clubIdx = header.indexOf("[CLUB]");
    const runtimeNetIdx = header.indexOf("[RUNTIMENET]");

    const startNumIdx = header.indexOf("[STARTNUM]");
    const runOrLegIdx = header.indexOf("[RUNORLEG]");
    const baseClassIdx = header.indexOf("[BASECLASS]"); 
    const teamIdx = header.indexOf("[GROUPNAME]");

    lines.forEach((line, idx) => {
      const tokens = parseCSVLine(line);
      if (tokens.length < 50) {
        return;
      }

      if (idx === 0) {
        result.relay = tokens[0].endsWith("=R");
      }

      const name = tokens[baseClassIdx];

      if (name.indexOf("TW") !== -1 || name.indexOf("TM") !== -1) {
        return;
      }

      let category = categories[name];
      if (!category) {
        category = {
          name: name,
          distance: 0,
          ascent: 0,
          controls: parseInt(tokens[noOfSplitsIdx]),
          runners: [],
        } as any;
        categories[name] = category;
        result.categories.push(category);
      }

      const status = tokens[statusIdx];
      if (status !== "5" && status !== "2") {
        return;
      }

      const startTime = parseInt(tokens[startTimeIdx]);
      const runner: Runner = {
        id: tokens[sortKeyIdx] || "0",
        category: name,
        fullName: clean(tokens[firstNameIdx]) + " " + clean(tokens[familyNameIdx]),
        yearOfBirth: tokens[yobIdx] || undefined,
        city: clean(tokens[townIdx]),
        club: clean(tokens[clubIdx]),
        time: formatTime(parseInt(tokens[runtimeNetIdx])),
        startTime: formatTime(startTime),
        startNumber: clean(tokens[startNumIdx]),
        runOrLeg: tokens[runOrLegIdx] ? parseInt(tokens[runOrLegIdx]) : undefined,
        team: clean(tokens[teamIdx]),
        splits: [],
      };

      for (let i = termIdx + 3; i < tokens.length - 2; i += 2) {
        const time = tokens[i + 1]
          ? formatTime(parseInt(tokens[i + 1]) - startTime)
          : "";
        const code = tokens[i] === "9999" ? "Zi" : tokens[i];
        runner.splits!.push({ code, time: time });
      }

      category.runners.push(runner);
    });

    return result;
  }

  serialize(event: Competition): string {
    throw new Error("format does not implement serialization");
  }

  check(text: string) {
    return text.startsWith("BasicData,");
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  // Add the last field
  fields.push(current);

  return fields;
}