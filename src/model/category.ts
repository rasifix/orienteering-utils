import { Runner } from "./runner";

export interface Category {
    name: string;
    distance?: number;
    ascent?: number;
    controls: number;
    runners: Runner[];
}