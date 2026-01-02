import { formatTime } from "../time";
import { RankingRunner } from "./ranking";

export function errorTime(runner: RankingRunner, options): string {
  const thresholdRelative = options.thresholdRelative || 1.2;
  const thresholdAbsolute = options.thresholdAbsolute || 10;

  const perfindices = runner.splits.filter(perfidx => perfidx).map(split => split.performanceIndex).sort((s1, s2) => s1 - s2 );
  let middle = calculateMedian(perfindices);
  
  let errorTime = 0;
  runner.splits.filter(split => split.splitTime).forEach(split => {
    let errorFreeTime = Math.round(split.splitTime * (split.performanceIndex / middle));
    if (split.splitTime / errorFreeTime > thresholdRelative && (split.splitTime - errorFreeTime) > thresholdAbsolute) {        
      split.timeLoss = split.splitTime - errorFreeTime;
      errorTime += split.timeLoss;
    }
  });

  return formatTime(errorTime);
}

function calculateMedian(perfindices: number[]) {
    if (perfindices.length % 2 === 1) {
        return perfindices[Math.floor(perfindices.length / 2)];
    } else {
        return (perfindices[perfindices.length / 2] + perfindices[perfindices.length / 2 + 1]) / 2;
    }
}
