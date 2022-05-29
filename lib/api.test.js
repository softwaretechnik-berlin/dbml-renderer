"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = __importDefault(require("./api"));
var ava_1 = __importDefault(require("ava"));
var fs_1 = require("fs");
var path_1 = require("path");
var examplesDir = "examples";
var testOutputDir = ".test-output";
var formats = ["dot", "svg"];
(0, fs_1.mkdirSync)(testOutputDir, { recursive: true });
var dbmlFiles = (0, fs_1.readdirSync)(examplesDir)
    .filter(function (file) { return file.endsWith(".dbml"); })
    .filter(function (file) { return !file.startsWith("_"); })
    .map(function (dbmlFilename) { return [dbmlFilename, (0, path_1.join)(examplesDir, dbmlFilename)]; });
dbmlFiles.forEach(function (_a) {
    var dbmlFilename = _a[0], dbmlFile = _a[1];
    var input = (0, fs_1.readFileSync)(dbmlFile, "utf-8");
    var outputFile = function (format) {
        return (0, path_1.join)(testOutputDir, "".concat(dbmlFilename, ".").concat(format));
    };
    formats.forEach(function (format) {
        (0, ava_1.default)("".concat(dbmlFile, " can be converted to ").concat(format), function (t) {
            var output = (0, api_1.default)(input, format);
            (0, fs_1.writeFileSync)(outputFile(format), output, "utf-8");
            t.pass();
        });
    });
    (0, ava_1.default)("".concat(dbmlFile, " dot output is consistent"), function (t) {
        var expectedOutput = (0, fs_1.readFileSync)("".concat(dbmlFile, ".dot"), "utf-8");
        var currentOutput = (0, fs_1.readFileSync)(outputFile("dot"), "utf-8");
        t.deepEqual(currentOutput, expectedOutput);
    });
});
var comparisonPage = "\n  <style>\n    table {\n      width: 100%;\n    }\n    table, th, td {\n      border: 1px solid black;\n      border-collapse: collapse;\n    }\n    img {\n      width: 100%;\n      height: auto;\n    }\n  </style>\n" +
    dbmlFiles
        .map(function (_a) {
        var dbmlFilename = _a[0], dbmlFile = _a[1];
        return "<div>\n    <h2>".concat(dbmlFilename, "</h2>\n    <table>\n      <tr>\n        <th>Expected</th>\n        <th>Current</th>\n      </tr>\n      <tr>\n        <td><img src=\"").concat(dbmlFile, ".svg\" /></td>\n        <td><img src=\"").concat((0, path_1.join)(testOutputDir, dbmlFilename), ".svg\" /></td>\n      </tr>\n    </table>\n  </div>\n  ");
    })
        .join("\n");
(0, fs_1.writeFileSync)(".compare-test-output.html", comparisonPage, "utf-8");
