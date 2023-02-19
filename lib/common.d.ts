export type SimplifiedTableRef = {
    schema: string | null;
    name: string;
};
export declare const tableName: (table: SimplifiedTableRef) => string;
