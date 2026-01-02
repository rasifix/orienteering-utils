import { Runner } from "../model/runner";
import { Split } from "../model/split";
import { parseTime, formatTime } from "../time";
import { errorTime } from "./analyzis";

function invalidTime(time:number|undefined) {
  return time === undefined || time < 0;
}

function validTime(time:number|undefined) {
  return !invalidTime(time);
}

function sum(a1: number, a2: number) {
  return a1 + a2;
}

export interface Course {
  code: string;
  runners: string[]
}

export interface RunnerLegs {
  [key: string]: RunnerLeg;
}

export interface RunnerLeg {
  runners: RunnerLegEntry[];
  code: string;
  idealSplit?: number;
  fastestSplit?: number;
  spread: [number, number];
  weight?: number;
}

export interface RunnerLegEntry {
  id: string;
  fullName: string;
  time: number;
  split: number;
  splitBehind?: number;
  splitRank: number;
  performanceIndex?: number;
  overallRank?: number;
  overallBehind?: string;
  idealBehind?: string;
  leg?: string;
  position?: number;
}


/**
 * Assigns the following property to every valid leg of a runner.
 *
 * - splitBehind: how much time behind the faster runner
 * - splitRank: rank on corresponding leg
 * - leg: code of leg
 *
 * @param {RankingRunner[]} runners
 * @param {RunnerLegs} legs
 */
function assignLegInfoToSplits(runners: RankingRunner[], legs: RunnerLegs): void {
  runners.forEach((runner) => {
    runner.splits
      .filter((s) => validTime(s.splitTime))
      .forEach((split) => {
        let leg = legs[split.legCode];

        if (!leg) {
          throw "leg with code " + split.leg + " not defined!";
        }

        split.legCode = leg.code;

        let legRunner = leg.runners.find((r) => r.id === runner.id);

        if (legRunner) {
          split.leg.idealBehind = leg.idealSplit && legRunner.split - leg.idealSplit;
          split.leg.behind = legRunner.splitBehind;
          split.leg.rank = legRunner.splitRank;
          split.performanceIndex = legRunner.performanceIndex;
        }
        split.weight = leg.weight;
      });
    runner.errorTime = errorTime(runner, { thresholdRelative: 1.2, thresholdAbsolute: 10 });
  });
}

function rank(runners: RankingRunner[]) {
  runners.sort((r1, r2) => {
    const t1 = parseTime(r1.time);
    const t2 = parseTime(r2.time);

    if (invalidTime(t1) && invalidTime(t2)) {
      return 0;
    } else if (invalidTime(t1)) {
      return 1;
    } else if (invalidTime(t2)) {
      return -1;
    } else {
      return t1! - t2!;
    }
  });
  runners.forEach((runner, idx) => {
    if (idx === 0) {
      runner.rank = 1;
    } else {
      let prev = runners[idx - 1];
      if (prev.time === runner.time) {
        runner.rank = prev.rank;
      } else if (parseTime(runner.time)) {
        runner.rank = idx + 1;
      }
    }
  });
}

export interface Ranking {
    courses: Course[],

    /* indexed information about runners */
    runners: RankingRunner[],

    /* extracted information about all legs found */
    legs: RunnerLeg[],
}

export interface RankingRunner {
  // the unique identifier of this runner
  id: string; 

  // the category of this runner
  category: string;

  // the overall rank of this runner
  rank?: number;

  // the full name of this runner
  fullName: string; 

  // the overall time of this runner
  time?: string; 

  // the error time of this runner
  errorTime: string;

  // the year of birth of this runner
  yearOfBirth?: string; 

  // the city of this runner
  city?: string; 

  // the club of this runner
  club?: string; 

  // the splits of this runner
  splits: RankingSplit[];
}

export interface RankingSplit {

  // the control code of this leg
  code: string; 

  // the leg identifier for this leg (from-to)
  legCode: string;

  // the punch time from the start of the race
  time?: number;

  // the split time for this leg
  splitTime?: number;

