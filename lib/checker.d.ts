import { Column, Enum, Output, Project, Ref, Table, TableGroup, TableIndices } from "./types";
export declare const check: (input: Output) => NormalizedOutput;
export type NormalizedTable = {
    actual: Table;
    columns: Column[];
    indices?: TableIndices;
    options: Record<string, string>;
};
export type NormalizedGroup = {
    actual: TableGroup;
    tables: NormalizedTable[];
    options: Record<string, string>;
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
