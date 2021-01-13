"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dot = void 0;
var parser_1 = __importDefault(require("./parser"));
var RowRenderer = /** @class */ (function () {
    function RowRenderer(port, label, attributes) {
        this.port = "f" + port;
        this.label = label;
        this.attributes = Object.entries(attributes)
            .map(function (_a) {
            var key = _a[0], value = _a[1];
            return key + "=\"" + value + "\"";
        })
            .join(" ");
    }
    RowRenderer.prototype.toDot = function () {
        return "<TR><TD PORT=\"" + this.port + "\" " + this.attributes + ">" + this.label + "</TD></TR>";
    };
    return RowRenderer;
}());
var TableRenderer = /** @class */ (function () {
    function TableRenderer(table) {
        var _this = this;
        this.columns = new Map();
        this.table = table;
        this.addRow("__TABLE_NAME__", "<font color=\"#ffffff\"><B>       " + table.name + "       </B></font>", {
            WIDTH: "150",
            BGCOLOR: "#1d71b8",
        });
        table.columns.forEach(function (column) {
            var nameTransformations = [];
            if ("pk" in column.settings) {
                nameTransformations.push(function (name) { return "<b>" + name + "</b>"; });
            }
            if ("not null" in column.settings) {
                nameTransformations.push(function (name) { return name + " <i>NOT NULL</i>"; });
            }
            var transformName = nameTransformations.reduce(function (a, b) { return function (name) { return b(a(name)); }; }, function (n) { return n; });
            _this.addRow(column.name, transformName(column.name), {
                BGCOLOR: "#e7e2dd",
            });
        });
    }
    TableRenderer.prototype.addRow = function (name, label, attributes) {
        this.columns.set(name, new RowRenderer(this.columns.size, label, attributes || {}));
    };
    TableRenderer.prototype.ref = function (column) {
        if (!this.columns.has(column)) {
            throw new Error("Unknown column " + this.table.name + "." + column);
        }
        return this.table.name + ":" + this.columns.get(column).port;
    };
    TableRenderer.prototype.refAll = function (columns) {
        //TODO: check that all columns exist
        //TODO: check that columns together are pk
        var key = columns.sort().join(",");
        if (!this.columns.has(key)) {
            this.addRow(key, "<font color=\"#1d71b8\"><i>" + key + "</i></font>", {
                BGCOLOR: "#e7e2dd",
            });
        }
        return this.ref(key);
    };
    TableRenderer.prototype.toDot = function () {
        return "\"" + this.table.name + "\" [id=" + this.table.name + ";label=<<TABLE BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"10\" >\n      " + Array.from(this.columns.values())
            .map(function (column) { return column.toDot(); })
            .join("\n") + "\n    </TABLE>>];";
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
        this.fromRef = this.findRef(tables.get(ref.fromTable), ref.fromColumns);
        this.toRef = this.findRef(tables.get(ref.toTable), ref.toColumns);
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
        return this.fromRef + ":e -> " + this.toRef + ":w [headlabel=\"" + headLabel + "\", taillabel=\"" + tailLabel + "\", arrowhead=\"normal\", arrowtail=\"none\"]";
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
