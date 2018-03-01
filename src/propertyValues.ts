import { fetchRows } from "./fetch";
import { CharSet } from "chardata-charset";

export async function fetchValues(source: string) {
    const valueCodePointRanges = new Map<string, [number, number][]>();
    for (const [codePointRange, values] of await fetchRows(source)) {
        const codePoints = codePointRange.split("..");
        const min = parseInt(codePoints[0], 16);
        const max = codePoints.length > 1 ? parseInt(codePoints[1], 16) : min;
        for (const value of values.trim().split(" ")) {
            let ranges = valueCodePointRanges.get(value);
            if (!ranges) valueCodePointRanges.set(value, ranges = []);
            ranges.push([min, max]);
        }
    }

    return new Map(convert(valueCodePointRanges));
}

function* convert(iterable: Iterable<[string, [number, number][]]>) {
    for (const [key, value] of iterable) {
        yield [key, CharSet.from(value)] as [string, CharSet];
    }
}