import { NormalizedOutput } from "./checker";
export type Format = "dot" | "svg";
export declare const render: (input: NormalizedOutput, format: Format) => string;
