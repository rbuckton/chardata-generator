import * as fs from "fs";
import { install } from "source-map-support";
import { parseCommandLine, CommandLine } from "power-options";
import * as path from "path";
import { fetchValues } from "./propertyValues";
import { Writer } from "./writer";
import { fetchAliases } from "./aliases";
import { files } from "./files";

const version = "6.2.0";
const commandLine = new CommandLine({
    color: true,
    package: path.resolve(__dirname, "../package.json"),
    options: {
        "property": {
            type: "string",
            description: `The Unicode Character Database property to read:\n${Array.from(files.keys(), key => `- ${key}`).join("\n")}`,
            required: true,
            in: Array.from(files.keys()),
            position: 0,
        },
        "out": {
            type: "string",
            description: "output file",
            param: "generated.ts",
            required: true,
            position: 1
        },
        "version": {
            type: "string",
            description: "Unicode version",
            defaultValue: version
        }
    }
});

async function main() {
    const { options, error, help } = commandLine.parse<{ out: string, property: string, version: string }>(process.argv.slice(2));
    if (error) {
        commandLine.printHelp();
        commandLine.printError(error);
        process.exit(1);
        return;
    }

    if (help) {
        commandLine.printHelp();
        process.exit(0);
        return;
    }

    const aliases = await fetchAliases(options.version);
    const file = files.get(options.property)!;
    const source = `http://www.unicode.org/Public/${version}/ucd/${file.path}`;
    const valueCodePointRanges = await fetchValues(source);

    const writer = new Writer();
    writer.writeln(`// Unicode ${version} ${options.property}`);
    writer.writeln(`// Derived from: ${source}`);
    if (file.kind === "binary-value" || file.kind === "non-binary-value") {
        writer.writeln(`import { CharSet } from "ucdata-charset";`);
        writer.writeln();
        writer.writePropertyValues(valueCodePointRanges,
            file.kind === "non-binary-value" ? aliases.getPropertyValues(file.alias) :
            aliases);
    }
    else if (file.kind === "property-alias") {
        writer.writePropertyAliases([...aliases.propertyAliases()]);
    }
    else if (file.kind === "property-value-alias") {
        writer.writePropertyValueAliases([...aliases.propertyValueAliases()]);
    }

    fs.writeFileSync(options.out, writer.toString(), "utf8");
}

main().catch(console.error);
