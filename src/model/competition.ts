import { Category } from "./category";

export interface Competition {
    id?: string;
    name: string;
    map?: string;
    date: string;
    startTime: string;
    categories: Category[];
    relay?: boolean;
}