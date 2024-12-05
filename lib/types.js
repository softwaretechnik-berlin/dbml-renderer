"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Output = exports.Entity = exports.Ref = exports.Cardinality = exports.Enum = exports.EnumValue = exports.TableGroup = exports.TableGroupOption = exports.TableRef = exports.Table = exports.TableIndices = exports.TableOption = exports.Column = exports.StickyNote = exports.Project = exports.Options = exports.Settings = exports.Comment = void 0;
const zod_1 = __importDefault(require("zod"));
exports.Comment = zod_1.default.object({
    type: zod_1.default.literal("comment"),
    comment: zod_1.default.string(),
});
exports.Settings = zod_1.default.record(zod_1.default.string().nullable());
exports.Options = zod_1.default.record(zod_1.default.string());
exports.Project = zod_1.default.object({
    type: zod_1.default.literal("project"),
    name: zod_1.default.string().nullable(),
    options: exports.Options.nullable().transform((v) => v || {}),
});
exports.StickyNote = zod_1.default.object({
    type: zod_1.default.literal("note"),
    name: zod_1.default.string(),
    note: zod_1.default.string(),
});
exports.Column = zod_1.default.object({
    type: zod_1.default.literal("column"),
    name: zod_1.default.string(),
    data: zod_1.default.string(),
    settings: exports.Settings.nullable().transform((v) => v || {}),
});
exports.TableOption = zod_1.default.object({
    type: zod_1.default.literal("option"),
    option: zod_1.default.record(zod_1.default.string()),
});
exports.TableIndices = zod_1.default.object({
    type: zod_1.default.literal("indices"),
    indices: zod_1.default.array(zod_1.default.object({
        columns: zod_1.default.array(zod_1.default.string()),
        settings: exports.Settings.nullable().transform((v) => v || {}),
    })),
});
exports.Table = zod_1.default.object({
    type: zod_1.default.literal("table"),
    schema: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
    alias: zod_1.default.string().nullable(),
    items: zod_1.default.array(zod_1.default.union([exports.Comment, exports.Column, exports.TableOption, exports.TableIndices])),
    settings: exports.Settings.nullable().transform((v) => v || {}),
});
exports.TableRef = zod_1.default.object({
    type: zod_1.default.literal("table"),
    schema: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
});
exports.TableGroupOption = zod_1.default.object({
    type: zod_1.default.literal("option"),
    option: zod_1.default.record(zod_1.default.string()),
});
exports.TableGroup = zod_1.default.object({
    type: zod_1.default.literal("group"),
    name: zod_1.default.string().nullable(),
    items: zod_1.default.array(zod_1.default.union([exports.Comment, exports.TableRef, exports.TableGroupOption])),
    settings: exports.Settings.nullable().transform((v) => v || {}),
});
exports.EnumValue = zod_1.default.object({
    type: zod_1.default.literal("value"),
    name: zod_1.default.string(),
    settings: exports.Settings.nullable().transform((v) => v || {}),
});
exports.Enum = zod_1.default.object({
    type: zod_1.default.literal("enum"),
    schema: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
    items: zod_1.default.array(zod_1.default.union([exports.Comment, exports.EnumValue])),
});
exports.Cardinality = zod_1.default.union([
    zod_1.default.literal("<>"),
    zod_1.default.literal(">"),
    zod_1.default.literal("<"),
    zod_1.default.literal("-"),
]);
const ColumnRef = zod_1.default.object({
    schema: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
    columns: zod_1.default.array(zod_1.default.string()),
});
exports.Ref = zod_1.default.object({
    type: zod_1.default.literal("ref"),
    cardinality: exports.Cardinality,
    from: ColumnRef,
    to: ColumnRef,
    settings: exports.Settings.nullable().transform((v) => v || {}),
});
exports.Entity = zod_1.default.union([
    exports.Comment,
    exports.Project,
    exports.StickyNote,
    exports.Table,
    exports.TableGroup,
    exports.Enum,
    exports.Ref,
]);
exports.Output = zod_1.default.array(exports.Entity);