  // time lost on this leg due to errors
  timeLoss?: number;

  overall: RankingInfo;

  leg: SplitInfo;

  // the performance index for this runner on this leg
  performanceIndex: number | undefined;

  // defines the start position of this leg as a percentage
  position: number;

  // defines the percentage of the overall time this leg represents
  weight: number | undefined; 
}

export interface Leg {
    from: string;
    to: string;
    ranking: RankingEntry[];
}

export interface RankingEntry {
    rank: number;
    time: string;
    runnerRef: string;
}

export interface RankingInfo {
  rank?: number;
  behind?: number;
  idealBehind?: number;
}

export interface SplitInfo extends RankingInfo {
  performanceIndex?: number;
}

export function parseRanking(runners: Runner[]): Ranking {
  const courses = defineCourses(runners);

  // prepare the result by defining the runners and their splits
  const rankingRunners = defineRunners(runners);

  // prepare auxiliary data about the legs needed to calculate ideal times, weights, ...
  const legs = defineLegs(rankingRunners);

  // calculate the ideal time [s]
  const idealTime = Object.keys(legs)
    .map((code) => legs[code].idealSplit)
    .filter((time) => time !== undefined)
    .reduce(sum, 0);

  // each leg's weight is calculated regarding as a ratio of the ideal split time to the ideal time
  Object.keys(legs).forEach((code) => {
    let leg = legs[code];
    if (leg.idealSplit && idealTime > 0) {
      leg.weight = leg.idealSplit / idealTime;
    }
    if (!leg.weight || isNaN(leg.weight)) {
      console.log("invalid weight for leg ", code, leg.idealSplit, idealTime);
    }
  });

  // now assing the leg information (such as idealTime, weight, ...) to the individual splits of the runners
  assignLegInfoToSplits(rankingRunners, legs);

  rankingRunners.forEach((runner) => {
    let behind = 0;
    let weightSum = 0;
    runner.splits.forEach((split) => {
      behind += split.leg.idealBehind!;
      split.overall = {
        behind: behind
      };
      split.position = weightSum + split.weight!;

      if (split.weight) {
        weightSum += split.weight;
      }
    });
  });

  // function of function calculating the time at an arbitrary position for a given runner
  let timeFn =
    (runner: RankingRunner) =>
    (pos: number): number | undefined => {
      if (pos === 0) {
        return 0;
      } else if (isNaN(pos)) {  
        return undefined;
      } else if (pos >= 1) {
        if (!parseTime(runner.time)) {
          return undefined;
        }
        return parseTime(runner.time)!;
      }

      let idx = 0;
      let weightSum = 0;
      let prevTime = 0;
      for (idx = 0; idx < runner.splits.length; idx++) {
        let split = runner.splits[idx];
        if (weightSum + split.weight! >= pos) {
          break;
        }
        weightSum += split.weight!;
        prevTime = split.time!
      }

      let prev = idx === 0 ? { position: 0, time: 0 } : runner.splits[idx - 1];
      let next = runner.splits[idx];

      if (
        prev === undefined ||
        next === undefined ||
        invalidTime(prev.time) ||
        invalidTime(next.splitTime)
      ) {
        return undefined;
      }

      return prevTime! + ((pos - prev.position) / next.weight!) * next.splitTime!;
    };

  // function returning the times at a given position for all runners
  const memo = new Map<number, { id: string, time: number | undefined}[]>();
  const timesAtPosition = (pos: number): { id: string, time: number | undefined}[] => {
    if (memo.has(pos)) {
      return memo.get(pos)!;
    }
    const result = rankingRunners.map((runner) => {
      return { id: runner.id, time: timeFn(runner)(pos) };
    });
    memo.set(pos, result);
    return result;
  };

  rankingRunners.forEach((runner) => {
    runner.splits.forEach((split) => {
      const times = timesAtPosition(split.position)
        .filter((entry) => entry.time && entry.time > 0)
        .map((entry) => {
          return { id: entry.id, time: entry.time! };
        });
      times.sort((t1, t2) => t1.time - t2.time);

      if (!split.position || isNaN(split.position)) {
        return;
      }

      if (!times || times.length === 0) {
        console.log(
          "no times at position ",
          split.position,
          split.weight,
          " for runner ",
          runner.fullName,
          runner.time,
          times.length
        );
        return;
      }

      let rank = 1;

      const lastTime = times[0].time;
      for (let idx = 0; idx < times.length; idx++) {
        const entry = times[idx];

        if (lastTime < entry.time) {
          rank++;
        }

        if (runner.id === entry.id) {
          const idealSplitTime = times.slice(0, 5).reduce((sum, t) => sum + t.time!, 0) / Math.min(5, times.length);
          const fastestTime = times[0].time;
          split.overall.rank = rank;
          split.overall.behind = entry.time - fastestTime;
          split.overall.idealBehind = Math.round(entry.time - idealSplitTime);
          break;
        }
      }
    });
  });

  // calculate the overall rank
  rank(rankingRunners);

  Object.values(legs).forEach((leg) => {
    const ideal = leg.idealSplit!;
    const min = leg.runners.filter((runner) => !isNaN(runner.split) && runner.split !== undefined).map((runner) => runner.split).reduce((min, split) => Math.min(min, split - ideal), Number.MAX_VALUE);
    const max = leg.runners.filter((runner) => !isNaN(runner.split) && runner.split !== undefined).map((runner) => runner.split).reduce((max, split) => Math.max(max, split - ideal), Number.MIN_VALUE);
    leg.spread = [min, max];
  });

  return {
    courses,
    runners: rankingRunners,
    legs: Object.values(legs).map((leg) => ({
      code: leg.code,
      spread: leg.spread,
      idealSplit: leg.idealSplit,
      fastestSplit: leg.fastestSplit,
      weight: leg.weight,
      runners: leg.runners
    })),
  };
}

