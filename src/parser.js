import dbml from "./dbml";

const isObject = (what) => typeof what === "object" && what !== null;
const isArray = (what) => Array.isArray(what);

const removeComments = (what) => {
  if (isArray(what)) {
    var i = what.length;
    while (i--) {
      const child = what[i];
      if (isObject(child)) {
        if ("comment" in child) what.splice(i, 1);
        else removeComments(child);
      }
    }
  } else if (isObject(what)) {
    Object.entries(what).forEach(([key, child]) => {
      if (isObject(child)) {
        if ("comment" in child) delete child["comment"];
        else removeComments(child);
      }
    });
  }
  return what;
};

const entriesTransformations = {
  project: (project) => {
    return project;
  },
  table: (table) => {
    const obj = {
      name: table.name,
      alias: table.alias,
    };
    table.items.forEach((item) => {
      const itemKey = item.item + "s";
      (obj[itemKey] = obj[itemKey] || []).push(item);
    });
    const settings = obj.settingss || [];
    delete obj.settingss;
    obj.settings = settings
      .map((s) => s.settings)
      .reduce((a, b) => Object.assign(a, b), {});
    const options = obj.options || [];
    obj.options = options
      .map((o) => o.option)
      .reduce((a, b) => Object.assign(a, b), {});
    const indices = obj.indicess || [];
    delete obj.indicess;
    obj.indices = indices.flatMap((s) => s.indices);
    obj.columns = obj.columns || [];
    return obj;
  },
  ref: (ref) => {
    return ref;
  },
  enum: (en) => {
    return en;
  },
  group: (group) => {
    return group;
  },
  default: (entry) => {
    throw new Error(`Unknown entry type ${entry.type}`);
  },
};

class SyntaxError extends Error {
  constructor(pegJsError) {
    super(
      `Could not parse input at line ${pegJsError.location.start.line}. ${pegJsError.message}`
    );
    this.name = "SyntaxError";
    this.pegJsError = pegJsError;
  }
}

const parseDbml = (input) => {
  try {
    return dbml.parse(input);
  } catch (e) {
    throw e.name === "SyntaxError" ? new SyntaxError(e) : e;
  }
};

export default function parse(input) {
  const parsed = parseDbml(input);

  const obj = {};
  removeComments(parsed).forEach((entry) => {
    const typeKey = entry.type + "s";
    const transform =
      entriesTransformations[entry.type] || entriesTransformations.default;
    (obj[typeKey] = obj[typeKey] || []).push(transform(entry));
  });
  const projects = obj.projects || [];
  delete obj.projects;
  obj.project = {
    options: projects
      .map((p) => p.options)
      .reduce((a, b) => Object.assign(a, b), {}),
  };

  obj.tables = obj.tables || [];
  obj.groups = obj.groups || [];
  obj.enums = obj.enums || [];
  obj.refs = obj.refs || [];

  return obj;
}
