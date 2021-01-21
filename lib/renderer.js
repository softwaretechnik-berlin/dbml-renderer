"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dot = void 0;
var parser_1 = __importDefault(require("./parser"));
var TableNameRowRenderer = /** @class */ (function () {
    function TableNameRowRenderer(table) {
        this.name = "__TABLE__";
        this.port = "f0";
        this.table = table;
    }
    TableNameRowRenderer.prototype.toDot = function () {
        return "<TR><TD PORT=\"" + this.port + "\" WIDTH=\"150\" BGCOLOR=\"#1d71b8\"><font color=\"#ffffff\"><B>       " + this.table.name + "       </B></font></TD></TR>";
    };
    return TableNameRowRenderer;
}());
var ColumnRowRenderer = /** @class */ (function () {
    function ColumnRowRenderer(port, column) {
        this.column = column;
        this.name = column.name;
        this.port = port;
    }
    ColumnRowRenderer.prototype.toDot = function () {
        var nameTransformations = [];
        if ("pk" in this.column.settings) {
            nameTransformations.push(function (name) { return "<b>" + name + "</b>"; });
        }
        if ("not null" in this.column.settings) {
            nameTransformations.push(function (name) { return name + " <i>NOT NULL</i>"; });
        }
        var transformName = nameTransformations.reduce(function (a, b) { return function (name) { return b(a(name)); }; }, function (n) { return n; });
        //TODO: make it a table that has two columns with the name and types
        return "<TR><TD PORT=\"" + this.port + "\" BGCOLOR=\"#e7e2dd\">" + transformName(this.name) + "</TD></TR>";
    };
    return ColumnRowRenderer;
}());
var CompositeKeyRowRenderer = /** @class */ (function () {
    function CompositeKeyRowRenderer(port, name, columns) {
        this.columns = columns;
        this.port = port;
        this.name = name;
    }
    CompositeKeyRowRenderer.prototype.toDot = function () {
        return "<TR><TD PORT=\"" + this.port + "\" BGCOLOR=\"#e7e2dd\"><font color=\"#1d71b8\"><i>" + this.columns.join(", ") + "</i></font></TD></TR>";
    };
    return CompositeKeyRowRenderer;
}());
var TableRenderer = /** @class */ (function () {
    function TableRenderer(table) {
        var _a;
        this.columns = [];
        this.table = table;
        this.columns.push(new TableNameRowRenderer(table));
        (_a = this.columns).push.apply(_a, table.columns.map(function (column, i) { return new ColumnRowRenderer("f" + (i + 1), column); }));
    }
    TableRenderer.prototype.selfRef = function () {
        return this.table.name + ":" + this.columns[0].port;
    };
    TableRenderer.prototype.ref = function (columnName) {
        var column = this.findColumn(columnName);
        if (!column) {
            throw new Error("Unknown column " + this.table.name + "." + column);
        }
        return this.table.name + ":" + column.port;
    };
    TableRenderer.prototype.findColumn = function (columnName) {
        return this.columns.find(function (c) { return c.name === columnName; });
    };
    TableRenderer.prototype.refAll = function (columns) {
        //TODO: check that all columns exist
        //TODO: check that columns together are pk
        var name = columns.sort().join(",");
        var column = this.findColumn(name);
        if (!column) {
            this.columns.push(new CompositeKeyRowRenderer("f" + this.columns.length, name, columns));
        }
        return this.ref(name);
    };
    TableRenderer.prototype.toDot = function () {
        return "\"" + this.table.name + "\" [id=" + this.table.name + ";label=<<TABLE BORDER=\"2\" COLOR=\"#29235c\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"10\" >\n      " + this.columns.map(function (column) { return column.toDot(); }).join("\n") + "\n    </TABLE>>];";
    };
    return TableRenderer;
}());
var TablesRenderer = /** @class */ (function () {
    function TablesRenderer(tables) {
        var _this = this;
        this.renderers = new Map();
        tables.forEach(function (table) {
            var renderer = new TableRenderer(table);
            _this.renderers.set(table.name, renderer);
            table.alias && _this.renderers.set(table.alias, renderer);
        });
    }
    TablesRenderer.prototype.get = function (table) {
        var tableRenderer = this.renderers.get(table);
        if (!tableRenderer) {
            throw new Error("Unknown table " + table);
        }
        return tableRenderer;
    };
    TablesRenderer.prototype.names = function () {
        return new Set(this.renderers.keys());
    };
    return TablesRenderer;
}());
var GroupRenderer = /** @class */ (function () {
    function GroupRenderer(group, tables) {
        this.name = group.name;
        this.tables = tables;
    }
    GroupRenderer.prototype.toDot = function () {
        return "subgraph cluster_" + this.name + " {\n      label = \"" + this.name + "\"\n      style=filled;\n      color=\"#dddddd\";\n\n      " + this.tables.map(function (table) { return table.toDot(); }).join("\n") + "\n    }";
    };
    return GroupRenderer;
}());
var UngroupedRenderer = /** @class */ (function () {
    function UngroupedRenderer(tables) {
        this.tables = tables;
    }
    UngroupedRenderer.prototype.toDot = function () {
        return this.tables.map(function (table) { return table.toDot(); }).join("\n");
    };
    return UngroupedRenderer;
}());
var GroupsRenderer = /** @class */ (function () {
    function GroupsRenderer(groups, tables) {
        var remainingTables = tables.names();
        this.groups = groups.map(function (group) {
            return new GroupRenderer(group, group.tables.map(function (name) {
                if (!remainingTables.delete(name)) {
                    throw new Error("Table " + name + " does not exist or belongs to two groups");
                }
                return tables.get(name);
            }));
        });
        this.ungrouped = new UngroupedRenderer(Array.from(remainingTables).map(function (table) { return tables.get(table); }));
    }
    GroupsRenderer.prototype.toDot = function () {
        return "\n      " + this.groups.map(function (group) { return group.toDot(); }).join("\n") + "\n      " + this.ungrouped.toDot() + "\n    ";
    };
    return GroupsRenderer;
}());
var refLabels = {
    ">": ["*", "1"],
    "<": ["1", "*"],
    "-": ["1", "1"],
};
var RefRenderer = /** @class */ (function () {
    function RefRenderer(ref, tables) {
        this.ref = ref;
        this.fromTable = tables.get(ref.fromTable);
        this.toTable = tables.get(ref.toTable);
        this.fromRef = this.findRef(this.fromTable, ref.fromColumns);
        this.toRef = this.findRef(this.toTable, ref.toColumns);
    }
    RefRenderer.prototype.findRef = function (table, columns) {
        if (columns.length === 1) {
            return table.ref(columns[0]);
        }
        else {
            return table.refAll(columns);
        }
    };
    RefRenderer.prototype.toDot = function () {
        var _a = refLabels[this.ref.cardinality], tailLabel = _a[0], headLabel = _a[1];
        return this.fromTable.selfRef() + " -> " + this.toTable.selfRef() + " [style=invis, weight=100, color=red]\n    " + this.fromRef + ":e -> " + this.toRef + ":w [penwidth=3, color=\"#29235c\", headlabel=\"" + headLabel + "\", taillabel=\"" + tailLabel + "\", arrowhead=\"normal\", arrowtail=\"none\"]";
    };
    return RefRenderer;
}());
var DbmlRenderer = /** @class */ (function () {
    function DbmlRenderer(dbml) {
        var tables = new TablesRenderer(dbml.tables);
        this.groups = new GroupsRenderer(dbml.groups, tables);
        this.refs = dbml.refs
            .concat(this.findRefsInSettings(dbml.tables))
            .map(function (ref) { return new RefRenderer(ref, tables); });
    }
    DbmlRenderer.prototype.findRefsInSettings = function (tables) {
        var extraRefs = [];
        tables.forEach(function (table) {
            table.columns.forEach(function (column) {
                if ("ref" in column.settings) {
                    var ref = column.settings["ref"];
                    var _a = ref.split(/([-<>])\s+([\w_]+)\.([\w_]+)/), _ = _a[0], cardinality = _a[1], toTable = _a[2], toColumn = _a[3];
                    extraRefs.push({
                        cardinality: cardinality,
                        fromTable: table.name,
                        fromColumns: [column.name],
                        toTable: toTable,
                        toColumns: [toColumn],
                    });
                }
            });
        });
        return extraRefs;
    };
    //--light-blue: #1d71b8;--dark-blue: #29235c;--grey: #e7e2dd;--white: #ffffff;--orange: #ea5b0c
    DbmlRenderer.prototype.toDot = function () {
        return "digraph dbml {\n      rankdir=LR;\n      graph [fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\", bgcolor=\"transparent\"];\n      node [penwidth=0, margin=0, fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\"];\n      edge [fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\", color=\"#29235c\"];\n\n      " + this.groups.toDot() + "\n      " + this.refs.map(function (ref) { return ref.toDot(); }).join("\n") + "\n    }";
    };
    return DbmlRenderer;
}());
function dot(input) {
    var dbml = new DbmlRenderer(parser_1.default(input));
    return dbml.toDot();
}
exports.dot = dot;
function render(input, format) {
    var dotString = dot(input);
    if (format === "dot") {
        // viz.js can return the dot format too, but it needs node.js' global
        // 'process' object to be present, but it isn't available in graal's
        // script engine.
        return dotString;
    }
    var vizRenderStringSync = require("@aduh95/viz.js/sync");
    return vizRenderStringSync(dotString, {
        engine: "dot",
        format: format,
    });
}
exports.default = render;
