const { parseTime, formatTime } = require('./time');
const { reorganize } = require('./reorganize');


function invalidTime(time) {
  return !time || time < 0;
}

function validTime(time) {
  return !invalidTime(time);
}
  
function sum(a1, a2) {
  return a1 + a2;
}

function defineCourses(runners) {
  let courses = { };
  runners.forEach(runner => {
    let course = defineCourse(runner);
    if (!courses[course]) {
      courses[course] = {
        code: course,
        runners: [ runner.id ]
      };
    } else {
      courses[course].runners.push(runner.id);
    }
  });
  return Object.keys(courses).map(key => courses[key]);
}

function defineCourse(runner) {
  return 'St,' + runner.splits.map(split => split.code).join(',');
}

function defineLegs(runners) {
  let result = { };

  runners.filter(runner => runner.splits.length > 0).forEach(runner => {
    runner.splits.forEach((split, idx) => {
      if (validTime(split.split)) {
        let from = idx === 0 ? 'St' : runner.splits[idx - 1].code;
        let code = from + '-' + split.code;
        addRunnerToLeg(result, code, runner, split.split);
      }
    });
  });

  return result;
}

function addRunnerToLeg(legs, code, runner, split) {
  let leg = legs[code];
  if (!leg) {
    leg = legs[code] = createLeg(code);
  }
  
  leg.runners.push({
    id: runner.id,
    fullName: runner.fullName,
    split: split
  });
}

function createLeg(code) {
  return {
    code: code,
    runners: []
  };
}

