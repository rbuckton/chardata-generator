import { CharSet } from "chardata-charset";
import { PropertyValueAliases, PropertyAliases, PropertyAlias, PropertyValueAlias } from "./aliases";

export class Writer {
    private text = "";
    private indentDepth = 0;
    private indentPending = true;

    public increaseIndent() {
        this.indentDepth++;
    }

    public decreaseIndent() {
        this.indentDepth--;
    }

    public write(text: string) {
        if (text) {
            if (this.indentPending) {
                for (let i = 0; i < this.indentDepth; i++) {
                    this.text += "    ";
                }
                this.indentPending = false;
            }
            this.text += text;
        }
    }

    public writeln(text?: string) {
        if (text) this.write(text);
        this.text += "\n";
        this.indentPending = true;
    }

    public toString() {
        return this.text;
    }

    public writePropertyValues(valueCodePointRanges: ReadonlyMap<string, CharSet>, aliases?: PropertyAliases | PropertyValueAliases) {
        const array = Array.from(valueCodePointRanges).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? +1 : 0);
        for (const [value, codePoints] of array) {
            const long = aliases && aliases.long(value) || value;
            this.writePropertyValue(long, codePoints);
            if (aliases) {
                this.writePropertyValueAliasExports(long, aliases);
            }
        }
        this.writeGetCharSet(array, aliases);
    }

    private writePropertyValue(propertyValue: string, codePointRanges: CharSet) {
        this.writeln(`export const ${propertyValue} = new CharSet(${JSON.stringify(codePointRanges)});`);
    }

    private writePropertyValueAliasExports(propertyValue: string, aliases: PropertyAliases | PropertyValueAliases) {
        const all = aliases.all(propertyValue);
        if (!all) return;
        let first = true;
        for (const name of all) {
            if (name === propertyValue) continue;
            if (first) {
                this.write(`export { `);
                first = false;
            }
            else {
                this.write(`, `);
            }
            this.write(`${propertyValue} as ${name}`);
        }
        if (!first) {
            this.writeln(` };`);
        }
    }

    private writeGetCharSet(valueCodePointRanges: [string, CharSet][], aliases?: PropertyAliases | PropertyValueAliases) {
        this.writeln(`export default function (value: string): CharSet | undefined {`);
        this.increaseIndent();
        this.writeln(`switch (value) {`);
        this.increaseIndent();
        for (const [value] of valueCodePointRanges) {
            const names = aliases && aliases.all(value) || [value];
            const long = aliases && aliases.long(value) || value;
            for (const name of names) {
                this.writeln(`case "${name}":`);
            }
            this.increaseIndent();
            this.writeln(`return ${long};`);
            this.decreaseIndent();
        }

        this.decreaseIndent();
        this.writeln(`}`);
        this.writeln(`return undefined;`);
        this.decreaseIndent();
        this.writeln(`}`);
    }

    public writePropertyAliases(aliases: ReadonlyArray<PropertyAlias>) {
        this.writePropertyAliasesFunction(aliases, "long");
        this.writePropertyAliasesFunction(aliases, "short");
        this.writePropertyAliasesFunction(aliases, "all");
    }

    private writePropertyAliasesFunction(aliases: ReadonlyArray<PropertyAlias>, name: string) {
        this.writeln(`export function ${name}(property: string) {`);
        this.increaseIndent();
        this.writeln(`switch (property) {`);
        this.increaseIndent();
        switch (name) {
            case "long":
                this.writeLong(aliases);
                break;
            case "short":
                this.writeLong(aliases);
                break;
            case "all":
                this.writeLong(aliases);
                break;
        }
        this.decreaseIndent();
        this.writeln(`}`);
        this.decreaseIndent();
        this.writeln(`}`);
    }

    public writePropertyValueAliases(aliases: ReadonlyArray<PropertyValueAliases>) {
        this.writePropertyValueAliasesFunction(aliases, "long");
        this.writePropertyValueAliasesFunction(aliases, "short");
        this.writePropertyValueAliasesFunction(aliases, "all");
    }

    private writePropertyValueAliasesFunction(aliases: ReadonlyArray<PropertyValueAliases>, name: string) {
        this.writeln(`export function ${name}(propertyShort: string, value: string) {`);
        this.increaseIndent();
        this.writeln(`switch (propertyShort) {`);
        this.increaseIndent();
        for (const property of aliases) {
            this.writeln(`case "${property.property}":`);
            this.increaseIndent();
            this.writeln(`switch (value) {`);
            this.increaseIndent();
            switch (name) {
                case "long":
                    this.writeLong([...property.propertyValueAliases()]);
                    break;
                case "short":
                    this.writeLong([...property.propertyValueAliases()]);
                    break;
                case "all":
                    this.writeLong([...property.propertyValueAliases()]);
                    break;
            }
            this.decreaseIndent();
            this.writeln(`}`);
            this.decreaseIndent();
        }
        this.decreaseIndent();
        this.writeln(`}`);
        this.decreaseIndent();
        this.writeln(`}`);
    }

    private writeLong(aliases: ReadonlyArray<PropertyAlias | PropertyValueAlias>) {
        for (const alias of aliases) {
            for (const name of alias.all) {
                this.writeln(`case "${name}":`);
            }
            this.increaseIndent();
            this.writeln(`return ${JSON.stringify(alias.long)};`)
            this.decreaseIndent();
        }
    }

    private writeShort(aliases: ReadonlyArray<PropertyAlias | PropertyValueAlias>) {
        for (const alias of aliases) {
            for (const name of alias.all) {
                this.writeln(`case "${name}":`);
            }
            this.increaseIndent();
            this.writeln(`return ${JSON.stringify(alias.short)};`)
            this.decreaseIndent();
        }
    }

    private writeAll(aliases: ReadonlyArray<PropertyAlias | PropertyValueAlias>) {
        for (const alias of aliases) {
            for (const name of alias.all) {
                this.writeln(`case "${name}":`);
            }
            this.increaseIndent();
            this.writeln(`return ${JSON.stringify(alias.all)};`)
            this.decreaseIndent();
        }
    }
}
