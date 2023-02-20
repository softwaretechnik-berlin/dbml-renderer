import { tableName } from "./common";
import { parse } from "./parser";
import {
  Column,
  Enum,
  Output,
  Project,
  Ref,
  Table,
  TableGroup,
  TableIndices,
} from "./types";

export const check = (input: Output): NormalizedOutput => {
  const tables = extract("table", input).map((table) => ({
    actual: table,
    columns: extract("column", table.items),
    indices: extract("indices", table.items)[0],
    options: extract("option", table.items).reduce(
      (acc, i) => ({ ...acc, ...i.option }),
      {}
    ),
  }));

  const inlinedRefs = tables.flatMap((table) =>
    table.columns.flatMap((column) => {
      const ref = column.settings["ref"];
      if (!ref) {
        return [];
      }

      // create a virtual ref, parse it and add it to the list of refs
      const virtualRef = `Ref: ${tableName(table.actual)}.${
        column.name
      } ${ref}`;
      return extract("ref", parse(virtualRef));
    })
  );

  const groupedTables = new Set<string>();
  const groups = extract("group", input).map((group) => ({
    actual: group,
    tables: extract("table", group.items).map((i) => {
      const name = tableName(i);
      const table = resolveTableUnsafe(name, tables);
      if (!groupedTables.add(name)) {
        throw new Error(`Table ${i.name} belongs to multiple groups`);
      }

      return table;
    }),
  }));

  const ungroupedTables = tables.filter(
    (t) => !groupedTables.has(tableName(t.actual))
  );

  return {
    project: extract("project", input)[0],
    ungroupedTables,
    groups,
    refs: extract("ref", input)
      .concat(inlinedRefs)
      .map((ref) => ({
        actual: ref,
        fromTable: resolveTableUnsafe(tableName(ref.from), tables),
        toTable: resolveTableUnsafe(tableName(ref.to), tables),
      })),
    enums: extract("enum", input).map((e) => ({
      actual: e,
      values: extract("value", e.items).map((v) => v.name),
    })),
  };
};

export type NormalizedTable = {
  actual: Table;
  columns: Column[];
  indices?: TableIndices;
  options: Record<string, string>;
};

export type NormalizedGroup = {
  actual: TableGroup;
  tables: NormalizedTable[];
};

export type NormalizedEnum = {
  actual: Enum;
  values: string[];
};

export type NormalizedRef = {
  actual: Ref;
  fromTable: NormalizedTable;
  toTable: NormalizedTable;
};

export type NormalizedOutput = {
  project?: Project;
  ungroupedTables: NormalizedTable[];
  groups: NormalizedGroup[];
  refs: NormalizedRef[];
  enums: NormalizedEnum[];
};

const resolveTableUnsafe = (
  id: string,
  tables: NormalizedTable[]
): NormalizedTable => {
  const table = tables.find(
    (t) => tableName(t.actual) === id || t.actual.alias === id
  );
  if (!table) {
    throw new Error(`Table ${id} does not exist`);
  }

  return table;
};

const extract = <E extends { type: string }, T extends E["type"]>(
  type: T,
  entries: E[]
): Extract<E, { type: T }>[] => {
  return entries.filter((e) => e.type === type) as Extract<E, { type: T }>[];
};
