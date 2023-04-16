"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const api_1 = require("./api");
const examplesDir = "examples";
const testOutputDir = ".test-output";
const formats = ["dot", "svg"];
(0, fs_1.mkdirSync)(testOutputDir, { recursive: true });
const dbmlFiles = (0, fs_1.readdirSync)(examplesDir)
    .filter((file) => file.endsWith(".dbml"))
    .filter((file) => !file.startsWith("_"))
    .map((dbmlFilename) => [dbmlFilename, (0, path_1.join)(examplesDir, dbmlFilename)]);
dbmlFiles.forEach(([dbmlFilename, dbmlFile]) => {
    const input = (0, fs_1.readFileSync)(dbmlFile, "utf-8");
    const outputFile = (format) => (0, path_1.join)(testOutputDir, `${dbmlFilename}.${format}`);
    formats.forEach((format) => {
        (0, ava_1.default)(`${dbmlFile} can be converted to ${format}`, (t) => {
            const output = (0, api_1.run)(input, format);
            (0, fs_1.writeFileSync)(outputFile(format), output, "utf-8");
            t.pass();
        });
        (0, ava_1.default)(`${dbmlFile} ${format} output is consistent`, async (t) => {
            const expectedOutput = (0, promises_1.readFile)(`${dbmlFile}.${format}`, "utf-8");
            const currentOutput = (0, promises_1.readFile)(outputFile(format), "utf-8");
            await t.notThrowsAsync(expectedOutput);
            await t.notThrowsAsync(currentOutput);
            t.deepEqual(await currentOutput, await expectedOutput);
        });
    });
});
const comparisonPage = `
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
        .map(([dbmlFilename, dbmlFile]) => `<div>
    <h2 id="${dbmlFilename}">${dbmlFilename}</h2>
    <table>
      <tr>
        <th>Expected</th>
        <th>Current</th>
      </tr>
      <tr>
        <td><img src="${dbmlFile}.svg" /></td>
        <td><img src="${(0, path_1.join)(testOutputDir, dbmlFilename)}.svg" /></td>
      </tr>
    </table>
  </div>
  `)
        .join("\n");
(0, fs_1.writeFileSync)(".compare-test-output.html", comparisonPage, "utf-8");
