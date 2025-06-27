"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
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
        const virtualRef = `Ref: ${(0, common_1.fullName)(table.actual)}.${column.name} ${ref}`;
        return extract("ref", (0, parser_1.parse)(virtualRef));
    }));
    const groupedTables = new Set();
    const groups = extract("group", input).map((group) => ({
        actual: group,
        tables: extract("table", group.items).map((i) => {
            const table = resolveTable(i, tables);
            const name = (0, common_1.fullName)(table.actual);
            if (!groupedTables.add(name)) {
                throw new Error(`Table ${i.name} belongs to multiple groups`);
            }
            return table;
        }),
        options: extract("option", group.items).reduce((acc, i) => ({ ...acc, ...i.option }), {}),
    }));
    const ungroupedTables = tables.filter((t) => !groupedTables.has((0, common_1.fullName)(t.actual)));
    const refs = extract("ref", input)
        .concat(inlinedRefs)
        .map((ref) => {
        return {
            actual: ref,
            from: extractColumns(ref.from, tables),
            to: extractColumns(ref.to, tables),
        };
    });
    return {
        project: extract("project", input)[0],
        ungroupedTables,
        groups,
        refs,
        enums: extract("enum", input).map((e) => ({
            actual: e,
            values: extract("value", e.items).map((v) => v.name),
        })),
    };
};
exports.check = check;
const resolveTable = (ref, tables) => {
    const table = tables.find((t) => ref.schema === t.actual.schema &&
        (ref.name === t.actual.name || ref.name === t.actual.alias));
    if (!table) {
        throw new Error(`Table ${(0, common_1.fullName)(ref)} does not exist`);
    }
    return table;
};
const extract = (type, entries) => {
    return entries.filter((e) => e.type === type);
};
const extractColumns = (ref, tables) => {
    const table = resolveTable(ref, tables);
    return {
        table,
        columns: ref.columns.map((c) => {
            const column = table.columns.find((i) => i.name === c);
            if (!column) {
                throw new Error(`Column ${c} does not exist in table ${(0, common_1.fullName)(table.actual)}`);
            }
            return column;
        }),
    };
};
