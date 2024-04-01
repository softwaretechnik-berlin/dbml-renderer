import test from "ava";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { run } from "./api";
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
      const output = run(input, format);

      writeFileSync(outputFile(format), output, "utf-8");

      t.pass();
    });

    test(`${dbmlFile} ${format} output is consistent`, async (t) => {
      const expectedOutput = readFile(`${dbmlFile}.${format}`, "utf-8");
      const currentOutput = readFile(outputFile(format), "utf-8");

      await t.notThrowsAsync(expectedOutput);
      await t.notThrowsAsync(currentOutput);

      t.deepEqual(await currentOutput, await expectedOutput);
    });
  });
});

const comparisonPage =
  `
  <style>
    table {
      width: 100%;
    }
    table, th, td {
      border: 1px solid black;
      border-collapse: collapse;
    }
    img {
      width: 100%;
      height: auto;
    }
  </style>
` +
  dbmlFiles
    .map(
      ([dbmlFilename, dbmlFile]) => `<div>
    <h2 id="${dbmlFilename}">${dbmlFilename}</h2>
    <table>
      <tr>
        <th>Expected</th>
        <th>Current</th>
      </tr>
      <tr>
        <td><img src="${dbmlFile}.svg" /></td>
        <td><img src="${join(testOutputDir, dbmlFilename)}.svg" /></td>
      </tr>
    </table>
  </div>
  `,
    )
    .join("\n");

writeFileSync(".compare-test-output.html", comparisonPage, "utf-8");
