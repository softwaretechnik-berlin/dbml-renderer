import { parse } from "./parser";
import {
  Cardinality,
  Column,
  Entity,
  Enum,
  Output,
  Ref,
  Settings,
  Table,
  TableGroup,
  TableIndices,
  TableOption,
  TableRef,
} from "./types";

export type Format = "dot" | "svg";

interface RowRenderer {
  readonly name: string;
  readonly port: string;
  toDot(): string;
}

const escapeString = (text: string): string => {
  text = JSON.stringify(text);
  return text.substring(1, text.length - 1);
};

class TableNameRowRenderer implements RowRenderer {
  readonly name = "__TABLE__";
  readonly port = "f0";
  private table: Table;

  constructor(table: Table) {
    this.table = table;
  }

  toDot(): string {
    const tableColor = !this.table.settings?.headercolor
      ? "#1d71b8"
      : this.table.settings.headercolor;
    let fontColor = "#ffffff";
    if (tableColor.startsWith("#") && tableColor.length == 7) {
      // Best contrast selection computation based on https://stackoverflow.com/a/41491220
      const r = parseInt(tableColor.substring(1, 3), 16);
      const g = parseInt(tableColor.substring(3, 5), 16);
      const b = parseInt(tableColor.substring(5, 7), 16);
      if (r * 0.299 + g * 0.587 + b * 0.114 > 186) {
        fontColor = "#000000";
      }
    }
    return `<TR><TD PORT="${this.port}" BGCOLOR="${tableColor}"><font color="${fontColor}"><B>       ${this.table.name}       </B></font></TD></TR>`;
  }
}

class ColumnRowRenderer implements RowRenderer {
  private indices: TableIndices;
  readonly actual: Column;
  readonly name: string;
  readonly port: string;

  constructor(port: string, column: Column, table: Table) {
    this.actual = column;
    this.name = column.name;
    this.port = port;

    this.indices = (table.items.find(
      (item) => item.type === "indices"
    ) as TableIndices) || { type: "indices", indices: [] };
  }

