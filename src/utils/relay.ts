// I need functions to process relay data
// in case of relay the event returns Runners with startNumber, runOrLeg, baseCategory, team
// runners of the same team have the same baseCategory and same startNumber
// runOrLeg indicates which leg of the relay the runner is running
// e.g. for a 3-leg relay, there will be runners with runOrLeg 1, 2 and 3
// all runners with runOrLeg 1 belong to the first leg of their team, etc.

import { Runner } from "../model";
import { Ranking, parseRanking } from "./ranking";
import { parseTime, formatTime } from "../time";

export interface Team {
    name: string;
    startNumber: number;
}

/**
 * Extract all unique teams from the given runners.
 * 
 * @param runners the runners to extract teams from
 * @returns a list of unique teams with their name and start number
 */
export function getTeams(runners: Runner[]): Team[] {
    const teams = new Set<Team>();
    runners.forEach(runner => {
        if (runner.team && runner.team.trim().length > 0) {
            teams.add({
                name: runner.team,
                startNumber: runner.startNumber ? parseInt(runner.startNumber) : 0
            });
        }
    });
    return Array.from(teams);
}

/**
 * Create a ranking for a relay event from the given runners. The runners must
 * belong to the same base category.
 * 
 * @param runners the runners to create a ranking from
 * @returns a ranking for the relay event
 */
export function parseRelayRanking(runners: Runner[]): Ranking {
    // Group runners by team (startNumber)
    const teamMap = new Map<string, Runner[]>();
    
    runners.forEach(runner => {
        const team = runner.startNumber || '';
        if (!teamMap.has(team)) {
            teamMap.set(team, []);
        }
        teamMap.get(team)!.push(runner);
    });
    
    // Create combined runners for each team
    const combinedRunners: Runner[] = [];
    
    teamMap.forEach((teamRunners, startNumber) => {
        // Sort runners by runOrLeg to ensure correct order
        teamRunners.sort((a, b) => (a.runOrLeg || 0) - (b.runOrLeg || 0));
        
        // Start with the first leg runner as the base
        const firstRunner = teamRunners[0];
        const combinedRunner: Runner = {
            id: firstRunner.id,
            category: firstRunner.category,
            fullName: teamRunners.map(r => r.fullName).join(' / '),
            club: teamRunners.filter(r => r.club && r.club.trim().length > 0).map(r => r.club).join(' / '),
            startTime: firstRunner.startTime,
            startNumber: startNumber,
            team: firstRunner.team,
            splits: []
        };
        
        // Combine splits from all legs
        let accumulatedTime = 0;
        let previousValid = true
        
        teamRunners.forEach(runner => {
            runner.splits.forEach(split => {
                const splitTime = parseTime(split.time);
                
                if (splitTime !== undefined && splitTime > 0) {
                    // Accumulate time from previous legs
                    const adjustedTime = splitTime + accumulatedTime;
                    
                    // Add the adjusted split
                    combinedRunner.splits.push({
                        code: split.code,
                        time: formatTime(adjustedTime)
                    });
                }
            });
            
            // Accumulate the total time of this leg for the next leg
            if (runner.time) {
                const runnerTotalTime = parseTime(runner.time);
                if (runnerTotalTime !== undefined && runnerTotalTime > 0) {
                    accumulatedTime += runnerTotalTime;
                }
            }
            previousValid = previousValid && (runner.time !== undefined) && parseTime(runner.time) !== undefined;
        });
        
        // Set the final combined time
        combinedRunner.time = previousValid ? formatTime(accumulatedTime) : "DSQ";
        
        combinedRunners.push(combinedRunner);
    });
    
    // Parse the ranking as usual
    return parseRanking(combinedRunners);
}