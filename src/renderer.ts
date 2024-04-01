import {
  NormalizedEnum,
  NormalizedGroup,
  NormalizedOutput,
  NormalizedRef,
  NormalizedTable,
} from "./checker";
import { fullName } from "./common";
import { Cardinality, Column, Settings, Table, TableIndices } from "./types";

export type Format = "dot" | "svg";

export const render = (input: NormalizedOutput, format: Format): string => {
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

const dot = (input: NormalizedOutput): string => {
  const dbml = new DbmlRenderer(input);
  return dbml.toDot();
};

interface RowRenderer {
  readonly name: string;
  readonly port: string;
  toDot(): string;
}

class TableNameRenderer implements RowRenderer {
  private table: Table;
  private displayName: string;
  readonly name = "__TABLE__";
  readonly port = "f0";

  constructor(table: Table, displayName: string) {
    this.table = table;
    this.displayName = displayName;
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
    return `<TR><TD PORT="${this.port}" BGCOLOR="${tableColor}"><FONT COLOR="${fontColor}"><B>       ${this.displayName}       </B></FONT></TD></TR>`;
  }
}

class ColumnRenderer implements RowRenderer {
  private indices: TableIndices;
  readonly actual: Column;
  readonly name: string;
  readonly port: string;

  constructor(port: string, column: Column, table: Table) {
    this.actual = column;
    this.name = column.name;
    this.port = port;

    this.indices = (table.items.find(
      (item) => item.type === "indices",
    ) as TableIndices) || { type: "indices", indices: [] };
  }

  dataType(): string {
    return this.actual.data;
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
      name = `<B>${name}</B>`;
    }

    let type = `<I>${this.dataType()}</I>`;
    if ("not null" in settings) {
      type = type + " <B>(!)</B>";
    }

    return `<TR><TD ALIGN="LEFT" PORT="${this.port}" BGCOLOR="#e7e2dd">
      <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
        <TR>
          <TD ALIGN="LEFT">${name}    </TD>
          <TD ALIGN="RIGHT"><FONT>${type}</FONT></TD>
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
    }" BGCOLOR="#e7e2dd"><FONT COLOR="#1d71b8"><I>    ${this.columns.join(
      ", ",
    )}    </I></FONT></TD></TR>`;
  }
}

class TableRenderer {
  private renderers: RowRenderer[];
  readonly table: NormalizedTable;
  readonly columns: ColumnRenderer[];

  constructor(table: NormalizedTable) {
    this.table = table;

    this.columns = [];
    table.columns.forEach((column, i) => {
      this.columns.push(new ColumnRenderer(`f${i + 1}`, column, table.actual));
    });
    this.renderers = [
      new TableNameRenderer(table.actual, this.displayName()),
      ...this.columns,
    ];
  }

  selfRef(): string {
    return `"${this.displayName()}":${this.renderers[0].port}`;
  }

  ref(columnName: string): string {
    const column = this.findColumn(columnName);
    if (!column) {
      throw new Error(`Unknown column ${this.displayName()}.${column}`);
    }
    return `"${this.displayName()}":${column.port}`;
  }

  private findColumn(columnName: string) {
    return this.renderers.find((c) => c.name === columnName);
  }

  refAll(columns: string[]): string {
    //TODO: check that all columns exist

    const columnIndex: Record<string, any> = {};
    columns.forEach(
      (columnName) =>
        (columnIndex[columnName] =
          this.renderers.findIndex((c) => c.name === columnName) + 1 ||
          Number.MAX_SAFE_INTEGER),
    );

    const name = columns
      .sort((a, b) => columnIndex[a] - columnIndex[b])
      .join(",");

    const column = this.findColumn(name);
    if (!column) {
      this.renderers.push(
        new CompositeKeyRowRenderer(`f${this.renderers.length}`, name, columns),
      );
    }
    return this.ref(name);
  }

  private displayName(): string {
    return fullName(this.table.actual);
  }

  toDot(): string {
    const note = this.table.options.Note;
    const tooltip = !note
      ? ""
      : `tooltip="${this.displayName()}\\n${escapeString(note)}";`;

    return `"${this.displayName()}" [id="${this.displayName()}";${tooltip}label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10">
      ${this.renderers.map((column) => column.toDot()).join("\n")}
    </TABLE>>];`;
  }
}

class GroupRenderer {
  private name: string;
  readonly tables: TableRenderer[];

  constructor(group: NormalizedGroup) {
    this.name = group.actual.name || "-unnamed-";
    this.tables = group.tables.map((table) => new TableRenderer(table));
  }

  toDot(): string {
    return `subgraph cluster_${this.name} {
      label="${this.name}"
      style=filled;
      color="#dddddd";

      ${this.tables.map((table) => table.toDot()).join("\n")}
    }`;
  }
}

const refLabels: Record<Cardinality, [string, string]> = {
  "<>": ["*", "*"],
  ">": ["*", "1"],
  "<": ["1", "*"],
  "-": ["1", "1"],
};

