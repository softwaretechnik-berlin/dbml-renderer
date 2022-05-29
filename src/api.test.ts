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

    t.deepEqual(currentOutput, expectedOutput);
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
    <h2>${dbmlFilename}</h2>
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
  `
    )
    .join("\n");

writeFileSync(".compare-test-output.html", comparisonPage, "utf-8");
