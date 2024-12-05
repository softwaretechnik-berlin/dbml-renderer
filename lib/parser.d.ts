export declare const parse: (input: string) => ({
    type: "comment";
    comment: string;
} | {
    type: "project";
    options: Record<string, string>;
    name: string | null;
} | {
    type: "table";
    name: string;
    settings: Record<string, string | null>;
    schema: string | null;
    alias: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "column";
        data: string;
        name: string;
        settings: Record<string, string | null>;
    } | {
        type: "option";
        option: Record<string, string>;
    } | {
        type: "indices";
        indices: {
            settings: Record<string, string | null>;
            columns: string[];
        }[];
    })[];
} | {
    type: "group";
    name: string | null;
    settings: Record<string, string | null>;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "table";
        name: string;
        schema: string | null;
    })[];
} | {
    type: "enum";
    name: string;
    schema: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "value";
        name: string;
        settings: Record<string, string | null>;
    })[];
} | {
    type: "ref";
    settings: Record<string, string | null>;
    cardinality: "<>" | ">" | "<" | "-";
    from: {
        name: string;
        columns: string[];
        schema: string | null;
    };
    to: {
        name: string;
        columns: string[];
        schema: string | null;
    };
})[];
