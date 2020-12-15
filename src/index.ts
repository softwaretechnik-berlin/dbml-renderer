#!/usr/bin/env node

import createParser, { Table, Cardinality, Group, DBML, Ref } from "./parser";
import vizRenderStringSync from "@aduh95/viz.js/sync";
import yargs, { number } from "yargs";
import fs from "fs";

type Formats = "dot" | "svg";

const args = yargs(process.argv.slice(2))
  .scriptName("dbml-renderer")
  .usage("Usage: $0 [options]")
  .example("$0 -i schema.dbml", "Render the given file and output to stdout")
  .alias("h", "help")
  .option("input", {
    demandOption: true,
    alias: "i",
    type: "string",
    description: "DBML file",
    coerce: (arg) => {
      if (!fs.existsSync(arg)) {
        throw new Error(`Could not find file '${arg}'`);
      }

      return fs.readFileSync(arg, "utf-8");
    },
  })
  .option("format", {
    alias: "f",
    type: "string",
    choices: ["dot", "svg"],
    default: "svg",
    description: "Output format",
    coerce: (arg) => arg as Formats,
  })
  .option("output", {
    alias: "o",
    type: "string",
    default: "-",
    description: "Output file",
    coerce: (arg) => {
      return arg === "-"
        ? console.log
        : (content: string) => fs.writeFileSync(arg, content);
    },
  }).argv;

const parse = createParser(
  fs.readFileSync(__dirname + "/../src/dbml.pegjs", "utf-8")
);

type RowAttributes = {
  [key: string]: string;
};

class RowRenderer {
  readonly port: string;
  private label: string;
  private attributes: string;

  constructor(port: number, label: string, attributes: RowAttributes) {
    this.port = `f${port}`;
    this.label = label;
    this.attributes = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
  }
  toDot(): string {
    return `<TR><TD PORT="${this.port}" ${this.attributes}>${this.label}</TD></TR>`;
  }
}

class TableRenderer {
  private table: Table;
  private columns: Map<string, RowRenderer> = new Map();

  constructor(table: Table) {
    this.table = table;
    this.addRow("__TABLE_NAME__", `<B>       ${table.name}       </B>`, {
      WIDTH: "150",
      BGCOLOR: "#cccccc",
    });

    table.columns.forEach((column) => {
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

      this.addRow(column.name, transformName(column.name));
    });
  }

  private addRow(
    name: string,
    label: string,
    attributes?: RowAttributes
  ): void {
    this.columns.set(
      name,
      new RowRenderer(this.columns.size, label, attributes || {})
    );
  }

  ref(column: string): string {
    if (!this.columns.has(column)) {
      throw new Error(`Unknown column ${this.table.name}.${column}`);
    }
    return `${this.table.name}:${this.columns.get(column)!.port}`;
  }

  refAll(columns: string[]): string {
    //TODO: check that all columns exist
    //TODO: check that columns together are pk
    const key = columns.sort().join(",");
    if (!this.columns.has(key)) {
      this.addRow(key, `<font color="grey"><i>${key}</i></font>`);
    }
    return this.ref(key);
  }

  toDot(): string {
    return `"${
      this.table.name
    }" [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10" >
      ${Array.from(this.columns.values())
        .map((column) => column.toDot())
        .join("\n")}
    </TABLE>>];`;
  }
}

class TablesRenderer {
  private renderers: Map<string, TableRenderer> = new Map();

  constructor(tables: Table[]) {
    tables.forEach((table) => {
      const renderer = new TableRenderer(table);
      this.renderers.set(table.name, renderer);
      table.alias && this.renderers.set(table.alias, renderer);
    });
  }

  get(table: string): TableRenderer {
    const tableRenderer = this.renderers.get(table);
    if (!tableRenderer) {
      throw new Error(`Unknown table ${table}`);
    }
    return tableRenderer;
  }

  names(): Set<string> {
    return new Set(this.renderers.keys());
  }
}

class GroupRenderer {
  readonly name: string;
  private tables: TableRenderer[];
  constructor(group: Group, tables: TableRenderer[]) {
    this.name = group.name;
    this.tables = tables;
  }

