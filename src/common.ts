export type SchemaElementRef = {
  schema: string | null;
  name: string;
};

export const fullName = (table: SchemaElementRef): string => {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
};
