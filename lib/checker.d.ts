import { Column, Enum, Project, Ref, Table, TableGroup, TableIndices } from "./types";
export declare const check: (input: ({
    type: "comment";
    comment: string;
} | {
    type: "project";
    options: Record<string, string>;
    name: string | null;
} | {
    type: "table";
    name: string;
    settings: Record<string, string | null>;
    schema: string | null;
    alias: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "column";
        data: string;
        name: string;
        settings: Record<string, string | null>;
    } | {
        type: "option";
        option: Record<string, string>;
    } | {
        type: "indices";
        indices: {
            settings: Record<string, string | null>;
            columns: string[];
        }[];
    })[];
} | {
    type: "group";
    name: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "table";
        name: string;
        schema: string | null;
    })[];
} | {
    type: "enum";
    name: string;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "value";
        name: string;
        settings: Record<string, string | null>;
    })[];
} | {
    type: "ref";
    settings: Record<string, string | null>;
    cardinality: ">" | "<" | "-";
    from: {
        name: string;
        columns: string[];
        schema: string | null;
    };
    to: {
        name: string;
        columns: string[];
        schema: string | null;
    };
})[]) => NormalizedOutput;
export type NormalizedTable = {
    actual: Table;
    columns: Column[];
    indices?: TableIndices;
    options: Record<string, string>;
};
export type NormalizedGroup = {
    actual: TableGroup;
    tables: NormalizedTable[];
};
export type NormalizedEnum = {
    actual: Enum;
    values: string[];
};
export type NormalizedRef = {
    actual: Ref;
    from: ReferredColumns;
    to: ReferredColumns;
};
export type ReferredColumns = {
    table: NormalizedTable;
    columns: Column[];
};
export type NormalizedOutput = {
    project?: Project;
    ungroupedTables: NormalizedTable[];
    groups: NormalizedGroup[];
    refs: NormalizedRef[];
    enums: NormalizedEnum[];
};
