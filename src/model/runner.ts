import { Split } from "./split";

export interface Runner {
  id: number;
  category: string;
  rank?: number;
  name: string;
  firstName: string;
  fullName: string;
  yearOfBirth?: string;
  sex?: Sex;
  city?: string;
  nation?: string;
  club?: string;
  time?: string;
  startTime: string;
  splits: Split[];
}

export enum Sex {
    male = 'm',
    female = 'f'
}