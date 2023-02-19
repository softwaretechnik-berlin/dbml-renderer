#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const api_1 = require("./api");
const args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .scriptName("dbml-renderer")
    .usage("Usage: $0 [options]")
    .example("$0 -i schema.dbml", "Render the given file and output to stdout")
    .alias("h", "help")
    .option("input", {
    demandOption: true,
    alias: "i",
    type: "string",
    default: "-",
    description: "DBML file",
    coerce: (arg) => {
        if (!fs_1.default.existsSync(arg) && !(arg === "-")) {
            throw new Error(`Could not find file '${arg}'`);
        }
        return arg === "-"
            ? fs_1.default.readFileSync(0, "utf-8")
            : fs_1.default.readFileSync(arg, "utf-8");
    },
})
    .option("format", {
    alias: "f",
    type: "string",
    choices: ["dot", "svg"],
    default: "svg",
    description: "Output format",
    coerce: (arg) => arg,
})
    .option("output", {
    alias: "o",
    type: "string",
    default: "-",
    description: "Output file",
    coerce: (arg) => {
        return arg === "-"
            ? console.log
            : (content) => fs_1.default.writeFileSync(arg, content);
    },
})
    .parseSync();
try {
    args.output((0, api_1.run)(args.input, args.format));
}
catch (e) {
    console.error(e.message || e);
    process.exit(1);
}
