export type UcdFile = NonBinaryValueFile | BinaryValueFile | PropertyAliasFile | PropertyValueAliasFile;

export interface NonBinaryValueFile {
    kind: "non-binary-value";
    path: string;
    property: string;
    alias: string;
}

export interface BinaryValueFile {
    kind: "binary-value";
    path: string;
}

export interface PropertyAliasFile {
    kind: "property-alias";
    path: string;
}

export interface PropertyValueAliasFile {
    kind: "property-value-alias";
    path: string;
}

export const files = new Map<string, UcdFile>([
    ["General_Category", {
        path: "extracted/DerivedGeneralCategory.txt",
        kind: "non-binary-value",
        property: "General_Category",
        alias: "gc"
    }],
    ["Script", {
        path: "Scripts.txt",
        kind: "non-binary-value",
        property: "Script",
        alias: "sc"
    }],
    ["Script_Extensions", {
        path: "ScriptExtensions.txt",
        kind: "non-binary-value",
        property: "Script_Extensions",
        alias: "sc"
    }],
    ["DerivedCoreProperties", {
        path: "DerivedCoreProperties.txt",
        kind: "binary-value"
    }],
    ["PropList", {
        path: "PropList.txt",
        kind: "binary-value"
    }],
    // ["DerivedAge", {
    //     path: "DerivedAge.txt",
    //     kind: "binary-value"
    // }],
    ["PropertyAliases", {
        path: "PropertyAliases.txt",
        kind: "property-alias"
    }],
    ["PropertyValueAliases", {
        path: "PropertyValueAliases.txt",
        kind: "property-value-alias"
    }]
]);