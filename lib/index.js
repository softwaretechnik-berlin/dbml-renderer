#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs_1 = __importDefault(require("yargs"));
var helpers_1 = require("yargs/helpers");
var fs_1 = __importDefault(require("fs"));
var renderer_1 = __importDefault(require("./renderer"));
var args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
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
    coerce: function (arg) {
        if (!fs_1.default.existsSync(arg) && !(arg === "-")) {
            throw new Error("Could not find file '".concat(arg, "'"));
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
    coerce: function (arg) { return arg; },
})
    .option("output", {
    alias: "o",
    type: "string",
    default: "-",
    description: "Output file",
    coerce: function (arg) {
        return arg === "-"
            ? console.log
            : function (content) { return fs_1.default.writeFileSync(arg, content); };
    },
})
    .parseSync();
try {
    args.output((0, renderer_1.default)(args.input, args.format));
}
catch (e) {
    console.error(e.message || e);
    process.exit(1);
}
