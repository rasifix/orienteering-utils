export interface Ranking {
    /* indexed information about runners */
    runners: { [key:string]: RunnerInfo },

    /* extracted information about all legs found */
    legs: { [key:string]: Leg },

    /* this is the overall ranking of the given runners */
    ranking: RankingEntry[]
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

export interface RunnerInfo {
    fullName: string;
    club: string;
    city: string;
    category: string;
    course: string[];
    startTime: string;
}


const sample:Ranking = {
    runners: {
        "22": {
            fullName: "Hans Dobeli",
            club: "OLG Hopp Hopp",
            city: "Witzwil",
            category: "HB",
            startTime: "01:33:00",
            course: [ "St", "31", "32", "33", "Zi" ]
        },
        "23": {
            fullName: "Fritz Berger",
            club: "OLV Chapf",
            city: "Langnau",
            category: "HB",
            startTime: "00:55:00",
            course: [ "St", "31", "32", "33", "Zi" ]
        }
    },
    legs: {
        "St-31": {
            from: "St",
            to: "31",
            ranking: [
                {
                    rank: 1,
                    time: "02:33",
                    runnerRef: "22"
                },
                {
                    rank: 2,
                    time: "08:02",
                    runnerRef: "23"
                }
            ]
        }
    },
    ranking: [
        {
            rank: 1,
            runnerRef: "22",
            time: "38:22"
        },
        {
            rank: 2,
            runnerRef: "23",
            time: "46:44"
        }
    ]
}
