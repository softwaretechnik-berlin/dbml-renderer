import { SchemaElementRef, fullName } from "./common";
import { parse } from "./parser";
import {
  Column,
  ColumnRef,
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
      {},
    ),
  }));

  const inlinedRefs = tables.flatMap((table) =>
    table.columns.flatMap((column) => {
      const ref = column.settings["ref"];
      if (!ref) {
        return [];
      }

      // create a virtual ref, parse it and add it to the list of refs
      const virtualRef = `Ref: ${fullName(table.actual)}.${column.name} ${ref}`;
      return extract("ref", parse(virtualRef));
    }),
  );

  const groupedTables = new Set<string>();
  const groups = extract("group", input).map((group) => ({
    actual: group,
    tables: extract("table", group.items).map((i) => {
      const table = resolveTable(i, tables);
      const name = fullName(table.actual);
      if (!groupedTables.add(name)) {
        throw new Error(`Table ${i.name} belongs to multiple groups`);
      }

      return table;
    }),
    options: extract("option", group.items).reduce(
      (acc, i) => ({ ...acc, ...i.option }),
      {},
    ),
  }));

  const ungroupedTables = tables.filter(
    (t) => !groupedTables.has(fullName(t.actual)),
  );

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

export type NormalizedTable = {
  actual: Table;
  columns: Column[];
  indices?: TableIndices;
  options: Record<string, string>;
};

export type NormalizedGroup = {
  actual: TableGroup;
  tables: NormalizedTable[];
  options: Record<string, string>;
};

export type NormalizedEnum = {
  actual: Enum;
  values: string[];
};

export type NormalizedRef = {
  actual: Ref;
  from: ReferredColumns;
  to: ReferredColumns;
};

export type ReferredColumns = {
  table: NormalizedTable;
  columns: Column[];
};

export type NormalizedOutput = {
  project?: Project;
  ungroupedTables: NormalizedTable[];
  groups: NormalizedGroup[];
  refs: NormalizedRef[];
  enums: NormalizedEnum[];
};

const resolveTable = (
  ref: SchemaElementRef,
  tables: NormalizedTable[],
): NormalizedTable => {
  const table = tables.find(
    (t) =>
      ref.schema === t.actual.schema &&
      (ref.name === t.actual.name || ref.name === t.actual.alias),
  );

  if (!table) {
    throw new Error(`Table ${fullName(ref)} does not exist`);
  }

  return table;
};

const extract = <E extends { type: string }, T extends E["type"]>(
  type: T,
  entries: E[],
): Extract<E, { type: T }>[] => {
  return entries.filter((e) => e.type === type) as Extract<E, { type: T }>[];
};

const extractColumns = (
  ref: ColumnRef,
  tables: NormalizedTable[],
): ReferredColumns => {
  const table = resolveTable(ref, tables);

  return {
    table,
    columns: ref.columns.map((c) => {
      const column = table.columns.find((i) => i.name === c);
      if (!column) {
        throw new Error(
          `Column ${c} does not exist in table ${fullName(table.actual)}`,
        );
      }
      return column;
    }),
  };
};
