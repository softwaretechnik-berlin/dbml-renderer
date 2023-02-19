import { tableName } from "./common";
import { parse } from "./parser";
import {
  Column,
  Entity,
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
    columns: table.items.filter((i) => i.type === "column") as Column[],
    indices: table.items.find((i) => i.type === "indices") as TableIndices,
    options: table.items.reduce(
      (acc, i) => (i.type === "option" ? { ...acc, ...i.option } : acc),
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

  return new NormalizedOutput({
    project: extract("project", input)[0],
    tables,
    groups: extract("group", input).map((group) => ({
      actual: group,
      tables: group.items.flatMap((i) => {
        if (i.type !== "table") {
          return [];
        }

        const name = tableName(i);
        const table = resolveTableUnsafe(name, tables);
        if (!groupedTables.add(name)) {
          throw new Error(`Table ${i.name} belongs to multiple groups`);
        }

        return table;
      }),
    })),
    refs: extract("ref", input)
      .concat(inlinedRefs)
      .map((ref) => ({
        actual: ref,
        fromTable: resolveTableUnsafe(tableName(ref.from), tables),
        toTable: resolveTableUnsafe(tableName(ref.to), tables),
      })),
    enums: extract("enum", input).map((e) => ({
      actual: e,
      values: e.items.flatMap((i) => (i.type === "value" ? i.name : [])),
    })),
  });
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

export class NormalizedOutput {
  readonly project?: Project;
  readonly tables: NormalizedTable[];
  readonly groups: NormalizedGroup[];
  readonly refs: NormalizedRef[];
  readonly enums: NormalizedEnum[];

  constructor({
    project,
    tables,
    groups,
    refs,
    enums,
  }: {
    project?: Project;
    tables: NormalizedTable[];
    groups: NormalizedGroup[];
    refs: NormalizedRef[];
    enums: NormalizedEnum[];
  }) {
    this.project = project;
    this.tables = tables;
    this.groups = groups;
    this.refs = refs;
    this.enums = enums;
  }

  table(id: string): NormalizedTable | undefined {
    return resolveTable(id, this.tables);
  }

  ungroupedTables(): NormalizedTable[] {
    const groupedTables = new Set<string>(
      this.groups.flatMap((group) =>
        group.tables.map((t) => tableName(t.actual))
      )
    );

    return this.tables.filter(
      (table) => !groupedTables.has(tableName(table.actual))
    );
  }
}

const resolveTable = (
  id: string,
  tables: NormalizedTable[]
): NormalizedTable | undefined =>
  tables.find((t) => tableName(t.actual) === id || t.actual.alias === id);

const resolveTableUnsafe = (
  id: string,
  tables: NormalizedTable[]
): NormalizedTable => {
  const table = resolveTable(id, tables);
  if (!table) {
    throw new Error(`Table ${id} does not exist`);
  }

  return table;
};

const extract = <T extends Entity["type"]>(
  type: T,
  output: Output
): Extract<Entity, { type: T }>[] => {
  return output.filter((entity) => entity.type === type) as Extract<
    Entity,
    { type: T }
  >[];
};
