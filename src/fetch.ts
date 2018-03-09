import * as fs from "fs";
import * as http from "http";
import * as es from "event-stream";
import * as path from "path";
import { URL } from "url";
import { readUserFile, writeUserFile, createUserFileReadStream, createUserFileWriteStream } from "./data";
import { Readable } from "stream";
import { createHash } from "crypto";

interface RequestCache {
    [url: string]: { headers: any; file: string; } | undefined;
}

let requestCache: RequestCache | undefined;

async function readRequestCache() {
    if (requestCache) return requestCache;
    try {
        const text = await readUserFile("cache.json");
        return requestCache = JSON.parse(text) as RequestCache;
    }
    catch (e) {
        if (e.code === "ENOENT") return {} as RequestCache;
        throw e;
    }
}

function getUniqueName(cache: RequestCache, url: string) {
    const uri = new URL(url);
    const name = path.join("cache", uri.hostname, uri.pathname.slice(1));
    const dirname = path.dirname(name);
    const basename = path.basename(name);
    let file = name;
    while (exists(file)) {
        file = path.join(dirname, (Math.random() * 1000).toString(16) + basename);
    }
    return file;

    function exists(file: string) {
        file = file.toUpperCase();
        for (const key in cache) {
            const entry = cache[key];
            if (entry && entry.file.toUpperCase() === file) return true;
        }
        return false;
    }
}

async function writeRequestCache(cache: RequestCache) {
    const text = JSON.stringify(requestCache = cache, undefined, "  ");
    await writeUserFile("cache.json", text);
}

function get(url: string, headers: http.OutgoingHttpHeaders) {
    return new Promise<http.IncomingMessage>((resolve, reject) => {
        const uri = new URL(url);
        http.get({ hostname: uri.hostname, path: uri.pathname, headers }, resolve).on("error", reject);
    });
}

export async function fetchRows(url: string) {
    const stream = await fetch(url);
    return await new Promise<string[][]>((resolve, reject) => {
        const rows: string[][] = [];
        stream
            .pipe(es.split(/\n/))
            .on("data", (line: string) => {
                line = line.replace(/#.*$/, "").trim();
                if (line) rows.push(line.split(/\s*;\s*/g));
            })
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}

export async function fetch(url: string) {
    let stream: Readable | undefined;
    let response: http.IncomingMessage | undefined;
    const headers: http.OutgoingHttpHeaders = {};
    const cache = await readRequestCache();
    const entry = cache[url];
    if (entry) {
        if (entry.headers["etag"]) headers["If-None-Match"] = entry.headers["etag"];
        if (entry.headers["last-modified"] || entry.headers["date"]) headers["If-Modified-Since"] = entry.headers["last-modified"] || entry.headers["date"];
        response = await get(url, headers);
        if (response.statusCode === 304) {
            try {
                stream = await createUserFileReadStream(entry.file);
                stream.setEncoding("utf8");
            }
            catch (e) {
                delete cache[url];
                response = undefined;
            }
        }
    }
    if (!response || !stream) {
        response = await get(url, { });
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            stream = response.setEncoding("utf8");
            const entry = cache[url];
            const file = entry && entry.file || getUniqueName(cache, url);
            const writable = await createUserFileWriteStream(file);
            await new Promise<void>((resolve, reject) => stream!.pipe(writable, { end: true }).on("close", resolve).on("error", reject));
            cache[url] = { headers: response.headers, file };
            await writeRequestCache(cache);
            stream = await createUserFileReadStream(file);
            stream.setEncoding("utf8");
        }
        else {
            throw new Error(response.statusMessage);
        }
    }
    return stream;
}