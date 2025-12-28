import { Competition } from "./model/competition";

export interface Format {

    check(content:string):boolean;

    parse(content:string, options:any):Competition;

    serialize(competition:Competition):string;

}