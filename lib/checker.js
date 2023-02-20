"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizedOutput = exports.check = void 0;
const common_1 = require("./common");
const parser_1 = require("./parser");
const check = (input) => {
    const tables = extract("table", input).map((table) => ({
        actual: table,
        columns: extract("column", table.items),
        indices: extract("indices", table.items)[0],
        options: extract("option", table.items).reduce((acc, i) => ({ ...acc, ...i.option }), {}),
    }));
    const inlinedRefs = tables.flatMap((table) => table.columns.flatMap((column) => {
        const ref = column.settings["ref"];
        if (!ref) {
            return [];
        }
        // create a virtual ref, parse it and add it to the list of refs
        const virtualRef = `Ref: ${(0, common_1.tableName)(table.actual)}.${column.name} ${ref}`;
        return extract("ref", (0, parser_1.parse)(virtualRef));
    }));
    const groupedTables = new Set();
    return new NormalizedOutput({
        project: extract("project", input)[0],
        tables,
        groups: extract("group", input).map((group) => ({
            actual: group,
            tables: extract("table", group.items).map((i) => {
                const name = (0, common_1.tableName)(i);
                const table = resolveTableUnsafe(name, tables);
                if (!groupedTables.add(name)) {
                    throw new Error(`Table ${i.name} belongs to multiple groups`);
                }
                return table;
            }),
        })),
        refs: extract("ref", input)
            .concat(inlinedRefs)
            .map((ref) => ({
            actual: ref,
            fromTable: resolveTableUnsafe((0, common_1.tableName)(ref.from), tables),
            toTable: resolveTableUnsafe((0, common_1.tableName)(ref.to), tables),
        })),
        enums: extract("enum", input).map((e) => ({
            actual: e,
            values: extract("value", e.items).map((v) => v.name),
        })),
    });
};
exports.check = check;
class NormalizedOutput {
    constructor({ project, tables, groups, refs, enums, }) {
        this.project = project;
        this.tables = tables;
        this.groups = groups;
        this.refs = refs;
        this.enums = enums;
    }
    table(id) {
        return resolveTable(id, this.tables);
    }
    ungroupedTables() {
        const groupedTables = new Set(this.groups.flatMap((group) => group.tables.map((t) => (0, common_1.tableName)(t.actual))));
        return this.tables.filter((table) => !groupedTables.has((0, common_1.tableName)(table.actual)));
    }
}
exports.NormalizedOutput = NormalizedOutput;
const resolveTable = (id, tables) => tables.find((t) => (0, common_1.tableName)(t.actual) === id || t.actual.alias === id);
const resolveTableUnsafe = (id, tables) => {
    const table = resolveTable(id, tables);
    if (!table) {
        throw new Error(`Table ${id} does not exist`);
    }
    return table;
};
const extract = (type, entries) => {
    return entries.filter((e) => e.type === type);
};
