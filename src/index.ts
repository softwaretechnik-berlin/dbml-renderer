import createParser, { Table, Cardinality } from "./wiring";
import { readFileSync } from "fs";
import vizRenderStringSync from "@aduh95/viz.js/sync";

const parse = createParser(
  readFileSync(__dirname + "/../src/dbml.pegjs", "utf-8")
);

const dbml = parse(readFileSync(process.argv[2], "utf-8"));

const columnRows: Map<string, string> = new Map();
const tables: Map<string, { table: Table; dot: string }> = new Map();

dbml.tables.forEach((table) => {
  const alias = table.alias || table.name;

  const rows = table.columns
    .map((column, i) => {
      const port = i + 1;
      const ref = `${alias}:f${port}`;
      columnRows.set(`${alias}.${column.name}`, ref);
      columnRows.set(`${table.name}.${column.name}`, ref);

      if ("ref" in column.settings) {
        const ref: string = column.settings["ref"];
        const [_, cardinality, toTable, toColumn] = ref.split(
          /([-<>])\s+([\w_]+)\.([\w_]+)/
        );
        dbml.refs.push({
          cardinality: cardinality as Cardinality,
          fromTable: table.name,
          fromColumns: [column.name],
          toTable,
          toColumns: [toColumn],
        });
      }

      const nameTransformations: ((name: string) => string)[] = [];
      if ("pk" in column.settings) {
        nameTransformations.push((name: string) => `<b>${name}</b>`);
      }
      if ("not null" in column.settings) {
        nameTransformations.push((name: string) => name + " <i>NOT NULL</i>");
      }

      const transformName = nameTransformations.reduce(
        (a, b) => (name: string) => b(a(name)),
        (n) => n
      );

      return `<TR><TD PORT="f${port}">${transformName(column.name)}</TD></TR>`;
    })
    .join("|");

  const value = {
    table,
    dot: `${alias} [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10" >
      <TR><TD PORT="f0" WIDTH="150" bgcolor="#cccccc"><B>${table.name}</B></TD></TR>
      ${rows}
    </TABLE>>];`,
  };

  tables.set(alias, value);
  tables.set(table.name, value);
});

const groups = dbml.groups
  .map((group) => {
    const tablesInGroup = group.tables
      .map((tableName) => {
        const table = tables.get(tableName);
        if (!table) {
          throw new Error(
            `Could not find table ${tableName} for group ${group.name}`
          );
        }

        tables.delete(table.table.name);
        if (table.table.alias) tables.delete(table.table.alias);

        return table.dot;
      })
      .join("\n");

    return `subgraph cluster_${group.name} {
      style=filled;
      color="#dddddd";
      label = "${group.name}"
      margin=20

      ${tablesInGroup}
  }`;
  })
  .join("\n");

const remainingTables = Array.from(tables.values())
  .map((v) => v.dot)
  .join("\n");

const refLabels = {
  ">": ["*", "1"],
  "<": ["1", "*"],
  "-": ["1", "1"],
};

const refs = dbml.refs
  .map((ref) => {
    const fromKey = `${ref.fromTable}.${ref.fromColumns[0]}`;
    const fromRow = columnRows.get(fromKey);
    if (!fromRow) throw new Error(`Could not find ${fromKey} used in from ref`);

    const toKey = `${ref.toTable}.${ref.toColumns[0]}`;
    const toRow = columnRows.get(toKey);
    if (!toRow) throw new Error(`Could not find ${toKey} used in to ref`);

    let [tailLabel, headLabel] = refLabels[ref.cardinality];

    return `${fromRow}->${toRow} [headlabel="${headLabel}",taillabel="${tailLabel}", arrowhead="none", arrowtail="none"]`;
  })
  .join("\n");

const dot = `digraph obj {
  node [shape=none, style=filled, fillcolor=aliceblue, fontname=arial, margin=0];
  nodesep=2.0;

  ${groups}
  ${remainingTables}
  ${refs}
}`;

// console.log(dot);

const svg = vizRenderStringSync(dot, {
  engine: "dot",
  format: "svg",
});

console.log(svg);
