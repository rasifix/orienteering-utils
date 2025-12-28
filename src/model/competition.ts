import { Category } from "./category";

export interface Competition {
    name: string;
    map?: string;
    date: string;
    startTime: string;
    categories: Category[];
}