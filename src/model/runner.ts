import { Split } from "./split";

export interface Runner {
  id: string;
  category: string;
  rank?: number;
  fullName: string;
  yearOfBirth?: string;
  sex?: Sex;
  city?: string;
  nation?: string;
  club?: string;
  time?: string;
  startTime: string;
  startNumber?: string;
  runOrLeg?: number;
  team?: string;
  splits: Split[];
}

export enum Sex {
    male = 'm',
    female = 'f'
}