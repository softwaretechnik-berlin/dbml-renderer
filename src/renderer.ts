import parse, {
  Table,
  Cardinality,
  Group,
  DBML,
  Ref,
  Column,
  Enum,
  Settings,
} from "./parser";

export type Format = "dot" | "svg";

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
  private table: Table;
  readonly name: string;
  readonly port: string;

  constructor(port: string, column: Column, table: Table) {
    this.column = column;
    this.table = table;
    this.name = column.name;
    this.port = port;
  }

  toDot(): string {
    const relatedIndexSettings = this.table.indices
      .filter((index) => index.columns.includes(this.column.name))
      .map((index) => index.settings);
    const isPk = (settings: Settings): boolean =>
      "pk" in settings || "primary key" in settings;

    var name = this.column.name;
    const settings = this.column.settings;
    if (isPk(settings) || relatedIndexSettings.some(isPk)) {
      name = `<b>${name}</b>`;
    }

    var type = `<i>${this.column.type}</i>`;
    if ("not null" in settings) {
      type = type + " <b>(!)</b>";
    }

    return `<TR><TD ALIGN="left" PORT="${this.port}" BGCOLOR="#e7e2dd">
      <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
        <TR>
          <TD ALIGN="LEFT">${name}<FONT>    </FONT></TD>
          <TD ALIGN="RIGHT"><font>${type}</font></TD>
        </TR>
      </TABLE>
    </TD></TR>`;
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
    }" BGCOLOR="#e7e2dd"><font color="#1d71b8"><i>    ${this.columns.join(
      ", "
    )}    </i></font></TD></TR>`;
  }
}

//TODO: use indices to look for primary keys
class TableRenderer {
  private table: Table;
  private columns: RowRenderer[] = [];

  constructor(table: Table) {
    this.table = table;
    this.columns.push(new TableNameRowRenderer(table));
    this.columns.push(
      ...table.columns.map(
        (column, i) => new ColumnRowRenderer(`f${i + 1}`, column, table)
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
    //TODO: sort by the order that they appear on the table
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

class TableRendererMap {
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
  constructor(groups: Group[], tables: TableRendererMap) {
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

  constructor(ref: Ref, tables: TableRendererMap) {
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

class EnumRenderer {
  private enumType: Enum;

  constructor(enumType: Enum) {
    this.enumType = enumType;
  }

  selfRef(): string {
    return `${this.enumType.name}:f0`;
  }

  toDot(): string {
    return `"${this.enumType.name}" [id=${
      this.enumType.name
    };label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10">
    <TR><TD PORT="f0" WIDTH="150" BGCOLOR="#29235c"><font color="#ffffff"><B>       ${
      this.enumType.name
    }       </B></font></TD></TR>
    ${this.enumType.values
      .map((value, i) => this.valueDot(value.name, i))
      .join("\n")}
    </TABLE>>];`;
  }

  private valueDot(name: string, i: number): string {
    return `<TR><TD PORT="f${i}" BGCOLOR="#e7e2dd"><font color="#1d71b8"><i>    ${name}    </i></font></TD></TR>`;
  }
}

class EnumsRenderer {
  private renderers: Map<string, EnumRenderer> = new Map();

  constructor(enums: Enum[]) {
    enums.forEach((enumType) =>
      this.renderers.set(enumType.name, new EnumRenderer(enumType))
    );
  }

  get(name: string): EnumRenderer | undefined {
    return this.renderers.get(name);
  }

  toDot(): string {
    return Array.from(this.renderers.values())
      .map((renderer) => renderer.toDot())
      .join("\n");
  }
}

class EnumDefinitionRenderer {
  private columnRef: string;
  private enumRef: string;

  constructor(columnRef: string, enumRef: string) {
    this.columnRef = columnRef;
    this.enumRef = enumRef;
  }

  toDot(): string {
    return `${this.columnRef}:e -> ${this.enumRef}:w [penwidth=3, color="#29235c", arrowhead="none", arrowtail="none"]`;
  }
}

class DbmlRenderer {
  private groups: GroupsRenderer;
  private refs: RefRenderer[];
  private enumDefs: EnumDefinitionRenderer[];
  private enums: EnumsRenderer;

  constructor(dbml: DBML) {
    this.enums = new EnumsRenderer(dbml.enums);
    const tables = new TableRendererMap(dbml.tables);

    this.groups = new GroupsRenderer(dbml.groups, tables);

    this.refs = dbml.refs
      .concat(this.findRefsInSettings(dbml.tables))
      .map((ref) => new RefRenderer(ref, tables));

    this.enumDefs = [];
    dbml.tables.forEach((table) =>
      table.columns.forEach((column) => {
        const columnType = this.enums.get(column.type);
        if (columnType) {
          this.enumDefs.push(
            new EnumDefinitionRenderer(
              tables.get(table.name).ref(column.name),
              columnType.selfRef()
            )
          );
        }
      })
    );
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

      ${this.enums.toDot()}
      ${this.groups.toDot()}
      ${this.refs.map((ref) => ref.toDot()).join("\n")}
      ${this.enumDefs.map((def) => def.toDot()).join("\n")}
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