function defineRunners(runners) {
  return runners.map(function(runner) {
    return {
        id: runner.id,
        fullName: runner.fullName,
        time: runner.time,
        yearOfBirth: runner.yearOfBirth,
        city: runner.city,
        club: runner.club,
        splits: runner.splits.map(function(split, idx) {
          var splitTime = null;
          if (split.time === '-') {
            splitTime = '-';
          } else if (idx === 0) {
            splitTime = parseTime(split.time);
          } else {
            if (parseTime(split.time) === null || parseTime(runner.splits[idx - 1].time) === null) {
              splitTime = '-';
            } else {
              splitTime = parseTime(split.time) - parseTime(runner.splits[idx - 1].time);
            }
          }
          
          return {
            code: split.code,
            time: split.time,
            split: splitTime
          };
        })
    };
  });
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
function defineLegProperties(legs) {
  Object.keys(legs).forEach(code => {
    let leg = legs[code];
    leg.runners.sort(function(r1, r2) {
      return r1.split - r2.split;
    });
      
    // calculate the ideal time: take up to 5 fastest on that leg 
    let selected = leg.runners.slice(0, Math.min(leg.runners.length, 5)).map(runner => runner.split);
    
    // only if there are valid splits for this leg
    if (selected.length > 0) {
      leg.idealSplit = Math.round(selected.reduce(sum) / selected.length);
    }
      
    // only if there are valid splits for this leg
    if (leg.runners.length > 0) {
      leg.fastestSplit = leg.runners[0].split;
      leg.runners[0].splitBehind = '0:00';
      leg.runners.slice(1).forEach(runner => {
        runner.splitBehind = runner.split - leg.fastestSplit;
      });
      
      leg.runners[0].splitRank = 1;
      leg.runners.forEach((runner, idx, arr) => {
        if (idx > 0) {
          if (runner.split === arr[idx - 1].split) {
            runner.splitRank = arr[idx - 1].splitRank;
          } else {
            runner.splitRank = idx + 1;
          }
          runner.performanceIndex = Math.round(1.0 * leg.idealSplit / runner.split * 100);
        }
      });
    }    
  });
}

/**
 * Calculates the weight of each leg regarding the passed in idealTime.
 * 
 * @param {*} legs 
 * @param {*} idealTime 
 */
function defineLegWeight(legs, idealTime) {
  Object.keys(legs).forEach((code) => {
    let leg = legs[code];
    leg.weight = leg.idealSplit / idealTime;
  });
}

function legCode(splits, idx) {
  if (idx === 0) {
    return 'St-' + splits[0].code;
  } else {
    return splits[idx - 1].code + '-' + splits[idx].code;
  }
}

/**
 * Assigns the following property to every valid leg of a runner.
 * 
 * - splitBehind: how much time behind the faster runner
 * - splitRank: rank on corresponding leg
 * - leg: code of leg
 * 
 * @param {*} runners 
 * @param {*} legs 
 */
function assignLegInfoToSplits(runners, legs) {
  runners.forEach(runner => {
    runner.splits.filter(s => validTime(s.split)).forEach((split, idx) => {
      let code = legCode(runner.splits, idx);
      let leg = legs[code];

      if (!leg) {
        throw 'leg with code ' + code + ' not defined!';
      }

      split.leg = leg.code;

      let legRunner = leg.runners.find(r => r.id === runner.id);
      
      split.idealBehind = legRunner ? legRunner.split - leg.idealSplit : '-';
      split.supermanBehind = legRunner ? legRunner.split - leg.fastestSplit : '-';
      split.splitBehind = legRunner ? legRunner.splitBehind : '-';
      split.splitRank = legRunner ? legRunner.splitRank : null;
      split.performanceIndex = legRunner ? legRunner.performanceIndex : null;
      split.weight = leg.weight;
    });
  });
}

function rank(runners) {
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

class RankingBuilder {

  constructor(runners) {
    runners.forEach((runner, idx) => {
      for (let i = 0; i < runner.splits.length; i++) {
        let split = runner.splits[i];
        if (i === 0 && validTime(split.time)) {
          split.split = parseTime(split.time);
        } else if (i > 0) {
          let previousSplit = runner.splits[i - 1];
          if (validTime(split.time) && validTime(previousSplit.time)) {
            split.split = parseTime(split.time) - parseTime(previousSplit.time);
          }
        }
      }
    });

    this.courses = defineCourses(runners);
    this.legs = defineLegs(runners);
    this.runners = defineRunners(runners);
  
    defineLegProperties(this.legs);

    // calculate the ideal time [s]
    this.idealTime = Object.keys(this.legs).map(code => this.legs[code].idealSplit).reduce(sum);

    // each leg's weight is calculated regarding as a ratio of the ideal split time to the ideal time
    defineLegWeight(this.legs, this.idealTime);

    // now assing the leg information (such as idealTime, weight, ...) to the individual splits of the runners
    assignLegInfoToSplits(this.runners, this.legs);

    
    this.runners.forEach(runner => {
      let behind = 0;
      let supermanBehind = 0;
      let weightSum = 0;
      runner.splits.forEach(split => {
        behind += split.idealBehind;
        supermanBehind += split.supermanBehind;
        split.overallIdealBehind = behind;
        split.overallSupermanBehind = supermanBehind;
        split.position = weightSum;

        weightSum += split.weight;
      });
    });

    // function of function calculating the time at an arbitrary position for a given runner
    let timeFn = (runner) => (pos) => {
      if (pos === 0) {
        return 0;
      } else if (pos >= 1) {
        return parseTime(runner.time);
      }

      let idx = 0;
      let weightSum = 0;
      for (idx = 0; idx < runner.splits.length; idx++) {
        let split = runner.splits[idx];
        if (weightSum + split.weight > pos) {
          break;
        }
        weightSum += split.weight;
      }

      let prev = runner.splits[idx - 1];
      let next = runner.splits[idx];

      let prevTime = parseTime(prev.time);
      let nextTime = parseTime(next.time);
      return prevTime + (pos - prev.position) / (next.position - prev.position) * (nextTime - prevTime);
    };

    let timesAtPosition = (pos) => {
      return this.runners.map(runner => { return { id: runner.id, time: timeFn(runner)(pos) }; });
    };

    this.runners.forEach(runner => {
      runner.splits.forEach(split => {
        let times = timesAtPosition(split.position + split.weight).filter(entry => entry.time !== null && entry.time > 0);
        times.sort((t1, t2) => t1.time - t2.time);

        let rank = 1;
        let fastestTime = times[0].time;

        let lastTime = parseTime(times[0].time);
        for (let idx = 0; idx < times.length; idx++) {
          let entry = times[idx];  

          if (lastTime < parseTime(entry.time)) {
            rank = idx;
          }

          if (runner.id === entry.id) {
            split.overallRank = rank;
            split.overallBehind = formatTime(entry.time - fastestTime);
            break;
          }
        }    
      });
    });

    console.log(this.runners[1]);

    // calculate the overall rank
    rank(this.runners);
  }

  getCourses() {
    return this.courses;
  }

  getLeg(code) {
    return this.legs[code];
  }

  getLegs() {
    return Object.keys(this.legs).map(code => this.legs[code]);
  }

  getRanking() {
    let runners = this.runners.map(runner => { return { ...runner } });

 
    /*

    for each runner we need the following function

    f(pos) => timeBehindIdeal

    using this function it will be possible to calculate the following properties

    f(runner, split) => {
      overallRank   // the rank the current position
      idealBehind   // time behind ideal
    }

    the first function

     */
  }
}

module.exports.RankingBuilder = RankingBuilder;


/*
  /* depends on ordered courses!
  Object.keys(results.legs).forEach((code, idx) => {
    let leg = result.legs[code];    
    if (idx === 0) {
      leg.fastestTime = formatTime(leg.fastestSplit);
      leg.idealTime = formatTime(leg.idealSplit);
    } else {
      leg.fastestTime = formatTime(parseTime(result.legs[idx - 1].fastestTime) + leg.fastestSplit);
      leg.idealTime = formatTime(parseTime(result.legs[idx - 1].idealTime) + leg.idealSplit);
    }
  });
    
  result.runners.forEach(function(runner) {
    // calculate overall time behind leader
    runner.splits.forEach(function(split, splitIdx) {
      if (!invalidTime(split.time)) {
        let leader = result.runners.map(function(r) {
          return {
            time: r.splits[splitIdx].time,
            rank: r.splits[splitIdx].overallRank
          };
        }).find(function(split) {
          return split.rank === 1;
        });
          
        // no leader for this leg?!
        if (leader) {
          let leaderTime = leader.time;
          if (parseTime(split.time) !== null) {
            split.overallBehind = formatTime(parseTime(split.time) - parseTime(leaderTime));
            split.fastestBehind = formatTime(parseTime(split.time) - parseTime(result.legs[splitIdx].fastestTime));
            split.idealBehind = formatTime(parseTime(split.time) - parseTime(result.legs[splitIdx].idealTime));
          } else {
            split.overallBehind = '-';
            split.fastestBehind = '-';
            split.idealBehind = '-';
          }
        }
      }
    });
    
    // performance index for split
    runner.splits.filter(split => split.split != '-' && split.split != 's' && split.split != '0:00').forEach(split => {
      let leg = findLeg(legs, split.leg);
      split.perfidx = Math.round(1.0 * leg.idealSplit / parseTime(split.split) * 100);
    }); 
  });
    
  return result;
}
*/