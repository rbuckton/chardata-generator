import { fetchRows } from "./fetch";

export interface PropertyAlias {
    readonly short: string;
    readonly long: string;
    readonly all: ReadonlyArray<string>;
}

export interface PropertyValueAlias {
    readonly numeric: number | undefined;
    readonly short: string;
    readonly long: string;
    readonly all: ReadonlyArray<string>;
}

export class PropertyAliases {
    private _aliases: ReadonlyArray<PropertyAlias>;
    private _lookup = new Map<string, PropertyAlias>();
    private _valueLookup = new Map<string, PropertyValueAliases>();

    constructor(propertyAliases: ReadonlyArray<PropertyAlias>, propertyValueAliases: ReadonlyMap<string, ReadonlyArray<PropertyValueAlias>>) {
        this._aliases = propertyAliases;
        for (const alias of propertyAliases) {
            for (const name of alias.all) {
                this._lookup.set(name, alias);
            }
        }

        for (const [property, aliases] of propertyValueAliases) {
            this._valueLookup.set(property, new PropertyValueAliases(property, aliases));
        }
    }

    public get size() {
        return this._aliases.length;
    }

    public hasProperty(property: string) {
        return this._lookup.has(property);
    }

    public hasPropertyValue(property: string, value: string) {
        const valueAliases = this.getPropertyValues(property);
        return valueAliases ? valueAliases.has(value) : false;
    }

    public get(alias: string) {
        return this._lookup.get(alias);
    }

    public getPropertyValues(property: string) {
        const valueAliases = this._valueLookup.get(property);
        if (valueAliases) return valueAliases;
        const propertyAlias = this.get(property);
        if (propertyAlias) {
            for (const name of propertyAlias.all) {
                const valueAliases = this._valueLookup.get(name);
                if (valueAliases) return valueAliases;
            }
        }
    }

    public getPropertyValue(property: string, value: string) {
        const valueAliases = this.getPropertyValues(property);
        return valueAliases && valueAliases.get(value);
    }

    public short(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.short : undefined;
    }

    public long(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.long : undefined;
    }

    public all(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.all : undefined;
    }

    public * propertyAliases() {
        yield* this._aliases;
    }

    public propertyValueAliases(): IterableIterator<PropertyValueAliases>;
    public propertyValueAliases(property: string): IterableIterator<PropertyValueAlias>;
    public * propertyValueAliases(property?: string) {
        if (property) {
            const valueAliases = this.getPropertyValues(property);
            if (valueAliases) yield * valueAliases.propertyValueAliases();
        }
        else {
            yield* this._valueLookup.values();
        }
    }

    [Symbol.iterator]() {
        return this.propertyAliases();
    }
}

export class PropertyValueAliases {
    private _property: string;
    private _aliases: ReadonlyArray<PropertyValueAlias>;
    private _lookup: Map<string, PropertyValueAlias>;

    constructor(property: string, aliases: ReadonlyArray<PropertyValueAlias>) {
        this._property = property;
        this._aliases = aliases;
        this._lookup = new Map<string, PropertyValueAlias>();
        for (const alias of aliases) {
            for (const name of alias.all) {
                this._lookup.set(name, alias);
            }
        }
    }

    public get property() {
        return this._property;
    }

    public get size() {
        return this._aliases.length;
    }

    public has(value: string) {
        return this._lookup.has(value);
    }

    public get(value: string) {
        return this._lookup.get(value);
    }

    public short(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.short : undefined;
    }

    public long(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.long : undefined;
    }

    public all(value: string) {
        const alias = this._lookup.get(value);
        return alias ? alias.all : undefined;
    }


    public * propertyValueAliases() {
        yield* this._aliases;
    }

    [Symbol.iterator]() {
        return this.propertyValueAliases();
    }
}

export async function fetchAliases(version: string) {
    const propertyValueAliases = await fetchPropertyValueAliases(version);
    const propertyAliases = await fetchPropertyAliases(version);
    return new PropertyAliases(propertyAliases, propertyValueAliases);
}

async function fetchPropertyAliases(version: string) {
    const rows = await fetchRows(`http://www.unicode.org/Public/${version}/ucd/PropertyAliases.txt`);
    const propertyAliases: PropertyAlias[] = [];
    for (const row of rows) {
        const [short, long] = row;
        propertyAliases.push({ short, long, all: row });
    }
    return propertyAliases;
}

async function fetchPropertyValueAliases(version: string) {
    const rows = await fetchRows(`http://www.unicode.org/Public/${version}/ucd/PropertyValueAliases.txt`);
    const propertyValueAliases = new Map<string, PropertyValueAlias[]>();
    for (const row of rows) {
        let numeric: number | undefined;
        let short: string | undefined;
        let long: string | undefined;
        let others: string[];
        const propertyShort = row[0];
        if (propertyShort === "ccc") {
            let numericString: string;
            [, numericString, short, long, ...others] = row;
            numeric = +numericString;
        }
        else {
            [, short, long, ...others] = row;
        }

        let valueAliases = propertyValueAliases.get(propertyShort);
        if (!valueAliases) propertyValueAliases.set(propertyShort, valueAliases = []);

        valueAliases.push({ numeric, short, long, all: [short, long, ...others] });
    }
    return propertyValueAliases;
}