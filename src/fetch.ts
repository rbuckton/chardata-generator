import * as http from "http";
import * as es from "event-stream";

const USE_LOCAL = true;
const pathRegExp = /\/ucd\/(.*)$/;

export function fetchRows(url: string) {
    if (USE_LOCAL) {
        const match = pathRegExp.exec(url);
        if (match) return readRows(`C:/Users/rbuckton/Downloads/UCD/${match[1]}`);
    }
    return new Promise<string[][]>((resolve, reject) => {
        http.get(url, response => {
            const rows: string[][] = [];
            response
                .setEncoding("utf8")
                .pipe(es.split(/\n/))
                .on("data", (line: string) => {
                    line = line.replace(/#.*$/, "").trim();
                    if (line) rows.push(line.split(/\s*;\s*/g));
                })
                .on("end", () => {
                    resolve(rows);
                })
                .on("error", reject);
        }).on("error", reject);
    });
}

import * as fs from "fs";

export function readRows(file: string) {
    return new Promise<string[][]>((resolve, reject) => {
        const rows: string[][] = [];
        fs.createReadStream(file)
            .setEncoding("utf8")
            .pipe(es.split(/\n/))
            .on("data", (line: string) => {
                line = line.replace(/#.*$/, "").trim();
                if (line) rows.push(line.split(/\s*;\s*/g));
            })
            .on("end", () => {
                resolve(rows);
            })
            .on("error", reject);
    });
}