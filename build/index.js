"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var wiring_1 = __importDefault(require("./wiring"));
var fs_1 = require("fs");
var sync_1 = __importDefault(require("@aduh95/viz.js/sync"));
var parse = wiring_1.default(fs_1.readFileSync(__dirname + "/../src/dbml.pegjs", "utf-8"));
var dbml = parse(fs_1.readFileSync(process.argv[2], "utf-8"));
var columnRows = new Map();
var tables = new Map();
dbml.tables.forEach(function (table) {
    var alias = table.alias || table.name;
    var rows = table.columns
        .map(function (column, i) {
        var port = i + 1;
        var ref = alias + ":f" + port;
        columnRows.set(alias + "." + column.name, ref);
        columnRows.set(table.name + "." + column.name, ref);
        if ("ref" in column.settings) {
            var ref_1 = column.settings["ref"];
            var _a = ref_1.split(/([-<>])\s+([\w_]+)\.([\w_]+)/), _ = _a[0], cardinality = _a[1], toTable = _a[2], toColumn = _a[3];
            dbml.refs.push({
                cardinality: cardinality,
                fromTable: table.name,
                fromColumns: [column.name],
                toTable: toTable,
                toColumns: [toColumn],
            });
        }
        var nameTransformations = [];
        if ("pk" in column.settings) {
            nameTransformations.push(function (name) { return "<b>" + name + "</b>"; });
        }
        if ("not null" in column.settings) {
            nameTransformations.push(function (name) { return name + " <i>NOT NULL</i>"; });
        }
        var transformName = nameTransformations.reduce(function (a, b) { return function (name) { return b(a(name)); }; }, function (n) { return n; });
        return "<TR><TD PORT=\"f" + port + "\">" + transformName(column.name) + "</TD></TR>";
    })
        .join("|");
    var value = {
        table: table,
        dot: alias + " [label=<<TABLE BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"10\" >\n      <TR><TD PORT=\"f0\" WIDTH=\"150\" bgcolor=\"#cccccc\"><B>" + table.name + "</B></TD></TR>\n      " + rows + "\n    </TABLE>>];",
    };
    tables.set(alias, value);
    tables.set(table.name, value);
});
var groups = dbml.groups
    .map(function (group) {
    var tablesInGroup = group.tables
        .map(function (tableName) {
        var table = tables.get(tableName);
        if (!table) {
            throw new Error("Could not find table " + tableName + " for group " + group.name);
        }
        tables.delete(table.table.name);
        if (table.table.alias)
            tables.delete(table.table.alias);
        return table.dot;
    })
        .join("\n");
    return "subgraph cluster_" + group.name + " {\n      style=filled;\n      color=\"#dddddd\";\n      label = \"" + group.name + "\"\n      margin=20\n\n      " + tablesInGroup + "\n  }";
})
    .join("\n");
var remainingTables = Array.from(tables.values())
    .map(function (v) { return v.dot; })
    .join("\n");
var refLabels = {
    ">": ["*", "1"],
    "<": ["1", "*"],
    "-": ["1", "1"],
};
var refs = dbml.refs
    .map(function (ref) {
    var fromKey = ref.fromTable + "." + ref.fromColumns[0];
    var fromRow = columnRows.get(fromKey);
    if (!fromRow)
        throw new Error("Could not find " + fromKey + " used in from ref");
    var toKey = ref.toTable + "." + ref.toColumns[0];
    var toRow = columnRows.get(toKey);
    if (!toRow)
        throw new Error("Could not find " + toKey + " used in to ref");
    var _a = refLabels[ref.cardinality], tailLabel = _a[0], headLabel = _a[1];
    return fromRow + "->" + toRow + " [headlabel=\"" + headLabel + "\",taillabel=\"" + tailLabel + "\", arrowhead=\"none\", arrowtail=\"none\"]";
})
    .join("\n");
var dot = "digraph obj {\n  node [shape=none, style=filled, fillcolor=aliceblue, fontname=arial, margin=0];\n  nodesep=2.0;\n\n  " + groups + "\n  " + remainingTables + "\n  " + refs + "\n}";
// console.log(dot);
var svg = sync_1.default(dot, {
    engine: "dot",
    format: "svg",
});
console.log(svg);
