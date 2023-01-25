File = all:DBML+ { return all.filter(e => e); }

DBML =
  Comment
  / Project
  / Table
  / TableGroup
  / Ref
  / Enum
  / NewLine {}

Project = "Project"i _ ProjectName? __ "{" __ options:Options Comment? __ "}"
  { return { type: "project", options } }
ProjectName = Name
Options = (head:Option tail:(EOL __ opt:Option { return opt; })* { return [head, ...tail].reduce((a, b) => Object.assign(a, b), {}); })?
Option = key:OptionKey _ ":" _ value:OptionValue _ Comment?
  { return { [key]: value } }
OptionKey = Name
OptionValue = AnyString

SchemaName = Name
FullTableName = schema:(SchemaName ".")? name:TableName
  { return Array.isArray(schema) && schema.length > 0 ? schema[0]+"."+name : name }

Table = "Table"i _ schema:(SchemaName ".")? name:TableName _ alias:TableAlias? _ "{" __ items:TableItems Comment? __ "}"
  { return { type: "table", name: (Array.isArray(schema) && schema.length > 0 ? schema[0]+"." : "") + name, items: items || [], alias }}
TableName = Name
TableAlias = "as" _ alias:Name { return alias; }
TableItems = (head:TableItem tail:(EOL __ item:TableItem { return item; })* { return [head, ...tail]; })?
TableItem =
  Comment
  / Column
  / Indices
  / TableSettings
  / option:Option { return { item: "option", option }; }

TableSettings = settings:Settings { return { item: "settings", settings }; }

Column = name:ColumnName _ type:ColumnType _ settings:Settings? { return { item: "column", name, type, settings: settings || {} } }
ColumnName = Name
ColumnType = prefix:Name _ suffix:$('(' RawName? ')')? { return prefix + suffix }

Indices = "Indexes"i _ "{" __ indices:IndicesList Comment? __ "}"
   { return { item: "indices", indices }; }
IndicesList = (head:IndexItem tail:(EOL __ index:IndexItem { return index; })* { return [head, ...tail]; })?
IndexItem =
  Comment
  / Index
Index = columns:((name:ColumnName { return [name]; }) / CompositeIndex) _ settings:Settings? _ Comment? { return { columns, settings: settings || {} } }
CompositeIndex = "(" _ entries:(head:CompositeIndexEntry tail:(_ "," _ entry:CompositeIndexEntry { return entry; })* { return [head, ...tail]; } )? _ ")" { return entries; }
CompositeIndexEntry = ColumnName / Function

Settings = "[" pairs:SettingsPairs "]" { return pairs; }
SettingsPairs = (head:Setting tail:(_ "," _ setting:Setting _ { return setting; })* { return [head, ...tail].reduce((a, b) => Object.assign(a,b), {}); })?
Setting = key:SettingKey _ value:(":" _ v:SettingValue { return v; })? { return {[key]: value}; }
SettingKey = [^,\]:]+ { return text().trim(); }
SettingValue = AnyString / Function / ([^,\]]+ { return text().trim(); })

TableGroup = "TableGroup"i _ name:TableName _ "{" __ tables:TableGroupItems Comment? __ "}" { return { type: "group", name, tables: tables || [] }; }
TableGroupItems = (head:TableGroupItem tail:(EOL __ item:TableGroupItem { return item; })* { return [head, ...tail]; })?
TableGroupItem =
  Comment
  / FullTableName

Ref = "Ref"i _ name:Name? _ ":" _ fromTable:(SchemaName '.' TableName '.' / TableName '.') fromColumns:RefColumns _ cardinality:Cardinality _ toTable:(SchemaName '.' TableName '.' / TableName '.') toColumns:RefColumns _ settings:Settings? Comment?
  { return { type: "ref", cardinality, fromTable: fromTable.length > 3 ? fromTable[0]+"."+fromTable[2] : fromTable[0], fromColumns, toTable: toTable.length > 3 ? toTable[0]+"."+toTable[2] : toTable[0], toColumns }; }
RefColumns =
  (name:ColumnName { return [name]; })
  / CompositeKey
Cardinality = '-' / '>' / '<'

CompositeKey = "(" _ columns:(head:ColumnName tail:(_ "," _ name:ColumnName { return name; })* { return [head, ...tail]; } )? _ ")" { return columns; }

Enum = "Enum"i _ name:Name _ "{" __  values:EnumValues Comment? __ "}" { return { type: "enum", name, values: values || [] }}
EnumValues = (head:EnumValue tail:(EOL __ item:EnumValue { return item; })* { return [head, ...tail].filter(i => i); })?
EnumValue =
  name:Name _ settings:Settings? { return { name, settings: settings || {} }; }
  / Comment

Name = RawName / QuotedName
RawName = $[a-zA-Z0-9_]+
QuotedName = '"' content:$[^"\n\r]* '"' { return content; }

AnyString = MultiLineString / SingleQuotedString / DoubleQuotedString
MultiLineString = "'''" content:(("'''" { return ""; }) / MultiLineStringContent) { return content; }
MultiLineStringContent = head:. tail:(!"'''" c:. { return c; })* "'''" { return [head, ...tail].join(""); }
SingleQuotedString = "'" content:($[^'\\]+ / "\\'" { return "'" } / [\\])* "'" { return content.join(""); }
DoubleQuotedString = '"' content:($[^"\\]+ / '\\"' { return '"' } / [\\])* "'" { return content.join(""); }

Function = '`' [^`]* '`' { return text(); }

Comment = _ "//" _ comment:LineOfText { return { comment }; }
LineOfText = text:$([^\n\r]*)
EOL = NewLine / (Comment NewLine) / EOF
NewLine = '\n' / '\r' '\n'
EOF = !.

_ "space" = [ \t]*
__ "whitespace" = [ \t\n\r]*
