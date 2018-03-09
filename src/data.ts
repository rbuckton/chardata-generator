import * as os from "os";
import * as path from "path";
import * as fs from "fs";

export async function readUserFile(file: string) {
    if (path.isAbsolute(file)) throw new Error(`Path may not be absolute.`);
    const configfile = path.resolve(os.homedir(), ".chardata", file);
    const text = await readFileAsync(configfile);
    return text;
}

export async function writeUserFile(file: string, data: string) {
    if (path.isAbsolute(file)) throw new Error(`Path may not be absolute.`);
    const configfile = path.resolve(os.homedir(), ".chardata", file);
    try {
        await writeFileAsync(configfile, data);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            await mkdirpAsync(path.dirname(configfile));
            await writeFileAsync(configfile, data);
            return;
        }
        throw e;
    }
}

export async function createUserFileReadStream(file: string) {
    if (path.isAbsolute(file)) throw new Error(`Path may not be absolute.`);
    const configfile = path.resolve(os.homedir(), ".chardata", file);
    return await createReadStreamAsync(configfile);
}

export async function createUserFileWriteStream(file: string) {
    if (path.isAbsolute(file)) throw new Error(`Path may not be absolute.`);
    const configfile = path.resolve(os.homedir(), ".chardata", file);
    try {
        return await createWriteStreamAsync(configfile);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            await mkdirpAsync(path.dirname(configfile));
            return await createWriteStreamAsync(configfile);
        }
        throw e;
    }
}

function readFileAsync(file: string) {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(file, { encoding: "utf8" }, (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });
}

function writeFileAsync(file: string, data: string) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(file, data, { encoding: "utf8" }, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function createReadStreamAsync(file: string) {
    return new Promise<fs.ReadStream>((resolve, reject) => {
        const stream = fs.createReadStream(file, { encoding: "utf8" });
        stream.on("open", () => resolve(stream));
        stream.on("error", reject);
    });
}

function createWriteStreamAsync(file: string) {
    return new Promise<fs.WriteStream>((resolve, reject) => {
        const stream = fs.createWriteStream(file, { encoding: "utf8" });
        stream.on("open", () => resolve(stream));
        stream.on("error", reject);
    });
}

function mkdirAsync(file: string) {
    return new Promise<void>((resolve, reject) => {
        fs.mkdir(file, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}

async function mkdirpAsync(file: string) {
    try {
        await mkdirAsync(file);
    }
    catch (e) {
        if (e.code === "EEXIST") return;
        if (e.code === "ENOENT") {
            const dirname = path.dirname(file);
            if (dirname !== file) {
                await mkdirpAsync(dirname);
                try {
                    await mkdirAsync(file);
                }
                catch (e) {
                    if (e.code === "EEXIST") return;
                    throw e;
                }
                return;
            }
        }
        throw e;
    }
}