class RefRenderer {
  private ref: NormalizedRef;
  private fromRef: string;
  private toRef: string;
  private fromTable: TableRenderer;
  private toTable: TableRenderer;

  constructor(ref: NormalizedRef, tables: TableRenderer[]) {
    // reverse ref if cardinality is "<"
    this.ref =
      ref.actual.cardinality !== "<"
        ? ref
        : {
            actual: {
              type: "ref",
              cardinality: ref.actual.cardinality,
              from: ref.actual.to,
              to: ref.actual.from,
              settings: ref.actual.settings,
            },
            from: ref.to,
            to: ref.from,
          };

    this.fromTable = tables.find((t) => t.table === ref.from.table)!;
    this.toTable = tables.find((t) => t.table === ref.to.table)!;

    this.fromRef = this.findRef(this.fromTable, ref.actual.from.columns);
    this.toRef = this.findRef(this.toTable, ref.actual.to.columns);
  }

  private findRef(table: TableRenderer, columns: string[]): string {
    if (columns.length === 1) {
      return table.ref(columns[0]);
    } else {
      return table.refAll(columns);
    }
  }

  toDot(): string {
    const [tailLabel, headLabel] = refLabels[this.ref.actual.cardinality];
    return `${this.fromTable.selfRef()} -> ${this.toTable.selfRef()} [style=invis, weight=100, color=red]
    ${this.fromRef}:e -> ${this.toRef}:w [dir=${
      this.ref.actual.cardinality == "<>" ? "both" : "forward"
    }, penwidth=3, color="#29235c", headlabel="${headLabel}", taillabel="${tailLabel}"]`;
  }
}

class EnumRenderer {
  readonly enumType: NormalizedEnum;

  constructor(enumType: NormalizedEnum) {
    this.enumType = enumType;
  }

  name(): string {
    return fullName(this.enumType.actual);
  }

  selfRef(): string {
    return `"${this.name()}":f0`;
  }

  toDot(): string {
    return `"${this.name()}" [id="${this.name()}";label=<<TABLE BORDER="2" COLOR="#29235c" CELLBORDER="1" CELLSPACING="0" CELLPADDING="10">
    <TR><TD PORT="f0" BGCOLOR="#29235c"><FONT COLOR="#ffffff"><B>       ${this.name()}       </B></FONT></TD></TR>
    ${this.enumType.values.map((name, i) => this.valueDot(name, i)).join("\n")}
    </TABLE>>];`;
  }

  private valueDot(name: string, i: number): string {
    return `<TR><TD PORT="f${i}" BGCOLOR="#e7e2dd"><FONT COLOR="#1d71b8"><I>    ${name}    </I></FONT></TD></TR>`;
  }
}

class EnumReferenceRenderer {
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
  private enums: EnumRenderer[];
  private groups: GroupRenderer[];
  private ungroupedTables: TableRenderer[];
  private refs: RefRenderer[];
  private enumRefs: EnumReferenceRenderer[];

  constructor(dbml: NormalizedOutput) {
    this.groups = dbml.groups.map((group) => new GroupRenderer(group));
    this.ungroupedTables = dbml.ungroupedTables.map(
      (table) => new TableRenderer(table),
    );

    const allTables = this.groups
      .flatMap((group) => group.tables)
      .concat(this.ungroupedTables);

    this.refs = dbml.refs.map((ref) => new RefRenderer(ref, allTables));
    this.enums = dbml.enums.map((e) => new EnumRenderer(e));

    this.enumRefs = this.groups
      .flatMap((group) => enumRefs(group.tables, this.enums))
      .concat(enumRefs(this.ungroupedTables, this.enums));
  }

  //--light-blue: #1d71b8;--dark-blue: #29235c;--grey: #e7e2dd;--white: #ffffff;--orange: #ea5b0c
  toDot(): string {
    return `digraph dbml {
      rankdir=LR;
      graph [fontname="helvetica", fontsize=32, fontcolor="#29235c", bgcolor="transparent"];
      node [penwidth=0, margin=0, fontname="helvetica", fontsize=32, fontcolor="#29235c"];
      edge [fontname="helvetica", fontsize=32, fontcolor="#29235c", color="#29235c"];

      ${this.enums.map((e) => e.toDot()).join("\n")}
      ${this.groups.map((group) => group.toDot()).join("\n")}
      ${this.ungroupedTables.map((table) => table.toDot()).join("\n")}
      ${this.refs.map((ref) => ref.toDot()).join("\n")}
      ${this.enumRefs.map((def) => def.toDot()).join("\n")}
    }
`;
  }
}

const enumRefs = (tables: TableRenderer[], enums: EnumRenderer[]) =>
  tables.flatMap((table) =>
    table.columns.flatMap((column) => {
      const enumType = enums.find((e) => e.name() === column.dataType());
      if (!enumType) {
        return [];
      }

      const columnRef = table.ref(column.name);
      const enumRef = enumType.selfRef();

      return new EnumReferenceRenderer(columnRef, enumRef);
    }),
  );

const escapeString = (text: string): string => {
  text = JSON.stringify(text);
  return text.substring(1, text.length - 1);
};
