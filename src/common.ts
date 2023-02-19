export type SimplifiedTableRef = {
  schema: string | null;
  name: string;
};

export const tableName = (table: SimplifiedTableRef): string => {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
};
