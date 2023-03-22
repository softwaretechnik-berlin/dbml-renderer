#!/usr/bin/env node

import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { run } from "./api";
import { Format } from "./renderer";

const args = yargs(hideBin(process.argv))
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
      if (!fs.existsSync(arg) && !(arg === "-")) {
        throw new Error(`Could not find file '${arg}'`);
      }
      return arg === "-"
        ? fs.readFileSync(0, "utf-8")
        : fs.readFileSync(arg, "utf-8");
    },
  })
  .option("format", {
    alias: "f",
    type: "string",
    choices: ["dot", "svg"],
    default: "svg",
    description: "Output format",
    coerce: (arg) => arg as Format,
  })
  .option("output", {
    alias: "o",
    type: "string",
    default: "-",
    description: "Output file",
    coerce: (arg) => {
      return arg === "-"
        ? console.log
        : (content: string) => fs.writeFileSync(arg, content);
    },
  })
  .parseSync();

try {
  args.output(run(args.input, args.format));
} catch (e) {
  console.error((e as any).message || e);
  process.exit(1);
}
