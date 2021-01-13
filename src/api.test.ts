import render from "./api";
import test from "ava";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { Format } from "./renderer";

const examplesDir = "examples";
const testOutputDir = ".test-output";
const formats: Format[] = ["dot", "svg"];

mkdirSync(testOutputDir, { recursive: true });

const dbmlFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".dbml"))
  .filter((file) => !file.startsWith("_"))
  .map((dbmlFilename) => [dbmlFilename, join(examplesDir, dbmlFilename)]);

dbmlFiles.forEach(([dbmlFilename, dbmlFile]) => {
  const input = readFileSync(dbmlFile, "utf-8");
  const outputFile = (format: Format) =>
    join(testOutputDir, `${dbmlFilename}.${format}`);

  formats.forEach((format) => {
    test(`${dbmlFile} can be converted to ${format}`, (t) => {
      const output = render(input, format);

      writeFileSync(outputFile(format), output, "utf-8");

      t.pass();
    });
  });

  test(`${dbmlFile} dot output is consistent`, (t) => {
    const expectedOutput = readFileSync(`${dbmlFile}.dot`, "utf-8");
    const currentOutput = readFileSync(outputFile("dot"), "utf-8");

    t.is(currentOutput, expectedOutput);
  });
});

// test("foo", (t) => {
//   t.pass();
// });

// test("bar", async (t) => {
//   const bar = Promise.resolve("bar");
//   t.is(await bar, "bar");
// });

// ["a", "b"].forEach((x) => {
//   test(x, async (t) => {
//     const bar = Promise.resolve("bar");
//     t.is(await bar, "bar");
//   });
// });