/**
 * Define the sources ran by the given runners. If all runner ran the same
 * course, then only one course will be defined.
 * 
 * @param runners the list of runners
 * @returns the defined courses
 */
function defineCourses(runners: Runner[]): Course[] {
  let courses:{[key:string]: Course} = {};
  runners.filter((runner) => validTime(parseTime(runner.time))).forEach((runner) => {
    let course = "St," + runner.splits.map((split) => split.code).join(",");
    if (!courses[course]) {
      courses[course] = {
        code: course,
        runners: [runner.id],
      };
    } else {
      courses[course].runners.push(runner.id);
    }
  });
  return Object.keys(courses).map((key) => courses[key]);
}

function defineRunners(runners:Runner[]): RankingRunner[] {
  return runners.filter((runner) => runner.splits.length > 0 && runner.splits.every((split) => split.code)).map((runner) => {
    let splits = runner.splits.map((split, idx) => defineRunnerLegSplit(split, idx, runner));
    if (!runner.splits.some((s) => s.code === "Zi")) {
      const lastSplit = defineRunnerLegSplit({ code: "Zi", time: runner.time }, runner.splits.length, runner);
      splits = splits.concat([lastSplit]);
    }
    return {
      id: runner.id,
      category: runner.category,
      rank: undefined,
      fullName: runner.fullName,
      time: runner.time,
      yearOfBirth: runner.yearOfBirth,
      city: runner.city,
      club: runner.club,
      splits: splits,
      errorTime: '00:00'
    };
  });
}

function defineRunnerLegSplit(split: {
  code: string;
  time?: string;
}, idx: number, runner: Runner): RankingSplit {
  var splitTime: number | undefined = undefined;
  if (split.time === "-") {
    splitTime = undefined;
  } else if (idx === 0) {
    splitTime = parseTime(split.time) ? parseTime(split.time)! : undefined;
  } else {
    let current = parseTime(split.time);
    let previous = parseTime(runner.splits[idx - 1].time);
    if (!current || !previous) {
      splitTime = undefined;
    } else {
      splitTime = current - previous;
    }
  }

  return {
    code: split.code,
    legCode: legCode(runner.splits, idx),
    time: parseTime(split.time),
    splitTime: splitTime,
    leg: {
      rank: undefined,
      behind: 0,
      idealBehind: undefined
    },
    overall: {
      rank: undefined,
      behind: 0,
      idealBehind: undefined
    },
    performanceIndex: undefined,
    position: 0,
    weight: undefined
  };
}

