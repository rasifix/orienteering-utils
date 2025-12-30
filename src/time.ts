function pad(value:number) {
    return value < 10 ? '0' + value : value;
};
  
var regex = /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/;
  
/**
 * Parses a time string that must satisfy the following regex:
 * 
 * /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/
 * 
 * @param str input string
 * @returns the number of seconds in the given input string or null if input is not parseable
 */
export function parseTime(str:string|undefined):number|undefined {
    if (!str) {
        return undefined;
    } else if (typeof str !== 'string') {
        return undefined;
    } else if (!regex.test(str)) {
        return undefined;
    }
  
    var split = str.split(":");
    var result:number = NaN;
    if (split.length === 2) {
        var negative = split[0][0] === '-';
        var minutes = parseInt(split[0], 10);
        result = (negative ? -1 : 1) * (Math.abs(minutes) * 60 + parseInt(split[1], 10));
    } else if (split.length === 3) {
        result = parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseInt(split[2], 10);
    }
    
    return isNaN(result) ? undefined : result;
}
  
export function formatTime(seconds:number|undefined) {
    if (!seconds) {
        return undefined;
    }
    const sign = seconds < 0 ? '-' : '';
    const value = Math.abs(Math.round(seconds));
    if (value >= 3600) {
        return sign + Math.floor(value / 3600) + ":" + pad(Math.floor(value / 60) % 60) + ":" + pad(value % 60);
    } else {
        return sign + Math.floor(value / 60) + ":" + pad(value % 60);
    }
}
