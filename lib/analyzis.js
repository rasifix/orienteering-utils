const { parseTime, formatTime } = require('./time');

export function errorTime(runner, options) {
  let thresholdRelative = options.thresholdRelative || 1.2;
  let thresholdAbsolute = options.thresholdAbsolute || 10;

  let perfindices = runner.splits.filter(perfidx => perfidx).map(split => split.perfidx).sort((s1, s2) => s1 - s2 );
  let middle = null;
  if (perfindices.length % 2 === 1) {
    middle = perfindices[Math.floor(perfindices.length / 2)];
  } else {
    middle = (perfindices[perfindices.length / 2] + perfindices[perfindices.length / 2 + 1]) / 2;
  }
  
  let errorTime = 0;
  runner.splits.filter(split => split.split !== '-' && split.split !== 's').forEach(split => {
    let errorFreeTime = Math.round(parseTime(split.split) * (split.perfidx / middle));
    if (parseTime(split.split) / errorFreeTime > thresholdRelative && (parseTime(split.split) - errorFreeTime) > thresholdAbsolute) {        
      split.timeLoss = formatTime(parseTime(split.split) - errorFreeTime);
      errorTime += parseTime(split.timeLoss);
    }
  });

  return formatTime(errorTime);
}
