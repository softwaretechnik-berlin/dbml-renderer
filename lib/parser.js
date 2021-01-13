"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dbml_1 = __importDefault(require("./dbml"));
var isObject = function (what) { return typeof what === "object" && what !== null; };
var isArray = function (what) { return Array.isArray(what); };
var removeComments = function (what) {
    if (isArray(what)) {
        var i = what.length;
        while (i--) {
            var child = what[i];
            if (isObject(child)) {
                if ("comment" in child)
                    what.splice(i, 1);
                else
                    removeComments(child);
            }
        }
    }
    else if (isObject(what)) {
        Object.entries(what).forEach(function (_a) {
            var key = _a[0], child = _a[1];
            if (isObject(child)) {
                if ("comment" in child)
                    delete child["comment"];
                else
                    removeComments(child);
            }
        });
    }
    return what;
};
var entriesTransformations = {
    project: function (project) {
        return project;
    },
    table: function (table) {
        var obj = {
            name: table.name,
            alias: table.alias,
        };
        table.items.forEach(function (item) {
            var itemKey = item.item + "s";
            (obj[itemKey] = obj[itemKey] || []).push(item);
        });
        var settings = obj.settingss || [];
        delete obj.settingss;
        obj.settings = settings
            .map(function (s) { return s.settings; })
            .reduce(function (a, b) { return Object.assign(a, b); }, {});
        var options = obj.options || [];
        obj.options = options
            .map(function (o) { return o.option; })
            .reduce(function (a, b) { return Object.assign(a, b); }, {});
        var indices = obj.indicess || [];
        delete obj.indicess;
        obj.indices = indices.flatMap(function (s) { return s.indices; });
        obj.columns = obj.columns || [];
        return obj;
    },
    ref: function (ref) {
        return ref;
    },
    enum: function (en) {
        return en;
    },
    group: function (group) {
        return group;
    },
    default: function (entry) {
        throw new Error("Unknown entry type " + entry.type);
    },
};
function createParser(input) {
    var parsed = dbml_1.default.parse(input);
    var obj = {};
    removeComments(parsed).forEach(function (entry) {
        var typeKey = entry.type + "s";
        var transform = entriesTransformations[entry.type] || entriesTransformations.default;
        (obj[typeKey] = obj[typeKey] || []).push(transform(entry));
    });
    var projects = obj.projects || [];
    delete obj.projects;
    obj.project = {
        options: projects
            .map(function (p) { return p.options; })
            .reduce(function (a, b) { return Object.assign(a, b); }, {}),
    };
    obj.tables = obj.tables || [];
    obj.groups = obj.groups || [];
    obj.enums = obj.enums || [];
    obj.refs = obj.refs || [];
    return obj;
}
exports.default = createParser;
