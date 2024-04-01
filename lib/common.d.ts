export type SchemaElementRef = {
    schema: string | null;
    name: string;
};
export declare const fullName: (table: SchemaElementRef) => string;