  toDot(): string {
    return `subgraph cluster_${this.name} {
      rankdir=LR;
      style=filled;
      color="#dddddd";
      label = "${this.name}"
      margin=20

      ${this.tables.map((table) => table.toDot()).join("\n")}
    }`;
  }
}

class UngroupedRenderer {
  private tables: TableRenderer[];
  constructor(tables: TableRenderer[]) {
    this.tables = tables;
  }
  toDot(): string {
    return this.tables.map((table) => table.toDot()).join("\n");
  }
}

class GroupsRenderer {
  private groups: GroupRenderer[];
  private ungrouped: UngroupedRenderer;

  constructor(groups: Group[], tables: TablesRenderer) {
    const remainingTables = tables.names();
    this.groups = groups.map((group) => {
      return new GroupRenderer(
        group,
        group.tables.map((name) => {
          if (!remainingTables.delete(name)) {
            throw new Error(
              `Table ${name} does not exist or belongs to two groups`
            );
          }
          return tables.get(name);
        })
      );
    });

    this.ungrouped = new UngroupedRenderer(
      Array.from(remainingTables).map((table) => tables.get(table))
    );
  }

  toDot(): string {
    return `
      ${this.groups.map((group) => group.toDot()).join("\n")}
      ${this.ungrouped.toDot()}
    `;
  }
}

const refLabels = {
  ">": ["*", "1"],
  "<": ["1", "*"],
  "-": ["1", "1"],
};

class RefRenderer {
  private ref: Ref;
  private fromRef: string;
  private toRef: string;
  constructor(ref: Ref, tables: TablesRenderer) {
    this.ref = ref;

    this.fromRef = this.findRef(tables.get(ref.fromTable), ref.fromColumns);
    this.toRef = this.findRef(tables.get(ref.toTable), ref.toColumns);
  }
  private findRef(table: TableRenderer, columns: string[]): string {
    if (columns.length === 1) {
      return table.ref(columns[0]);
    } else {
      return table.refAll(columns);
    }
  }

  toDot(): string {
    const [tailLabel, headLabel] = refLabels[this.ref.cardinality];
    return `${this.fromRef}:e -> ${this.toRef}:w [headlabel="${headLabel}", taillabel="${tailLabel}", arrowhead="normal", arrowtail="none"]`;
  }
}

class DbmlRenderer {
  private groups: GroupsRenderer;
  private refs: RefRenderer[];
  constructor(dbml: DBML) {
    const tables = new TablesRenderer(dbml.tables);

    this.groups = new GroupsRenderer(dbml.groups, tables);

    this.refs = dbml.refs
      .concat(this.findRefsInSettings(dbml.tables))
      .map((ref) => new RefRenderer(ref, tables));
  }

  private findRefsInSettings(tables: Table[]): Ref[] {
    const extraRefs: Ref[] = [];
    tables.forEach((table) => {
      table.columns.forEach((column) => {
        if ("ref" in column.settings) {
          const ref: string = column.settings["ref"];
          const [_, cardinality, toTable, toColumn] = ref.split(
            /([-<>])\s+([\w_]+)\.([\w_]+)/
          );
          extraRefs.push({
            cardinality: cardinality as Cardinality,
            fromTable: table.name,
            fromColumns: [column.name],
            toTable,
            toColumns: [toColumn],
          });
        }
      });
    });
    return extraRefs;
  }

  toDot(): string {
    return `digraph dbml {
      graph [pad="0", ranksep="0", nodesep="4"]
      node [shape=none, style=filled, fillcolor=aliceblue, margin=0, fontname=arial, fontsize=18];
      fontname=arial;
      nodesep=5.0;

      ${this.groups.toDot()}
      ${this.refs.map((ref) => ref.toDot()).join("\n")}
    }`;
  }
}

const dbml = new DbmlRenderer(parse(args.input));

const svg = vizRenderStringSync(dbml.toDot(), {
  engine: "dot",
  format: args.format,
});

args.output(svg);