function legCode(splits: Split[], idx: number) {
  if (idx === 0) {
    return "St-" + splits[0].code;
  } else if (idx === splits.length) {
    return splits[idx - 1].code + "-Zi";
  } else {
    return splits[idx - 1].code + "-" + splits[idx].code;
  }
}

function defineLegs(runners: RankingRunner[]) {
  const legs = Array.from(runners
    .map((runner) => 
      runner.splits.map((split, idx) => {
        let from = idx === 0 ? "St" : runner.splits[idx - 1].code;
        let to = split.code;
        let code = from + "-" + to;
        return code;
      })
    ).reduce((a, b) => a.concat(b), [])
    .reduce((a, b) => a.add(b), new Set<string>())).reduce((obj, code) => {
      obj[code] = {
        code: code,
        runners: [],
        spread: [0, 0],
      };
      return obj;
  }, {} as RunnerLegs);
  
  runners.forEach((runner) => {
    runner.splits
      //.filter((s) => validTime(s.time))
      .forEach((split, idx) => {
        const from = idx === 0 ? "St" : runner.splits[idx - 1].code;
        const to = split.code;
        const code = from + "-" + to;

        const current = legs[code];
        if (validTime(split.time)) {
          current.runners.push({
            id: runner.id,
            fullName: runner.fullName,
            splitRank: 0,
            time: split.time!,
            split: idx === 0
              ? split.time!
              : split.time! - runner.splits[idx - 1].time!,
          });
        }
      });
  });

  defineLegProperties(legs);

  return legs;
}

/**
 * Define properties of each leg. After this method the leg structure will be enhanced as follows:
 *
 * - runners are sorted per split time per leg
 * - each leg has a property 'idealSplit' (ideal split time of this leg)
 * - each leg has a property 'fastestSplit'
 * - each runner entry of a leg is enhanced with 'splitBehind' and 'splitRank'
 *
 * @param {*} legs leg data structre (only split is relevant)
 */
function defineLegProperties(legs: RunnerLegs) {
  Object.keys(legs).forEach((code) => {
    let leg = legs[code];
    leg.runners.sort(function (r1, r2) {
      return r1.split - r2.split;
    });

    // calculate the ideal time: take up to 5 fastest on that leg
    let selected = leg.runners
      .slice(0, Math.min(leg.runners.length, 5))
      .map((runner) => runner.split);

    // only if there are valid splits for this leg
    if (selected.length > 0) {
      leg.idealSplit = Math.round(selected.reduce(sum, 0) / selected.length);

      if (leg.idealSplit < 0 || isNaN(leg.idealSplit)) {
        console.log("invalid ideal split calculated for leg " + code, leg.idealSplit, selected);
        leg.idealSplit = 30;
      }
    }

    // only if there are valid splits for this leg
    if (leg.runners.length > 0) {
      const fastestSplit = leg.runners[0].split;
      leg.fastestSplit = fastestSplit;
      leg.runners[0].splitBehind = 0;
      leg.runners.slice(1).forEach((runner) => {
        runner.splitBehind = runner.split - fastestSplit;
      });

      leg.runners[0].splitRank = 1;

      leg.runners.forEach((runner, idx, arr) => {
        if (idx > 0) {
          if (runner.split === arr[idx - 1].split) {
            runner.splitRank = arr[idx - 1].splitRank;
          } else {
            runner.splitRank = idx + 1;
          }
        }

        if (leg.idealSplit) {
          runner.performanceIndex = Math.round(((1.0 * leg.idealSplit) / runner.split) * 100);
        } else {
          console.log("cannot calculate performance index for runner ", runner.fullName, " on leg ", code);
        }
      });
    }
  });
}