import z from "zod";

export const Comment = z.object({
  type: z.literal("comment"),
  comment: z.string(),
});
export type Comment = z.infer<typeof Comment>;

export const Settings = z.record(z.string().nullable());
export type Settings = z.infer<typeof Settings>;

export const Options = z.record(z.string());
export type Options = z.infer<typeof Options>;

export const Project = z.object({
  type: z.literal("project"),
  name: z.string().nullable(),
  options: Options.nullable().transform((v) => v || {}),
});
export type Project = z.infer<typeof Project>;

export const StickyNote = z.object({
  type: z.literal("note"),
  name: z.string(),
  note: z.string(),
});
export type StickyNote = z.infer<typeof StickyNote>;

export const Column = z.object({
  type: z.literal("column"),
  name: z.string(),
  data: z.string(),
  settings: Settings.nullable().transform((v) => v || {}),
});
export type Column = z.infer<typeof Column>;

export const TableOption = z.object({
  type: z.literal("option"),
  option: z.record(z.string()),
});
export type TableOption = z.infer<typeof TableOption>;

export const TableIndices = z.object({
  type: z.literal("indices"),
  indices: z.array(
    z.object({
      columns: z.array(z.string()),
      settings: Settings.nullable().transform((v) => v || {}),
    }),
  ),
});
export type TableIndices = z.infer<typeof TableIndices>;

export const Table = z.object({
  type: z.literal("table"),
  schema: z.string().nullable(),
  name: z.string(),
  alias: z.string().nullable(),
  items: z.array(z.union([Comment, Column, TableOption, TableIndices])),
  settings: Settings.nullable().transform((v) => v || {}),
});
export type Table = z.infer<typeof Table>;

export const TableRef = z.object({
  type: z.literal("table"),
  schema: z.string().nullable(),
  name: z.string(),
});
export type TableRef = z.infer<typeof TableRef>;

export const TableGroupOption = z.object({
  type: z.literal("option"),
  option: z.record(z.string()),
});
export type TableGroupOption = z.infer<typeof TableGroupOption>;

export const TableGroup = z.object({
  type: z.literal("group"),
  name: z.string().nullable(),
  items: z.array(z.union([Comment, TableRef, TableGroupOption])),
  settings: Settings.nullable().transform((v) => v || {}),
});
export type TableGroup = z.infer<typeof TableGroup>;

export const EnumValue = z.object({
  type: z.literal("value"),
  name: z.string(),
  settings: Settings.nullable().transform((v) => v || {}),
});
export type EnumValue = z.infer<typeof EnumValue>;

export const Enum = z.object({
  type: z.literal("enum"),
  schema: z.string().nullable(),
  name: z.string(),
  items: z.array(z.union([Comment, EnumValue])),
});
export type Enum = z.infer<typeof Enum>;

export const Cardinality = z.union([
  z.literal("<>"),
  z.literal(">"),
  z.literal("<"),
  z.literal("-"),
]);
export type Cardinality = z.infer<typeof Cardinality>;

const ColumnRef = z.object({
  schema: z.string().nullable(),
  name: z.string(),
  columns: z.array(z.string()),
});
export type ColumnRef = z.infer<typeof ColumnRef>;

export const Ref = z.object({
  type: z.literal("ref"),
  cardinality: Cardinality,
  from: ColumnRef,
  to: ColumnRef,
  settings: Settings.nullable().transform((v) => v || {}),
});
export type Ref = z.infer<typeof Ref>;

export const Entity = z.union([
  Comment,
  Project,
  StickyNote,
  Table,
  TableGroup,
  Enum,
  Ref,
]);
export type Entity = z.infer<typeof Entity>;

export const Output = z.array(Entity);
export type Output = z.infer<typeof Output>;
