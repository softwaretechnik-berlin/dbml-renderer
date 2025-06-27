File = all:DBML+ { return all.filter(e => e); }

DBML = _ declaration:(
  Comment
  / Project
  / StickyNote
  / Table
  / TableGroup
  / Ref
  / Enum
  / NewLine {}
) { return declaration }

Project = "Project"i _ name:ProjectName? __ "{" __ options:Options __ "}" { return { type: "project", name, options } }
ProjectName = Name

StickyNote = "Note"i _ name:StickyNoteName __ "{" __ note:String __ "}" { return { type: "note", name, note } }
StickyNoteName = Name

Schema = Name

Table = "Table"i _ name:SchemaElementName _ alias:TableAlias? _ settings:TableSettings? __ "{" __ items:TableItems __ "}"
  { return { type: "table", ...name, alias, items, settings }}
TableAlias = "as" _ alias:Name { return alias; }
TableItems = (head:TableItem tail:(EOL __ item:TableItem { return item; })* { return [head, ...tail]; })?
TableItem =
  Column
  / Indices
  / option:Option { return { type: "option", option }; }
TableSettings = Settings

Column = name:ColumnName _ data:ColumnType _ settings:Settings? { return { type: "column", name, data, settings } }
ColumnName = Name
ColumnType = base:(ParameterizedColumnType / QualifiedColumnType / SimpleColumnType) array:("[" _ arg:$[a-zA-Z0-9_,]* _ "]" { return `[${arg}]`; })* { return base + array.join(""); }
QualifiedColumnType = schema:Schema _ "." _ simple:SimpleColumnType { return schema + "." + simple }
SimpleColumnType = QuotedName / $[a-zA-Z0-9_,]+
ParameterizedColumnType = outer:SimpleColumnType _ "(" _ args:(head:TypeParameter tail:(_ "," _ entry:TypeParameter { return entry; })* { return [head, ...tail]; } )? _ ")" { return `${outer}(${args.join(",")})`; }
TypeParameter = ColumnType / String

Indices = "Indexes"i __ "{" __ indices:IndicesList __ "}" { return { type: "indices", indices }; }
IndicesList = (head:IndexItem tail:(EOL __ index:IndexItem { return index; })* { return [head, ...tail]; })?
IndexItem = Index

Index = columns:(name:Function { return [name] } / (name:ColumnName { return [name]; }) / CompositeIndex) _ settings:Settings? { return { columns, settings } }

CompositeIndex = "(" _ entries:(head:CompositeIndexEntry tail:(_ "," _ entry:CompositeIndexEntry { return entry; })* { return [head, ...tail]; } )? _ ")" { return entries; }
CompositeIndexEntry = ColumnName / Function

TableGroup = "TableGroup"i _ name:Name _ settings:TableGroupSettings? __ "{" __ items:TableGroupItems __ "}"
  { return { type: "group", name, items, settings }; }
TableGroupItems = (head:TableGroupItem tail:(EOL __ item:TableGroupItem { return item; })* { return [head, ...tail]; })?
TableGroupItem =
  option:Option { return { type: "option", option }; }
  / name:SchemaElementName { return {type: "table", ...name} }
TableGroupSettings = Settings

Ref = "Ref"i _ name:Name? _ ":" _ from:RefFull _ cardinality:Cardinality _ to:RefFull _ settings:Settings? { return { type: "ref", cardinality, from, to, settings }; }
RefFull = schemaTable:(n:SchemaAndName _ '.' { return n; } / n:SimpleName _ '.' { return n; }) _ columns:RefColumns { return { ...schemaTable, columns } }
RefColumns =
  (name:ColumnName { return [name]; })
  / CompositeKey
Cardinality = '-' / '<>' / '>' / '<'

CompositeKey = "(" _ columns:(head:ColumnName tail:(_ "," _ name:ColumnName { return name; })* { return [head, ...tail]; } )? _ ")" { return columns; }

Enum = "Enum"i _ name:SchemaElementName __ "{" __  items:EnumValues __ "}" { return { type: "enum", ...name, items }}
EnumValues = (head:EnumValue tail:(EOL __ item:EnumValue { return item; })* { return [head, ...tail].filter(i => i); })?
EnumValue =
  name:Name _ settings:Settings? { return { type:"value", name, settings }; }

SchemaElementName = SchemaAndName / SimpleName
SchemaAndName = schema:Schema _ "." _ name:Name { return {schema, name}; }
SimpleName = name:Name { return {schema: null, name}; }

Name = RawName / QuotedName
RawName = $[a-zA-Z0-9_]+
QuotedName = '"' content:$[^"\n\r]* '"' { return content; }

String = MultiLineString / SingleQuotedString / DoubleQuotedString
MultiLineString = "'''" content:(("'''" { return ""; }) / MultiLineStringContent) { return content; }
MultiLineStringContent = head:. tail:(!"'''" c:. { return c; })* "'''" { return [head, ...tail].join(""); }
SingleQuotedString = "'" content:($[^'\\]+ / "\\'" { return "'" } / [\\])* "'" { return content.join(""); }
DoubleQuotedString = '"' content:($[^"\\]+ / '\\"' { return '"' } / [\\])* '"' { return content.join(""); }

Comment = comment:(SingleLineComment / MultiLineComment) { return {type: "comment", comment} }
SingleLineComment = _ "//" _ comment:LineOfText { return comment; }
MultiLineComment = "/*" comment:(("*/" { return ""; }) / MultiLineCommentContent) { return comment; }
MultiLineCommentContent = head:. tail:(!"*/" c:. { return c; })* "*/" { return [head, ...tail].join(""); }
LineOfText = text:$([^\n\r]*)

Settings = "[" pairs:SettingsPairs "]" { return pairs; }
SettingsPairs = (head:Setting tail:(_ "," _ setting:Setting _ { return setting; })* { return [head, ...tail].reduce((a, b) => Object.assign(a,b), {}); })?
Setting = key:SettingKey _ value:(":" _ v:SettingValue { return v; })? { return {[key]: value}; }
SettingKey = [^,\]:]+ { return text().trim().toLowerCase(); }
SettingValue = String / Function / ([^,\]]+ { return text().trim(); })

Function = '`' [^`]* '`' { return text(); }

Options = (head:Option tail:(EOL __ opt:Option { return opt; })* { return [head, ...tail].reduce((a, b) => Object.assign(a, b), {}); })?
Option =
  key:OptionKey _ ":" _ value:OptionValue { return { [key]: value } }
  /  key:OptionKey _ "{" __ value:OptionValue __ "}" { return { [key]: value } }
OptionKey = Name { return text().trim().toLowerCase() }
OptionValue = String

_ "space" = [ \t]*
__ "whitespace" = pure_whitespace (Comment pure_whitespace)*
pure_whitespace "pure whitespace" = [ \t\n\r]*
EOL = _ NewLine / (Comment NewLine) / EOF
NewLine = '\n' / '\r' '\n'
EOF = !.