  toDot(): string {
    const relatedIndexSettings = this.indices.indices
      .filter((index) => index.columns.includes(this.actual.name))
      .map((index) => index.settings);
    const isPk = (settings: Settings): boolean =>
      "pk" in settings || "primary key" in settings;

    let name = this.actual.name;
    const settings = this.actual.settings || {};
    if (isPk(settings) || relatedIndexSettings.some(isPk)) {
      name = `<b>${name}</b>`;
    }

    let type = `<i>${this.actual.data}</i>`;
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

class TableRenderer {
  private renderers: RowRenderer[];
  private options: Record<string, string>;
  readonly actual: Table;
  readonly columns: ColumnRowRenderer[];

  constructor(table: Table) {
    this.actual = table;

    this.columns = [];
    table.items.forEach((item, i) => {
      if (item.type === "column") {
        this.columns.push(new ColumnRowRenderer(`f${i + 1}`, item, table));
      }
    });
    this.renderers = [new TableNameRowRenderer(table), ...this.columns];

    this.options = table.items.reduce((acc, item) => {
      return item.type === "option" ? { ...acc, ...item.option } : acc;
    }, {} as Record<string, string>);
  }

  selfRef(): string {
    return `"${this.name()}":${this.renderers[0].port}`;
  }

  ref(columnName: string): string {
    const column = this.findColumn(columnName);
    if (!column) {
      throw new Error(`Unknown column ${this.name()}.${column}`);
    }
    return `"${this.name()}":${column.port}`;
  }

  private findColumn(columnName: string) {
    return this.renderers.find((c) => c.name === columnName);
  }

  refAll(columns: string[]): string {
    //TODO: check that all columns exist

    const columnIndex: Record<string, any> = {};
    columns.map(
      (columnName) =>
        (columnIndex[columnName] =
          this.renderers.findIndex((c) => c.name === columnName) + 1 ||
          Number.MAX_SAFE_INTEGER)
    );

    const name = columns
      .sort((a, b) => columnIndex[a] - columnIndex[b])
      .join(",");

    const column = this.findColumn(name);
    if (!column) {
      this.renderers.push(
        new CompositeKeyRowRenderer(`f${this.renderers.length}`, name, columns)
      );
    }
    return this.ref(name);
  }

  name(): string {
    return tableName(this.actual);
  }

  toDot(): string {
    const tooltip = !this.options.Note
      ? ""
      : `tooltip="${this.name()}\\n${escapeString(this.options.Note)}";`;

    return `"${this.name()}" [id="${this.name()}";${tooltip}label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10" >
      ${this.renderers.map((column) => column.toDot()).join("\n")}
    </TABLE>>];`;
  }
}

class TableRendererMap {
  readonly tables: Map<string, TableRenderer> = new Map();

  constructor(tables: Table[]) {
    tables.forEach((table) => {
      const renderer = new TableRenderer(table);
      this.tables.set(renderer.name(), renderer);
      table.alias && this.tables.set(table.alias, renderer);
    });
  }

  get(table: SimplifiedTableRef | string): TableRenderer {
    const name = typeof table === "string" ? table : tableName(table);
    if (!this.tables.has(name)) {
      throw new Error(`Unknown table ${table}`);
    }
    return this.tables.get(name)!;
  }

  names(): Set<string> {
    return new Set(
      Array.from(this.tables.values()).map((t) => tableName(t.actual))
    );
  }
}

class GroupRenderer {
  readonly name: string;
  private tables: TableRenderer[];

  constructor(group: TableGroup, tables: TableRenderer[]) {
    this.name = group.name || "-unnamed-";
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

  constructor(groups: TableGroup[], tables: TableRendererMap) {
    const remainingTables = tables.names();

    // validate that all referenced tables exist and do not belong to more than a single group
    groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.type === "table" && !remainingTables.delete(tableName(item))) {
          throw new Error(
            `Table ${item.name} does not exist or belongs to two groups`
          );
        }
      });
    });

    this.groups = groups.map((group) => {
      return new GroupRenderer(
        group,
        group.items.flatMap((item) =>
          item.type === "table" ? [tables.get(item)] : []
        )
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

const refLabels: Record<Cardinality, [string, string]> = {
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
    // reverse ref if cardinality is "<"
    this.ref =
      ref.cardinality !== "<"
        ? ref
        : {
            type: "ref",
            cardinality: ref.cardinality,
            from: ref.to,
            to: ref.from,
            settings: ref.settings,
          };

    this.fromTable = tables.get(ref.from);
    this.toTable = tables.get(ref.to);

    this.fromRef = this.findRef(this.fromTable, ref.from.columns);
    this.toRef = this.findRef(this.toTable, ref.to.columns);
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
  private values: string[];

  constructor(enumType: Enum) {
    this.enumType = enumType;
    this.values = enumType.items.flatMap((item) =>
      item.type === "value" ? [item.name] : []
    );
  }

  selfRef(): string {
    return `"${this.enumType.name}":f0`;
  }

  toDot(): string {
    return `"${this.enumType.name}" [id=${
      this.enumType.name
    };label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10">
    <TR><TD PORT="f0" BGCOLOR="#29235c"><font color="#ffffff"><B>       ${
      this.enumType.name
    }       </B></font></TD></TR>
    ${this.values.map((name, i) => this.valueDot(name, i)).join("\n")}
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

  constructor(dbml: Output) {
    this.enums = new EnumsRenderer(extract("enum", dbml));
    const tables = new TableRendererMap(extract("table", dbml));

    this.groups = new GroupsRenderer(extract("group", dbml), tables);

    this.refs = extract("ref", dbml)
      .concat(this.findRefsInSettings(tables.tables))
      .map((ref) => new RefRenderer(ref, tables));

    this.enumDefs = [];
    tables.tables.forEach((table) => {
      table.columns.forEach((column) => {
        const enumType = this.enums.get(column.actual.data);
        if (enumType) {
          this.enumDefs.push(
            new EnumDefinitionRenderer(
              tables.get(table.actual).ref(column.name),
              enumType.selfRef()
            )
          );
        }
      })
    });
  }

  private findRefsInSettings(tables: Map<string, TableRenderer>): Ref[] {
    return Array.from(tables.values()).flatMap((table) =>
      table.columns.flatMap((column) => {
        const ref = column.actual.settings["ref"];
        if (!ref) {
          return [];
        }

        // create a virtual ref, parse it and add it to the list of refs
        const virtualRef = `Ref: ${table.name()}.${column.name} ${ref}`;
        return extract("ref", parse(virtualRef));
      })
    );
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

const extract = <T extends Entity["type"]>(
  type: T,
  output: Output
): Extract<Entity, { type: T }>[] => {
  return output.filter((entity) => entity.type === type) as Extract<
    Entity,
    { type: T }
  >[];
};

export const dot = (input: string): string => {
  const dbml = new DbmlRenderer(parse(input));
  return dbml.toDot();
};

export const render = (input: string, format: Format): string => {
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
};

type SimplifiedTableRef = {
  schema: string | null;
  name: string;
};

const tableName = (table: SimplifiedTableRef): string => {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
};
