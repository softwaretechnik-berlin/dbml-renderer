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
        return "<TR><TD PORT=\"".concat(this.port, "\" WIDTH=\"150\" BGCOLOR=\"#1d71b8\"><font color=\"#ffffff\"><B>       ").concat(this.table.name, "       </B></font></TD></TR>");
    };
    return TableNameRowRenderer;
}());
var ColumnRowRenderer = /** @class */ (function () {
    function ColumnRowRenderer(port, column, table) {
        this.column = column;
        this.table = table;
        this.name = column.name;
        this.port = port;
    }
    ColumnRowRenderer.prototype.toDot = function () {
        var _this = this;
        var relatedIndexSettings = this.table.indices
            .filter(function (index) { return index.columns.includes(_this.column.name); })
            .map(function (index) { return index.settings; });
        var isPk = function (settings) {
            return "pk" in settings || "primary key" in settings;
        };
        var name = this.column.name;
        var settings = this.column.settings;
        if (isPk(settings) || relatedIndexSettings.some(isPk)) {
            name = "<b>".concat(name, "</b>");
        }
        var type = "<i>".concat(this.column.type, "</i>");
        if ("not null" in settings) {
            type = type + " <b>(!)</b>";
        }
        return "<TR><TD ALIGN=\"left\" PORT=\"".concat(this.port, "\" BGCOLOR=\"#e7e2dd\">\n      <TABLE CELLPADDING=\"0\" CELLSPACING=\"0\" BORDER=\"0\">\n        <TR>\n          <TD ALIGN=\"LEFT\">").concat(name, "<FONT>    </FONT></TD>\n          <TD ALIGN=\"RIGHT\"><font>").concat(type, "</font></TD>\n        </TR>\n      </TABLE>\n    </TD></TR>");
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
        return "<TR><TD PORT=\"".concat(this.port, "\" BGCOLOR=\"#e7e2dd\"><font color=\"#1d71b8\"><i>    ").concat(this.columns.join(", "), "    </i></font></TD></TR>");
    };
    return CompositeKeyRowRenderer;
}());
var TableRenderer = /** @class */ (function () {
    function TableRenderer(table) {
        var _a;
        this.columns = [];
        this.table = table;
        this.columns.push(new TableNameRowRenderer(table));
        (_a = this.columns).push.apply(_a, table.columns.map(function (column, i) { return new ColumnRowRenderer("f".concat(i + 1), column, table); }));
    }
    TableRenderer.prototype.selfRef = function () {
        return "\"".concat(this.table.name, "\":").concat(this.columns[0].port);
    };
    TableRenderer.prototype.ref = function (columnName) {
        var column = this.findColumn(columnName);
        if (!column) {
            throw new Error("Unknown column ".concat(this.table.name, ".").concat(column));
        }
        return "\"".concat(this.table.name, "\":").concat(column.port);
    };
    TableRenderer.prototype.findColumn = function (columnName) {
        return this.columns.find(function (c) { return c.name === columnName; });
    };
    TableRenderer.prototype.refAll = function (columns) {
        //TODO: check that all columns exist
        var _this = this;
        var columnIndex = {};
        columns.map(function (columnName) {
            return (columnIndex[columnName] =
                _this.columns.findIndex(function (c) { return c.name === columnName; }) + 1 ||
                    Number.MAX_SAFE_INTEGER);
        });
        var name = columns
            .sort(function (a, b) { return columnIndex[a] - columnIndex[b]; })
            .join(",");
        var column = this.findColumn(name);
        if (!column) {
            this.columns.push(new CompositeKeyRowRenderer("f".concat(this.columns.length), name, columns));
        }
        return this.ref(name);
    };
    TableRenderer.prototype.toDot = function () {
        return "\"".concat(this.table.name, "\" [id=\"").concat(this.table.name, "\";label=<<TABLE BORDER=\"2\" COLOR=\"#29235c\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"10\" >\n      ").concat(this.columns.map(function (column) { return column.toDot(); }).join("\n"), "\n    </TABLE>>];");
    };
    return TableRenderer;
}());
var TableRendererMap = /** @class */ (function () {
    function TableRendererMap(tables) {
        var _this = this;
        this.renderers = new Map();
        tables.forEach(function (table) {
            var renderer = new TableRenderer(table);
            _this.renderers.set(table.name, renderer);
            table.alias && _this.renderers.set(table.alias, renderer);
        });
    }
    TableRendererMap.prototype.get = function (table) {
        var tableRenderer = this.renderers.get(table);
        if (!tableRenderer) {
            throw new Error("Unknown table ".concat(table));
        }
        return tableRenderer;
    };
    TableRendererMap.prototype.names = function () {
        return new Set(this.renderers.keys());
    };
    return TableRendererMap;
}());
var GroupRenderer = /** @class */ (function () {
    function GroupRenderer(group, tables) {
        this.name = group.name;
        this.tables = tables;
    }
    GroupRenderer.prototype.toDot = function () {
        return "subgraph cluster_".concat(this.name, " {\n      label = \"").concat(this.name, "\"\n      style=filled;\n      color=\"#dddddd\";\n\n      ").concat(this.tables.map(function (table) { return table.toDot(); }).join("\n"), "\n    }");
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
                    throw new Error("Table ".concat(name, " does not exist or belongs to two groups"));
                }
                return tables.get(name);
            }));
        });
        this.ungrouped = new UngroupedRenderer(Array.from(remainingTables).map(function (table) { return tables.get(table); }));
    }
    GroupsRenderer.prototype.toDot = function () {
        return "\n      ".concat(this.groups.map(function (group) { return group.toDot(); }).join("\n"), "\n      ").concat(this.ungrouped.toDot(), "\n    ");
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
        this.ref =
            ref.cardinality !== "<"
                ? ref
                : {
                    fromTable: ref.toTable,
                    fromColumns: ref.toColumns,
                    toTable: ref.fromTable,
                    toColumns: ref.fromColumns,
                    cardinality: ref.cardinality,
                };
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
        return "".concat(this.fromTable.selfRef(), " -> ").concat(this.toTable.selfRef(), " [style=invis, weight=100, color=red]\n    ").concat(this.fromRef, ":e -> ").concat(this.toRef, ":w [penwidth=3, color=\"#29235c\", headlabel=\"").concat(headLabel, "\", taillabel=\"").concat(tailLabel, "\", arrowhead=\"normal\", arrowtail=\"none\"]");
    };
    return RefRenderer;
}());
var EnumRenderer = /** @class */ (function () {
    function EnumRenderer(enumType) {
        this.enumType = enumType;
    }
    EnumRenderer.prototype.selfRef = function () {
        return "\"".concat(this.enumType.name, "\":f0");
    };
    EnumRenderer.prototype.toDot = function () {
        var _this = this;
        return "\"".concat(this.enumType.name, "\" [id=").concat(this.enumType.name, ";label=<<TABLE BORDER=\"2\" COLOR=\"#29235c\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"10\">\n    <TR><TD PORT=\"f0\" WIDTH=\"150\" BGCOLOR=\"#29235c\"><font color=\"#ffffff\"><B>       ").concat(this.enumType.name, "       </B></font></TD></TR>\n    ").concat(this.enumType.values
            .map(function (value, i) { return _this.valueDot(value.name, i); })
            .join("\n"), "\n    </TABLE>>];");
    };
    EnumRenderer.prototype.valueDot = function (name, i) {
        return "<TR><TD PORT=\"f".concat(i, "\" BGCOLOR=\"#e7e2dd\"><font color=\"#1d71b8\"><i>    ").concat(name, "    </i></font></TD></TR>");
    };
    return EnumRenderer;
}());
var EnumsRenderer = /** @class */ (function () {
    function EnumsRenderer(enums) {
        var _this = this;
        this.renderers = new Map();
        enums.forEach(function (enumType) {
            return _this.renderers.set(enumType.name, new EnumRenderer(enumType));
        });
    }
    EnumsRenderer.prototype.get = function (name) {
        return this.renderers.get(name);
    };
    EnumsRenderer.prototype.toDot = function () {
        return Array.from(this.renderers.values())
            .map(function (renderer) { return renderer.toDot(); })
            .join("\n");
    };
    return EnumsRenderer;
}());
var EnumDefinitionRenderer = /** @class */ (function () {
    function EnumDefinitionRenderer(columnRef, enumRef) {
        this.columnRef = columnRef;
        this.enumRef = enumRef;
    }
    EnumDefinitionRenderer.prototype.toDot = function () {
        return "".concat(this.columnRef, ":e -> ").concat(this.enumRef, ":w [penwidth=3, color=\"#29235c\", arrowhead=\"none\", arrowtail=\"none\"]");
    };
    return EnumDefinitionRenderer;
}());
var DbmlRenderer = /** @class */ (function () {
    function DbmlRenderer(dbml) {
        var _this = this;
        this.enums = new EnumsRenderer(dbml.enums);
        var tables = new TableRendererMap(dbml.tables);
        this.groups = new GroupsRenderer(dbml.groups, tables);
        this.refs = dbml.refs
            .concat(this.findRefsInSettings(dbml.tables))
            .map(function (ref) { return new RefRenderer(ref, tables); });
        this.enumDefs = [];
        dbml.tables.forEach(function (table) {
            return table.columns.forEach(function (column) {
                var columnType = _this.enums.get(column.type);
                if (columnType) {
                    _this.enumDefs.push(new EnumDefinitionRenderer(tables.get(table.name).ref(column.name), columnType.selfRef()));
                }
            });
        });
    }
    DbmlRenderer.prototype.findRefsInSettings = function (tables) {
        var extraRefs = [];
        tables.forEach(function (table) {
            table.columns.forEach(function (column) {
                if ("ref" in column.settings) {
                    var ref = column.settings["ref"];
                    var _a = ref.split(/([-<>])\s+(?:([\w_]+)|"([^"\\]+)")\.(?:([\w_]+)|"([^"\\]+)")/), _ = _a[0], cardinality = _a[1], toTableUnquoted = _a[2], toTableQuoted = _a[3], toColumnUnquoted = _a[4], toColumnQuoted = _a[5];
                    extraRefs.push({
                        cardinality: cardinality,
                        fromTable: table.name,
                        fromColumns: [column.name],
                        toTable: toTableUnquoted || toTableQuoted,
                        toColumns: [toColumnUnquoted || toColumnQuoted],
                    });
                }
            });
        });
        return extraRefs;
    };
    //--light-blue: #1d71b8;--dark-blue: #29235c;--grey: #e7e2dd;--white: #ffffff;--orange: #ea5b0c
    DbmlRenderer.prototype.toDot = function () {
        return "digraph dbml {\n      rankdir=LR;\n      graph [fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\", bgcolor=\"transparent\"];\n      node [penwidth=0, margin=0, fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\"];\n      edge [fontname=\"helvetica\", fontsize=32, fontcolor=\"#29235c\", color=\"#29235c\"];\n\n      ".concat(this.enums.toDot(), "\n      ").concat(this.groups.toDot(), "\n      ").concat(this.refs.map(function (ref) { return ref.toDot(); }).join("\n"), "\n      ").concat(this.enumDefs.map(function (def) { return def.toDot(); }).join("\n"), "\n    }");
    };
    return DbmlRenderer;
}());
function dot(input) {
    var dbml = new DbmlRenderer((0, parser_1.default)(input));
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
