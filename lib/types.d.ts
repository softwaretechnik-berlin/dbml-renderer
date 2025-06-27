import z from "zod";
export declare const Comment: z.ZodObject<{
    type: z.ZodLiteral<"comment">;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "comment";
    comment: string;
}, {
    type: "comment";
    comment: string;
}>;
export type Comment = z.infer<typeof Comment>;
export declare const Settings: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
export type Settings = z.infer<typeof Settings>;
export declare const Options: z.ZodRecord<z.ZodString, z.ZodString>;
export type Options = z.infer<typeof Options>;
export declare const Project: z.ZodObject<{
    type: z.ZodLiteral<"project">;
    name: z.ZodNullable<z.ZodString>;
    options: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>, Record<string, string>, Record<string, string> | null>;
}, "strip", z.ZodTypeAny, {
    type: "project";
    options: Record<string, string>;
    name: string | null;
}, {
    type: "project";
    options: Record<string, string> | null;
    name: string | null;
}>;
export type Project = z.infer<typeof Project>;
export declare const StickyNote: z.ZodObject<{
    type: z.ZodLiteral<"note">;
    name: z.ZodString;
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    name: string;
    note: string;
}, {
    type: "note";
    name: string;
    note: string;
}>;
export type StickyNote = z.infer<typeof StickyNote>;
export declare const Column: z.ZodObject<{
    type: z.ZodLiteral<"column">;
    name: z.ZodString;
    data: z.ZodString;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
    type: "column";
    name: string;
    data: string;
    settings: Record<string, string | null>;
}, {
    type: "column";
    name: string;
    data: string;
    settings: Record<string, string | null> | null;
}>;
export type Column = z.infer<typeof Column>;
export declare const TableOption: z.ZodObject<{
    type: z.ZodLiteral<"option">;
    option: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "option";
    option: Record<string, string>;
}, {
    type: "option";
    option: Record<string, string>;
}>;
export type TableOption = z.infer<typeof TableOption>;
export declare const TableIndices: z.ZodObject<{
    type: z.ZodLiteral<"indices">;
    indices: z.ZodArray<z.ZodObject<{
        columns: z.ZodArray<z.ZodString, "many">;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        settings: Record<string, string | null>;
        columns: string[];
    }, {
        settings: Record<string, string | null> | null;
        columns: string[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "indices";
    indices: {
        settings: Record<string, string | null>;
        columns: string[];
    }[];
}, {
    type: "indices";
    indices: {
        settings: Record<string, string | null> | null;
        columns: string[];
    }[];
}>;
export type TableIndices = z.infer<typeof TableIndices>;
export declare const Table: z.ZodObject<{
    type: z.ZodLiteral<"table">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    alias: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"column">;
        name: z.ZodString;
        data: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null>;
    }, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"indices">;
        indices: z.ZodArray<z.ZodObject<{
            columns: z.ZodArray<z.ZodString, "many">;
            settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
        }, "strip", z.ZodTypeAny, {
            settings: Record<string, string | null>;
            columns: string[];
        }, {
            settings: Record<string, string | null> | null;
            columns: string[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "indices";
        indices: {
            settings: Record<string, string | null>;
            columns: string[];
        }[];
    }, {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
        name: string;
        data: string;
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
}, {
    type: "table";
    name: string;
    settings: Record<string, string | null> | null;
    schema: string | null;
    alias: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    } | {
        type: "option";
        option: Record<string, string>;
    } | {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    })[];
}>;
export type Table = z.infer<typeof Table>;
export declare const TableRef: z.ZodObject<{
    type: z.ZodLiteral<"table">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "table";
    name: string;
    schema: string | null;
}, {
    type: "table";
    name: string;
    schema: string | null;
}>;
export type TableRef = z.infer<typeof TableRef>;
export declare const TableGroupOption: z.ZodObject<{
    type: z.ZodLiteral<"option">;
    option: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "option";
    option: Record<string, string>;
}, {
    type: "option";
    option: Record<string, string>;
}>;
export type TableGroupOption = z.infer<typeof TableGroupOption>;
export declare const TableGroup: z.ZodObject<{
    type: z.ZodLiteral<"group">;
    name: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"table">;
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table";
        name: string;
        schema: string | null;
    }, {
        type: "table";
        name: string;
        schema: string | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}, {
    type: "group";
    name: string | null;
    settings: Record<string, string | null> | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "table";
        name: string;
        schema: string | null;
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}>;
export type TableGroup = z.infer<typeof TableGroup>;
export declare const EnumValue: z.ZodObject<{
    type: z.ZodLiteral<"value">;
    name: z.ZodString;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
    type: "value";
    name: string;
    settings: Record<string, string | null>;
}, {
    type: "value";
    name: string;
    settings: Record<string, string | null> | null;
}>;
export type EnumValue = z.infer<typeof EnumValue>;
export declare const Enum: z.ZodObject<{
    type: z.ZodLiteral<"enum">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"value">;
        name: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "value";
        name: string;
        settings: Record<string, string | null>;
    }, {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "enum";
    name: string;
    schema: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    })[];
}>;
export type Enum = z.infer<typeof Enum>;
export declare const Cardinality: z.ZodUnion<[z.ZodLiteral<"<>">, z.ZodLiteral<">">, z.ZodLiteral<"<">, z.ZodLiteral<"-">]>;
export type Cardinality = z.infer<typeof Cardinality>;
declare const ColumnRef: z.ZodObject<{
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    columns: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    columns: string[];
    schema: string | null;
}, {
    name: string;
    columns: string[];
    schema: string | null;
}>;
export type ColumnRef = z.infer<typeof ColumnRef>;
export declare const Ref: z.ZodObject<{
    type: z.ZodLiteral<"ref">;
    cardinality: z.ZodUnion<[z.ZodLiteral<"<>">, z.ZodLiteral<">">, z.ZodLiteral<"<">, z.ZodLiteral<"-">]>;
    from: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    to: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "ref";
    settings: Record<string, string | null> | null;
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
}>;
export type Ref = z.infer<typeof Ref>;
export declare const Entity: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"comment">;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "comment";
    comment: string;
}, {
    type: "comment";
    comment: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"project">;
    name: z.ZodNullable<z.ZodString>;
    options: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>, Record<string, string>, Record<string, string> | null>;
}, "strip", z.ZodTypeAny, {
    type: "project";
    options: Record<string, string>;
    name: string | null;
}, {
    type: "project";
    options: Record<string, string> | null;
    name: string | null;
}>, z.ZodObject<{
    type: z.ZodLiteral<"note">;
    name: z.ZodString;
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    name: string;
    note: string;
}, {
    type: "note";
    name: string;
    note: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"table">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    alias: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"column">;
        name: z.ZodString;
        data: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null>;
    }, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"indices">;
        indices: z.ZodArray<z.ZodObject<{
            columns: z.ZodArray<z.ZodString, "many">;
            settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
        }, "strip", z.ZodTypeAny, {
            settings: Record<string, string | null>;
            columns: string[];
        }, {
            settings: Record<string, string | null> | null;
            columns: string[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "indices";
        indices: {
            settings: Record<string, string | null>;
            columns: string[];
        }[];
    }, {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
        name: string;
        data: string;
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
}, {
    type: "table";
    name: string;
    settings: Record<string, string | null> | null;
    schema: string | null;
    alias: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    } | {
        type: "option";
        option: Record<string, string>;
    } | {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"group">;
    name: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"table">;
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table";
        name: string;
        schema: string | null;
    }, {
        type: "table";
        name: string;
        schema: string | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}, {
    type: "group";
    name: string | null;
    settings: Record<string, string | null> | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "table";
        name: string;
        schema: string | null;
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"enum">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"value">;
        name: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "value";
        name: string;
        settings: Record<string, string | null>;
    }, {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "enum";
    name: string;
    schema: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"ref">;
    cardinality: z.ZodUnion<[z.ZodLiteral<"<>">, z.ZodLiteral<">">, z.ZodLiteral<"<">, z.ZodLiteral<"-">]>;
    from: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    to: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "ref";
    settings: Record<string, string | null> | null;
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
}>]>;
export type Entity = z.infer<typeof Entity>;
export declare const Output: z.ZodArray<z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"comment">;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "comment";
    comment: string;
}, {
    type: "comment";
    comment: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"project">;
    name: z.ZodNullable<z.ZodString>;
    options: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>, Record<string, string>, Record<string, string> | null>;
}, "strip", z.ZodTypeAny, {
    type: "project";
    options: Record<string, string>;
    name: string | null;
}, {
    type: "project";
    options: Record<string, string> | null;
    name: string | null;
}>, z.ZodObject<{
    type: z.ZodLiteral<"note">;
    name: z.ZodString;
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    name: string;
    note: string;
}, {
    type: "note";
    name: string;
    note: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"table">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    alias: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"column">;
        name: z.ZodString;
        data: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null>;
    }, {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"indices">;
        indices: z.ZodArray<z.ZodObject<{
            columns: z.ZodArray<z.ZodString, "many">;
            settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
        }, "strip", z.ZodTypeAny, {
            settings: Record<string, string | null>;
            columns: string[];
        }, {
            settings: Record<string, string | null> | null;
            columns: string[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "indices";
        indices: {
            settings: Record<string, string | null>;
            columns: string[];
        }[];
    }, {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
        name: string;
        data: string;
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
}, {
    type: "table";
    name: string;
    settings: Record<string, string | null> | null;
    schema: string | null;
    alias: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "column";
        name: string;
        data: string;
        settings: Record<string, string | null> | null;
    } | {
        type: "option";
        option: Record<string, string>;
    } | {
        type: "indices";
        indices: {
            settings: Record<string, string | null> | null;
            columns: string[];
        }[];
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"group">;
    name: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"table">;
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table";
        name: string;
        schema: string | null;
    }, {
        type: "table";
        name: string;
        schema: string | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"option">;
        option: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "option";
        option: Record<string, string>;
    }, {
        type: "option";
        option: Record<string, string>;
    }>]>, "many">;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}, {
    type: "group";
    name: string | null;
    settings: Record<string, string | null> | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "table";
        name: string;
        schema: string | null;
    } | {
        type: "option";
        option: Record<string, string>;
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"enum">;
    schema: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    items: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"comment">;
        comment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "comment";
        comment: string;
    }, {
        type: "comment";
        comment: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"value">;
        name: z.ZodString;
        settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
    }, "strip", z.ZodTypeAny, {
        type: "value";
        name: string;
        settings: Record<string, string | null>;
    }, {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "enum";
    name: string;
    schema: string | null;
    items: ({
        type: "comment";
        comment: string;
    } | {
        type: "value";
        name: string;
        settings: Record<string, string | null> | null;
    })[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"ref">;
    cardinality: z.ZodUnion<[z.ZodLiteral<"<>">, z.ZodLiteral<">">, z.ZodLiteral<"<">, z.ZodLiteral<"-">]>;
    from: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    to: z.ZodObject<{
        schema: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: string[];
        schema: string | null;
    }, {
        name: string;
        columns: string[];
        schema: string | null;
    }>;
    settings: z.ZodEffects<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>, Record<string, string | null>, Record<string, string | null> | null>;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "ref";
    settings: Record<string, string | null> | null;
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
}>]>, "many">;
export type Output = z.infer<typeof Output>;
export {};
