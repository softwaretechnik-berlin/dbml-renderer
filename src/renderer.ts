import parse, { Table, Cardinality, Group, DBML, Ref, Column } from "./parser";

export type Format = "dot" | "svg";

type RowAttributes = {
  [key: string]: string;
};

// class RowRenderer {
//   readonly port: string;
//   private label: string;
//   private attributes: string;

//   constructor(port: number, label: string, attributes: RowAttributes) {
//     this.port = `f${port}`;
//     this.label = label;
//     this.attributes = Object.entries(attributes)
//       .map(([key, value]) => `${key}="${value}"`)
//       .join(" ");
//   }
//   toDot(): string {
//     //TODO: make it a table that has two columns with the name and types
//     return `<TR><TD PORT="${this.port}" ${this.attributes}>${this.label}</TD></TR>`;
//   }
// }

interface RowRenderer {
  readonly name: string;
  readonly port: string;
  toDot(): string;
}

class TableNameRowRenderer implements RowRenderer {
  readonly name = "__TABLE__";
  readonly port = "f0";
  private table: Table;

  constructor(table: Table) {
    this.table = table;
  }

  toDot(): string {
    return `<TR><TD PORT="${this.port}" WIDTH="150" BGCOLOR="#1d71b8"><font color="#ffffff"><B>       ${this.table.name}       </B></font></TD></TR>`;
  }
}

class ColumnRowRenderer implements RowRenderer {
  private column: Column;
  readonly name: string;
  readonly port: string;

  constructor(port: string, column: Column) {
    this.column = column;
    this.name = column.name;
    this.port = port;
  }

  toDot(): string {
    const nameTransformations: ((name: string) => string)[] = [];
    if ("pk" in this.column.settings) {
      nameTransformations.push((name: string) => `<b>${name}</b>`);
    }
    if ("not null" in this.column.settings) {
      nameTransformations.push((name: string) => name + " <i>NOT NULL</i>");
    }

    const transformName = nameTransformations.reduce(
      (a, b) => (name: string) => b(a(name)),
      (n) => n
    );

    //TODO: make it a table that has two columns with the name and types
    return `<TR><TD PORT="${this.port}" BGCOLOR="#e7e2dd">${transformName(
      this.name
    )}</TD></TR>`;
  }
}

class CompositeKeyRowRenderer implements RowRenderer {
  private columns: string[];
  readonly name: string;
  readonly port: string;

  constructor(port: string, name: string, columns: string[]) {
    this.columns = columns;
    this.port = port;
    this.name = name;
  }

  toDot(): string {
    return `<TR><TD PORT="${
      this.port
    }" BGCOLOR="#e7e2dd"><font color="#1d71b8"><i>${this.columns.join(
      ", "
    )}</i></font></TD></TR>`;
  }
}

class TableRenderer {
  private table: Table;
  private columns: RowRenderer[] = [];

  constructor(table: Table) {
    this.table = table;
    this.columns.push(new TableNameRowRenderer(table));
    this.columns.push(
      ...table.columns.map(
        (column, i) => new ColumnRowRenderer(`f${i + 1}`, column)
      )
    );
  }

  selfRef(): string {
    return `${this.table.name}:${this.columns[0].port}`;
  }

  ref(columnName: string): string {
    const column = this.findColumn(columnName);
    if (!column) {
      throw new Error(`Unknown column ${this.table.name}.${column}`);
    }
    return `${this.table.name}:${column.port}`;
  }

  private findColumn(columnName: string) {
    return this.columns.find((c) => c.name === columnName);
  }

  refAll(columns: string[]): string {
    //TODO: check that all columns exist
    //TODO: check that columns together are pk
    const name = columns.sort().join(",");
    const column = this.findColumn(name);
    if (!column) {
      this.columns.push(
        new CompositeKeyRowRenderer(`f${this.columns.length}`, name, columns)
      );
    }
    return this.ref(name);
  }

  toDot(): string {
    return `"${this.table.name}" [id=${
      this.table.name
    };label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10" >
      ${this.columns.map((column) => column.toDot()).join("\n")}
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
      label = "${this.name}"
      style=filled;
      color="#dddddd";

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
  private fromTable: TableRenderer;
  private toTable: TableRenderer;

  constructor(ref: Ref, tables: TablesRenderer) {
    this.ref = ref;

    this.fromTable = tables.get(ref.fromTable);
    this.toTable = tables.get(ref.toTable);

    this.fromRef = this.findRef(this.fromTable, ref.fromColumns);
    this.toRef = this.findRef(this.toTable, ref.toColumns);
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
    return `${this.fromTable.selfRef()} -> ${this.toTable.selfRef()} [style=invis, weight=100, color=red]
    ${this.fromRef}:e -> ${
      this.toRef
    }:w [penwidth=3, color="#29235c", headlabel="${headLabel}", taillabel="${tailLabel}", arrowhead="normal", arrowtail="none"]`;
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

  //--light-blue: #1d71b8;--dark-blue: #29235c;--grey: #e7e2dd;--white: #ffffff;--orange: #ea5b0c
  toDot(): string {
    return `digraph dbml {
      rankdir=LR;
      graph [fontname="helvetica", fontsize=32, fontcolor="#29235c", bgcolor="transparent"];
      node [penwidth=0, margin=0, fontname="helvetica", fontsize=32, fontcolor="#29235c"];
      edge [fontname="helvetica", fontsize=32, fontcolor="#29235c", color="#29235c"];

      ${this.groups.toDot()}
      ${this.refs.map((ref) => ref.toDot()).join("\n")}
    }`;
  }
}

export function dot(input: string): string {
  const dbml = new DbmlRenderer(parse(input));
  return dbml.toDot();
}

export default function render(input: string, format: Format): string {
  const dotString = dot(input);

  if (format === "dot") {
    // viz.js can return the dot format too, but it needs node.js' global
    // 'process' object to be present, but it isn't available in graal's
    // script engine.
    return dotString;
  }
  const vizRenderStringSync = require("@aduh95/viz.js/sync");

  return vizRenderStringSync(dotString, {
    engine: "dot",
    format: format,
  });
}
